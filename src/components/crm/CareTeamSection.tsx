import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { logAuditEvent, computeChanges } from '@/lib/auditLog';

interface StaffMember {
  id: string;
  name: string;
  phone: string | null;
  role: string;
}

interface CareTeamSectionProps {
  referralId: string;
  referral: {
    primary_rn?: string | null;
    cna?: string | null;
    social_worker?: string | null;
    chaplain?: string | null;
    marketer?: string | null;
    status?: string;
  };
  onUpdate: () => void;
}

const ROLE_CONFIG = [
  { field: 'primary_rn', label: 'Primary RN', roles: ['rn'] },
  { field: 'cna', label: 'CNA', roles: ['cna'] },
  { field: 'social_worker', label: 'Social Worker', roles: ['sw'] },
  { field: 'chaplain', label: 'Chaplain', roles: ['chaplain'] },
  { field: 'marketer', label: 'Marketer', roles: ['marketing', 'admin', 'intake_coordinator'] },
] as const;

const CareTeamSection = ({ referralId, referral, onUpdate }: CareTeamSectionProps) => {
  const queryClient = useQueryClient();

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, phone, role')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ field, staffId }: { field: string; staffId: string | null }) => {
      const updateData = { [field]: staffId } as any;
      const { error } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', referralId);
      if (error) throw error;

      // Log to activity log
      const staffName = staffId ? staffList.find(s => s.id === staffId)?.name : 'Unassigned';
      const roleLabel = ROLE_CONFIG.find(r => r.field === field)?.label || field;
      await supabase.from('referral_activity_log').insert({
        referral_id: referralId,
        activity_type: 'status_update',
        note: `Care team updated: ${roleLabel} → ${staffName}`,
        activity_date: new Date().toISOString(),
      } as any);

      await logAuditEvent({
        action: 'update',
        tableName: 'referrals',
        recordId: referralId,
        changes: computeChanges(
          { [field]: (referral as any)[field] },
          { [field]: staffId }
        ),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral', referralId] });
      toast.success('Care team updated');
      onUpdate();
    },
    onError: (err: Error) => {
      toast.error('Failed to update: ' + err.message);
    },
  });

  const getStaffForRole = (roles: readonly string[]) =>
    staffList.filter(s => roles.includes(s.role));

  const getAssignedStaff = (staffId: string | null | undefined) =>
    staffId ? staffList.find(s => s.id === staffId) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Care Team
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROLE_CONFIG.map(({ field, label, roles }) => {
          const currentValue = (referral as any)?.[field] as string | null;
          const assigned = getAssignedStaff(currentValue);
          const options = getStaffForRole(roles);

          return (
            <div key={field} className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium text-muted-foreground shrink-0">
                {label}
              </div>
              <Select
                value={currentValue || 'unassigned'}
                onValueChange={(val) =>
                  updateMutation.mutate({
                    field,
                    staffId: val === 'unassigned' ? null : val,
                  })
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {options.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assigned?.phone && (
                <a
                  href={`tel:${assigned.phone}`}
                  className="text-primary hover:text-primary/80 shrink-0"
                  title={`Call ${assigned.name}`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CareTeamSection;
