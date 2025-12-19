
import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
  view: 'card' | 'list';
  onViewChange: (view: 'card' | 'list') => void;
}

export const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
      <Button
        variant={view === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('card')}
        className={view === 'card' ? 'bg-white shadow-sm' : ''}
      >
        <Grid className="w-4 h-4" />
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={view === 'list' ? 'bg-white shadow-sm' : ''}
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
};
