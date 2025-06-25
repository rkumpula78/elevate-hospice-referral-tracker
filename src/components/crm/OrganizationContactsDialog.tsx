
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Phone, Mail, Star } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrganizationContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  direct_phone: string | null;
  email: string | null;
  role_in_referral: string | null;
  years_in_position: number | null;
  previous_experience: string | null;
  communication_preferences: string[] | null;
  best_contact_times: string | null;
  relationship_strength: number | null;
  personal_interests: string | null;
  professional_networks: string | null;
  influence_level: string | null;
}

const OrganizationContactsDialog = ({ open, onOpenChange, organizationId, organizationName }: OrganizationContactsDialogProps) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    title: '',
    direct_phone: '',
    email: '',
    role_in_referral: '',
    years_in_position: '',
    previous_experience: '',
    communication_preferences: ['email'],
    best_contact_times: '',
    relationship_strength: 1,
    personal_interests: '',
    professional_networks: '',
    influence_level: 'medium'
  });

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['organization-contacts', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('last_name');
      
      if (error) throw error;
      return data as Contact[];
    },
    enabled: open
  });

  const resetForm = () => {
    setFormData({
      first_name: '', last_name: '', title: '', direct_phone: '', email: '', 
      role_in_referral: '', years_in_position: '', previous_experience: '', 
      communication_preferences: ['email'], best_contact_times: '', relationship_strength: 1, 
      personal_interests: '', professional_networks: '', influence_level: 'medium'
    });
    setShowAddForm(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      organization_id: organizationId,
      years_in_position: formData.years_in_position ? parseInt(formData.years_in_position) : null
    };

    if (editingContact) {
      const { error } = await supabase
        .from('organization_contacts')
        .update(dataToSubmit)
        .eq('id', editingContact.id);
      
      if (error) {
        toast.error('Failed to update contact');
      } else {
        toast.success('Contact updated successfully');
        queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] });
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('organization_contacts')
        .insert([dataToSubmit]);
      
      if (error) {
        toast.error('Failed to add contact');
      } else {
        toast.success('Contact added successfully');
        queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] });
        resetForm();
      }
    }
  };

  const handleEdit = (contact: Contact) => {
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      title: contact.title || '',
      direct_phone: contact.direct_phone || '',
      email: contact.email || '',
      role_in_referral: contact.role_in_referral || '',
      years_in_position: contact.years_in_position?.toString() || '',
      previous_experience: contact.previous_experience || '',
      communication_preferences: contact.communication_preferences || ['email'],
      best_contact_times: contact.best_contact_times || '',
      relationship_strength: contact.relationship_strength || 1,
      personal_interests: contact.personal_interests || '',
      professional_networks: contact.professional_networks || '',
      influence_level: contact.influence_level || 'medium'
    });
    setEditingContact(contact);
    setShowAddForm(true);
  };

  const handleDelete = async (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      const { error } = await supabase
        .from('organization_contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) {
        toast.error('Failed to delete contact');
      } else {
        toast.success('Contact deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] });
      }
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'decision_maker': return 'bg-red-100 text-red-800';
      case 'influencer': return 'bg-blue-100 text-blue-800';
      case 'gatekeeper': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInfluenceColor = (level: string | null) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contacts - {organizationName}</DialogTitle>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="self-end"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </DialogHeader>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingContact ? 'Edit' : 'Add'} Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role_in_referral">Role in Referral Process</Label>
                    <Select value={formData.role_in_referral} onValueChange={(value) => setFormData(prev => ({ ...prev, role_in_referral: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="decision_maker">Decision Maker</SelectItem>
                        <SelectItem value="influencer">Influencer</SelectItem>
                        <SelectItem value="gatekeeper">Gatekeeper</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="direct_phone">Direct Phone</Label>
                    <Input
                      id="direct_phone"
                      value={formData.direct_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, direct_phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="years_in_position">Years in Position</Label>
                    <Input
                      id="years_in_position"
                      type="number"
                      value={formData.years_in_position}
                      onChange={(e) => setFormData(prev => ({ ...prev, years_in_position: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship_strength">Relationship Strength (1-5)</Label>
                    <Select value={formData.relationship_strength.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_strength: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Cold</SelectItem>
                        <SelectItem value="2">2 - Aware</SelectItem>
                        <SelectItem value="3">3 - Friendly</SelectItem>
                        <SelectItem value="4">4 - Advocate</SelectItem>
                        <SelectItem value="5">5 - Champion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="influence_level">Influence Level</Label>
                    <Select value={formData.influence_level} onValueChange={(value) => setFormData(prev => ({ ...prev, influence_level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="best_contact_times">Best Contact Times</Label>
                  <Input
                    id="best_contact_times"
                    value={formData.best_contact_times}
                    onChange={(e) => setFormData(prev => ({ ...prev, best_contact_times: e.target.value }))}
                    placeholder="e.g., Mornings, Tue-Thu 2-4pm"
                  />
                </div>

                <div>
                  <Label htmlFor="personal_interests">Personal Interests</Label>
                  <Textarea
                    id="personal_interests"
                    value={formData.personal_interests}
                    onChange={(e) => setFormData(prev => ({ ...prev, personal_interests: e.target.value }))}
                    placeholder="Family, hobbies, interests..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingContact ? 'Update' : 'Add'} Contact
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div>Loading contacts...</div>
          ) : contacts?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No contacts added yet. Click "Add Contact" to get started.
            </div>
          ) : (
            contacts?.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {contact.title && (
                          <Badge variant="outline">{contact.title}</Badge>
                        )}
                        {contact.role_in_referral && (
                          <Badge className={getRoleColor(contact.role_in_referral)}>
                            {contact.role_in_referral.replace('_', ' ')}
                          </Badge>
                        )}
                        <Badge className={getInfluenceColor(contact.influence_level)}>
                          {contact.influence_level} influence
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {contact.direct_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {contact.direct_phone}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {contact.email}
                          </div>
                        )}
                        {contact.relationship_strength && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {contact.relationship_strength}/5
                          </div>
                        )}
                      </div>

                      {contact.best_contact_times && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Best times:</strong> {contact.best_contact_times}
                        </p>
                      )}

                      {contact.personal_interests && (
                        <p className="text-sm text-gray-600">
                          <strong>Interests:</strong> {contact.personal_interests}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationContactsDialog;
