import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ShieldCheck, Plus, Edit, Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralEligibilityProps {
  referralId: string;
}

const ReferralEligibility = ({ referralId }: ReferralEligibilityProps) => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: eligibility, isLoading } = useQuery({
    queryKey: ['referral-eligibility', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_eligibility' as any)
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as any;
    },
    enabled: !!referralId
  });

  const [formData, setFormData] = useState<Record<string, any>>({});

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({
      medicare_number: '',
      date_of_birth: '',
      date_of_death: '',
      sex: '',
      beneficiary_address: '',
      beneficiary_city: '',
      beneficiary_state: '',
      beneficiary_zip: '',
      part_a_entitlement_reason: '',
      part_a_entitlement_date: '',
      part_a_termination_date: '',
      part_b_entitlement_reason: '',
      part_b_entitlement_date: '',
      part_b_termination_date: '',
      full_inpatient_days: '',
      copay_inpatient_days: '',
      inpatient_ded_amt_remaining: '',
      full_snf_days: '',
      copay_snf_days: '',
      lifetime_psychiatric_days_remain: '',
      lifetime_reserve_days_remain: '',
      inpatient_blood_ded_units_remain: '',
      hospice_election_exists: false,
      hospice_election_notes: '',
      medicare_advantage_active: false,
      medicare_advantage_notes: '',
      msp_active: false,
      msp_notes: '',
      eligibility_verified_by: '',
      verification_source: 'NGS',
      eligibility_span_start: '',
      eligibility_span_end: '',
      notes: ''
    });
    setShowDialog(true);
  };

  const openEditDialog = () => {
    if (!eligibility) return;
    setEditingId(eligibility.id);
    setFormData({
      ...eligibility,
      date_of_birth: eligibility.date_of_birth || '',
      date_of_death: eligibility.date_of_death || '',
      part_a_entitlement_date: eligibility.part_a_entitlement_date || '',
      part_a_termination_date: eligibility.part_a_termination_date || '',
      part_b_entitlement_date: eligibility.part_b_entitlement_date || '',
      part_b_termination_date: eligibility.part_b_termination_date || '',
      eligibility_span_start: eligibility.eligibility_span_start || '',
      eligibility_span_end: eligibility.eligibility_span_end || '',
    });
    setShowDialog(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        referral_id: referralId,
        medicare_number: formData.medicare_number || null,
        date_of_birth: formData.date_of_birth || null,
        date_of_death: formData.date_of_death || null,
        sex: formData.sex || null,
        beneficiary_address: formData.beneficiary_address || null,
        beneficiary_city: formData.beneficiary_city || null,
        beneficiary_state: formData.beneficiary_state || null,
        beneficiary_zip: formData.beneficiary_zip || null,
        part_a_entitlement_reason: formData.part_a_entitlement_reason || null,
        part_a_entitlement_date: formData.part_a_entitlement_date || null,
        part_a_termination_date: formData.part_a_termination_date || null,
        part_b_entitlement_reason: formData.part_b_entitlement_reason || null,
        part_b_entitlement_date: formData.part_b_entitlement_date || null,
        part_b_termination_date: formData.part_b_termination_date || null,
        full_inpatient_days: formData.full_inpatient_days ? parseInt(formData.full_inpatient_days) : null,
        copay_inpatient_days: formData.copay_inpatient_days ? parseInt(formData.copay_inpatient_days) : null,
        inpatient_ded_amt_remaining: formData.inpatient_ded_amt_remaining ? parseFloat(formData.inpatient_ded_amt_remaining) : null,
        full_snf_days: formData.full_snf_days ? parseInt(formData.full_snf_days) : null,
        copay_snf_days: formData.copay_snf_days ? parseInt(formData.copay_snf_days) : null,
        lifetime_psychiatric_days_remain: formData.lifetime_psychiatric_days_remain ? parseInt(formData.lifetime_psychiatric_days_remain) : null,
        lifetime_reserve_days_remain: formData.lifetime_reserve_days_remain ? parseInt(formData.lifetime_reserve_days_remain) : null,
        inpatient_blood_ded_units_remain: formData.inpatient_blood_ded_units_remain ? parseFloat(formData.inpatient_blood_ded_units_remain) : null,
        hospice_election_exists: formData.hospice_election_exists || false,
        hospice_election_notes: formData.hospice_election_notes || null,
        medicare_advantage_active: formData.medicare_advantage_active || false,
        medicare_advantage_notes: formData.medicare_advantage_notes || null,
        msp_active: formData.msp_active || false,
        msp_notes: formData.msp_notes || null,
        eligibility_verified_date: new Date().toISOString(),
        eligibility_verified_by: formData.eligibility_verified_by || null,
        verification_source: formData.verification_source || 'NGS',
        eligibility_span_start: formData.eligibility_span_start || null,
        eligibility_span_end: formData.eligibility_span_end || null,
        notes: formData.notes || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('referral_eligibility' as any)
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('referral_eligibility' as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-eligibility', referralId] });
      toast.success(editingId ? 'Eligibility updated' : 'Eligibility saved');
      setShowDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save eligibility');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!eligibility?.id) return;
      const { error } = await supabase
        .from('referral_eligibility' as any)
        .delete()
        .eq('id', eligibility.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-eligibility', referralId] });
      toast.success('Eligibility record deleted');
    }
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading eligibility...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Medicare Eligibility
            </div>
            {eligibility ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={openEditDialog}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate()}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Add Eligibility
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eligibility ? (
            <div className="space-y-6">
              {/* Status indicators */}
              <div className="flex flex-wrap gap-2">
                {eligibility.hospice_election_exists ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Prior Hospice Election
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-300 bg-green-50">
                    <CheckCircle className="h-3 w-3" />
                    No Prior Hospice Election
                  </Badge>
                )}
                {eligibility.medicare_advantage_active && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Medicare Advantage Active
                  </Badge>
                )}
                {eligibility.part_a_entitlement_date && !eligibility.part_a_termination_date && (
                  <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-300 bg-green-50">
                    <CheckCircle className="h-3 w-3" />
                    Part A Active
                  </Badge>
                )}
              </div>

              {/* Beneficiary info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Beneficiary Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Medicare #</span>
                    <p className="font-medium">{eligibility.medicare_number || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DOB</span>
                    <p className="font-medium">{eligibility.date_of_birth || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sex</span>
                    <p className="font-medium">{eligibility.sex || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location</span>
                    <p className="font-medium">
                      {[eligibility.beneficiary_city, eligibility.beneficiary_state].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Entitlement */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Entitlement</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="border rounded-md p-3">
                    <p className="font-medium mb-1">Part A</p>
                    <p className="text-muted-foreground text-xs">{eligibility.part_a_entitlement_reason || 'N/A'}</p>
                    <p>Entitlement: {eligibility.part_a_entitlement_date || '—'}</p>
                    <p>Termination: {eligibility.part_a_termination_date || 'None'}</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <p className="font-medium mb-1">Part B</p>
                    <p className="text-muted-foreground text-xs">{eligibility.part_b_entitlement_reason || 'N/A'}</p>
                    <p>Entitlement: {eligibility.part_b_entitlement_date || '—'}</p>
                    <p>Termination: {eligibility.part_b_termination_date || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Benefit Days */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Benefit Days Remaining</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="border rounded-md p-2 text-center">
                    <p className="text-lg font-bold">{eligibility.full_inpatient_days ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Full Inpatient</p>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <p className="text-lg font-bold">{eligibility.copay_inpatient_days ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Copay Inpatient</p>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <p className="text-lg font-bold">{eligibility.full_snf_days ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Full SNF</p>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <p className="text-lg font-bold">{eligibility.lifetime_reserve_days_remain ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Lifetime Reserve</p>
                  </div>
                </div>
              </div>

              {/* Verification */}
              <div className="text-xs text-muted-foreground border-t pt-3">
                Verified: {eligibility.eligibility_verified_date ? format(new Date(eligibility.eligibility_verified_date), 'MMM dd, yyyy') : '—'}
                {eligibility.eligibility_verified_by && ` by ${eligibility.eligibility_verified_by}`}
                {eligibility.verification_source && ` via ${eligibility.verification_source}`}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No eligibility data recorded yet.</p>
              <p className="text-xs mt-1">Click "Add Eligibility" to enter data from NGS or other verification systems.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for add/edit */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Medicare Eligibility</DialogTitle>
            <DialogDescription>
              Enter beneficiary eligibility information from the NGS system or other Medicare verification source.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Beneficiary Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Beneficiary Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="medicare_number">Medicare Number (MBI)</Label>
                  <Input id="medicare_number" value={formData.medicare_number} onChange={e => updateField('medicare_number', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="sex">Sex</Label>
                  <Select value={formData.sex} onValueChange={v => updateField('sex', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={formData.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dod">Date of Death</Label>
                  <Input id="dod" type="date" value={formData.date_of_death} onChange={e => updateField('date_of_death', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="b_address">Address</Label>
                  <Input id="b_address" value={formData.beneficiary_address} onChange={e => updateField('beneficiary_address', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="b_city">City</Label>
                    <Input id="b_city" value={formData.beneficiary_city} onChange={e => updateField('beneficiary_city', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="b_state">State</Label>
                    <Input id="b_state" value={formData.beneficiary_state} onChange={e => updateField('beneficiary_state', e.target.value)} maxLength={2} />
                  </div>
                  <div>
                    <Label htmlFor="b_zip">ZIP</Label>
                    <Input id="b_zip" value={formData.beneficiary_zip} onChange={e => updateField('beneficiary_zip', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Part A/B Entitlement */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Entitlement Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 border rounded-md p-3">
                  <p className="font-medium text-sm">Part A</p>
                  <div>
                    <Label htmlFor="part_a_reason">Reason</Label>
                    <Input id="part_a_reason" value={formData.part_a_entitlement_reason} onChange={e => updateField('part_a_entitlement_reason', e.target.value)} placeholder="e.g., Age OASI" />
                  </div>
                  <div>
                    <Label htmlFor="part_a_date">Entitlement Date</Label>
                    <Input id="part_a_date" type="date" value={formData.part_a_entitlement_date} onChange={e => updateField('part_a_entitlement_date', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="part_a_term">Termination Date</Label>
                    <Input id="part_a_term" type="date" value={formData.part_a_termination_date} onChange={e => updateField('part_a_termination_date', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2 border rounded-md p-3">
                  <p className="font-medium text-sm">Part B</p>
                  <div>
                    <Label htmlFor="part_b_reason">Reason</Label>
                    <Input id="part_b_reason" value={formData.part_b_entitlement_reason} onChange={e => updateField('part_b_entitlement_reason', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="part_b_date">Entitlement Date</Label>
                    <Input id="part_b_date" type="date" value={formData.part_b_entitlement_date} onChange={e => updateField('part_b_entitlement_date', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="part_b_term">Termination Date</Label>
                    <Input id="part_b_term" type="date" value={formData.part_b_termination_date} onChange={e => updateField('part_b_termination_date', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit Days */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Benefit Days Remaining</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="full_ip">Full Inpatient</Label>
                  <Input id="full_ip" type="number" value={formData.full_inpatient_days} onChange={e => updateField('full_inpatient_days', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="copay_ip">Copay Inpatient</Label>
                  <Input id="copay_ip" type="number" value={formData.copay_inpatient_days} onChange={e => updateField('copay_inpatient_days', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ip_ded">IP Ded Remaining ($)</Label>
                  <Input id="ip_ded" type="number" step="0.01" value={formData.inpatient_ded_amt_remaining} onChange={e => updateField('inpatient_ded_amt_remaining', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="full_snf">Full SNF</Label>
                  <Input id="full_snf" type="number" value={formData.full_snf_days} onChange={e => updateField('full_snf_days', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="copay_snf">Copay SNF</Label>
                  <Input id="copay_snf" type="number" value={formData.copay_snf_days} onChange={e => updateField('copay_snf_days', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="psych">Lifetime Psych</Label>
                  <Input id="psych" type="number" value={formData.lifetime_psychiatric_days_remain} onChange={e => updateField('lifetime_psychiatric_days_remain', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="reserve">Lifetime Reserve</Label>
                  <Input id="reserve" type="number" value={formData.lifetime_reserve_days_remain} onChange={e => updateField('lifetime_reserve_days_remain', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="blood">Blood Ded Units</Label>
                  <Input id="blood" type="number" step="0.1" value={formData.inpatient_blood_ded_units_remain} onChange={e => updateField('inpatient_blood_ded_units_remain', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Flags */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Coverage Flags</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="hospice_election"
                    checked={formData.hospice_election_exists}
                    onCheckedChange={v => updateField('hospice_election_exists', v)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="hospice_election" className="cursor-pointer">Prior Hospice Election on File</Label>
                    {formData.hospice_election_exists && (
                      <Textarea
                        className="mt-2"
                        placeholder="Hospice election details..."
                        value={formData.hospice_election_notes}
                        onChange={e => updateField('hospice_election_notes', e.target.value)}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ma_active"
                    checked={formData.medicare_advantage_active}
                    onCheckedChange={v => updateField('medicare_advantage_active', v)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="ma_active" className="cursor-pointer">Medicare Advantage Active</Label>
                    {formData.medicare_advantage_active && (
                      <Textarea
                        className="mt-2"
                        placeholder="MA plan details..."
                        value={formData.medicare_advantage_notes}
                        onChange={e => updateField('medicare_advantage_notes', e.target.value)}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="msp_active"
                    checked={formData.msp_active}
                    onCheckedChange={v => updateField('msp_active', v)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="msp_active" className="cursor-pointer">Medicare Secondary Payer (MSP)</Label>
                    {formData.msp_active && (
                      <Textarea
                        className="mt-2"
                        placeholder="MSP details..."
                        value={formData.msp_notes}
                        onChange={e => updateField('msp_notes', e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Verification</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="verified_by">Verified By</Label>
                  <Input id="verified_by" value={formData.eligibility_verified_by} onChange={e => updateField('eligibility_verified_by', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="v_source">Source</Label>
                  <Select value={formData.verification_source} onValueChange={v => updateField('verification_source', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGS">NGS</SelectItem>
                      <SelectItem value="HETS">HETS</SelectItem>
                      <SelectItem value="Availity">Availity</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="span_start">Eligibility Span Start</Label>
                  <Input id="span_start" type="date" value={formData.eligibility_span_start} onChange={e => updateField('eligibility_span_start', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="span_end">Eligibility Span End</Label>
                  <Input id="span_end" type="date" value={formData.eligibility_span_end} onChange={e => updateField('eligibility_span_end', e.target.value)} />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="elig_notes">Notes</Label>
                <Textarea id="elig_notes" value={formData.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Additional eligibility notes..." />
              </div>
            </div>

            <Button onClick={() => saveMutation.mutate()} className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Update Eligibility' : 'Save Eligibility'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralEligibility;
