
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ScheduleVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId?: string;
}

type VisitTarget = 'patient' | 'facility' | 'referral_source' | 'event';
type VisitType = 'admission' | 'routine' | 'urgent' | 'discharge';

const ScheduleVisitDialog = ({ open, onOpenChange, referralId }: ScheduleVisitDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    subject: '',
    visit_target: 'patient' as VisitTarget,
    patient_id: referralId || '',
    organization_id: '',
    visit_type: 'routine' as VisitType,
    scheduled_date: '',
    scheduled_time: '',
    staff_name: '',
    duration_minutes: 60,
    notes: '',
    event_title: '',
    event_location: ''
  });

  // Fetch referrals to use as "patients" in the dropdown
  const { data: referrals } = useQuery({
    queryKey: ['referrals-for-visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, status')
        .in('status', ['pending', 'contacted', 'scheduled'])
        .order('patient_name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch organizations for the dropdown
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const scheduleVisitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const scheduledDateTime = `${data.scheduled_date}T${data.scheduled_time}:00`;
      
      if (data.visit_target === 'patient') {
        const { error } = await supabase
          .from('visits')
          .insert([{
            patient_id: data.patient_id,
            visit_type: data.visit_type,
            scheduled_date: scheduledDateTime,
            staff_name: data.staff_name,
            duration_minutes: data.duration_minutes,
            notes: data.subject ? `${data.subject}\n\n${data.notes}` : data.notes
          }]);
        if (error) throw error;
      } else {
        // For facilities, referral sources, and events, we'll store in notes
        const eventDescription = data.visit_target === 'event' 
          ? `Event: ${data.event_title} at ${data.event_location}`
          : `Visit to ${data.visit_target}`;
        
        const notesContent = [
          data.subject,
          eventDescription,
          data.notes
        ].filter(Boolean).join('\n\n');
        
        const { error } = await supabase
          .from('visits')
          .insert([{
            patient_id: null,
            visit_type: data.visit_type || 'routine',
            scheduled_date: scheduledDateTime,
            staff_name: data.staff_name,
            duration_minutes: data.duration_minutes,
            notes: notesContent
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({ title: "Visit scheduled successfully" });
      onOpenChange(false);
      setFormData({
        subject: '',
        visit_target: 'patient' as VisitTarget,
        patient_id: '',
        organization_id: '',
        visit_type: 'routine' as VisitType,
        scheduled_date: '',
        scheduled_time: '',
        staff_name: '',
        duration_minutes: 60,
        notes: '',
        event_title: '',
        event_location: ''
      });
    },
    onError: () => {
      toast({ title: "Error scheduling visit", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visit_target || !formData.scheduled_date || !formData.scheduled_time || !formData.staff_name) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (formData.visit_target === 'patient' && !formData.patient_id) {
      toast({ title: "Please select a patient", variant: "destructive" });
      return;
    }
    scheduleVisitMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    if (referralId) {
      setFormData(prev => ({ ...prev, patient_id: referralId }));
    }
  }, [referralId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Visit</DialogTitle>
          <DialogDescription>
            Schedule a visit to a patient, facility, referral source, or create an event.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter visit subject or title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="visit_target">Visit Type *</Label>
              <Select value={formData.visit_target} onValueChange={(value) => handleInputChange('visit_target', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient Visit</SelectItem>
                  <SelectItem value="facility">Facility Visit</SelectItem>
                  <SelectItem value="referral_source">Referral Source Visit</SelectItem>
                  <SelectItem value="event">Event/Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.visit_target === 'patient' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="patient_id">Patient *</Label>
                  <Select value={formData.patient_id} onValueChange={(value) => handleInputChange('patient_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {referrals?.map((referral) => (
                        <SelectItem key={referral.id} value={referral.id}>
                          {referral.patient_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="visit_type">Visit Category</Label>
                  <Select value={formData.visit_type} onValueChange={(value) => handleInputChange('visit_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admission">Admission</SelectItem>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="discharge">Discharge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formData.visit_target === 'facility' && (
              <div className="grid gap-2">
                <Label htmlFor="organization_id">Facility</Label>
                <Select value={formData.organization_id} onValueChange={(value) => handleInputChange('organization_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.visit_target === 'referral_source' && (
              <div className="grid gap-2">
                <Label htmlFor="organization_id">Referral Source</Label>
                <Select value={formData.organization_id} onValueChange={(value) => handleInputChange('organization_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select referral source" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.visit_target === 'event' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="event_title">Event Title</Label>
                  <Input
                    id="event_title"
                    value={formData.event_title}
                    onChange={(e) => handleInputChange('event_title', e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event_location">Location</Label>
                  <Input
                    id="event_location"
                    value={formData.event_location}
                    onChange={(e) => handleInputChange('event_location', e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduled_date">Date *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="scheduled_time">Time *</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="staff_name">Staff Member *</Label>
              <Input
                id="staff_name"
                value={formData.staff_name}
                onChange={(e) => handleInputChange('staff_name', e.target.value)}
                placeholder="Enter staff member name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                min={15}
                step={15}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={scheduleVisitMutation.isPending}>
              {scheduleVisitMutation.isPending ? "Scheduling..." : "Schedule Visit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleVisitDialog;
