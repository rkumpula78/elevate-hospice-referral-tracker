
import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AddOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationType: 'marketer' | 'referral_source';
}

const AddOrganizationDialog = ({ open, onOpenChange, organizationType }: AddOrganizationDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    contact_person: '',
    contact_email: '',
  });

  const addOrganizationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('organizations')
        .insert([{
          ...data,
          type: organizationType,
          is_active: true
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({ title: `${organizationType === 'marketer' ? 'Marketer' : 'Referral source'} added successfully` });
      onOpenChange(false);
      setFormData({
        name: '',
        address: '',
        phone: '',
        contact_person: '',
        contact_email: '',
      });
    },
    onError: () => {
      toast({ title: "Error adding organization", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Please enter organization name", variant: "destructive" });
      return;
    }
    addOrganizationMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const title = organizationType === 'marketer' ? 'Add Marketer' : 'Add Referral Source';
  const description = organizationType === 'marketer' 
    ? 'Add a new marketer to track in the system'
    : 'Add a new referring organization to the system';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addOrganizationMutation.isPending}>
              {addOrganizationMutation.isPending ? "Adding..." : `Add ${organizationType === 'marketer' ? 'Marketer' : 'Referral Source'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrganizationDialog;
