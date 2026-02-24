import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, ArrowLeft, Eye, User, Hand, Volume2, 
  Play, Clock, CheckCircle, Target, Sparkles,
  BookOpen, RotateCcw, TrendingUp, Award
} from 'lucide-react';

// Mock learning data
const weakSkills = [
  { skill: 'Hand Gestures', score: 65, icon: Hand },
  { skill: 'Posture', score: 72, icon: User },
  { skill: 'Filler Words', score: 68, icon: Volume2 },
];

const tutorials = [
  {
    id: 1,
    title: 'Confident Hand Gestures',
    description: 'Learn 5 powerful gestures that emphasize your points',
    duration: '8 min',
    category: 'Gestures',
    icon: Hand,
    progress: 0,
    isRecommended: true,
  },
  {
    id: 2,
    title: 'Power Posture Basics',
    description: 'Stand tall and project confidence with these techniques',
    duration: '6 min',
    category: 'Posture',
    icon: User,
    progress: 45,
    isRecommended: true,
  },
  {
    id: 3,
    title: 'Eliminate Filler Words',
    description: 'Replace "um" and "uh" with powerful pauses',
    duration: '10 min',
    category: 'Voice',
    icon: Volume2,
    progress: 0,
    isRecommended: true,
  },
  {
    id: 4,
    title: 'Eye Contact Mastery',
    description: 'Connect with your audience through strategic eye contact',
    duration: '7 min',
    category: 'Eye Contact',
    icon: Eye,
    progress: 100,
    isRecommended: false,
  },
  {
    id: 5,
    title: 'Voice Modulation',
    description: 'Add variety and emphasis to your speaking voice',
    duration: '12 min',
    category: 'Voice',
    icon: Volume2,
    progress: 20,
    isRecommended: false,
  },
];

const achievements = [
  { title: 'First Practice', description: 'Complete your first presentation', completed: true },
  { title: 'Eye Contact Pro', description: 'Score 90%+ on eye contact', completed: true },
  { title: 'Filler Word Free', description: 'Complete a presentation without filler words', completed: false },
  { title: 'Gesture Master', description: 'Score 85%+ on gestures', completed: false },
];

const Learning = () => {
  const completedTutorials = tutorials.filter(t => t.progress === 100).length;
  const overallProgress = Math.round(tutorials.reduce((acc, t) => acc + t.progress, 0) / tutorials.length);

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
              <Link to="/report">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Report
                </Button>
              </Link>
              <Link to="/presentation">
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Practice Again
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
            <BookOpen className="w-4 h-4 text-secondary" />
            <span className="text-sm text-secondary font-medium">Learning Center</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Improve Your Skills</h1>
          <p className="text-lg text-muted-foreground">
            Personalized tutorials and exercises based on your performance
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Weak Skills & Progress */}
          <div className="space-y-6">
            {/* Weak Skills */}
            <Card variant="glow" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-warning" />
                  Focus Areas
                </CardTitle>
                <CardDescription>Skills that need the most improvement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {weakSkills.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <skill.icon className="w-4 h-4 text-warning" />
                        <span className="text-sm font-medium">{skill.skill}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{skill.score}%</span>
                    </div>
                    <Progress value={skill.score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card variant="glass" className="animate-fade-in animation-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold gradient-text mb-2">{overallProgress}%</div>
                  <p className="text-sm text-muted-foreground">
                    {completedTutorials} of {tutorials.length} tutorials completed
                  </p>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card variant="glass" className="animate-fade-in animation-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.title}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      achievement.completed
                        ? 'bg-success/10 border border-success/20'
                        : 'bg-muted/30 border border-border/50'
                    }`}
                  >
                    <CheckCircle
                      className={`w-5 h-5 ${
                        achievement.completed ? 'text-success' : 'text-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className={`text-sm font-medium ${achievement.completed ? 'text-success' : ''}`}>
                        {achievement.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Middle & Right Columns - Tutorials */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recommended Section */}
            <div className="animate-fade-in animation-delay-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Recommended for You
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {tutorials.filter(t => t.isRecommended).map((tutorial) => (
                  <TutorialCard key={tutorial.id} tutorial={tutorial} featured />
                ))}
              </div>
            </div>

            {/* All Tutorials */}
            <div className="animate-fade-in animation-delay-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                All Tutorials
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {tutorials.filter(t => !t.isRecommended).map((tutorial) => (
                  <TutorialCard key={tutorial.id} tutorial={tutorial} />
                ))}
              </div>
            </div>

            {/* Practice CTA */}
            <Card variant="glow" className="animate-fade-in animation-delay-300">
              <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Practice?</h3>
                  <p className="text-muted-foreground">
                    Apply what you've learned with another presentation session
                  </p>
                </div>
                <Link to="/presentation">
                  <Button variant="hero" size="xl">
                    <Play className="w-5 h-5" />
                    Start Practice Session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

// Tutorial Card Component
interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
  isRecommended: boolean;
}

const TutorialCard = ({ tutorial, featured = false }: { tutorial: Tutorial; featured?: boolean }) => {
  const Icon = tutorial.icon;
  const isCompleted = tutorial.progress === 100;
  const isStarted = tutorial.progress > 0 && tutorial.progress < 100;

  return (
    <Card
      variant={featured ? 'glow' : 'glass'}
      className={`hover:scale-[1.02] transition-transform duration-300 ${
        isCompleted ? 'opacity-75' : ''
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isCompleted
                ? 'bg-success/20 border border-success/30'
                : featured
                ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30'
                : 'bg-muted border border-border/50'
            }`}
          >
            {isCompleted ? (
              <CheckCircle className="w-6 h-6 text-success" />
            ) : (
              <Icon className={`w-6 h-6 ${featured ? 'text-primary' : 'text-muted-foreground'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {tutorial.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {tutorial.duration}
              </div>
            </div>
            <h3 className="font-semibold mb-1 truncate">{tutorial.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{tutorial.description}</p>
            
            {/* Progress bar for started tutorials */}
            {isStarted && (
              <div className="mt-3">
                <Progress value={tutorial.progress} className="h-1.5" />
                <span className="text-xs text-muted-foreground mt-1 block">
                  {tutorial.progress}% complete
                </span>
              </div>
            )}
            
            {/* Action button */}
            <Button
              variant={isCompleted ? 'ghost' : featured ? 'default' : 'outline'}
              size="sm"
              className="mt-4"
            >
              {isCompleted ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Review
                </>
              ) : isStarted ? (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Continue
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Learning;
