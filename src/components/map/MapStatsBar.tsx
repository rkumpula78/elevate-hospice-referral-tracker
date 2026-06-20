import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, MapPinOff } from 'lucide-react';
import type { MapOrganization } from './useMapOrganizations';

export type ColorBy = 'rating' | 'marketer' | 'type' | 'overdue';

interface MapStatsBarProps {
  orgs: MapOrganization[];
  colorBy: ColorBy;
  onColorByChange: (v: ColorBy) => void;
  missingCoordsCount: number;
  isAdmin: boolean;
  onBackfill: () => void;
  backfilling: boolean;
  backfillProgress: { done: number; total: number } | null;
}

const isOverdue = (d: string | null) => !d || (Date.now() - new Date(d).getTime()) / 86400000 > 14;

const MapStatsBar = ({
  orgs, colorBy, onColorByChange, missingCoordsCount, isAdmin, onBackfill, backfilling, backfillProgress,
}: MapStatsBarProps) => {
  const overdue = orgs.filter(o => isOverdue(o.last_visit_date)).length;
  const byRating = orgs.reduce<Record<string, number>>((acc, o) => {
    const r = o.account_rating || 'C';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-2 bg-card/95 backdrop-blur border rounded-lg shadow-lg px-3 py-2 text-sm max-w-[calc(100%-1rem)]">
      <span className="font-semibold">{orgs.length}</span>
      <span className="text-muted-foreground">shown</span>
      {overdue > 0 && (
        <span className="text-destructive font-medium">· {overdue} overdue</span>
      )}
      <span className="hidden sm:inline text-muted-foreground">·</span>
      <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
        {['A', 'B', 'C', 'P', 'D'].filter(r => byRating[r]).map(r => (
          <span key={r}>{r}:{byRating[r]}</span>
        ))}
      </span>

      <div className="flex items-center gap-1 ml-1">
        <span className="text-xs text-muted-foreground">Color:</span>
        <Select value={colorBy} onValueChange={(v) => onColorByChange(v as ColorBy)}>
          <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="marketer">Marketer</SelectItem>
            <SelectItem value="type">Type</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {missingCoordsCount > 0 && (
        <div className="flex items-center gap-1.5 ml-1 border-l pl-2">
          <MapPinOff className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs text-amber-700">{missingCoordsCount} off-map</span>
          {isAdmin && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onBackfill} disabled={backfilling}>
              {backfilling
                ? (<><Loader2 className="h-3 w-3 mr-1 animate-spin" />{backfillProgress ? `${backfillProgress.done}/${backfillProgress.total}` : 'Fixing…'}</>)
                : 'Fix locations'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MapStatsBar;
