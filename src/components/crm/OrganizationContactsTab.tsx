
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash, Phone, Mail, User } from 'lucide-react';

interface OrganizationContactsTabProps {
  organizationId: string;
  organizationName: string;
}

const OrganizationContactsTab = ({ organizationId, organizationName }: OrganizationContactsTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    title: '',
    direct_phone: '',
    email: '',
    role_in_referral: '',
    influence_level: 'medium',
    relationship_strength: 3,
    years_in_position: '',
    communication_preferences: ['email'],
    best_contact_times: '',
    personal_interests: '',
    professional_networks: '',
    previous_experience: ''
  });

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['organization-contacts', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const { error } = await supabase
        .from('organization_contacts')
        .insert([{
          ...contactData,
          organization_id: organizationId,
          years_in_position: contactData.years_in_position ? parseInt(contactData.years_in_position) : null
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] });
      toast({ title: 'Contact added successfully' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error adding contact', description: error.message, variant: 'destructive' });
    }
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('organization_contacts')
        .update({
          ...data,
          years_in_position: data.years_in_position ? parseInt(data.years_in_position) : null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] });
      toast({ title: 'Contact updated successfully' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error updating contact', description: error.message, variant: 'destructive' });
    }
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('organization_contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] });
      toast({ title: 'Contact deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting contact', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      title: '',
      direct_phone: '',
      email: '',
      role_in_referral: '',
      influence_level: 'medium',
      relationship_strength: 3,
      years_in_position: '',
      communication_preferences: ['email'],
      best_contact_times: '',
      personal_interests: '',
      professional_networks: '',
      previous_experience: ''
    });
    setShowAddForm(false);
    setEditingContact(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, data: formData });
    } else {
      addContactMutation.mutate(formData);
    }
  };

  const startEdit = (contact: any) => {
    setFormData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      title: contact.title || '',
      direct_phone: contact.direct_phone || '',
      email: contact.email || '',
      role_in_referral: contact.role_in_referral || '',
      influence_level: contact.influence_level || 'medium',
      relationship_strength: contact.relationship_strength || 3,
      years_in_position: contact.years_in_position?.toString() || '',
      communication_preferences: contact.communication_preferences || ['email'],
      best_contact_times: contact.best_contact_times || '',
      personal_interests: contact.personal_interests || '',
      professional_networks: contact.professional_networks || '',
      previous_experience: contact.previous_experience || ''
    });
    setEditingContact(contact);
    setShowAddForm(true);
  };

  const getInfluenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Organization Contacts</h3>
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</CardTitle>
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
                  <Input
                    id="role_in_referral"
                    value={formData.role_in_referral}
                    onChange={(e) => setFormData(prev => ({ ...prev, role_in_referral: e.target.value }))}
                    placeholder="e.g., Decision Maker, Influencer"
                  />
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
                <div>
                  <Label htmlFor="relationship_strength">Relationship Strength (1-5)</Label>
                  <Select value={formData.relationship_strength.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_strength: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="years_in_position">Years in Position</Label>
                  <Input
                    id="years_in_position"
                    type="number"
                    value={formData.years_in_position}
                    onChange={(e) => setFormData(prev => ({ ...prev, years_in_position: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="best_contact_times">Best Contact Times</Label>
                <Input
                  id="best_contact_times"
                  value={formData.best_contact_times}
                  onChange={(e) => setFormData(prev => ({ ...prev, best_contact_times: e.target.value }))}
                  placeholder="e.g., Mornings, After 2 PM"
                />
              </div>

              <div>
                <Label htmlFor="personal_interests">Personal Interests</Label>
                <Textarea
                  id="personal_interests"
                  value={formData.personal_interests}
                  onChange={(e) => setFormData(prev => ({ ...prev, personal_interests: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addContactMutation.isPending || updateContactMutation.isPending}>
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {contacts?.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <h4 className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </h4>
                    <Badge className={getInfluenceColor(contact.influence_level)}>
                      {contact.influence_level} influence
                    </Badge>
                  </div>
                  
                  {contact.title && (
                    <p className="text-sm text-gray-600 mb-2">{contact.title}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {contact.direct_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{contact.direct_phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {contact.role_in_referral && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Role:</strong> {contact.role_in_referral}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => startEdit(contact)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => deleteContactMutation.mutate(contact.id)}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {contacts?.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No contacts added yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizationContactsTab;
