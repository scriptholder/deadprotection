import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Script = Database['public']['Tables']['scripts']['Row'];
type AccessTier = Database['public']['Enums']['access_tier'];

interface EditScriptDialogProps {
  script: Script | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditScriptDialog({
  script,
  open,
  onClose,
  onSaved,
}: EditScriptDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [accessTier, setAccessTier] = useState<AccessTier>('standard');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (script) {
      setName(script.name);
      setDescription(script.description || '');
      setContent(script.script_content);
      setAccessTier(script.access_tier);
    }
  }, [script]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!script) return;

    if (!name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Script name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Validation error',
        description: 'Script content is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('scripts')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        script_content: content,
        access_tier: accessTier,
      })
      .eq('id', script.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update script',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Updated',
        description: 'Script has been saved',
      });
      onSaved();
      onClose();
    }

    setSaving(false);
  };

  if (!script) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border/50 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Script</DialogTitle>
          <DialogDescription>
            Update your script details and content
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Script name"
              className="bg-input/50 border-border/50"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="bg-input/50 border-border/50"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tier">Access Tier</Label>
            <Select value={accessTier} onValueChange={(v) => setAccessTier(v as AccessTier)}>
              <SelectTrigger className="bg-input/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (Public)</SelectItem>
                <SelectItem value="premium">Premium (Whitelist Required)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">Script Content</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="-- Your Lua script here"
              className="bg-input/50 border-border/50 font-mono text-sm min-h-[200px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-primary hover:opacity-90"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
