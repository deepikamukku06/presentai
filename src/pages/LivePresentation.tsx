import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain, Video, Mic, MicOff, VideoOff,
  Square, Play, Eye, User, Hand,
  MessageSquare, ArrowRight, AlertCircle, AlertTriangle
} from 'lucide-react';
import { usePresentation } from '@/hooks/usePresentation';

/* ─── colour helper ─── */
const scoreColor = (pct: number) =>
  pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error';

const statusColorMap: Record<string, string> = {
  success: 'text-success border-success/30 bg-success/10',
  warning: 'text-warning border-warning/30 bg-warning/10',
  error:   'text-destructive border-destructive/30 bg-destructive/10',
};

/* ─── Filler word highlighter ─── */
const FILLER_SET = new Set([
  'um','uh','ah','er','like','basically','actually','literally',
  'honestly','right','okay','so','well','you know','i mean','sort of','kind of',
]);

function highlightFillers(text: string) {
  // split on word boundaries keeping the tokens
  const tokens = text.split(/(\s+)/);
  return tokens.map((tok, i) => {
    if (FILLER_SET.has(tok.toLowerCase())) {
      return (
        <span key={i} className="bg-warning/40 text-warning rounded px-0.5">
          {tok}
        </span>
      );
    }
    return tok;
  });
}

const LivePresentation = () => {
  const navigate = useNavigate();
  const {
    videoRef,
    canvasRef,
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
    startSession,
    stopSession,
  } = usePresentation();

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isStopping, setIsStopping] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  /* ─── camera init ─── */
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });
      setMediaStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera error', err);
    }
  }, [videoRef]);

  useEffect(() => {
    initCamera();
    return () => {
      mediaStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* auto-scroll transcript */
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcripts]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  /* ─── start / stop handlers ─── */
  const handleStart = async () => {
    let stream = mediaStream;
    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });
      setMediaStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    }
    await startSession(stream);
  };

  const handleStopAndReport = async () => {
    setIsStopping(true);
    await stopSession();
    // stop camera tracks
    mediaStream?.getTracks().forEach((t) => t.stop());
    setMediaStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    navigate('/report');
  };

  const toggleMute = () => {
    mediaStream?.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    mediaStream?.getVideoTracks().forEach((t) => (t.enabled = !isVideoOn));
    setIsVideoOn(!isVideoOn);
  };

  /* filler word total */
  const totalFillers = fillerWords.length;

  return (
    <div className="min-h-screen neural-bg">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">PresentAI</span>
            </Link>

            <div className="flex items-center gap-4">
              {isRunning && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20">
                  <div className="recording-dot" />
                  <span className="text-sm font-medium text-destructive">
                    Recording {formatTime(recordingTime)}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={!isRunning || isStopping}
                onClick={handleStopAndReport}
              >
                {isStopping ? 'Saving...' : 'End & View Report'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Pause alert banner */}
      {pauseActive && (
        <div className="bg-warning/20 border-b border-warning/30 px-6 py-3 text-center animate-pulse">
          <span className="text-warning font-medium flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Long pause detected — keep speaking!
          </span>
        </div>
      )}

      {/* Main */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left – video + metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Webcam */}
            <div className="relative">
              <div className="webcam-frame aspect-video bg-muted">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-2xl"
                />

                {/* Live overlay badges */}
                {isRunning && (
                  <div className="absolute top-4 right-4 space-y-2">
                    <OverlayBadge icon={<Eye className="w-3 h-3" />} label="Eye" pct={eyeScore} status={eyeStatus} />
                    <OverlayBadge icon={<User className="w-3 h-3" />} label="Posture" pct={postureScore} status={postureStatus} />
                    <OverlayBadge icon={<Hand className="w-3 h-3" />} label="Gesture" pct={gestureScore} status={gestureStatus} />
                  </div>
                )}

                {isRunning && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
                    <div className="recording-dot" />
                    <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant={isMuted ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={toggleMute}
                  className="rounded-full w-12 h-12"
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button
                  variant={isRunning ? 'destructive' : 'hero'}
                  size="lg"
                  disabled={isStopping}
                  onClick={isRunning ? handleStopAndReport : handleStart}
                  className="rounded-full px-8"
                >
                  {isRunning ? (
                    <>
                      <Square className="w-5 h-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Recording
                    </>
                  )}
                </Button>

                <Button
                  variant={!isVideoOn ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={toggleVideo}
                  className="rounded-full w-12 h-12"
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard icon={<Eye className="w-5 h-5" />} label="Eye Contact" value={`${eyeScore}%`} status={scoreColor(eyeScore)} />
              <MetricCard icon={<User className="w-5 h-5" />} label="Posture" value={`${postureScore}%`} status={scoreColor(postureScore)} />
              <MetricCard icon={<Hand className="w-5 h-5" />} label="Gestures" value={`${gestureScore}%`} status={scoreColor(gestureScore)} />
              <MetricCard icon={<AlertCircle className="w-5 h-5" />} label="Filler Words" value={String(totalFillers)} status={totalFillers > 10 ? 'error' : totalFillers > 4 ? 'warning' : 'success'} />
            </div>
          </div>

          {/* Right – transcript, fillers, analysis */}
          <div className="space-y-6">
            {/* Transcript */}
            <Card variant="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Live Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={transcriptRef} className="transcript-container space-y-3 pr-2 max-h-60 overflow-y-auto">
                  {transcripts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Start recording to see live transcript...
                    </p>
                  ) : (
                    transcripts.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`text-sm p-2 rounded-lg ${
                          entry.fillers.length > 0
                            ? 'bg-warning/10 border border-warning/20'
                            : 'bg-muted/30'
                        }`}
                      >
                        <span className="text-xs text-muted-foreground block mb-1">
                          {entry.time?.toFixed(1)}s
                        </span>
                        <span>{highlightFillers(entry.text)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filler words summary */}
            {Object.keys(fillerCounts).length > 0 && (
              <Card variant="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    Filler Words
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fillerCounts).map(([word, count]) => (
                      <span
                        key={word}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 border border-warning/20 text-xs text-warning font-medium"
                      >
                        "{word}" <span className="font-bold">{count}x</span>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live analysis log */}
            <Card variant="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-secondary" />
                  Live Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analysisLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Per-frame analysis will appear here...
                    </p>
                  ) : (
                    analysisLog
                      .slice()
                      .reverse()
                      .slice(0, 20)
                      .map((frame, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <ScoreBar label="P" score={frame.posture_score} />
                          <ScoreBar label="E" score={frame.eye_score} />
                          <ScoreBar label="G" score={frame.gesture_score} />
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─── Sub-components ─── */

interface OverlayBadgeProps {
  icon: React.ReactNode;
  label: string;
  pct: number;
  status: string;
}
const OverlayBadge = ({ icon, label, pct, status }: OverlayBadgeProps) => {
  const color = pct >= 70 ? 'bg-success/80' : pct >= 40 ? 'bg-warning/80' : 'bg-destructive/80';
  return (
    <div className={`${color} backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1`}>
      {icon} {label}: {pct}% ({status})
    </div>
  );
};

const ScoreBar = ({ label, score }: { label: string; score: number }) => {
  const color = score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex items-center gap-1 flex-1">
      <span className="w-4 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right">{score}</span>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'success' | 'warning' | 'error';
}

const MetricCard = ({ icon, label, value, status }: MetricCardProps) => {
  return (
    <div className={`glass-card p-4 border ${statusColorMap[status]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={statusColorMap[status].split(' ')[0]}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${statusColorMap[status].split(' ')[0]}`}>
        {value}
      </div>
    </div>
  );
};

export default LivePresentation;
