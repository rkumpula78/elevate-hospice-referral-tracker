import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { calculateBenefitPeriod } from '@/lib/benefitPeriodLogic';
import { Calendar, CheckCircle2, Building2, FileText, Edit, Save, X } from 'lucide-react';

interface AdmissionDetailsSectionProps {
  referral: any;
  onUpdate?: () => void;
}

const AdmissionDetailsSection = ({ referral, onUpdate }: AdmissionDetailsSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [admitDate, setAdmitDate] = useState(
    referral.admission_date ? format(new Date(referral.admission_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [mdNotified, setMdNotified] = useState(referral.md_notified || false);
  const [benefitPeriod, setBenefitPeriod] = useState(
    referral.benefit_period_number?.toString() || '1'
  );
  const [admissionNotes, setAdmissionNotes] = useState(referral.admission_notes || '');

  const calcPeriod = referral.admission_date
    ? calculateBenefitPeriod(referral.admission_date)
    : null;

  const daysFromReferralToAdmission = referral.referral_date && referral.admission_date
    ? differenceInDays(new Date(referral.admission_date), new Date(referral.referral_date))
    : null;

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('referrals')
        .update({
          admission_date: admitDate,
          md_notified: mdNotified,
          benefit_period_number: parseInt(benefitPeriod) || 1,
          admission_notes: admissionNotes,
        })
        .eq('id', referral.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral', referral.id] });
      toast({ title: 'Admission details updated' });
      setEditing(false);
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({ title: 'Error updating admission details', description: error.message, variant: 'destructive' });
    },
  });

  if (referral.status !== 'admitted') return null;

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span>Admission Details</span>
          </div>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" /> Save
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Admit Date</Label>
            {editing ? (
              <Input type="date" value={admitDate} onChange={(e) => setAdmitDate(e.target.value)} />
            ) : (
              <p className="font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {referral.admission_date
                  ? format(new Date(referral.admission_date), 'MMM dd, yyyy')
                  : 'Not set'}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">MD Notified</Label>
            {editing ? (
              <div className="flex items-center gap-2 mt-1">
                <Checkbox
                  checked={mdNotified}
                  onCheckedChange={(checked) => setMdNotified(!!checked)}
                />
                <span className="text-sm">{mdNotified ? 'Yes' : 'No'}</span>
              </div>
            ) : (
              <p className="font-medium">
                <Badge className={mdNotified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                  {mdNotified ? '✓ Notified' : '⚠ Not Notified'}
                </Badge>
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Benefit Period</Label>
            {editing ? (
              <div>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={benefitPeriod}
                  onChange={(e) => setBenefitPeriod(e.target.value)}
                />
                {calcPeriod && calcPeriod.period.toString() !== benefitPeriod && (
                  <p className="text-xs text-amber-600 mt-1">
                    Auto-calculated: Period {calcPeriod.period} ({calcPeriod.daysRemaining} days remaining)
                  </p>
                )}
              </div>
            ) : (
              <p className="font-medium">
                Period {referral.benefit_period_number || 1}
                {calcPeriod && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({calcPeriod.daysRemaining} days remaining)
                  </span>
                )}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Referring Organization</Label>
            <p className="font-medium flex items-center gap-1">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              {referral.organizations?.name || referral.referral_source || 'Unknown'}
            </p>
          </div>

          {daysFromReferralToAdmission !== null && (
            <div>
              <Label className="text-sm text-muted-foreground">Days: Referral → Admission</Label>
              <p className="font-medium">{daysFromReferralToAdmission} days</p>
            </div>
          )}
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Admission Notes</Label>
          {editing ? (
            <Textarea
              value={admissionNotes}
              onChange={(e) => setAdmissionNotes(e.target.value)}
              placeholder="Notes about the admission..."
              rows={3}
            />
          ) : (
            <p className="text-sm mt-1">
              {referral.admission_notes || <span className="text-muted-foreground italic">No notes</span>}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdmissionDetailsSection;
