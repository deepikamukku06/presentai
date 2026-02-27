import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Mic, Video, BarChart3, Sparkles } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen neural-bg grid-pattern relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float animation-delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">PresentAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/learning">
              <Button variant="ghost" size="sm">Resources</Button>
            </Link>
            <Link to="/script">
              <Button variant="outline" size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Coaching</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-foreground">Master Your</span>
            <br />
            <span className="gradient-text">Presentations</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in animation-delay-100">
            Real-time AI feedback on eye contact, posture, gestures, and voice. 
            Transform every presentation into a winning performance.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-fade-in animation-delay-200">
            <Link to="/script">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                <Mic className="w-5 h-5" />
                Start Presentation
              </Button>
            </Link>
            <Link to="/report">
              <Button variant="glass" size="xl" className="w-full sm:w-auto">
                <BarChart3 className="w-5 h-5" />
                View Demo Report
              </Button>
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 animate-fade-in animation-delay-300">
            <FeatureCard
              icon={<Video className="w-6 h-6" />}
              title="Live Video Analysis"
              description="Real-time eye contact, posture and gesture detection"
            />
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Voice Intelligence"
              description="Track filler words, pace, and voice modulation"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Detailed Reports"
              description="Comprehensive analytics with improvement tips"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          Built for hackathon excellence • Real-time AI presentation coaching
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="glass-card p-6 text-left hover:scale-105 transition-transform duration-300">
    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Landing;
