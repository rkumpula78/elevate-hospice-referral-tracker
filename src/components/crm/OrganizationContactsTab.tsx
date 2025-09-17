
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash, Phone, Mail, User, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
    // Core Contact Information
    first_name: '',
    last_name: '',
    middle_name: '',
    title: '',
    department: '',
    professional_license: '',
    npi_number: '',
    email: '',
    direct_phone: '',
    fax_number: '',
    mailing_address: '',
    preferred_contact_method: 'email',
    
    // Relationship & Referral Data
    contact_type: '',
    relationship_to_patient: '',
    role_in_referral: '',
    referral_source_category: '',
    lead_source: '',
    assigned_owner: '',
    influence_level: 'medium',
    relationship_strength: 3,
    last_contact_date: '',
    next_followup_date: '',
    
    // Compliance & Operations
    consent_status: 'pending',
    hipaa_compliance: false,
    credential_verification_status: 'pending',
    affiliation_agreements: false,
    
    // CRM Engagement & Analytics
    contact_stage: 'lead',
    referral_conversion_rate: '',
    marketing_preferences: [],
    tags_categories: [],
    
    // Custom Hospice Fields
    specialty: '',
    areas_of_service: '',
    patient_population_served: '',
    preferred_hospital: '',
    relationship_notes: '',
    
    // Legacy fields
    years_in_position: '',
    communication_preferences: ['email'],
    best_contact_times: '',
    personal_interests: '',
    professional_networks: '',
    previous_experience: ''
  });

  // Fetch contacts from organization_contacts table
  const { data: contacts, isLoading: contactsLoading } = useQuery({
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

  // Fetch organization data to get primary contact
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization-primary-contact', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('contact_person, contact_email, phone')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const isLoading = contactsLoading || orgLoading;

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      // Convert empty strings to null for date fields
      const processedData = {
        ...contactData,
        organization_id: organizationId,
        years_in_position: contactData.years_in_position ? parseInt(contactData.years_in_position) : null,
        last_contact_date: contactData.last_contact_date || null,
        next_followup_date: contactData.next_followup_date || null,
        referral_conversion_rate: contactData.referral_conversion_rate ? parseFloat(contactData.referral_conversion_rate) : null
      };
      
      const { error } = await supabase
        .from('organization_contacts')
        .insert([processedData]);
      
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
      // Convert empty strings to null for date fields
      const processedData = {
        ...data,
        years_in_position: data.years_in_position ? parseInt(data.years_in_position) : null,
        last_contact_date: data.last_contact_date || null,
        next_followup_date: data.next_followup_date || null,
        referral_conversion_rate: data.referral_conversion_rate ? parseFloat(data.referral_conversion_rate) : null
      };
      
      const { error } = await supabase
        .from('organization_contacts')
        .update(processedData)
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
      // Core Contact Information
      first_name: '',
      last_name: '',
      middle_name: '',
      title: '',
      department: '',
      professional_license: '',
      npi_number: '',
      email: '',
      direct_phone: '',
      fax_number: '',
      mailing_address: '',
      preferred_contact_method: 'email',
      
      // Relationship & Referral Data
      contact_type: '',
      relationship_to_patient: '',
      role_in_referral: '',
      referral_source_category: '',
      lead_source: '',
      assigned_owner: '',
      influence_level: 'medium',
      relationship_strength: 3,
      last_contact_date: '',
      next_followup_date: '',
      
      // Compliance & Operations
      consent_status: 'pending',
      hipaa_compliance: false,
      credential_verification_status: 'pending',
      affiliation_agreements: false,
      
      // CRM Engagement & Analytics
      contact_stage: 'lead',
      referral_conversion_rate: '',
      marketing_preferences: [],
      tags_categories: [],
      
      // Custom Hospice Fields
      specialty: '',
      areas_of_service: '',
      patient_population_served: '',
      preferred_hospital: '',
      relationship_notes: '',
      
      // Legacy fields
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
      // Core Contact Information
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      middle_name: contact.middle_name || '',
      title: contact.title || '',
      department: contact.department || '',
      professional_license: contact.professional_license || '',
      npi_number: contact.npi_number || '',
      email: contact.email || '',
      direct_phone: contact.direct_phone || '',
      fax_number: contact.fax_number || '',
      mailing_address: contact.mailing_address || '',
      preferred_contact_method: contact.preferred_contact_method || 'email',
      
      // Relationship & Referral Data
      contact_type: contact.contact_type || '',
      relationship_to_patient: contact.relationship_to_patient || '',
      role_in_referral: contact.role_in_referral || '',
      referral_source_category: contact.referral_source_category || '',
      lead_source: contact.lead_source || '',
      assigned_owner: contact.assigned_owner || '',
      influence_level: contact.influence_level || 'medium',
      relationship_strength: contact.relationship_strength || 3,
      last_contact_date: contact.last_contact_date ? new Date(contact.last_contact_date).toISOString().split('T')[0] : '',
      next_followup_date: contact.next_followup_date || '',
      
      // Compliance & Operations
      consent_status: contact.consent_status || 'pending',
      hipaa_compliance: contact.hipaa_compliance || false,
      credential_verification_status: contact.credential_verification_status || 'pending',
      affiliation_agreements: contact.affiliation_agreements || false,
      
      // CRM Engagement & Analytics
      contact_stage: contact.contact_stage || 'lead',
      referral_conversion_rate: contact.referral_conversion_rate?.toString() || '',
      marketing_preferences: contact.marketing_preferences || [],
      tags_categories: contact.tags_categories || [],
      
      // Custom Hospice Fields
      specialty: contact.specialty || '',
      areas_of_service: contact.areas_of_service || '',
      patient_population_served: contact.patient_population_served || '',
      preferred_hospital: contact.preferred_hospital || '',
      relationship_notes: contact.relationship_notes || '',
      
      // Legacy fields
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'decision_maker': return 'bg-red-100 text-red-800';
      case 'influencer': return 'bg-blue-100 text-blue-800';
      case 'gatekeeper': return 'bg-yellow-100 text-yellow-800';
      case 'primary_contact': return 'bg-green-100 text-green-800';
      case 'administrator': return 'bg-purple-100 text-purple-800';
      case 'physician': return 'bg-indigo-100 text-indigo-800';
      case 'nurse': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleDisplay = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="referral">Referral Data</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
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
                      <Label htmlFor="middle_name">Middle Name</Label>
                      <Input
                        id="middle_name"
                        value={formData.middle_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, middle_name: e.target.value }))}
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
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="professional_license">Professional License</Label>
                      <Input
                        id="professional_license"
                        value={formData.professional_license}
                        onChange={(e) => setFormData(prev => ({ ...prev, professional_license: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="npi_number">NPI Number</Label>
                      <Input
                        id="npi_number"
                        value={formData.npi_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, npi_number: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direct_phone">Direct Phone</Label>
                      <Input
                        id="direct_phone"
                        value={formData.direct_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, direct_phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fax_number">Fax Number</Label>
                      <Input
                        id="fax_number"
                        value={formData.fax_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, fax_number: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
                      <Select value={formData.preferred_contact_method} onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_contact_method: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="fax">Fax</SelectItem>
                          <SelectItem value="mail">Mail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mailing_address">Mailing Address</Label>
                    <Textarea
                      id="mailing_address"
                      value={formData.mailing_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, mailing_address: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="referral" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_type">Contact Type</Label>
                      <Select value={formData.contact_type} onValueChange={(value) => setFormData(prev => ({ ...prev, contact_type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="referral_source">Referral Source</SelectItem>
                          <SelectItem value="physician">Physician</SelectItem>
                          <SelectItem value="discharge_planner">Discharge Planner</SelectItem>
                          <SelectItem value="case_manager">Case Manager</SelectItem>
                          <SelectItem value="social_worker">Social Worker</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="administrator">Administrator</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contact_stage">Contact Stage</Label>
                      <Select value={formData.contact_stage} onValueChange={(value) => setFormData(prev => ({ ...prev, contact_stage: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="former_partner">Former Partner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="primary_contact">Primary Contact</SelectItem>
                          <SelectItem value="secondary_contact">Secondary Contact</SelectItem>
                          <SelectItem value="administrator">Administrator</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                          <SelectItem value="social_worker">Social Worker</SelectItem>
                          <SelectItem value="physician">Physician</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="coordinator">Coordinator</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="referral_source_category">Referral Source Category</Label>
                      <Select value={formData.referral_source_category} onValueChange={(value) => setFormData(prev => ({ ...prev, referral_source_category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">Hospital</SelectItem>
                          <SelectItem value="clinic">Clinic</SelectItem>
                          <SelectItem value="snf">SNF</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                          <SelectItem value="physician_office">Physician Office</SelectItem>
                          <SelectItem value="home_health">Home Health</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lead_source">Lead Source</Label>
                      <Input
                        id="lead_source"
                        value={formData.lead_source}
                        onChange={(e) => setFormData(prev => ({ ...prev, lead_source: e.target.value }))}
                        placeholder="How contact was acquired"
                      />
                    </div>
                    <div>
                      <Label htmlFor="assigned_owner">Assigned Owner</Label>
                      <Input
                        id="assigned_owner"
                        value={formData.assigned_owner}
                        onChange={(e) => setFormData(prev => ({ ...prev, assigned_owner: e.target.value }))}
                        placeholder="Account manager"
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
                      <Label htmlFor="referral_conversion_rate">Conversion Rate (%)</Label>
                      <Input
                        id="referral_conversion_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.referral_conversion_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, referral_conversion_rate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="last_contact_date">Last Contact Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.last_contact_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.last_contact_date ? format(new Date(formData.last_contact_date), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.last_contact_date ? new Date(formData.last_contact_date) : undefined}
                            onSelect={(date) => setFormData(prev => ({ 
                              ...prev, 
                              last_contact_date: date ? format(date, "yyyy-MM-dd") : ""
                            }))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="next_followup_date">Next Follow-up Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.next_followup_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.next_followup_date ? format(new Date(formData.next_followup_date), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.next_followup_date ? new Date(formData.next_followup_date) : undefined}
                            onSelect={(date) => setFormData(prev => ({ 
                              ...prev, 
                              next_followup_date: date ? format(date, "yyyy-MM-dd") : ""
                            }))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consent_status">Consent Status</Label>
                      <Select value={formData.consent_status} onValueChange={(value) => setFormData(prev => ({ ...prev, consent_status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="granted">Granted</SelectItem>
                          <SelectItem value="denied">Denied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="credential_verification_status">Credential Verification</Label>
                      <Select value={formData.credential_verification_status} onValueChange={(value) => setFormData(prev => ({ ...prev, credential_verification_status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="not_required">Not Required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hipaa_compliance"
                        checked={formData.hipaa_compliance}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hipaa_compliance: checked as boolean }))}
                      />
                      <Label htmlFor="hipaa_compliance">HIPAA Release on File</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="affiliation_agreements"
                        checked={formData.affiliation_agreements}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, affiliation_agreements: checked as boolean }))}
                      />
                      <Label htmlFor="affiliation_agreements">Affiliation Agreements on File</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="specialty">Specialty</Label>
                      <Input
                        id="specialty"
                        value={formData.specialty}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                        placeholder="e.g., Oncology, Palliative, Family Medicine"
                      />
                    </div>
                    <div>
                      <Label htmlFor="areas_of_service">Areas of Service</Label>
                      <Input
                        id="areas_of_service"
                        value={formData.areas_of_service}
                        onChange={(e) => setFormData(prev => ({ ...prev, areas_of_service: e.target.value }))}
                        placeholder="Coverage areas"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient_population_served">Patient Population Served</Label>
                      <Input
                        id="patient_population_served"
                        value={formData.patient_population_served}
                        onChange={(e) => setFormData(prev => ({ ...prev, patient_population_served: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferred_hospital">Preferred Hospital/Facility</Label>
                      <Input
                        id="preferred_hospital"
                        value={formData.preferred_hospital}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferred_hospital: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="relationship_notes">Relationship Notes</Label>
                    <Textarea
                      id="relationship_notes"
                      value={formData.relationship_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, relationship_notes: e.target.value }))}
                      rows={3}
                      placeholder="Notes on relationship strength and influence"
                    />
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

                  <div>
                    <Label htmlFor="professional_networks">Professional Networks</Label>
                    <Textarea
                      id="professional_networks"
                      value={formData.professional_networks}
                      onChange={(e) => setFormData(prev => ({ ...prev, professional_networks: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="previous_experience">Previous Experience</Label>
                    <Textarea
                      id="previous_experience"
                      value={formData.previous_experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, previous_experience: e.target.value }))}
                      rows={2}
                    />
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
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
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
        {/* Display primary contact from organization record */}
        {organization?.contact_person && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <h4 className="font-medium">{organization.contact_person}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="bg-blue-100 text-blue-800">
                        Primary Contact
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {organization.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{organization.phone}</span>
                      </div>
                    )}
                    {organization.contact_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate" title={organization.contact_email}>{organization.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      // Pre-populate form with primary contact data
                      setFormData(prev => ({
                        ...prev,
                        first_name: organization.contact_person?.split(' ')[0] || '',
                        last_name: organization.contact_person?.split(' ').slice(1).join(' ') || '',
                        email: organization.contact_email || '',
                        direct_phone: organization.phone || '',
                        contact_type: 'primary_contact',
                        contact_stage: 'active'
                      }));
                      setShowAddForm(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Display additional contacts from organization_contacts table */}
        {contacts?.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="pt-4">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                 <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <h4 className="font-medium">
                          {contact.first_name} {contact.middle_name && `${contact.middle_name} `}{contact.last_name}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {contact.contact_type && (
                          <Badge className="bg-purple-100 text-purple-800">
                            {formatRoleDisplay(contact.contact_type)}
                          </Badge>
                        )}
                        {contact.contact_stage && (
                          <Badge className={contact.contact_stage === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {formatRoleDisplay(contact.contact_stage)}
                          </Badge>
                        )}
                        <Badge className={getInfluenceColor(contact.influence_level)}>
                          {contact.influence_level} influence
                        </Badge>
                        {contact.role_in_referral && (
                          <Badge className={getRoleColor(contact.role_in_referral)}>
                            {formatRoleDisplay(contact.role_in_referral)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  
                  {contact.title && (
                    <p className="text-sm text-gray-600 mb-2">{contact.title}</p>
                  )}
                  
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                     {contact.direct_phone && (
                       <div className="flex items-center gap-1">
                         <Phone className="w-3 h-3 flex-shrink-0" />
                         <span className="truncate">{contact.direct_phone}</span>
                       </div>
                     )}
                     {contact.email && (
                       <div className="flex items-center gap-1">
                         <Mail className="w-3 h-3 flex-shrink-0" />
                         <span className="truncate" title={contact.email}>{contact.email}</span>
                       </div>
                     )}
                   </div>
                </div>
                
                <div className="flex gap-1 flex-shrink-0">
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
        
        {(!contacts || contacts.length === 0) && !organization?.contact_person && (
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
