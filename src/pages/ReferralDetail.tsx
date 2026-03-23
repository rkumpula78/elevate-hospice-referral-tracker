import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Phone, Mail, User, Building2, Edit, Plus } from 'lucide-react';
import ReferralEligibility from '@/components/crm/ReferralEligibility';
import BenefitPeriodTracker from '@/components/crm/BenefitPeriodTracker';
import { Badge } from '@/components/ui/badge';
import EditReferralDialog from '@/components/crm/EditReferralDialog';
import ScheduleVisitDialog from '@/components/crm/ScheduleVisitDialog';
import ReferralFamilyContacts from '@/components/crm/ReferralFamilyContacts';
import ReferralActivityLog from '@/components/crm/ReferralActivityLog';
import PageLayout from '@/components/layout/PageLayout';
import { format } from 'date-fns';
import AIQuickHelp from '@/components/dashboard/AIQuickHelp';
import StatusTimeline from '@/components/referrals/StatusTimeline';
import { getStatusBadgeColor as getStatusColor, getStatusLabel } from '@/lib/constants';

const ReferralDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const { data: referral, isLoading, refetch } = useQuery({
    queryKey: ['referral', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          organizations(name, type, contact_person, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Parse notes to display as rich text
  const parseNotes = (notes: string | null) => {
    if (!notes) return null;
    
    try {
      const parsedComments = JSON.parse(notes);
      if (Array.isArray(parsedComments)) {
        return parsedComments;
      }
    } catch {
      // If not valid JSON, treat as plain text
      return [{ id: '1', text: notes, timestamp: new Date().toISOString(), author: 'System' }];
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <PageLayout title="Loading..." subtitle="Please wait">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!referral) {
    return (
      <PageLayout title="Referral Not Found" subtitle="The requested referral could not be found">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              The referral you're looking for doesn't exist or may have been deleted.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/referrals')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Referrals
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Status helpers imported from constants

  const parsedNotes = parseNotes(referral.notes);

  return (
    <PageLayout 
      title={`Referral: ${referral.patient_name}`}
      subtitle="Referral details and management"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/referrals')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Referrals
          </Button>
          <div className="flex gap-2">
            <AIQuickHelp 
              contactName={referral.patient_name}
              contextData={{
                referralStatus: referral.status,
                diagnosis: referral.diagnosis,
                priority: referral.priority,
                organizationName: referral.organizations?.name
              }}
            />
            <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Visit
            </Button>
            <Button onClick={() => setShowEditDialog(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Referral
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Patient Information
                <Badge className={getStatusColor(referral.status)}>
                  {getStatusLabel(referral.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{referral.patient_name}</span>
              </div>
              {referral.patient_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${referral.patient_phone}`} className="text-blue-600 hover:underline">{referral.patient_phone}</a>
                </div>
              )}
              {referral.diagnosis && (
                <div>
                  <p className="text-sm text-gray-600">Diagnosis</p>
                  <p className="font-medium">{referral.diagnosis}</p>
                </div>
              )}
              {referral.insurance && (
                <div>
                  <p className="text-sm text-gray-600">Insurance</p>
                  <p className="font-medium">{referral.insurance}</p>
                </div>
              )}
              {referral.priority && (
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <Badge className={
                    referral.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    referral.priority === 'routine' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {referral.priority}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {referral.organizations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Referring Organization</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{referral.organizations.name}</p>
                  <p className="text-sm text-gray-600">{referral.organizations.type}</p>
                </div>
                {referral.organizations.contact_person && (
                  <div>
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="font-medium">{referral.organizations.contact_person}</p>
                  </div>
                )}
                {referral.organizations.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${referral.organizations.phone}`} className="text-blue-600 hover:underline">{referral.organizations.phone}</a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {referral.admission_date && (
            <BenefitPeriodTracker
              admissionDate={new Date(referral.admission_date)}
              patientName={referral.patient_name}
              compact
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Referral Date</p>
                <p className="font-medium">
                  {new Date(referral.referral_date).toLocaleDateString()}
                </p>
              </div>
              {referral.contact_date && (
                <div>
                  <p className="text-sm text-gray-600">Contact Date</p>
                  <p className="font-medium">
                    {new Date(referral.contact_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {referral.admission_date && (
                <div>
                  <p className="text-sm text-gray-600">Admission Date</p>
                  <p className="font-medium">
                    {new Date(referral.admission_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {referral.assigned_marketer && (
                <div>
                  <p className="text-sm text-gray-600">Assigned Marketer</p>
                  <p className="font-medium">{referral.assigned_marketer}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <div className="lg:col-span-2">
            <StatusTimeline referralId={id!} currentStatus={referral.status} />
          </div>

          {/* Medicare Eligibility Section */}
          <div className="lg:col-span-2">
            <ReferralEligibility referralId={id!} />
          </div>

          {/* Family Contacts Section */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <ReferralFamilyContacts referralId={id!} />
            </CardContent>
          </Card>

          {/* Structured Activity Log */}
          <ReferralActivityLog referralId={id!} />
        </div>

        <EditReferralDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              refetch();
            }
          }}
          referralId={id!}
        />

        <ScheduleVisitDialog
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          referralId={id}
        />
      </div>
    </PageLayout>
  );
};

export default ReferralDetail;
