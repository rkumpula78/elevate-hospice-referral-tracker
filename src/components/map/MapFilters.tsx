import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Filter, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MapFiltersState } from './useMapOrganizations';

interface MapFiltersProps {
  filters: MapFiltersState;
  onChange: (filters: MapFiltersState) => void;
  orgTypes: string[];
  orgCount: number;
}

const RATINGS = ['A', 'B', 'C', 'D'];

const MapFilters = ({ filters, onChange, orgTypes, orgCount }: MapFiltersProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(!isMobile);

  const toggleRating = (rating: string) => {
    const next = filters.ratings.includes(rating)
      ? filters.ratings.filter(r => r !== rating)
      : [...filters.ratings, rating];
    onChange({ ...filters, ratings: next });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          {orgCount > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">({orgCount})</span>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="absolute top-12 left-0 z-10 bg-card border rounded-lg shadow-lg p-4 space-y-4 w-64">
        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Account Rating</Label>
          <div className="flex gap-3 mt-2">
            {RATINGS.map(r => (
              <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox
                  checked={filters.ratings.includes(r)}
                  onCheckedChange={() => toggleRating(r)}
                />
                {r}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Last Visit</Label>
          <Select value={filters.lastVisit} onValueChange={(v) => onChange({ ...filters, lastVisit: v as any })}>
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="overdue">Overdue (&gt;14 days)</SelectItem>
              <SelectItem value="recent">Recent (&lt;7 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Organization Type</Label>
          <Select
            value={filters.orgTypes.length === 1 ? filters.orgTypes[0] : 'all'}
            onValueChange={(v) => onChange({ ...filters, orgTypes: v === 'all' ? [] : [v] })}
          >
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {orgTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MapFilters;
