import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Phone, Mail, MapPin, User, Edit, Globe, FileText, DollarSign, Target, Users, Bed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditOrganizationDialog from '@/components/crm/EditOrganizationDialog';
import OrganizationTraining from '@/components/crm/OrganizationTraining';
import OrganizationKPIs from '@/components/crm/OrganizationKPIs';
import PartnershipStageManager from '@/components/crm/PartnershipStageManager';
import SimpleOrganizationTraining from '@/components/training/SimpleOrganizationTraining';
import OrganizationKPICard from '@/components/crm/OrganizationKPICard';
import OrganizationContactsTab from '@/components/crm/OrganizationContactsTab';
import OrganizationValueProps from '@/components/value-props/OrganizationValueProps';

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: referrals } = useQuery({
    queryKey: ['organization-referrals', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, status, referral_date')
        .eq('organization_id', id)
        .order('referral_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <p>Organization not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'A': return 'bg-red-100 text-red-800';
      case 'B': return 'bg-orange-100 text-orange-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'P': return 'bg-blue-100 text-blue-800';
      case 'D': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractColor = (status: string | null) => {
    switch (status) {
      case 'exclusive': return 'bg-green-100 text-green-800';
      case 'preferred': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'competitive': return 'bg-orange-100 text-orange-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/organizations')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Organizations
            </Button>
            <h1 className="text-2xl font-bold">Organization Details</h1>
          </div>
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Organization
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="partnership">Partnership</TabsTrigger>
            <TabsTrigger value="training">Value Props & Resources</TabsTrigger>
            <TabsTrigger value="kpis">KPIs & Metrics</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Organization Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Organization Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">{organization.name}</h2>
                    {organization.dba_name && (
                      <p className="text-sm text-gray-600">DBA: {organization.dba_name}</p>
                    )}
                    <p className="text-gray-600 capitalize">{organization.type?.replace('_', ' ')}</p>
                    {organization.sub_type && (
                      <p className="text-sm text-gray-600">{organization.sub_type}</p>
                    )}
                  </div>
                  
                  {organization.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <span className="text-sm">{organization.address}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {organization.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3 h-3 text-gray-500" />
                        <span>{organization.phone}</span>
                      </div>
                    )}
                    
                    {organization.contact_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3 h-3 text-gray-500" />
                        <span>{organization.contact_email}</span>
                      </div>
                    )}
                    
                    {organization.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-3 h-3 text-gray-500" />
                        <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                    
                    {organization.bed_count && (
                      <div className="flex items-center space-x-2">
                        <Bed className="w-3 h-3 text-gray-500" />
                        <span>{organization.bed_count} beds</span>
                      </div>
                    )}
                  </div>

                  {organization.license_numbers && organization.license_numbers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">License Numbers:</p>
                      <div className="flex flex-wrap gap-1">
                        {organization.license_numbers.map((license, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {license}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strategic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Strategic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Account Rating</p>
                      <Badge className={getRatingColor(organization.account_rating)}>
                        {organization.account_rating || 'C'}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Contract Status</p>
                      <Badge className={getContractColor(organization.contract_status)}>
                        {(organization.contract_status || 'open').charAt(0).toUpperCase() + 
                         (organization.contract_status || 'open').slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {organization.referral_potential && (
                    <div>
                      <p className="text-sm text-gray-600">Referral Potential</p>
                      <p className="font-medium">{organization.referral_potential}/10</p>
                    </div>
                  )}

                  {organization.service_radius && (
                    <div>
                      <p className="text-sm text-gray-600">Service Radius</p>
                      <p className="font-medium">{organization.service_radius} miles</p>
                    </div>
                  )}

                  {organization.ownership_type && (
                    <div>
                      <p className="text-sm text-gray-600">Ownership Type</p>
                      <p className="font-medium capitalize">{organization.ownership_type.replace('_', ' ')}</p>
                    </div>
                  )}

                  {organization.current_hospice_providers && organization.current_hospice_providers.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Hospice Providers:</p>
                      <div className="flex flex-wrap gap-1">
                        {organization.current_hospice_providers.map((provider, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {provider}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact & Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Contact & Assignment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {organization.contact_person && (
                    <div>
                      <p className="text-sm text-gray-600">Primary Contact</p>
                      <p className="font-medium">{organization.contact_person}</p>
                    </div>
                  )}
                  
                  {organization.assigned_marketer && (
                    <div>
                      <p className="text-sm text-gray-600">Assigned Marketer</p>
                      <p className="font-medium">{organization.assigned_marketer}</p>
                    </div>
                  )}

                  {organization.after_hours_contact && (
                    <div>
                      <p className="text-sm text-gray-600">After Hours Contact</p>
                      <p className="font-medium">{organization.after_hours_contact}</p>
                    </div>
                  )}

                  {organization.medicare_id && (
                    <div>
                      <p className="text-sm text-gray-600">Medicare ID</p>
                      <p className="font-medium">{organization.medicare_id}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={organization.is_active ? "default" : "secondary"}>
                      {organization.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Intelligence Notes */}
            {(organization.competitive_landscape || organization.financial_health_notes || organization.expansion_plans || organization.regulatory_notes) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {organization.competitive_landscape && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>Competitive Landscape</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{organization.competitive_landscape}</p>
                    </CardContent>
                  </Card>
                )}

                {organization.financial_health_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5" />
                        <span>Financial Health</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{organization.financial_health_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {organization.expansion_plans && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5" />
                        <span>Expansion Plans</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{organization.expansion_plans}</p>
                    </CardContent>
                  </Card>
                )}

                {organization.regulatory_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Regulatory Notes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{organization.regulatory_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts">
            <OrganizationContactsTab 
              organizationId={id!} 
              organizationName={organization.name}
            />
          </TabsContent>

          <TabsContent value="partnership">
            <PartnershipStageManager
              organizationId={id!}
              currentStage={organization.partnership_stage || 'prospect'}
              lastTrainingReview={organization.last_training_review}
              partnershipNotes={organization.partnership_notes}
            />
          </TabsContent>

          <TabsContent value="training">
            <OrganizationValueProps 
              organizationType={organization.type}
            />
          </TabsContent>

          <TabsContent value="kpis">
            <OrganizationKPIs
              organizationId={id!}
              organizationType={organization.type}
            />
          </TabsContent>

          <TabsContent value="referrals">
            {referrals && referrals.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{referral.patient_name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(referral.referral_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No referrals yet for this organization</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <EditOrganizationDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          organizationId={id!}
        />
      </div>
    </div>
  );
};

export default OrganizationDetail;
