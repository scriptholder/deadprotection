import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Code,
  Users,
  Activity,
  Plus,
  LogOut,
  Loader2,
  TrendingUp,
  Clock,
} from 'lucide-react';
import ScriptList from '@/components/ScriptList';
import CreateScriptDialog from '@/components/CreateScriptDialog';
import type { Database } from '@/integrations/supabase/types';

type Script = Database['public']['Tables']['scripts']['Row'];

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [scriptsLoading, setScriptsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [stats, setStats] = useState({
    totalScripts: 0,
    totalExecutions: 0,
    activeWhitelists: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchScripts();
      fetchStats();
    }
  }, [user]);

  const fetchScripts = async () => {
    setScriptsLoading(true);
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setScripts(data);
    }
    setScriptsLoading(false);
  };

  const fetchStats = async () => {
    // Fetch total scripts count
    const { count: scriptsCount } = await supabase
      .from('scripts')
      .select('*', { count: 'exact', head: true });

    // Fetch total executions
    const { data: scriptsData } = await supabase
      .from('scripts')
      .select('total_executions');

    const totalExecutions = scriptsData?.reduce(
      (sum, s) => sum + (s.total_executions || 0),
      0
    ) || 0;

    // Fetch active whitelists count
    const { count: whitelistCount } = await supabase
      .from('whitelist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    setStats({
      totalScripts: scriptsCount || 0,
      totalExecutions,
      activeWhitelists: whitelistCount || 0,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ScriptGuard</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Scripts
              </CardTitle>
              <Code className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalScripts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Protected scripts
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Executions
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalExecutions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-success" />
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Whitelists
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeWhitelists}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Currently active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Scripts Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Scripts</h2>
              <p className="text-muted-foreground">
                Manage and protect your Lua scripts
              </p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Script
            </Button>
          </div>

          <ScriptList
            scripts={scripts}
            loading={scriptsLoading}
            onRefresh={fetchScripts}
          />
        </div>
      </main>

      <CreateScriptDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={() => {
          fetchScripts();
          fetchStats();
        }}
      />
    </div>
  );
}
