import React, { useState, useEffect } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface EditVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string | null;
}

type VisitTarget = 'patient' | 'facility' | 'referral_source' | 'event';
type VisitType = 'admission' | 'routine' | 'urgent' | 'discharge';

const EditVisitDialog = ({ open, onOpenChange, visitId }: EditVisitDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    subject: '',
    visit_target: 'patient' as VisitTarget,
    patient_id: '',
    organization_id: '',
    visit_type: '' as VisitType,
    scheduled_date: '',
    scheduled_time: '',
    staff_name: '',
    duration_minutes: 60,
    notes: '',
    is_completed: false,
    event_title: '',
    event_location: ''
  });

  // Fetch visit data
  const { data: visit, isLoading } = useQuery({
    queryKey: ['visit', visitId],
    queryFn: async () => {
      if (!visitId) return null;
      const { data, error } = await supabase
        .from('visits')
        .select('*, patients(first_name, last_name)')
        .eq('id', visitId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!visitId && open
  });

  // Fetch patients for the dropdown
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: open
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
    },
    enabled: open
  });

  // Update form data when visit data is loaded
  useEffect(() => {
    if (visit) {
      const scheduledDate = new Date(visit.scheduled_date);
      
      // Parse subject from notes if it exists
      const notes = visit.notes || '';
      const lines = notes.split('\n\n');
      let subject = '';
      let remainingNotes = notes;
      let visitTarget: VisitTarget = 'patient';
      let eventTitle = '';
      let eventLocation = '';

      // Try to extract subject and determine visit target from notes
      if (lines.length > 1) {
        const firstLine = lines[0];
        if (firstLine.startsWith('Event:')) {
          visitTarget = 'event';
          const eventMatch = firstLine.match(/Event: (.+) at (.+)/);
          if (eventMatch) {
            eventTitle = eventMatch[1];
            eventLocation = eventMatch[2];
          }
          subject = lines.length > 2 ? lines[1] : '';
          remainingNotes = lines.slice(lines.length > 2 ? 2 : 1).join('\n\n');
        } else if (firstLine.includes('Visit to facility')) {
          visitTarget = 'facility';
          subject = lines[1] || '';
          remainingNotes = lines.slice(2).join('\n\n');
        } else if (firstLine.includes('Visit to referral_source')) {
          visitTarget = 'referral_source';
          subject = lines[1] || '';
          remainingNotes = lines.slice(2).join('\n\n');
        } else {
          // Assume first line is subject for patient visits
          subject = firstLine;
          remainingNotes = lines.slice(1).join('\n\n');
        }
      }

      setFormData({
        subject,
        visit_target: visit.patient_id ? 'patient' : visitTarget,
        patient_id: visit.patient_id || '',
        organization_id: '',
        visit_type: visit.visit_type,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        scheduled_time: scheduledDate.toTimeString().slice(0, 5),
        staff_name: visit.staff_name,
        duration_minutes: visit.duration_minutes || 60,
        notes: remainingNotes,
        is_completed: visit.is_completed || false,
        event_title: eventTitle,
        event_location: eventLocation
      });
    }
  }, [visit]);

  const updateVisitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const scheduledDateTime = `${data.scheduled_date}T${data.scheduled_time}:00`;
      
      let notesContent = '';
      if (data.visit_target === 'patient') {
        notesContent = data.subject ? `${data.subject}\n\n${data.notes}` : data.notes;
      } else {
        const eventDescription = data.visit_target === 'event' 
          ? `Event: ${data.event_title} at ${data.event_location}`
          : `Visit to ${data.visit_target}`;
        
        notesContent = [
          data.subject,
          eventDescription,
          data.notes
        ].filter(Boolean).join('\n\n');
      }
      
      const { error } = await supabase
        .from('visits')
        .update({
          patient_id: data.visit_target === 'patient' ? data.patient_id || null : null,
          visit_type: data.visit_type,
          scheduled_date: scheduledDateTime,
          staff_name: data.staff_name,
          duration_minutes: data.duration_minutes,
          notes: notesContent,
          is_completed: data.is_completed,
          completed_date: data.is_completed ? new Date().toISOString() : null
        })
        .eq('id', visitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({ title: "Visit updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error updating visit", variant: "destructive" });
    }
  });

  const deleteVisitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast({ title: "Visit deleted successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error deleting visit", variant: "destructive" });
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
    updateVisitMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this visit?")) {
      deleteVisitMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div>Loading visit details...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Visit</DialogTitle>
          <DialogDescription>
            Update visit details and status.
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
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_completed"
                checked={formData.is_completed}
                onCheckedChange={(checked) => handleInputChange('is_completed', checked)}
              />
              <Label htmlFor="is_completed">Mark as completed</Label>
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
          
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Visit
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateVisitMutation.isPending}>
                {updateVisitMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVisitDialog;
