
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash, Phone, Mail, User, Crown, UserCheck } from 'lucide-react';

interface ReferralFamilyContactsProps {
  referralId: string;
}

const ReferralFamilyContacts = ({ referralId }: ReferralFamilyContactsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({
    contact_name: '',
    relationship: '',
    phone: '',
    email: '',
    is_poa: false,
    is_primary_contact: false
  });

  // Fetch family contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['referral-family-contacts', referralId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_family_contacts')
        .select('*')
        .eq('referral_id', referralId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const { error } = await supabase
        .from('referral_family_contacts')
        .insert([{
          ...contactData,
          referral_id: referralId
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-family-contacts', referralId] });
      toast({ title: 'Family contact added successfully' });
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
        .from('referral_family_contacts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-family-contacts', referralId] });
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
        .from('referral_family_contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-family-contacts', referralId] });
      toast({ title: 'Contact deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting contact', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      contact_name: '',
      relationship: '',
      phone: '',
      email: '',
      is_poa: false,
      is_primary_contact: false
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
      contact_name: contact.contact_name || '',
      relationship: contact.relationship || '',
      phone: contact.phone || '',
      email: contact.email || '',
      is_poa: contact.is_poa || false,
      is_primary_contact: contact.is_primary_contact || false
    });
    setEditingContact(contact);
    setShowAddForm(true);
  };

  if (isLoading) {
    return <div>Loading family contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Family & Caregiver Contacts</h3>
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingContact ? 'Edit Contact' : 'Add Family Contact'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="e.g., Spouse, Daughter, Son, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_poa"
                    checked={formData.is_poa}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_poa: !!checked }))}
                  />
                  <Label htmlFor="is_poa">Power of Attorney (POA)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary_contact"
                    checked={formData.is_primary_contact}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary_contact: !!checked }))}
                  />
                  <Label htmlFor="is_primary_contact">Primary Contact</Label>
                </div>
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
                    <h4 className="font-medium">{contact.contact_name}</h4>
                    <div className="flex gap-1">
                      {contact.is_poa && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Crown className="w-3 h-3 mr-1" />
                          POA
                        </Badge>
                      )}
                      {contact.is_primary_contact && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {contact.relationship && (
                    <p className="text-sm text-gray-600 mb-2">{contact.relationship}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {contact.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => startEdit(contact)} className="bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900 font-semibold">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => deleteContactMutation.mutate(contact.id)}
                    className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700 font-semibold"
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
              <p className="text-center text-gray-500">No family contacts added yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReferralFamilyContacts;
