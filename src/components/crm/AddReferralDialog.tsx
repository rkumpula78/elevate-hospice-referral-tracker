import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";
import { Loader2, Plus } from "lucide-react";
import ReferringContactSelector from "./ReferringContactSelector";
import { useTeamsIntegration } from "@/hooks/useTeamsIntegration";
import { Constants } from "@/integrations/supabase/types";

// Define the Zod schema for form validation
const referralStatusEnum = z.enum(Constants.public.Enums.referral_status);
const notAdmittedStatuses = [
  'not_admitted_patient_choice',
  'not_admitted_not_appropriate',
  'not_admitted_lost_contact'
];

const referralSchema = z.object({
  patient_name: z.string().min(1, "Patient name is required"),
  patient_phone: z.string().optional(),
  diagnosis: z.string().optional(),
  insurance: z.string().optional(),
  priority: z.enum(['low', 'routine', 'urgent']),
  organization_id: z.string().optional(),
  referring_contact_id: z.string().nullable().optional(),
  referral_method: z.enum(['general', 'specific_contact']),
  referring_physician: z.string().optional(),
  assigned_marketer: z.string().optional(),
  referral_intake_coordinator: z.string().optional(),
  status: referralStatusEnum,
  reason_for_non_admittance: z.string().optional(),
  notes: z.string().optional(),
  // For the inline new organization form
  newOrgName: z.string().optional(),
  newOrgType: z.enum(['hospital', 'physician_office', 'snf', 'home_health', 'other']).optional(),
}).superRefine((data, ctx) => {
  if (data.organization_id === 'create-new' && (!data.newOrgName || data.newOrgName.trim() === '')) {
    ctx.addIssue({
      code: 'custom',
      path: ['newOrgName'],
      message: 'Organization name is required when creating a new one.',
    });
  }
  if (notAdmittedStatuses.includes(data.status) && !data.reason_for_non_admittance) {
    ctx.addIssue({
      code: 'custom',
      path: ['reason_for_non_admittance'],
      message: 'Reason for non-admittance is required for this status.',
    });
  }
});

type ReferralFormValues = z.infer<typeof referralSchema>;

