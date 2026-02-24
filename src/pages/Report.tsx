import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain, ArrowLeft, Eye, User, Hand, Volume2,
  MessageSquare, Play, Download, RotateCcw, Trophy,
  TrendingUp, Loader2, AlertTriangle, Lightbulb, CheckCircle2, Target
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts';

/* ─── Types matching backend GET /api/session/report ─── */
interface Filler { word: string; time: number }
interface LiveFeedback {
  id: number;
  category: string;
  status: string;
  score: number;
  timestamp: number;
}
interface ContentFeedback {
  clarity_score: number;
  engagement_score: number;
  structure_score: number;
  strengths: string[];
  improvements: string[];
  overall_feedback: string;
  content_suggestions: string[];
}
interface ReportData {
  transcript: string;
  fillers: Filler[];
  filler_percent: number;
  pitch: { avg: number; min: number; max: number };
  vision_scores: { posture: number; eye: number; gesture: number; overall: number };
  missed_points: string[];
  partially_covered: string[];
  flow_issues: string[];
  coverage_percent: number;
  semantic_insights: string;
  has_script: boolean;
  speech_score: number;
  overall_score: number;
  content_feedback: ContentFeedback | null;
  video_url: string | null;
  live_feedback: LiveFeedback[];
}

/* ─── Filler set for highlighting ─── */
const FILLER_SET = new Set([
  'um','uh','ah','er','like','basically','actually','literally',
  'honestly','right','okay','so','well',
]);

