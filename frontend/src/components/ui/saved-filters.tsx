import React, { useState, useEffect } from 'react';
import { Save, Trash2, Star, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export interface SavedFilterPreset {
  id: string;
  name: string;
  filters: any;
  createdAt: string;
}

interface SavedFiltersProps {
  currentFilters: any;
  onLoadPreset: (filters: any) => void;
}

export const SavedFilters = ({ currentFilters, onLoadPreset }: SavedFiltersProps) => {
  const [presets, setPresets] = useState<SavedFilterPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState<SavedFilterPreset | null>(null);
  const { toast } = useToast();

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filterPresets');
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);

  const savePresets = (newPresets: SavedFilterPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem('filterPresets', JSON.stringify(newPresets));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the filter preset',
        variant: 'destructive',
      });
      return;
    }

    const newPreset: SavedFilterPreset = {
      id: editingPreset?.id || Date.now().toString(),
      name: presetName,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    const newPresets = editingPreset
      ? presets.map((p) => (p.id === editingPreset.id ? newPreset : p))
      : [...presets, newPreset];

    savePresets(newPresets);
    setShowSaveDialog(false);
    setPresetName('');
    setEditingPreset(null);
    
    toast({
      title: 'Success',
      description: `Filter preset "${newPreset.name}" saved`,
    });
  };

  const handleDeletePreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const newPresets = presets.filter((p) => p.id !== id);
    savePresets(newPresets);
    
    toast({
      title: 'Deleted',
      description: `Filter preset "${preset?.name}" deleted`,
    });
  };

  const handleEditPreset = (preset: SavedFilterPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setShowSaveDialog(true);
  };

  const hasActiveFilters = Object.keys(currentFilters).some(
    (key) => currentFilters[key] && (Array.isArray(currentFilters[key]) ? currentFilters[key].length > 0 : true)
  );

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          disabled={!hasActiveFilters}
          className="transition-all duration-200"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Filters
        </Button>

        {presets.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Star className="w-4 h-4 mr-2" />
                Saved Filters ({presets.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-background z-50">
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  className="flex items-center justify-between p-2 cursor-pointer group"
                  onSelect={(e) => {
                    e.preventDefault();
                    onLoadPreset(preset.filters);
                    toast({
                      title: 'Filters loaded',
                      description: `Applied "${preset.name}" preset`,
                    });
                  }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(preset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPreset(preset);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePreset(preset.id);
                      }}
                      className="h-6 w-6 p-0 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>
              {editingPreset ? 'Edit Filter Preset' : 'Save Filter Preset'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="presetName">Preset Name</Label>
              <Input
                id="presetName"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder='e.g., "Urgent Medicare Referrals"'
                className="bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSaveDialog(false);
              setPresetName('');
              setEditingPreset(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              {editingPreset ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
