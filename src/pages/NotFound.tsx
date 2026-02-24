import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen neural-bg flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow mx-auto mb-8">
          <Brain className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          This page seems to have wandered off script
        </p>
        <Link to="/">
          <Button variant="hero" size="lg">
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
