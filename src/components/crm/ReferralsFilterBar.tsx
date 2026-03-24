import React from 'react';
import { Download, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FilterChips, FilterChip } from '@/components/ui/filter-chips';
import { SavedFilters } from '@/components/ui/saved-filters';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export interface ReferralFilters {
  statuses: string[];
  priorities: string[];
  facilities: string[];
  insurances: string[];
  marketers: string[];
  dateRange?: DateRange;
}

interface ReferralsFilterBarProps {
  filters: ReferralFilters;
  onFiltersChange: (filters: ReferralFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export const ReferralsFilterBar = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: ReferralsFilterBarProps) => {
  const { toast } = useToast();

  // Fetch unique facilities for multi-select
  const { data: facilities = [] } = useQuery({
    queryKey: ['organizations-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data.map((org) => ({ label: org.name, value: org.id }));
    },
  });

  // Fetch unique insurance providers
  const { data: insurances = [] } = useQuery({
    queryKey: ['insurances-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('insurance')
        .not('insurance', 'is', null);
      
      if (error) throw error;
      
      const uniqueInsurances = [...new Set(data.map((r) => r.insurance).filter(Boolean))];
      return uniqueInsurances.map((ins) => ({ label: ins, value: ins }));
    },
  });

  // Fetch unique assigned marketers
  const { data: marketers = [] } = useQuery({
    queryKey: ['marketers-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('assigned_marketer')
        .not('assigned_marketer', 'is', null)
        .is('deleted_at', null);
      
      if (error) throw error;
      
      const uniqueMarketers = [...new Set(data.map((r) => r.assigned_marketer).filter(Boolean))] as string[];
      return uniqueMarketers.sort().map((m) => ({ label: m, value: m }));
    },
  });

  const statusOptions: MultiSelectOption[] = [
    { label: 'New', value: 'new_referral' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Assessment', value: 'assessment' },
    { label: 'Pending', value: 'pending' },
    { label: 'Admitted', value: 'admitted' },
    { label: 'Closed', value: 'closed' },
  ];

  const priorityOptions: MultiSelectOption[] = [
    { label: 'Urgent', value: 'urgent' },
    { label: 'Routine', value: 'routine' },
    { label: 'Low', value: 'low' },
  ];

  const updateFilter = (key: keyof ReferralFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getFilterChips = (): FilterChip[] => {
    const chips: FilterChip[] = [];

    if (filters.statuses.length > 0) {
      chips.push({
        key: 'statuses',
        label: 'Status',
        value: `${filters.statuses.length} selected`,
      });
    }

    if (filters.priorities.length > 0) {
      chips.push({
        key: 'priorities',
        label: 'Priority',
        value: `${filters.priorities.length} selected`,
      });
    }

    if (filters.facilities.length > 0) {
      chips.push({
        key: 'facilities',
        label: 'Facility',
        value: `${filters.facilities.length} selected`,
      });
    }

    if (filters.insurances.length > 0) {
      chips.push({
        key: 'insurances',
        label: 'Insurance',
        value: `${filters.insurances.length} selected`,
      });
    }

    if (filters.marketers.length > 0) {
      chips.push({
        key: 'marketers',
        label: 'Assigned Marketer',
        value: `${filters.marketers.length} selected`,
      });
    }

    if (filters.dateRange?.from) {
      chips.push({
        key: 'dateRange',
        label: 'Date Range',
        value: filters.dateRange.to 
          ? `${new Date(filters.dateRange.from).toLocaleDateString()} - ${new Date(filters.dateRange.to).toLocaleDateString()}`
          : new Date(filters.dateRange.from).toLocaleDateString(),
      });
    }

    return chips;
  };

  const handleRemoveFilter = (key: string) => {
    if (key === 'dateRange') {
      updateFilter('dateRange', undefined);
    } else {
      updateFilter(key as keyof ReferralFilters, []);
    }
  };

  const handleClearAll = () => {
    onFiltersChange({
      statuses: [],
      priorities: [],
      facilities: [],
      insurances: [],
      marketers: [],
      dateRange: undefined,
    });
  };

  const hasActiveFilters = getFilterChips().length > 0;

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: `Exporting ${filteredCount} referrals...`,
    });
    // Implement export logic here
  };

  const quickPresets = [
    {
      label: 'New This Week',
      icon: Zap,
      apply: () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        onFiltersChange({
          ...filters,
          statuses: ['new_referral'],
          dateRange: { from: weekAgo, to: today }
        });
      }
    },
    {
      label: 'Urgent',
      icon: Zap,
      apply: () => {
        onFiltersChange({
          ...filters,
          priorities: ['urgent']
        });
      }
    },
    {
      label: 'In Progress',
      icon: Zap,
      apply: () => {
        onFiltersChange({
          ...filters,
          statuses: ['in_progress']
        });
      }
    },
    {
      label: 'Pending',
      icon: Zap,
      apply: () => {
        onFiltersChange({
          ...filters,
          statuses: ['pending']
        });
      }
    },
    {
      label: 'Closed',
      icon: Zap,
      apply: () => {
        onFiltersChange({
          ...filters,
          statuses: ['closed']
        });
      }
    }
  ];

  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
      {/* Quick Filter Presets */}
      <div className="flex flex-wrap gap-2 pb-3 border-b">
        <span className="text-xs font-medium text-muted-foreground flex items-center">
          Quick Filters:
        </span>
        {quickPresets.map((preset) => (
          <Badge
            key={preset.label}
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={preset.apply}
          >
            <preset.icon className="w-3 h-3 mr-1" />
            {preset.label}
          </Badge>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div>
          <Label className="text-xs font-medium mb-2 block">Status</Label>
          <MultiSelect
            options={statusOptions}
            selected={filters.statuses}
            onChange={(value) => updateFilter('statuses', value)}
            placeholder="All statuses"
          />
        </div>

        <div>
          <Label className="text-xs font-medium mb-2 block">Priority</Label>
          <MultiSelect
            options={priorityOptions}
            selected={filters.priorities}
            onChange={(value) => updateFilter('priorities', value)}
            placeholder="All priorities"
          />
        </div>

        <div>
          <Label className="text-xs font-medium mb-2 block">Referring Facility</Label>
          <MultiSelect
            options={facilities}
            selected={filters.facilities}
            onChange={(value) => updateFilter('facilities', value)}
            placeholder="All facilities"
            searchable
          />
        </div>

        <div>
          <Label className="text-xs font-medium mb-2 block">Insurance Provider</Label>
          <MultiSelect
            options={insurances}
            selected={filters.insurances}
            onChange={(value) => updateFilter('insurances', value)}
            placeholder="All insurances"
            searchable
          />
        </div>

        <div>
          <Label className="text-xs font-medium mb-2 block">Referral Date</Label>
          <DateRangePicker
            date={filters.dateRange}
            onDateChange={(value) => updateFilter('dateRange', value)}
          />
        </div>
      </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <FilterChips
          filters={getFilterChips()}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAll}
        />
      )}

      {/* Filter Analytics & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">
            Showing <span className="text-primary">{filteredCount}</span> of{' '}
            <span className="text-muted-foreground">{totalCount}</span> referrals
          </p>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SavedFilters
            currentFilters={filters}
            onLoadPreset={(preset) => onFiltersChange(preset)}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredCount === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>
    </div>
  );
};
