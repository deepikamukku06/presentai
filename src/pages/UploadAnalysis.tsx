import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Upload, FileText, ArrowRight, ArrowLeft,
  Video, CheckCircle2, Loader2, Play, X, FileVideo,
  Eye, User, Volume2, Sparkles, BarChart3
} from 'lucide-react';

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'done';
}

const UploadAnalysis = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptText, setScriptText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'frames', label: 'Extracting frames', icon: <Video className="w-4 h-4" />, status: 'pending' },
    { id: 'pose', label: 'Running pose & posture analysis', icon: <User className="w-4 h-4" />, status: 'pending' },
    { id: 'eye', label: 'Analyzing eye contact & gestures', icon: <Eye className="w-4 h-4" />, status: 'pending' },
    { id: 'speech', label: 'Running speech analysis', icon: <Volume2 className="w-4 h-4" />, status: 'pending' },
    { id: 'report', label: 'Generating AI report', icon: <Sparkles className="w-4 h-4" />, status: 'pending' },
  ]);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleVideoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i))) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setAnalysisComplete(false);
    }
  }, []);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setAnalysisComplete(false);
    }
  };

  const handleScriptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScriptFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setScriptText(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setAnalysisComplete(false);
    setOverallProgress(0);
    setProcessingSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
  };

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setOverallProgress(0);

    const steps = ['frames', 'pose', 'eye', 'speech', 'report'];
    let currentStep = 0;

    const runStep = () => {
      if (currentStep >= steps.length) {
        setIsAnalyzing(false);
        setAnalysisComplete(true);
        setOverallProgress(100);
        return;
      }

      setProcessingSteps(prev =>
        prev.map(s => ({
          ...s,
          status: s.id === steps[currentStep] ? 'running' : s.status,
        }))
      );

      const stepDuration = 1500 + Math.random() * 1000;
      const progressPerStep = 100 / steps.length;
      const startProgress = currentStep * progressPerStep;

      // Animate progress within step
      const progressInterval = setInterval(() => {
        setOverallProgress(prev => {
          const target = startProgress + progressPerStep;
          return Math.min(prev + 2, target);
        });
      }, stepDuration / (progressPerStep / 2));

      setTimeout(() => {
        clearInterval(progressInterval);
        setProcessingSteps(prev =>
          prev.map(s => ({
            ...s,
            status: s.id === steps[currentStep] ? 'done' : s.status,
          }))
        );
        setOverallProgress((currentStep + 1) * progressPerStep);
        currentStep++;
        runStep();
      }, stepDuration);
    };

    // Reset steps
    setProcessingSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    runStep();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen neural-bg relative">
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
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
              <Upload className="w-4 h-4 text-secondary" />
              <span className="text-sm text-secondary font-medium">Upload Mode</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Upload & Analyze</h1>
            <p className="text-lg text-muted-foreground">
              Upload a recorded presentation video and get a full AI analysis report.
            </p>
          </div>

          {/* Video Upload */}
          <Card variant="glass" className="animate-fade-in animation-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileVideo className="w-5 h-5 text-primary" />
                Upload Presentation Video
              </CardTitle>
              <CardDescription>MP4, MOV, or WEBM — max 500MB</CardDescription>
            </CardHeader>
            <CardContent>
              {!videoFile ? (
                <div
                  className="border-2 border-dashed border-border/70 rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => videoInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleVideoDrop}
                >
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoSelect}
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    className="hidden"
                  />
                  <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-foreground font-medium mb-1">
                    Drag & drop your video here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse files
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
                    {videoPreviewUrl && (
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                    <button
                      onClick={removeVideo}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-destructive/20 hover:border-destructive/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* File Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <FileVideo className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{videoFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(videoFile.size)}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional Reference Script */}
          <Card variant="glass" className="mt-4 animate-fade-in animation-delay-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Reference Script
                <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!scriptFile ? (
                <div
                  className="border border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => scriptInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={scriptInputRef}
                    onChange={handleScriptSelect}
                    accept=".txt,.doc,.docx,.pdf"
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a reference script to compare against the transcript
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/30">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium truncate">{scriptFile.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-success ml-auto shrink-0" />
                  <button
                    onClick={() => { setScriptFile(null); setScriptText(''); }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analyze Button */}
          <div className="flex justify-center mt-8 animate-fade-in animation-delay-300">
            {!analysisComplete ? (
              <Button
                variant="hero"
                size="xl"
                onClick={simulateAnalysis}
                disabled={!videoFile || isAnalyzing}
                className="gap-3"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Analyze Presentation
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate('/report')}
                className="gap-3"
              >
                <BarChart3 className="w-5 h-5" />
                View Full Report
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Processing Status */}
          {(isAnalyzing || analysisComplete) && (
            <Card variant="glass" className="mt-8 animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {analysisComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {analysisComplete ? 'Analysis Complete' : 'Processing Your Video...'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>

                {/* Step Indicators */}
                <div className="space-y-3">
                  {processingSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        step.status === 'done'
                          ? 'bg-success/5 border-success/20'
                          : step.status === 'running'
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-muted/20 border-border/30'
                      }`}
                    >
                      {/* Status Icon */}
                      <div className={`shrink-0 ${
                        step.status === 'done'
                          ? 'text-success'
                          : step.status === 'running'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}>
                        {step.status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : step.status === 'running' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                      {/* Step Icon */}
                      <span className={
                        step.status === 'done'
                          ? 'text-success'
                          : step.status === 'running'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }>
                        {step.icon}
                      </span>
                      {/* Label */}
                      <span className={`text-sm font-medium ${
                        step.status === 'done'
                          ? 'text-success'
                          : step.status === 'running'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Estimated Time */}
                {isAnalyzing && (
                  <p className="text-xs text-center text-muted-foreground">
                    Estimated time remaining: ~{Math.max(5, Math.round((100 - overallProgress) / 4))}s
                  </p>
                )}

                {/* AI Summary (shown after completion) */}
                {analysisComplete && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">AI Summary</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Your presentation demonstrates strong posture and good eye contact. 
                          Vocal energy is consistent but could benefit from more variation. 
                          3 filler words detected. Overall score: <span className="text-primary font-semibold">82/100</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default UploadAnalysis;
