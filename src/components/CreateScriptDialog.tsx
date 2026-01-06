import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AccessTier = Database['public']['Enums']['access_tier'];

interface CreateScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateScriptDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateScriptDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [accessTier, setAccessTier] = useState<AccessTier>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !scriptContent.trim()) {
      toast({
        title: 'Validation error',
        description: 'Name and script content are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('scripts').insert({
      name: name.trim(),
      description: description.trim() || null,
      script_content: scriptContent,
      access_tier: accessTier,
      user_id: user.id,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create script',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Script created successfully',
      });
      resetForm();
      onOpenChange(false);
      onCreated();
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setScriptContent('');
    setAccessTier('standard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Create New Script</DialogTitle>
          <DialogDescription>
            Add a new protected script to your collection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Script Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Script"
              className="bg-input/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your script"
              className="bg-input/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier">Access Tier</Label>
            <Select value={accessTier} onValueChange={(v) => setAccessTier(v as AccessTier)}>
              <SelectTrigger className="bg-input/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Script Content</Label>
            <Textarea
              id="content"
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              placeholder="-- Your Lua code here"
              className="bg-input/50 border-border/50 font-mono min-h-[200px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Script
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
