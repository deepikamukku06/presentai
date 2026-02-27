import { useState, useRef, useCallback, useEffect } from "react";

/* ─── Types ─── */
export interface FrameScores {
  posture_status: string;
  eye_status: string;
  gesture_status: string;
  posture_score: number;
  eye_score: number;
  gesture_score: number;
}

export interface TranscriptEntry {
  text: string;
  time: number;
  fillers: { word: string; time: number }[];
}

export interface PauseEvent {
  type: string;
  time: number;
  message: string;
}

export interface PresentationState {
  /* session */
  sessionId: number | null;
  isRunning: boolean;

  /* live scores (running averages) */
  postureScore: number;
  eyeScore: number;
  gestureScore: number;
  postureStatus: string;
  eyeStatus: string;
  gestureStatus: string;

  /* analysis log */
  analysisLog: FrameScores[];

  /* transcript & fillers */
  transcripts: TranscriptEntry[];
  fillerWords: { word: string; time: number }[];
  fillerCounts: Record<string, number>;

  /* pauses */
  pauseActive: boolean;

  /* recording */
  recordingTime: number;
}

const FRAME_INTERVAL = 500; // ms
const TRANSCRIPT_POLL = 2000;
const PAUSE_POLL = 1000;

export function usePresentation() {
  /* ─── state ─── */
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [postureScore, setPostureScore] = useState(0);
  const [eyeScore, setEyeScore] = useState(0);
  const [gestureScore, setGestureScore] = useState(0);
  const [postureStatus, setPostureStatus] = useState("N/A");
  const [eyeStatus, setEyeStatus] = useState("N/A");
  const [gestureStatus, setGestureStatus] = useState("N/A");

  const [analysisLog, setAnalysisLog] = useState<FrameScores[]>([]);

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [fillerWords, setFillerWords] = useState<{ word: string; time: number }[]>([]);
  const [fillerCounts, setFillerCounts] = useState<Record<string, number>>({});

  const [pauseActive, setPauseActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  /* ─── refs ─── */
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beepOscRef = useRef<OscillatorNode | null>(null);
  const beepCtxRef = useRef<AudioContext | null>(null);
  const lastPauseCountRef = useRef(0); // track how many pause events we've seen
  /* Frontend silence detection */
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SILENCE_THRESHOLD = 0.01;  // RMS below this = silence
  const SILENCE_DURATION = 3000;   // ms of silence before beep
  /* Sliding window of recent frame scores for accurate live % */
  const WINDOW = 20;
  const recentPosture = useRef<number[]>([]);
  const recentEye = useRef<number[]>([]);
  const recentGesture = useRef<number[]>([]);

  /* ─── helpers ─── */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.6).split(",")[1]; // base64 only
  }, []);

  const startBeep = useCallback(async () => {
    if (beepOscRef.current) return; // already beeping
    let ctx = beepCtxRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      beepCtxRef.current = ctx;
    }
    // Resume if browser suspended it (autoplay policy)
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch (e) { console.warn("AudioContext resume failed", e); }
    }
    console.log("🔔 Starting beep — AudioContext state:", ctx.state);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square"; // square wave is more audible/alerting than sine
    osc.frequency.value = 800; // higher pitch = more noticeable
    gain.gain.value = 0.35; // louder
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    beepOscRef.current = osc;
  }, []);

  const stopBeep = useCallback(() => {
    if (beepOscRef.current) {
      beepOscRef.current.stop();
      beepOscRef.current.disconnect();
      beepOscRef.current = null;
    }
  }, []);

  /* ─── frame sender ─── */
  const sendFrame = useCallback(
    async (sid: number) => {
      const b64 = captureFrame();
      if (!b64) return;
      try {
        const res = await fetch("/api/frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frame: b64, session_id: sid }),
        });
        if (!res.ok) return;
        const data: FrameScores = await res.json();

        // Push into sliding windows
        recentPosture.current.push(data.posture_score);
        recentEye.current.push(data.eye_score);
        recentGesture.current.push(data.gesture_score);
        if (recentPosture.current.length > WINDOW) recentPosture.current.shift();
        if (recentEye.current.length > WINDOW) recentEye.current.shift();
        if (recentGesture.current.length > WINDOW) recentGesture.current.shift();

        // Compute averages over the window
        const avg = (arr: number[]) =>
          arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        setPostureScore(avg(recentPosture.current));
        setEyeScore(avg(recentEye.current));
        setGestureScore(avg(recentGesture.current));

        setPostureStatus(data.posture_status);
        setEyeStatus(data.eye_status);
        setGestureStatus(data.gesture_status);
        setAnalysisLog((prev) => [...prev.slice(-99), data]);
      } catch (err) {
        console.error("frame error", err);
      }
    },
    [captureFrame]
  );

  /* ─── transcript poller ─── */
  const pollTranscripts = useCallback(async () => {
    try {
      const res = await fetch("/api/transcripts");
      const data = await res.json();
      const entries: TranscriptEntry[] = data.transcripts ?? [];
      setTranscripts(entries);
      const allFillers: { word: string; time: number }[] = [];
      const counts: Record<string, number> = {};
      for (const t of entries) {
        for (const f of t.fillers ?? []) {
          allFillers.push(f);
          counts[f.word] = (counts[f.word] ?? 0) + 1;
        }
      }
      setFillerWords(allFillers);
      setFillerCounts(counts);
    } catch (err) {
      console.error("transcript poll error", err);
    }
  }, []);

  /* ─── frontend silence detection using AnalyserNode ─── */
  const checkSilence = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    // Compute RMS
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);

    const now = Date.now();
    if (rms < SILENCE_THRESHOLD) {
      // Silence detected
      if (silenceStartRef.current === null) {
        silenceStartRef.current = now;
      } else if (now - silenceStartRef.current >= SILENCE_DURATION) {
        // Long pause — trigger beep
        setPauseActive(true);
        startBeep();
      }
    } else {
      // User is speaking — reset silence timer & stop beep
      silenceStartRef.current = null;
      setPauseActive(false);
      stopBeep();
    }
  }, [startBeep, stopBeep]);

  /* ─── pause poller (backend, as extra signal) ─── */
  const pollPauses = useCallback(async () => {
    try {
      const res = await fetch("/api/pause-events");
      if (!res.ok) return;
      const data = await res.json();
      const eventCount: number = data.count ?? 0;
      const speakingActive: boolean = data.speaking_active ?? true;

      // Backend says user is in a long pause
      if (!speakingActive && eventCount > lastPauseCountRef.current) {
        lastPauseCountRef.current = eventCount;
        setPauseActive(true);
        startBeep();
      }
    } catch {
      // Backend pause detection is optional — frontend handles it independently
    }
  }, [startBeep]);

  /* ─── start session ─── */
  const startSession = useCallback(
    async (stream: MediaStream) => {
      try {
        // 1. Send script if available
        const script = sessionStorage.getItem("presentationScript");
        if (script) {
          try {
            await fetch("/api/script", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ script }),
            });
          } catch {
            // Script already finalized in DB via Script AI module — safe to skip
          }
        }

        // 2. Start backend session
        const res = await fetch("/api/start?user_id=1", { method: "POST" });
        if (!res.ok) {
          const errText = await res.text().catch(() => "Unknown error");
          throw new Error(`Backend /api/start failed (${res.status}): ${errText}`);
        }
        const data = await res.json();
        const sid = data.session_id as number;
        if (!sid) throw new Error("No session_id returned from backend");
        setSessionId(sid);
        setIsRunning(true);

        // Reset accumulators
        recentPosture.current = [];
        recentEye.current = [];
        recentGesture.current = [];
        lastPauseCountRef.current = 0;
        setAnalysisLog([]);
        setTranscripts([]);
        setFillerWords([]);
        setFillerCounts({});
        setPauseActive(false);
        setRecordingTime(0);

        // Pre-init AudioContext on user gesture so beep can play later
        if (!beepCtxRef.current) {
          beepCtxRef.current = new AudioContext();
        }
        if (beepCtxRef.current.state === "suspended") {
          await beepCtxRef.current.resume();
        }

        // Set up frontend silence detection via AnalyserNode
        try {
          const audioCtx = beepCtxRef.current;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          // Don't connect analyser to destination (we don't want to hear mic playback)
          analyserRef.current = analyser;
          silenceStartRef.current = null;
          // Check silence every 500ms
          silenceIntervalRef.current = setInterval(checkSilence, 500);
          console.log("✅ Frontend silence detection active");
        } catch (e) {
          console.warn("⚠️ Frontend silence detection setup failed:", e);
        }

        // 3. Start frame capture
        frameIntervalRef.current = setInterval(() => sendFrame(sid), FRAME_INTERVAL);

        // 4. Start transcript polling
        transcriptIntervalRef.current = setInterval(pollTranscripts, TRANSCRIPT_POLL);

        // 5. Start pause polling
        pauseIntervalRef.current = setInterval(pollPauses, PAUSE_POLL);

        // 6. Recording timer
        timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);

        // 7. Start MediaRecorder
        try {
          const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
          chunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.start(1000); // 1s chunks
          mediaRecorderRef.current = recorder;
        } catch (recErr) {
          // Fallback mimeType
          try {
            const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.start(1000);
            mediaRecorderRef.current = recorder;
          } catch (e2) {
            console.error("MediaRecorder not supported", e2);
          }
        }
      } catch (err) {
        console.error("start session error", err);
      }
    },
    [sendFrame, pollTranscripts, pollPauses, checkSilence]
  );

  /* ─── stop session ─── */
  const stopSession = useCallback(async (): Promise<string | null> => {
    // clear intervals
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (transcriptIntervalRef.current) clearInterval(transcriptIntervalRef.current);
    if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    analyserRef.current = null;
    silenceStartRef.current = null;
    stopBeep();
    setIsRunning(false);
    setPauseActive(false);

    // Stop backend
    try {
      await fetch("/api/stop", { method: "POST" });
    } catch (err) {
      console.error("stop error", err);
    }

    // Stop MediaRecorder & upload
    let videoUrl: string | null = null;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      videoUrl = await new Promise<string | null>((resolve) => {
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          try {
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            const uploadData = await uploadRes.json();
            resolve(uploadData.video_url ?? null);
          } catch (e) {
            console.error("upload error", e);
            resolve(null);
          }
        };
        recorder.stop();
      });
    }

    return videoUrl;
  }, [stopBeep]);

  /* ─── cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (transcriptIntervalRef.current) clearInterval(transcriptIntervalRef.current);
      if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      analyserRef.current = null;
      stopBeep();
    };
  }, [stopBeep]);

  return {
    /* refs for JSX */
    videoRef,
    canvasRef,

    /* state */
    sessionId,
    isRunning,
    postureScore,
    eyeScore,
    gestureScore,
    postureStatus,
    eyeStatus,
    gestureStatus,
    analysisLog,
    transcripts,
    fillerWords,
    fillerCounts,
    pauseActive,
    recordingTime,

    /* actions */
    startSession,
    stopSession,
  };
}
