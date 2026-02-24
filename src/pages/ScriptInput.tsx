import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain, Upload, FileText, ArrowRight, ArrowLeft, Sparkles, MessageSquare, Wand2, CheckCircle2, Send, Bot, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const USER_ID = 1; // change later when auth is added

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

const ScriptInput = () => {
  const [script, setScript] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  // Generate tab state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Chat/edit tab state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [currentScriptId, setCurrentScriptId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isEditing]);

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setFileName(file.name);
  setIsFinalized(false);
  setIsUploading(true);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(
      `/api/script/upload?user_id=${USER_ID}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (data.error) {
      toast({ title: "Upload failed", description: data.error, variant: "destructive" });
      return;
    }

    setScript(data.content ?? '');
    setCurrentScriptId(data.script_id);
    toast({ title: "Script uploaded", description: `${file.name} processed successfully.` });
  } catch (err) {
    console.error("Upload failed", err);
    toast({ title: "Upload failed", description: "Could not reach the server.", variant: "destructive" });
  } finally {
    setIsUploading(false);
  }
};

  const handleGenerate = async () => {
  if (!generatePrompt.trim()) return;

  setIsGenerating(true);

  try {
    const res = await fetch(`/api/script/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        prompt: generatePrompt,
      }),
    });

    const data = await res.json();

    if (data.error) {
      toast({ title: "Generation failed", description: data.error, variant: "destructive" });
      return;
    }

    setScript(data.content ?? '');
    setCurrentScriptId(data.script_id);
    setIsFinalized(false);
    toast({ title: "Script generated", description: "Your AI-generated script is ready." });
  } catch (err) {
    console.error("Generate failed", err);
    toast({ title: "Generation failed", description: "Could not reach the server.", variant: "destructive" });
  }

  setIsGenerating(false);
};

