
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, Building, MapPin, Phone, Mail, User, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface EnhancedOrganizationProfileProps {
  organizationId: string;
}

const EnhancedOrganizationProfile = ({ organizationId }: EnhancedOrganizationProfileProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Fetch organization data
  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization-profile', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Set form data when organization data is loaded
  useEffect(() => {
    if (organization) {
      setFormData(organization);
    }
  }, [organization]);

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from('organizations')
        .update(updatedData)
        .eq('id', organizationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profile', organizationId] });
      toast({ title: 'Organization profile updated successfully' });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({ title: 'Error updating organization', description: error.message, variant: 'destructive' });
    }
  });

  const handleSave = () => {
    updateOrganizationMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(organization);
    setIsEditing(false);
  };

  const getRelationshipStatusColor = (status: string) => {
    switch (status) {
      case 'active_high_volume': return 'bg-green-100 text-green-800';
      case 'active_low_volume': return 'bg-blue-100 text-blue-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'dormant': return 'bg-gray-100 text-gray-800';
      case 'former_partner': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPotentialColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading organization profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Organization Profile
            </CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave} disabled={updateOrganizationMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              ) : (
                <p className="text-lg font-semibold">{organization?.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="type">Organization Type</Label>
              {isEditing ? (
                <Select value={formData.type || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="nursing_home">Skilled Nursing Facility (SNF)</SelectItem>
                    <SelectItem value="assisted_living">Assisted Living Facility (ALF)</SelectItem>
                    <SelectItem value="physician_office">Physician Clinic</SelectItem>
                    <SelectItem value="home_health">Home Health Agency</SelectItem>
                    <SelectItem value="clinic">Community Group</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">{organization?.type?.replace('_', ' ')}</Badge>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{organization?.address || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Primary Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{organization?.phone || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Relationship Management */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="relationship_status">Relationship Status</Label>
              {isEditing ? (
                <Select value={formData.relationship_status || 'prospect'} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active_low_volume">Active - Low Volume</SelectItem>
                    <SelectItem value="active_high_volume">Active - High Volume</SelectItem>
                    <SelectItem value="dormant">Dormant</SelectItem>
                    <SelectItem value="former_partner">Former Partner</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getRelationshipStatusColor(organization?.relationship_status || 'prospect')}>
                  {organization?.relationship_status?.replace('_', ' ') || 'Prospect'}
                </Badge>
              )}
            </div>
            <div>
              <Label htmlFor="referral_potential_level">Referral Potential</Label>
              {isEditing ? (
                <Select value={formData.referral_potential_level || 'medium'} onValueChange={(value) => setFormData(prev => ({ ...prev, referral_potential_level: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getPotentialColor(organization?.referral_potential_level || 'medium')}>
                  {organization?.referral_potential_level || 'Medium'}
                </Badge>
              )}
            </div>
          </div>

          {/* Account Management */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assigned_marketer">Key Account Manager/Liaison</Label>
              {isEditing ? (
                <Input
                  id="assigned_marketer"
                  value={formData.assigned_marketer || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_marketer: e.target.value }))}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{organization?.assigned_marketer || 'Not assigned'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <Checkbox
                    id="contract_on_file"
                    checked={formData.contract_on_file || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contract_on_file: !!checked }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>{organization?.contract_on_file ? 'Contract on file' : 'No contract on file'}</span>
                  </div>
                )}
                {isEditing && <Label htmlFor="contract_on_file">Contract/Agreement on File</Label>}
              </div>
            </div>
          </div>

          {/* Contact Tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Last Contact Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>
                  {organization?.last_contact_date 
                    ? format(new Date(organization.last_contact_date), 'MMM dd, yyyy')
                    : 'No contact recorded'
                  }
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="next_followup_date">Next Follow-up Date</Label>
              {isEditing ? (
                <Input
                  id="next_followup_date"
                  type="date"
                  value={formData.next_followup_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_followup_date: e.target.value }))}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    {organization?.next_followup_date 
                      ? format(new Date(organization.next_followup_date), 'MMM dd, yyyy')
                      : 'Not scheduled'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          {isEditing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="partnership_notes">Partnership Notes</Label>
                <Textarea
                  id="partnership_notes"
                  value={formData.partnership_notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, partnership_notes: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bed_count">Bed Count</Label>
                  <Input
                    id="bed_count"
                    type="number"
                    value={formData.bed_count || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bed_count: parseInt(e.target.value) || null }))}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedOrganizationProfile;
