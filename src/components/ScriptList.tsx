import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  Users,
  Activity,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Copy,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ScriptDetailDialog from './ScriptDetailDialog';
import EditScriptDialog from './EditScriptDialog';
import type { Database } from '@/integrations/supabase/types';

type Script = Database['public']['Tables']['scripts']['Row'];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ScriptListProps {
  scripts: Script[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ScriptList({ scripts, loading, onRefresh }: ScriptListProps) {
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('scripts').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete script',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'Script has been removed',
      });
      onRefresh();
    }
    setDeleting(null);
  };

  const handleCopyLoader = (script: Script) => {
    const loaderCode = `loadstring(game:HttpGet("${SUPABASE_URL}/functions/v1/script-loader/${script.id}"))()`;
    navigator.clipboard.writeText(loaderCode);
    toast({
      title: 'Copied!',
      description: 'Loader script copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <Card className="border-border/50 bg-card/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Code className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No scripts yet</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Create your first protected script to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scripts.map((script) => (
          <Card
            key={script.id}
            className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-all cursor-pointer group"
            onClick={() => setSelectedScript(script)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{script.name}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {script.description || 'No description'}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setSelectedScript(script);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      setEditingScript(script);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Script
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLoader(script);
                    }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Loader
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(script.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      {deleting === script.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <Badge
                  variant={script.access_tier === 'premium' ? 'default' : 'secondary'}
                  className={script.access_tier === 'premium' ? 'bg-gradient-accent' : ''}
                >
                  {script.access_tier}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>{script.total_executions || 0}</span>
                </div>
                <Badge variant={script.is_active ? 'outline' : 'secondary'}>
                  {script.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ScriptDetailDialog
        script={selectedScript}
        onClose={() => setSelectedScript(null)}
        onRefresh={onRefresh}
      />

      <EditScriptDialog
        script={editingScript}
        open={!!editingScript}
        onClose={() => setEditingScript(null)}
        onSaved={onRefresh}
      />
    </>
  );
}
