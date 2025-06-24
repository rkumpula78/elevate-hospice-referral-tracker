import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Phone, Mail, MapPin, User, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditOrganizationDialog from '@/components/crm/EditOrganizationDialog';
import OrganizationTraining from '@/components/crm/OrganizationTraining';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
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
            <TabsTrigger value="training">Training & Resources</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <p className="text-gray-600">{organization.type}</p>
                  </div>
                  
                  {organization.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <span>{organization.address}</span>
                    </div>
                  )}
                  
                  {organization.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{organization.phone}</span>
                    </div>
                  )}
                  
                  {organization.contact_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{organization.contact_email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

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
                      <p className="text-sm text-gray-600">Contact Person</p>
                      <p className="font-medium">{organization.contact_person}</p>
                    </div>
                  )}
                  
                  {organization.assigned_marketer && (
                    <div>
                      <p className="text-sm text-gray-600">Assigned Marketer</p>
                      <p className="font-medium">{organization.assigned_marketer}</p>
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
          </TabsContent>

          <TabsContent value="training">
            <OrganizationTraining 
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
