
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

interface MarketerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MarketerSettingsDialog = ({ open, onOpenChange }: MarketerSettingsDialogProps) => {
  const { toast } = useToast();
  const [marketers, setMarketers] = useState<string[]>(() => {
    const stored = localStorage.getItem('hospice-marketers');
    if (stored) {
      return JSON.parse(stored);
    }
    return ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'David Brown'];
  });
  const [newMarketer, setNewMarketer] = useState('');

  const saveMarketers = (updatedMarketers: string[]) => {
    localStorage.setItem('hospice-marketers', JSON.stringify(updatedMarketers));
    setMarketers(updatedMarketers);
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('marketers-updated'));
  };

  const addMarketer = () => {
    if (!newMarketer.trim()) return;
    
    if (marketers.includes(newMarketer.trim())) {
      toast({ title: 'Marketer already exists', variant: 'destructive' });
      return;
    }

    const updatedMarketers = [...marketers, newMarketer.trim()];
    saveMarketers(updatedMarketers);
    setNewMarketer('');
    toast({ title: 'Marketer added successfully' });
  };

  const removeMarketer = (marketerToRemove: string) => {
    const updatedMarketers = marketers.filter(m => m !== marketerToRemove);
    saveMarketers(updatedMarketers);
    toast({ title: 'Marketer removed successfully' });
  };

  const updateMarketer = (index: number, newName: string) => {
    if (!newName.trim()) return;
    
    const updatedMarketers = [...marketers];
    updatedMarketers[index] = newName.trim();
    saveMarketers(updatedMarketers);
    toast({ title: 'Marketer updated successfully' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    toast({ title: 'Marketer settings saved' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Marketers</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Current Marketers</Label>
            {marketers.map((marketer, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={marketer}
                  onChange={(e) => updateMarketer(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMarketer(marketer)}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-marketer">Add New Marketer</Label>
            <div className="flex gap-2">
              <Input
                id="new-marketer"
                value={newMarketer}
                onChange={(e) => setNewMarketer(e.target.value)}
                placeholder="Enter marketer name"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMarketer())}
              />
              <Button type="button" onClick={addMarketer} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarketerSettingsDialog;
