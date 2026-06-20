import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Filter, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DEFAULT_MAP_FILTERS, type MapFiltersState } from './useMapOrganizations';

interface MapFiltersProps {
  filters: MapFiltersState;
  onChange: (filters: MapFiltersState) => void;
  orgTypes: string[];
  marketers: string[];
  cities: string[];
  orgCount: number;
  showMyAccounts: boolean;
}

const RATINGS = ['A', 'B', 'C', 'P', 'D'];
const BD_TIERS = ['A', 'B', 'C', 'D', 'E'];
const ROUTING_WEEKS = [1, 2, 3, 4];

const TYPE_LABELS: Record<string, string> = {
  assisted_living: 'Assisted Living',
  hospital: 'Hospital',
  clinic: 'Cancer Center/Clinic',
  physician_office: 'Physician Office',
  nursing_home: 'Skilled Nursing',
  home_health: 'Home Health',
  caregiver_services: 'Caregiver Services',
  other: 'Other',
};
const typeLabel = (t: string) => TYPE_LABELS[t] || t;

const MapFilters = ({ filters, onChange, orgTypes, marketers, cities, orgCount, showMyAccounts }: MapFiltersProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(!isMobile);

  const toggleIn = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];

  const activeCount =
    filters.ratings.length +
    filters.orgTypes.length +
    filters.marketers.length +
    filters.bdTiers.length +
    filters.routingWeeks.length +
    filters.cities.length +
    (filters.lastVisit !== 'all' ? 1 : 0) +
    (filters.contractOnFile !== 'all' ? 1 : 0) +
    (filters.activeStatus !== 'active' ? 1 : 0) +
    (filters.zipQuery.trim() ? 1 : 0) +
    (filters.myAccountsOnly ? 1 : 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold w-4 h-4">
                {activeCount}
              </span>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            <span className="ml-1 text-xs text-muted-foreground">({orgCount})</span>
          </Button>
        </CollapsibleTrigger>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onChange({ ...DEFAULT_MAP_FILTERS })}>
            Clear all
          </Button>
        )}
      </div>
      <CollapsibleContent className="absolute top-12 left-0 z-10 bg-card border rounded-lg shadow-lg p-4 space-y-4 w-72 max-h-[72vh] overflow-y-auto">
        {showMyAccounts && (
          <label className="flex items-center justify-between gap-2 text-sm cursor-pointer">
            <span className="font-medium">My accounts only</span>
            <Switch
              checked={filters.myAccountsOnly}
              onCheckedChange={(v) => onChange({ ...filters, myAccountsOnly: !!v })}
            />
          </label>
        )}

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Account Rating</Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {RATINGS.map(r => (
              <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox checked={filters.ratings.includes(r)} onCheckedChange={() => onChange({ ...filters, ratings: toggleIn(filters.ratings, r) })} />
                {r}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">BD Tier</Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {BD_TIERS.map(t => (
              <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox checked={filters.bdTiers.includes(t)} onCheckedChange={() => onChange({ ...filters, bdTiers: toggleIn(filters.bdTiers, t) })} />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Routing Week</Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {ROUTING_WEEKS.map(w => (
              <label key={w} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox checked={filters.routingWeeks.includes(w)} onCheckedChange={() => onChange({ ...filters, routingWeeks: toggleIn(filters.routingWeeks, w) })} />
                W{w}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Last Visit</Label>
          <Select value={filters.lastVisit} onValueChange={(v) => onChange({ ...filters, lastVisit: v as any })}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="overdue">Overdue (&gt;14 days)</SelectItem>
              <SelectItem value="recent">Recent (&lt;7 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Contract</Label>
            <Select value={filters.contractOnFile} onValueChange={(v) => onChange({ ...filters, contractOnFile: v as any })}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">On file</SelectItem>
                <SelectItem value="no">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Status</Label>
            <Select value={filters.activeStatus} onValueChange={(v) => onChange({ ...filters, activeStatus: v as any })}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Organization Type</Label>
          <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {orgTypes.map(t => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={filters.orgTypes.includes(t)} onCheckedChange={() => onChange({ ...filters, orgTypes: toggleIn(filters.orgTypes, t) })} />
                <span>{typeLabel(t)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Zip Code</Label>
          <Input
            value={filters.zipQuery}
            onChange={(e) => onChange({ ...filters, zipQuery: e.target.value })}
            placeholder="Starts with… e.g. 853"
            className="mt-1 h-8 text-sm"
            inputMode="numeric"
          />
        </div>

        {cities.length > 0 && (
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">City</Label>
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {cities.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={filters.cities.includes(c)} onCheckedChange={() => onChange({ ...filters, cities: toggleIn(filters.cities, c) })} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Assigned Marketer</Label>
            {filters.marketers.length > 0 && (
              <button type="button" onClick={() => onChange({ ...filters, marketers: [] })} className="text-[11px] text-muted-foreground hover:text-foreground underline">
                Clear
              </button>
            )}
          </div>
          <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {marketers.length === 0 && <p className="text-xs text-muted-foreground italic">No marketers assigned</p>}
            {marketers.map(m => (
              <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={filters.marketers.includes(m)} onCheckedChange={() => onChange({ ...filters, marketers: toggleIn(filters.marketers, m) })} />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MapFilters;
