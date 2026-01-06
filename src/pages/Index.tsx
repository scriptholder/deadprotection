import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, Code, Users, Zap, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center glow-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ScriptGuard</span>
          </div>

          <Link to="/auth">
            <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-gradient-primary">Protect</span> Your Scripts
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Advanced Lua script protection and distribution platform. Keep your code safe from leaks with our powerful whitelist system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8"
              >
                Start Protecting
                <Shield className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border/50">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-card/50 backdrop-blur border border-border/50 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure Protection</h3>
            <p className="text-muted-foreground">
              Advanced encryption and obfuscation to protect your scripts from unauthorized access and leaks.
            </p>
          </div>

          <div className="p-6 bg-card/50 backdrop-blur border border-border/50 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Whitelist System</h3>
            <p className="text-muted-foreground">
              Control access with Discord and Roblox ID whitelisting. Set time-based access for different tiers.
            </p>
          </div>

          <div className="p-6 bg-card/50 backdrop-blur border border-border/50 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground">
              Track script executions, monitor usage, and manage all your protected scripts from one dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-border/50 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to protect your scripts?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join developers who trust ScriptGuard to keep their code secure.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-card/30 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">ScriptGuard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ScriptGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
