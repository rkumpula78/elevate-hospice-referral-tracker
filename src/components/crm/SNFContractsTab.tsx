import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, GraduationCap, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, addYears, format, parseISO, isPast } from 'date-fns';
import ContractDocuments from './ContractDocuments';

const CONTRACT_TYPES = [
  { value: 'patient_care', label: 'Patient Care in Facility' },
  { value: 'gip', label: 'General Inpatient (GIP)' },
  { value: 'respite', label: 'Respite Care' },
];

const CONTRACT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending Signature' },
  { value: 'expired', label: 'Expired' },
  { value: 'not_started', label: 'Not Started' },
];

interface SNFContractsTabProps {
  organization: any;
}

const SNFContractsTab = ({ organization }: SNFContractsTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [contractOnFile, setContractOnFile] = useState<boolean>(organization.contract_on_file ?? false);
  const [contractStatus, setContractStatus] = useState<string>(organization.contract_status || 'not_started');
  const [contractStart, setContractStart] = useState<string>((organization as any).contract_start_date || '');
  const [contractExpiry, setContractExpiry] = useState<string>((organization as any).contract_expiry_date || '');
  const [contractTypes, setContractTypes] = useState<string[]>((organization as any).contract_types || []);
  const [contractNotes, setContractNotes] = useState<string>((organization as any).contract_notes || '');
  const [lastTraining, setLastTraining] = useState<string>(organization.last_training_review || '');

  const toggleType = (val: string) => {
    setContractTypes(prev =>
      prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]
    );
  };

  // Training status calculations
  const nextTrainingDue = lastTraining
    ? format(addYears(parseISO(lastTraining), 1), 'yyyy-MM-dd')
    : null;
  const trainingDaysLeft = nextTrainingDue
    ? differenceInDays(parseISO(nextTrainingDue), new Date())
    : null;
  const trainingOverdue = trainingDaysLeft !== null && trainingDaysLeft < 0;
  const trainingDueSoon = trainingDaysLeft !== null && trainingDaysLeft >= 0 && trainingDaysLeft <= 60;

  // Contract expiry status
  const expiryDaysLeft = contractExpiry ? differenceInDays(parseISO(contractExpiry), new Date()) : null;
  const contractExpired = expiryDaysLeft !== null && expiryDaysLeft < 0;
  const contractExpiringSoon = expiryDaysLeft !== null && expiryDaysLeft >= 0 && expiryDaysLeft <= 90;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('organizations')
        .update({
          contract_on_file: contractOnFile,
          contract_status: contractStatus,
          contract_start_date: contractStart || null,
          contract_expiry_date: contractExpiry || null,
          contract_types: contractTypes,
          contract_notes: contractNotes || null,
          last_training_review: lastTraining || null,
        } as any)
        .eq('id', organization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organization.id] });
      toast({ title: '✅ Contract details saved' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Alert banners */}
      {(trainingOverdue || contractExpired) && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            {trainingOverdue && (
              <p className="text-sm font-medium text-destructive">
                Annual training is overdue — last completed {lastTraining ? format(parseISO(lastTraining), 'MMM d, yyyy') : 'unknown'}.
              </p>
            )}
            {contractExpired && (
              <p className="text-sm font-medium text-destructive">
                Contract expired {contractExpiry ? format(parseISO(contractExpiry), 'MMM d, yyyy') : ''}.
              </p>
            )}
          </div>
        </div>
      )}
      {(trainingDueSoon && !trainingOverdue) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-800">
            Annual training due in {trainingDaysLeft} days — due {nextTrainingDue ? format(parseISO(nextTrainingDue), 'MMM d, yyyy') : ''}.
          </p>
        </div>
      )}
      {(contractExpiringSoon && !contractExpired) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-800">
            Contract expires in {expiryDaysLeft} days — {contractExpiry ? format(parseISO(contractExpiry), 'MMM d, yyyy') : ''}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4" />
              Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="contract_on_file"
                checked={contractOnFile}
                onCheckedChange={(v) => setContractOnFile(!!v)}
              />
              <Label htmlFor="contract_on_file" className="font-medium">Contract on file</Label>
            </div>

            <div>
              <Label className="text-sm">Contract Status</Label>
              <Select value={contractStatus} onValueChange={setContractStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Start Date</Label>
                <Input type="date" value={contractStart} onChange={e => setContractStart(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Expiry Date</Label>
                <Input
                  type="date"
                  value={contractExpiry}
                  onChange={e => setContractExpiry(e.target.value)}
                  className={`mt-1 ${contractExpired ? 'border-destructive' : contractExpiringSoon ? 'border-amber-400' : ''}`}
                />
                {expiryDaysLeft !== null && (
                  <p className={`text-xs mt-0.5 ${contractExpired ? 'text-destructive' : contractExpiringSoon ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {contractExpired ? `Expired ${Math.abs(expiryDaysLeft)} days ago` : `${expiryDaysLeft} days remaining`}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm">Contract Coverage</Label>
              <div className="mt-2 space-y-2">
                {CONTRACT_TYPES.map(t => (
                  <div key={t.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${t.value}`}
                      checked={contractTypes.includes(t.value)}
                      onCheckedChange={() => toggleType(t.value)}
                    />
                    <Label htmlFor={`type-${t.value}`} className="font-normal">{t.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">Contract Notes</Label>
              <Textarea
                value={contractNotes}
                onChange={e => setContractNotes(e.target.value)}
                placeholder="e.g., Signed copies with Administrator Jane Smith..."
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Annual Training */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-4 h-4" />
              Annual Training
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              CMS requires an annual in-service training for all contracted SNFs. Track the most recent completion date here.
            </p>

            <div>
              <Label className="text-sm">Last Training Date</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="date"
                  value={lastTraining}
                  onChange={e => setLastTraining(e.target.value)}
                />
                {lastTraining && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setLastTraining('')}>
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Edit or clear the date if entered by mistake, then click Save.
              </p>
            </div>

            {lastTraining && nextTrainingDue && (
              <div className={`rounded-lg p-3 border ${trainingOverdue ? 'border-destructive/50 bg-destructive/5' : trainingDueSoon ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'}`}>
                <div className="flex items-center gap-2">
                  {trainingOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  <p className="text-sm font-medium">
                    Next training due: {format(parseISO(nextTrainingDue), 'MMM d, yyyy')}
                  </p>
                </div>
                <p className={`text-xs mt-1 ${trainingOverdue ? 'text-destructive' : trainingDueSoon ? 'text-amber-700' : 'text-green-700'}`}>
                  {trainingOverdue
                    ? `${Math.abs(trainingDaysLeft!)} days overdue`
                    : `${trainingDaysLeft} days away`}
                </p>
              </div>
            )}

            {!lastTraining && (
              <div className="rounded-lg border border-dashed p-3 text-center">
                <p className="text-sm text-muted-foreground">No training date recorded yet.</p>
              </div>
            )}

            {/* Compliance summary */}
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Compliance Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  {contractOnFile ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <span>Contract {contractOnFile ? 'on file' : 'not on file'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {contractTypes.includes('gip') ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <span>GIP {contractTypes.includes('gip') ? 'covered' : 'not covered'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {contractTypes.includes('respite') ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <span>Respite {contractTypes.includes('respite') ? 'covered' : 'not covered'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!trainingOverdue && lastTraining ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <span>Training {!trainingOverdue && lastTraining ? 'current' : 'needed'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ContractDocuments organizationId={organization.id} />

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Contract Details'}
        </Button>
      </div>
    </div>
  );
};

export default SNFContractsTab;