const Report = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  /* fetch report on mount */
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch('/api/session/report?user_id=1');
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const raw = await res.json();
        // Map backend shape to frontend ReportData with safe defaults
        const rawPitch = raw.pitch ?? {};
        const rawVision = raw.vision_scores ?? {};
        const sa = raw.semantic_analysis;
        const cf = raw.content_feedback;
        const data: ReportData = {
          transcript: raw.transcript ?? '',
          fillers: Array.isArray(raw.fillers) ? raw.fillers : [],
          filler_percent: raw.filler_percent ?? 0,
          pitch: { avg: rawPitch.avg ?? 0, min: rawPitch.min ?? 0, max: rawPitch.max ?? 0 },
          vision_scores: { posture: rawVision.posture ?? 0, eye: rawVision.eye ?? 0, gesture: rawVision.gesture ?? 0, overall: rawVision.overall ?? 0 },
          missed_points: Array.isArray(sa?.missing_points) ? sa.missing_points : [],
          partially_covered: Array.isArray(sa?.partially_covered_points) ? sa.partially_covered_points : [],
          flow_issues: Array.isArray(sa?.flow_issues) ? sa.flow_issues : [],
          coverage_percent: sa?.coverage_percent ?? 0,
          semantic_insights: sa?.insights ?? '',
          has_script: sa !== null && sa !== undefined,
          speech_score: raw.speech_score ?? 0,
          overall_score: raw.overall_score ?? 0,
          content_feedback: (cf && typeof cf === 'object' && !cf.error) ? cf : null,
          video_url: raw.video_url ?? null,
          live_feedback: Array.isArray(raw.live_feedback) ? raw.live_feedback : [],
        };
        setReport(data);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Generating your report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-destructive">{error ?? 'No report data'}</p>
          <Link to="/presentation">
            <Button variant="outline">Try Again</Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Derived data ─── */
  const overallScore = Math.round(report.overall_score);

  const categoryScores = [
    { name: 'Eye Contact', score: Math.round(report.vision_scores.eye), fill: 'hsl(160, 84%, 39%)' },
    { name: 'Posture', score: Math.round(report.vision_scores.posture), fill: 'hsl(191, 91%, 50%)' },
    { name: 'Gestures', score: Math.round(report.vision_scores.gesture), fill: 'hsl(262, 83%, 58%)' },
    { name: 'Speech', score: Math.round(report.speech_score), fill: 'hsl(38, 92%, 50%)' },
  ];

  // count fillers
  const fillerMap: Record<string, number> = {};
  for (const f of (report.fillers ?? [])) {
    const w = f?.word ?? 'unknown';
    fillerMap[w] = (fillerMap[w] ?? 0) + 1;
  }
  const fillerWordsData = Object.entries(fillerMap).map(([word, count]) => ({ word, count }));

  const radialData = [
    {
      name: 'Score',
      value: overallScore,
      fill:
        overallScore >= 80
          ? 'hsl(160, 84%, 39%)'
          : overallScore >= 60
          ? 'hsl(191, 91%, 50%)'
          : 'hsl(38, 92%, 50%)',
    },
  ];

  /* ─── Transcript highlighting + click-to-seek ─── */
  const renderTranscript = () => {
    const words = (report.transcript ?? '').split(/(\s+)/);
    return words.map((tok, i) => {
      const lower = tok.toLowerCase().trim();
      const filler = (report.fillers ?? []).find((f) => f?.word === lower);
      if (FILLER_SET.has(lower) && filler) {
        return (
          <span
            key={i}
            className="bg-warning/30 text-warning rounded px-0.5 cursor-pointer hover:bg-warning/50 transition-colors"
            title={`Seek to ${(filler.time ?? 0).toFixed(1)}s`}
            onClick={() => {
              if (videoPlayerRef.current) {
                videoPlayerRef.current.currentTime = filler.time;
                videoPlayerRef.current.play();
              }
            }}
          >
            {tok}
          </span>
        );
      }
      return tok;
    });
  };

  /* ─── Dynamic tips based on scores ─── */
  const tips: { icon: React.ReactNode; text: string }[] = [];
  if (report.vision_scores.eye < 70)
    tips.push({ icon: <Eye className="w-4 h-4" />, text: 'Look directly at the camera to improve eye contact score.' });
  if (report.vision_scores.posture < 70)
    tips.push({ icon: <User className="w-4 h-4" />, text: 'Keep your shoulders back and sit/stand straight for better posture.' });
  if (report.vision_scores.gesture < 70)
    tips.push({ icon: <Hand className="w-4 h-4" />, text: 'Use more open hand gestures to emphasize your points.' });
  if (report.speech_score < 80)
    tips.push({ icon: <Volume2 className="w-4 h-4" />, text: 'Reduce filler words and work on vocal variety.' });
  if (report.filler_percent > 5)
    tips.push({ icon: <MessageSquare className="w-4 h-4" />, text: 'Pause briefly instead of using filler words like "um" and "like".' });
  if (tips.length === 0)
    tips.push({ icon: <Trophy className="w-4 h-4" />, text: 'Great job! Keep practising to maintain your excellent score.' });

  return (
    <div className="min-h-screen neural-bg">
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
              <Link to="/presentation">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-8">
        {/* Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-6">
            <Trophy className="w-4 h-4 text-success" />
            <span className="text-sm text-success font-medium">Presentation Complete!</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Performance Report</h1>
          <p className="text-lg text-muted-foreground">
            Detailed analysis of your presentation with improvement suggestions
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left – Score & Video */}
          <div className="space-y-6">
            {/* Overall Score */}
            <Card variant="glow" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-center">Overall Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={12}
                      data={radialData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        background={{ fill: 'hsl(222, 30%, 14%)' }}
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold gradient-text">{overallScore}</span>
                    <span className="text-sm text-muted-foreground">out of 100</span>
                  </div>
                </div>
                <p className="text-center mt-4 text-muted-foreground">
                  {overallScore >= 80
                    ? 'Excellent performance!'
                    : overallScore >= 60
                    ? 'Good job, keep practicing!'
                    : 'Room for improvement'}
                </p>
              </CardContent>
            </Card>

            {/* Video Playback */}
            <Card variant="glass" className="animate-fade-in animation-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  Recording Playback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.video_url ? (
                  <video
                    ref={videoPlayerRef}
                    src={report.video_url}
                    controls
                    className="w-full rounded-xl border border-border/50"
                  />
                ) : (
                  <div className="aspect-video bg-muted/50 rounded-xl flex items-center justify-center border border-border/50">
                    <p className="text-sm text-muted-foreground">No recording available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice / Pitch Stats */}
            <Card variant="glass" className="animate-fade-in animation-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-primary" />
                  Voice &amp; Pitch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{report.pitch.avg.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Avg Hz</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{report.pitch.min.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Min Hz</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">{report.pitch.max.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Max Hz</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle – Charts & Fillers */}
          <div className="space-y-6">
            {/* Category Breakdown */}
            <Card variant="glass" className="animate-fade-in animation-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryScores} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(215, 20%, 55%)" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={90}
                        stroke="hsl(215, 20%, 55%)"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(222, 47%, 8%)',
                          border: '1px solid hsl(222, 30%, 18%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Filler Words */}
            <Card variant="glass" className="animate-fade-in animation-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-warning" />
                  Filler Words Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fillerWordsData.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {fillerWordsData.map((item) => (
                        <div
                          key={item.word}
                          className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20"
                        >
                          <span className="text-sm font-medium">"{item.word}"</span>
                          <span className="text-lg font-bold text-warning">{item.count}x</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Total: {(report.fillers ?? []).length} occurrences ({(report.filler_percent ?? 0).toFixed(1)}% of speech)
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No filler words detected!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right – Transcript, AI Feedback, Tips */}
          <div className="space-y-6">
            {/* Transcript with highlights */}
            <Card variant="glass" className="animate-fade-in animation-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Transcript with Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-h-64 overflow-y-auto">
                  <p className="text-sm leading-relaxed">
                    {report.transcript ? renderTranscript() : 'No transcript available.'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Click a highlighted filler word to seek the video to that moment.
                </p>
              </CardContent>
            </Card>

            {/* AI Feedback */}
            <Card variant="glass" className="animate-fade-in animation-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-secondary" />
                  AI Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.content_feedback ? (
                  <div className="max-h-72 overflow-y-auto pr-1 space-y-4">
                    {/* Scores */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xl font-bold text-primary">{report.content_feedback.clarity_score}</p>
                        <p className="text-xs text-muted-foreground">Clarity</p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                        <p className="text-xl font-bold text-secondary">{report.content_feedback.engagement_score}</p>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                      <div className="p-2 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-xl font-bold text-success">{report.content_feedback.structure_score}</p>
                        <p className="text-xs text-muted-foreground">Structure</p>
                      </div>
                    </div>
                    {/* Overall */}
                    <p className="text-sm text-muted-foreground">{report.content_feedback.overall_feedback}</p>
                    {/* Strengths */}
                    {(report.content_feedback.strengths?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-success mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Strengths</p>
                        <ul className="space-y-1">
                          {report.content_feedback.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-success/50">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Improvements */}
                    {(report.content_feedback.improvements?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-warning mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Areas to Improve</p>
                        <ul className="space-y-1">
                          {report.content_feedback.improvements.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-warning/50">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">AI feedback is being generated...</p>
                )}
              </CardContent>
            </Card>

            {/* Script Analysis OR Content Suggestions */}
            <Card variant="glass" className="animate-fade-in animation-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {report.has_script ? (
                    <><Target className="w-5 h-5 text-destructive" /> Script Coverage Analysis</>
                  ) : (
                    <><Lightbulb className="w-5 h-5 text-warning" /> Content Improvement Suggestions</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.has_script ? (
                  <div className="space-y-4">
                    {/* Coverage bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Script Coverage</span>
                        <span>{report.coverage_percent}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            report.coverage_percent >= 80 ? 'bg-success' : report.coverage_percent >= 50 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(report.coverage_percent, 100)}%` }}
                        />
                      </div>
                    </div>
                    {/* Missing Points */}
                    {(report.missed_points?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Missing Points</p>
                        <ul className="space-y-1.5">
                          {report.missed_points.map((point, i) => (
                            <li key={i} className="text-sm p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-muted-foreground">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Partially Covered */}
                    {(report.partially_covered?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-warning mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Partially Covered</p>
                        <ul className="space-y-1.5">
                          {report.partially_covered.map((point, i) => (
                            <li key={i} className="text-sm p-2 rounded-lg bg-warning/10 border border-warning/20 text-muted-foreground">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Flow Issues */}
                    {(report.flow_issues?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-primary mb-2">Flow Issues</p>
                        <ul className="space-y-1.5">
                          {report.flow_issues.map((issue, i) => (
                            <li key={i} className="text-sm p-2 rounded-lg bg-primary/10 border border-primary/20 text-muted-foreground">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Insights */}
                    {report.semantic_insights && (
                      <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{report.semantic_insights}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.content_feedback?.content_suggestions && report.content_feedback.content_suggestions.length > 0 ? (
                      <ul className="space-y-2">
                        {report.content_feedback.content_suggestions.map((s, i) => (
                          <li key={i} className="text-sm p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-muted-foreground flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific content suggestions. Try adding a script before presenting for detailed coverage analysis.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dynamic Improvement Tips */}
            <Card variant="glass" className="animate-fade-in animation-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-secondary" />
                  Key Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tips.map((t, i) => (
                    <ImprovementItem key={i} icon={t.icon} tip={t.text} />
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3 animate-fade-in animation-delay-500">
              <Link to="/learning">
                <Button variant="hero" size="lg" className="w-full">
                  View Improvement Exercises
                  <TrendingUp className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/presentation">
                <Button variant="outline" size="lg" className="w-full">
                  <RotateCcw className="w-5 h-5" />
                  Practice Again
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ImprovementItem = ({ icon, tip }: { icon: React.ReactNode; tip: string }) => (
  <li className="flex items-start gap-3 text-sm">
    <span className="text-primary mt-0.5">{icon}</span>
    <span className="text-muted-foreground">{tip}</span>
  </li>
);

export default Report;
