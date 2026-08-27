import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, differenceInDays } from 'date-fns';

const STATUS_OPTIONS = [
  { key: 'cold', label: 'Cold' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'active_conversation', label: 'Active Conversation' },
  { key: 'pre_referral', label: 'Pre-Referral' },
  { key: 'active_referrer', label: 'Active Referrer' },
  { key: 'lost_inactive', label: 'Lost / Inactive' },
];

const TIER_OPTIONS = [
  { key: 'A', label: 'A — ALFs' },
  { key: 'B', label: 'B — Home Health' },
  { key: 'C', label: 'C — SNFs' },
  { key: 'D', label: 'D — Physicians' },
  { key: 'E', label: 'E — DD Homes (Deferred)' },
];

interface Props {
  organization: any;
}

const BDPipelineCard: React.FC<Props> = ({ organization }) => {
  const qc = useQueryClient();
  const inPipeline = !!organization.bd_tier;

  const patch = async (updates: Record<string, any>, msg?: string) => {
    const { error } = await supabase.from('organizations').update(updates).eq('id', organization.id);
    if (error) { toast.error(error.message); return; }
    if (msg) toast.success(msg);
    qc.invalidateQueries({ queryKey: ['organization', organization.id] });
    qc.invalidateQueries({ queryKey: ['bd-orgs-tab'] });
  };

  const promote = () => patch({
    bd_tier: 'C',
    bd_status: organization.bd_status || 'cold',
  }, 'Added to BD pipeline');

  const remove = () => patch({ bd_tier: null }, 'Removed from BD pipeline');

  const lc = organization.last_contact_date
    ? `${differenceInDays(new Date(), parseISO(organization.last_contact_date))}d ago`
    : 'Never';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            BD Pipeline
          </span>
          {inPipeline ? (
            <Button size="sm" variant="ghost" onClick={remove} className="text-destructive">
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          ) : (
            <Button size="sm" onClick={promote}>
              <Plus className="w-4 h-4 mr-1" /> Add to Pipeline
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!inPipeline ? (
          <p className="text-sm text-muted-foreground">
            Not currently tracked in the BD pipeline. Add to start logging visits, set tier, and track status.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Tier</label>
                <Select value={organization.bd_tier || ''} onValueChange={(v) => patch({ bd_tier: v }, 'Tier updated')}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">BD Status</label>
                <Select value={organization.bd_status || 'cold'} onValueChange={(v) => patch({ bd_status: v }, 'Status updated')}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <div>
                <div className="text-sm font-medium">Huddle target account</div>
                <div className="text-xs text-muted-foreground">Show this org under "Target accounts" on the Huddle board</div>
              </div>
              <Button
                size="sm"
                variant={organization.is_target_account ? 'default' : 'outline'}
                onClick={() => patch(
                  { is_target_account: !organization.is_target_account },
                  organization.is_target_account ? 'Removed from target accounts' : 'Added to target accounts'
                )}
              >
                {organization.is_target_account ? 'Target' : 'Not a target'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm pt-1">
              <div>
                <div className="text-xs text-muted-foreground">Last Contact</div>
                <div className="font-medium">{lc}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Next Follow-Up</div>
                <div className="font-medium">
                  {organization.next_followup_date
                    ? format(parseISO(organization.next_followup_date), 'MMM d, yyyy')
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BDPipelineCard;