interface AddReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddReferralDialog = ({ open, onOpenChange }: AddReferralDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { autoNotifyNewReferral } = useTeamsIntegration();

  const form = useForm<ReferralFormValues>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      patient_name: '',
      patient_phone: '',
      diagnosis: '',
      insurance: '',
      priority: 'routine',
      organization_id: '',
      referring_contact_id: null,
      referral_method: 'general',
      referring_physician: '',
      assigned_marketer: '',
      referral_intake_coordinator: '',
      status: 'new_referral',
      reason_for_non_admittance: '',
      notes: '',
      newOrgName: '',
      newOrgType: 'hospital'
    },
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('id, name, type').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: marketers } = useQuery({
    queryKey: ['marketers'],
    queryFn: async () => {
        const { data, error } = await supabase.from('marketers').select('name').eq('is_active', true).order('name');
        if (error) throw error;
        return data.map(m => m.name);
    }
  });

  const { data: intakeCoordinators } = useQuery({
    queryKey: ['intake_coordinators'],
    queryFn: async () => {
        const { data, error } = await supabase.from('intake_coordinators').select('name').eq('is_active', true).order('name');
        if (error) throw error;
        return data.map(c => c.name);
    }
  });

  const addReferralMutation = useMutation({
    mutationFn: async (data: ReferralFormValues) => {
      let organizationId = data.organization_id;
      
      if (data.organization_id === 'create-new' && data.newOrgName) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: data.newOrgName, type: data.newOrgType, is_active: true })
          .select()
          .single();
        if (orgError) throw orgError;
        organizationId = newOrg.id;
      }

      const { data: newReferral, error } = await supabase
        .from('referrals')
        .insert({
          patient_name: data.patient_name,
          patient_phone: data.patient_phone || null,
          diagnosis: data.diagnosis || null,
          insurance: data.insurance || null,
          priority: data.priority,
          organization_id: organizationId === 'create-new' ? null : organizationId,
          referring_contact_id: data.referral_method === 'specific_contact' ? data.referring_contact_id : null,
          referral_method: data.referral_method,
          referring_physician: data.referring_physician || null,
          assigned_marketer: data.assigned_marketer || null,
          referral_intake_coordinator: data.referral_intake_coordinator || null,
          status: data.status,
          reason_for_non_admittance: data.reason_for_non_admittance || null,
          notes: data.notes || null
        })
        .select()
        .single();
      if (error) throw error;
      
      if (newReferral) {
        await autoNotifyNewReferral(newReferral);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({ title: "Referral added successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error adding referral", description: error.message, variant: "destructive" });
    }
  });

  const onSubmit = (data: ReferralFormValues) => {
    addReferralMutation.mutate(data);
  };

  const organizationId = form.watch('organization_id');
  const status = form.watch('status');
  const showNewOrgForm = organizationId === 'create-new';
  const showReasonField = notAdmittedStatuses.includes(status);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Referral</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="patient_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={addReferralMutation.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="patient_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Phone</FormLabel>
                      <FormControl>
                        <PhoneInput {...field} onChange={field.onChange} value={field.value || ''} disabled={addReferralMutation.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} disabled={addReferralMutation.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insurance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} disabled={addReferralMutation.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Referral Source & Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={addReferralMutation.isPending}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="create-new" className="text-primary">
                            <div className="flex items-center"><Plus className="w-4 h-4 mr-2" />Create New Organization</div>
                          </SelectItem>
                          {organizations?.map((org) => (<SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {showNewOrgForm && (
                  <div className="space-y-2 border rounded-lg p-4 bg-gray-50 md:col-span-2">
                    <h4 className="text-sm font-medium">New Organization</h4>
                    <FormField
                      control={form.control}
                      name="newOrgName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Organization Name" {...field} disabled={addReferralMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newOrgType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={addReferralMutation.isPending}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hospital">Hospital</SelectItem>
                              <SelectItem value="physician_office">Physician Office</SelectItem>
                              <SelectItem value="snf">Skilled Nursing Facility</SelectItem>
                              <SelectItem value="home_health">Home Health</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {organizationId && !showNewOrgForm && (
                <div className="border-t pt-4">
                  <FormField
                    control={form.control}
                    name="referring_contact_id"
                    render={({ field }) => (
                      <FormItem>
                         <ReferringContactSelector
                            organizationId={organizationId}
                            selectedContactId={field.value}
                            selectedMethod={form.getValues('referral_method')}
                            onContactChange={(contactId, method) => {
                              form.setValue('referring_contact_id', contactId);
                              form.setValue('referral_method', method);
                            }}
                            disabled={addReferralMutation.isPending}
                          />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="referring_physician"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referring Physician</FormLabel>
                      <FormControl><Input {...field} value={field.value || ''} disabled={addReferralMutation.isPending} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_marketer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Marketer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={addReferralMutation.isPending}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select marketer" /></SelectTrigger></FormControl>
                        <SelectContent>{marketers?.map((m: string) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referral_intake_coordinator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Intake Coordinator</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={addReferralMutation.isPending}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select intake coordinator" /></SelectTrigger></FormControl>
                        <SelectContent>{intakeCoordinators?.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status & Priority</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={addReferralMutation.isPending}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="new_referral">New Referral</SelectItem>
                          <SelectItem value="contact_attempted">Contact Attempted</SelectItem>
                          <SelectItem value="information_gathering">Information Gathering</SelectItem>
                          <SelectItem value="assessment_scheduled">Assessment Scheduled</SelectItem>
                          <SelectItem value="pending_admission">Pending Admission</SelectItem>
                          <SelectItem value="admitted">Admitted</SelectItem>
                          <SelectItem value="not_admitted_patient_choice">Not Admitted - Patient Choice</SelectItem>
                          <SelectItem value="not_admitted_not_appropriate">Not Admitted - Not Yet Appropriate</SelectItem>
                          <SelectItem value="not_admitted_lost_contact">Not Admitted - Lost Contact</SelectItem>
                          <SelectItem value="deceased_prior_admission">Deceased Prior to Admission</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={addReferralMutation.isPending}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {showReasonField && (
                <FormField
                  control={form.control}
                  name="reason_for_non_admittance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Non-Admittance *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={addReferralMutation.isPending}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="patient_family_chose_competitor">Patient/Family chose competitor</SelectItem>
                          <SelectItem value="patient_stabilized_improved">Patient stabilized/improved</SelectItem>
                          <SelectItem value="family_not_ready">Family not ready</SelectItem>
                          <SelectItem value="financial_insurance_issues">Financial/Insurance issues</SelectItem>
                          <SelectItem value="unable_to_contact">Unable to contact</SelectItem>
                          <SelectItem value="chose_curative_care">Chose curative care</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea rows={3} {...field} value={field.value || ''} disabled={addReferralMutation.isPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addReferralMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={addReferralMutation.isPending}>
                {addReferralMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>) : ('Add Referral')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddReferralDialog;