const handleChatEdit = async () => {
  if (!chatInput.trim() || !currentScriptId) return;

  const userMsg: ChatMessage = { role: "user", content: chatInput };
  setChatMessages((prev) => [...prev, userMsg]);
  setChatInput("");
  setIsEditing(true);

  try {
    const res = await fetch(`/api/script/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script_id: currentScriptId,
        user_id: USER_ID,
        instruction: userMsg.content,
      }),
    });

    const data = await res.json();

    if (data.error) {
      const aiResponse: ChatMessage = {
        role: "ai",
        content: `Edit failed: ${data.error}`,
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      toast({ title: "Edit failed", description: data.error, variant: "destructive" });
    } else {
      setScript(data.content ?? '');
      // Keep currentScriptId (backend returns same id)
      if (data.script_id) setCurrentScriptId(data.script_id);

      const aiResponse: ChatMessage = {
        role: "ai",
        content: "Script updated successfully.",
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }
  } catch (err) {
    console.error("Edit failed", err);
    const aiResponse: ChatMessage = {
      role: "ai",
      content: "Could not reach the server. Please try again.",
    };
    setChatMessages((prev) => [...prev, aiResponse]);
    toast({ title: "Edit failed", description: "Could not reach the server.", variant: "destructive" });
  }

  setIsEditing(false);
  setIsFinalized(false);
};

 const handleFinalize = async () => {
  if (!script.trim()) {
    toast({ title: "No script to finalize", description: "Upload, generate, or type a script first.", variant: "destructive" });
    return;
  }

  try {
    // If user manually typed without uploading/generating, create a backend record first
    let scriptId = currentScriptId;
    if (!scriptId) {
      const createRes = await fetch(`/api/script/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          content: script,
        }),
      });
      const createData = await createRes.json();
      if (createData.error) {
        toast({ title: "Save failed", description: createData.error, variant: "destructive" });
        return;
      }
      scriptId = createData.script_id;
      setCurrentScriptId(scriptId);
    }

    const res = await fetch(`/api/script/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script_id: scriptId,
        user_id: USER_ID,
      }),
    });

    const data = await res.json();

    if (data.error) {
      toast({ title: "Finalize failed", description: data.error, variant: "destructive" });
      return;
    }

    setIsFinalized(true);
    sessionStorage.setItem("presentationScript", script);
    toast({ title: "Script finalized", description: "Your script is locked as the reference." });
  } catch (err) {
    console.error("Finalize failed", err);
    toast({ title: "Finalize failed", description: "Could not reach the server.", variant: "destructive" });
  }
};

  const handleContinue = async () => {
     if (!isFinalized) return;

    sessionStorage.setItem('presentationScript', script);
    // Also send script to backend so it's ready
    
    navigate('/presentation');
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Step 1 of 2</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Prepare Your Script</h1>
            <p className="text-lg text-muted-foreground">
              Upload, generate, or edit your script — then finalize it as your reference.
            </p>
          </div>

          {/* Tabs for 3 Options */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in animation-delay-100">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1 bg-muted/70 backdrop-blur-sm">
              <TabsTrigger value="upload" className="gap-2 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload File</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="gap-2 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">Generate Script</span>
                <span className="sm:hidden">Generate</span>
              </TabsTrigger>
              <TabsTrigger value="edit" className="gap-2 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Edit with AI</span>
                <span className="sm:hidden">Edit</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab A: Upload */}
            <TabsContent value="upload">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload Your Script
                  </CardTitle>
                  <CardDescription>
                    Upload a .txt, .doc, or .docx file containing your presentation script
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="border-2 border-dashed border-border/70 rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".txt,.doc,.docx,.pdf"
                      className="hidden"
                    />
                    {isUploading ? (
                      <>
                        <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" />
                        <p className="text-foreground font-medium mb-1">Processing file...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <p className="text-foreground font-medium mb-1">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports .txt, .doc, .docx, .pdf
                        </p>
                      </>
                    )}
                  </div>
                  {fileName && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{fileName}</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab B: Generate via Prompt */}
            <TabsContent value="generate">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Wand2 className="w-5 h-5 text-primary" />
                    Generate with AI
                  </CardTitle>
                  <CardDescription>
                    Describe your topic and let AI create a structured script for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="e.g. A 5-minute pitch about AI in healthcare..."
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                      className="flex-1 bg-muted/50 border-border/50 focus:border-primary/50"
                    />
                    <Button
                      onClick={handleGenerate}
                      disabled={!generatePrompt.trim() || isGenerating}
                      className="gap-2"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {['5-min startup pitch', 'Technical demo walkthrough', 'Quarterly business review'].map((example) => (
                      <button
                        key={example}
                        onClick={() => setGeneratePrompt(example)}
                        className="text-xs text-left p-2 rounded-lg bg-muted/50 hover:bg-primary/10 border border-border/30 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab C: Conversational Edit */}
            <TabsContent value="edit">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Edit Conversationally
                  </CardTitle>
                  <CardDescription>
                    Tell the AI how to modify your script — add points, restructure, change tone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!(script ?? '').trim() && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/30 text-center">
                      <p className="text-sm text-muted-foreground">
                        Upload or generate a script first, then use this tab to refine it.
                      </p>
                    </div>
                  )}
                  {/* Chat Messages */}
                  {chatMessages.length > 0 && (
                    <div className="max-h-[250px] overflow-y-auto space-y-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          {msg.role === 'ai' && (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div className={`text-sm px-3 py-2 rounded-xl max-w-[80%] ${
                            msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}>
                            {msg.content}
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-7 h-7 rounded-full bg-secondary/30 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-4 h-4 text-secondary" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Editing script...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={script.trim() ? 'e.g. "Make the intro more engaging"' : 'Add a script first...'}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatEdit()}
                      disabled={!script.trim() || isEditing}
                      className="flex-1 bg-muted/50 border-border/50"
                    />
                    <Button
                      size="icon"
                      onClick={handleChatEdit}
                      disabled={!chatInput.trim() || !script.trim() || isEditing}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Script Preview / Editor */}
          <Card variant="glass" className="mt-6 animate-fade-in animation-delay-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  Script Preview
                </CardTitle>
                <div className="flex items-center gap-2">
                  {script.trim() && (
                    <span className="text-xs text-muted-foreground">
                      {script.split(/\s+/).filter(Boolean).length} words
                    </span>
                  )}
                  {isFinalized && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Finalized
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Your script will appear here. Upload, generate, or type it directly..."
                value={script}
                onChange={(e) => {
                  setScript(e.target.value);
                  setIsFinalized(false);
                }}
                className="min-h-[200px] bg-muted/50 border-border/50 focus:border-primary/50 resize-none font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 animate-fade-in animation-delay-300">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/presentation')}
            >
              Skip Script
            </Button>
            {!isFinalized ? (
              <Button
                variant="outline"
                size="lg"
                onClick={handleFinalize}
                disabled={!script.trim()}
                className="gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Finalize Script
              </Button>
            ) : (
              <Button
                variant="hero"
                size="lg"
                onClick={handleContinue}
                className="gap-2"
              >
                Continue to Presentation
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Tips */}
          <div className="mt-12 glass-card p-6 animate-fade-in animation-delay-300">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              How It Works
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                Upload, generate, or type your script using the tabs above
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                Use the AI editor to refine wording, add points, or restructure
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                Click "Finalize" to lock your reference script
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                After presenting, your transcript is compared against this script
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScriptInput;
