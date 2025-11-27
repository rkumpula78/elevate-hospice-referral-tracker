import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

export const FilterChips = ({ filters, onRemove, onClearAll, className }: FilterChipsProps) => {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 animate-fade-in", className)}>
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="pl-3 pr-1 py-1 transition-all duration-200 hover:scale-105"
        >
          <span className="text-xs font-medium mr-1">
            {filter.label}: {filter.value}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(filter.key)}
            className="h-4 w-4 p-0 hover:bg-destructive/20 ml-1 transition-colors"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          Clear All
        </Button>
      )}
    </div>
  );
};
