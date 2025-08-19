import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
      const { data: newContact, error } = await supabase
        .from('organization_contacts')
        .insert({
          organization_id: organizationId,
          first_name: data.first_name,
          last_name: data.last_name,
          title: data.title || null,
          direct_phone: data.direct_phone || null,
          mobile_phone: data.mobile_phone || null,
          email: data.email || null,
          specialization: data.specialization || null,
          is_referring_contact: data.is_referring_contact,
          is_primary_referrer: data.is_primary_referrer,
          preferred_contact_method: data.preferred_contact_method,
          notes: data.notes || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return newContact;
    },
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] });
      toast({ title: "Contact added successfully" });
      
      // Notify parent component of the new contact ID
      if (onContactAdded) {
        onContactAdded(newContact.id);
      }
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error adding contact:', error);
      toast({ 
        title: "Error adding contact", 
        description: "Please try again",
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({ 
        title: "First and last name are required", 
        variant: "destructive" 
      });
      return;
    }
    
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
          {organizationName && (
            <p className="text-sm text-muted-foreground">
              Adding contact for {organizationName}
            </p>
          )}
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