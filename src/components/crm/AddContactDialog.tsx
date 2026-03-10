import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName?: string;
  onContactAdded?: (contactId: string) => void;
  autoSelectAsReferrer?: boolean;
}

const AddContactDialog: React.FC<AddContactDialogProps> = ({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  onContactAdded,
  autoSelectAsReferrer = true
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    title: '',
    direct_phone: '',
    cell_phone: '',
    mobile_phone: '',
    email: '',
    specialization: '',
    is_referring_contact: autoSelectAsReferrer,
    is_primary_referrer: false,
    preferred_contact_method: 'phone',
    notes: ''
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Adding contact with data:', { organizationId, ...data });
      
      // Validate organizationId exists
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const { data: newContact, error } = await supabase
        .from('organization_contacts')
        .insert({
          organization_id: organizationId,
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
          title: data.title.trim() || null,
          direct_phone: data.direct_phone.trim() || null,
          cell_phone: data.cell_phone.trim() || null,
          mobile_phone: data.mobile_phone.trim() || null,
          email: data.email.trim() || null,
          specialization: data.specialization.trim() || null,
          is_referring_contact: data.is_referring_contact,
          is_primary_referrer: data.is_primary_referrer,
          preferred_contact_method: data.preferred_contact_method,
          notes: data.notes.trim() || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error adding contact:', error);
        throw error;
      }
      
      console.log('Successfully created contact:', newContact);
      return newContact;
    },
    onSuccess: (newContact) => {
      console.log('Contact created successfully, invalidating queries...');
      
      // Invalidate all organization-contacts queries
      queryClient.invalidateQueries({ queryKey: ['organization-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      
      toast({ title: "Contact added successfully" });
      
      // Notify parent component of the new contact ID
      if (onContactAdded) {
        console.log('Notifying parent of new contact:', newContact.id);
        onContactAdded(newContact.id);
      }
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error adding contact:', error);
      
      let errorMessage = "Please try again";
      
      // Handle specific database errors
      if (error?.code === '23505') {
        errorMessage = "A contact with this information already exists";
      } else if (error?.code === '23503') {
        errorMessage = "Invalid organization selected";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Error adding contact", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({ 
        title: "First and last name are required", 
        variant: "destructive" 
      });
      return;
    }

    // Validate email format if provided
    if (formData.email.trim() && !formData.email.includes('@')) {
      toast({ 
        title: "Please enter a valid email address", 
        variant: "destructive" 
      });
      return;
    }

    // Validate that at least one contact method is provided
    if (!formData.direct_phone.trim() && !formData.cell_phone.trim() && !formData.mobile_phone.trim() && !formData.email.trim()) {
      toast({ 
        title: "Please provide at least one contact method (phone or email)", 
        variant: "destructive" 
      });
      return;
    }
    
    console.log('Submitting contact form with data:', formData);
    addContactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      title: '',
      direct_phone: '',
      mobile_phone: '',
      email: '',
      specialization: '',
      is_referring_contact: autoSelectAsReferrer,
      is_primary_referrer: false,
      preferred_contact_method: 'phone',
      notes: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const isSubmitting = addContactMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            {organizationName ? `Adding contact for ${organizationName}` : 'Add a new contact to the organization.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title/Position</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Director of Nursing, Social Worker"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="specialization">Specialization/Department</Label>
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) => handleInputChange('specialization', e.target.value)}
              placeholder="e.g., ICU, Emergency, Oncology"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="direct_phone">Direct Phone</Label>
              <PhoneInput
                id="direct_phone"
                value={formData.direct_phone}
                onChange={(value) => handleInputChange('direct_phone', value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="mobile_phone">Mobile Phone</Label>
              <PhoneInput
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(value) => handleInputChange('mobile_phone', value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
            <Select 
              value={formData.preferred_contact_method} 
              onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_referring_contact"
                checked={formData.is_referring_contact}
                onCheckedChange={(checked) => handleInputChange('is_referring_contact', checked as boolean)}
                disabled={isSubmitting}
              />
              <Label 
                htmlFor="is_referring_contact" 
                className="text-sm font-normal cursor-pointer"
              >
                This person is a referring contact (sends referrals)
              </Label>
            </div>

            {formData.is_referring_contact && (
              <div className="flex items-center space-x-2 pl-6">
                <Checkbox
                  id="is_primary_referrer"
                  checked={formData.is_primary_referrer}
                  onCheckedChange={(checked) => handleInputChange('is_primary_referrer', checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label 
                  htmlFor="is_primary_referrer" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Primary referrer for this organization
                </Label>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Any additional information about this contact..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Contact'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactDialog;