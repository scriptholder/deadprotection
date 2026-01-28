import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Copy,
  Plus,
  Trash2,
  Loader2,
  Users,
  Code,
  Activity,
  Download,
  Palette,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ThemeColorPicker, { type ThemeColors } from './ThemeColorPicker';
import AsciiArtPreview from './AsciiArtPreview';
import { generateLoaderScript, downloadLuaFile } from '@/lib/lua-generator';
import type { Database } from '@/integrations/supabase/types';

type Script = Database['public']['Tables']['scripts']['Row'];
type WhitelistEntry = Database['public']['Tables']['whitelist_entries']['Row'];
type AccessTier = Database['public']['Enums']['access_tier'];
type AccessDuration = Database['public']['Enums']['access_duration'];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ScriptDetailDialogProps {
  script: Script | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ScriptDetailDialog({
  script,
  onClose,
  onRefresh,
}: ScriptDetailDialogProps) {
  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const { toast } = useToast();

  // New entry form
  const [discordId, setDiscordId] = useState('');
  const [robloxId, setRobloxId] = useState('');
  const [entryTier, setEntryTier] = useState<AccessTier>('standard');
  const [duration, setDuration] = useState<AccessDuration>('unlimited');

  // Theme customization
  const [themeColor, setThemeColor] = useState<ThemeColors>({ r: 147, g: 51, b: 234 });
  const [showAsciiArt, setShowAsciiArt] = useState(true);

  useEffect(() => {
    if (script) {
      fetchWhitelist();
    }
  }, [script]);

  const fetchWhitelist = async () => {
    if (!script) return;
    setLoading(true);
    const { data } = await supabase
      .from('whitelist_entries')
      .select('*')
      .eq('script_id', script.id)
      .order('created_at', { ascending: false });

    setWhitelistEntries(data || []);
    setLoading(false);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!script) return;
    if (!discordId.trim() && !robloxId.trim()) {
      toast({
        title: 'Validation error',
        description: 'Discord ID or Roblox ID is required',
        variant: 'destructive',
      });
      return;
    }

    setAddingEntry(true);

    // Calculate expiration based on duration
    let expiresAt: string | null = null;
    if (duration !== 'unlimited') {
      const now = new Date();
      switch (duration) {
        case 'hourly':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
          break;
        case 'daily':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'weekly':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'monthly':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
      }
    }

    const { error } = await supabase.from('whitelist_entries').insert({
      script_id: script.id,
      discord_id: discordId.trim() || null,
      roblox_id: robloxId.trim() || null,
      access_tier: entryTier,
      duration_type: duration,
      expires_at: expiresAt,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add whitelist entry',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Added',
        description: 'Whitelist entry created',
      });
      setDiscordId('');
      setRobloxId('');
      fetchWhitelist();
    }

    setAddingEntry(false);
  };

  const handleRemoveEntry = async (id: string) => {
    const { error } = await supabase
      .from('whitelist_entries')
      .delete()
      .eq('id', id);

    if (!error) {
      toast({ title: 'Removed', description: 'Entry removed from whitelist' });
      fetchWhitelist();
    }
  };

  const handleCopyLoader = () => {
    if (!script) return;
    const loaderCode = `loadstring(game:HttpGet("${SUPABASE_URL}/functions/v1/script-loader/${script.id}"))()`;
    navigator.clipboard.writeText(loaderCode);
    toast({
      title: 'Copied!',
      description: 'Loader script copied to clipboard',
    });
  };

  const handleDownloadLua = () => {
    if (!script) return;
    const loaderContent = generateLoaderScript({
      scriptName: script.name,
      scriptId: script.id,
      supabaseUrl: SUPABASE_URL,
      themeColor,
      showAsciiArt,
    });
    downloadLuaFile(loaderContent, `${script.name.replace(/\s+/g, '_')}_loader.lua`);
    toast({
      title: 'Downloaded!',
      description: 'Lua loader file downloaded',
    });
  };

  if (!script) return null;

  return (
    <Dialog open={!!script} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border/50 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{script.name}</DialogTitle>
            <Badge
              variant={script.access_tier === 'premium' ? 'default' : 'secondary'}
              className={script.access_tier === 'premium' ? 'bg-gradient-accent' : ''}
            >
              {script.access_tier}
            </Badge>
          </div>
          <DialogDescription>{script.description || 'No description'}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="whitelist" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="whitelist" className="gap-2">
              <Users className="h-4 w-4" />
              Whitelist
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-4 w-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="loader" className="gap-2">
              <Download className="h-4 w-4" />
              Loader
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Activity className="h-4 w-4" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whitelist" className="flex-1 overflow-auto space-y-4">
            {/* Add Entry Form */}
            <form onSubmit={handleAddEntry} className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discord">Discord ID</Label>
                  <Input
                    id="discord"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    placeholder="123456789"
                    className="bg-input/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roblox">Roblox ID</Label>
                  <Input
                    id="roblox"
                    value={robloxId}
                    onChange={(e) => setRobloxId(e.target.value)}
                    placeholder="123456789"
                    className="bg-input/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select value={entryTier} onValueChange={(v) => setEntryTier(v as AccessTier)}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={(v) => setDuration(v as AccessDuration)}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">1 Hour</SelectItem>
                      <SelectItem value="daily">1 Day</SelectItem>
                      <SelectItem value="weekly">1 Week</SelectItem>
                      <SelectItem value="monthly">1 Month</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={addingEntry}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {addingEntry ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Entry
              </Button>
            </form>

            {/* Whitelist Entries */}
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : whitelistEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No whitelist entries yet
                </div>
              ) : (
                whitelistEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        {entry.discord_id && (
                          <div className="text-muted-foreground">
                            Discord: <span className="text-foreground font-mono">{entry.discord_id}</span>
                          </div>
                        )}
                        {entry.roblox_id && (
                          <div className="text-muted-foreground">
                            Roblox: <span className="text-foreground font-mono">{entry.roblox_id}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">{entry.access_tier}</Badge>
                      <Badge variant={entry.is_active ? 'default' : 'secondary'}>
                        {entry.duration_type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Loader Script</Label>
                <Button variant="ghost" size="sm" onClick={handleCopyLoader}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="p-4 bg-muted/30 rounded-lg font-mono text-sm overflow-x-auto">
                {`loadstring(game:HttpGet("${SUPABASE_URL}/functions/v1/script-loader/${script.id}"))()`}
              </pre>
            </div>
            <div className="space-y-2">
              <Label>Script Content</Label>
              <pre className="p-4 bg-muted/30 rounded-lg font-mono text-sm overflow-x-auto max-h-[300px]">
                {script.script_content}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="loader" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Loader Customization
                </Label>
                <p className="text-sm text-muted-foreground">
                  Customize the look and feel of your script loader
                </p>
              </div>

              <ThemeColorPicker value={themeColor} onChange={setThemeColor} />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label>ASCII Art Logo</Label>
                  <p className="text-xs text-muted-foreground">
                    Display script name as ASCII art in the loader
                  </p>
                </div>
                <Switch checked={showAsciiArt} onCheckedChange={setShowAsciiArt} />
              </div>

              {showAsciiArt && (
                <div className="space-y-2">
                  <Label className="text-sm">Preview</Label>
                  <AsciiArtPreview 
                    text={script.name} 
                    color={`rgb(${themeColor.r}, ${themeColor.g}, ${themeColor.b})`}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDownloadLua}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                <Download className="h-4 w-4 mr-2" />
                Download .lua Loader
              </Button>
              <Button variant="outline" onClick={handleCopyLoader}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Simple Loader
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{script.total_executions || 0}</div>
                <div className="text-sm text-muted-foreground">Total Executions</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{whitelistEntries.length}</div>
                <div className="text-sm text-muted-foreground">Whitelist Entries</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">
                  {new Date(script.created_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">
                  {new Date(script.updated_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
