import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Calendar, Phone, Mail, User, Users, Building2, Edit, Plus, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReferralEligibility from '@/components/crm/ReferralEligibility';
import AdmissionDetailsSection from '@/components/crm/AdmissionDetailsSection';
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
import CareTeamSection from '@/components/crm/CareTeamSection';
import { getStatusBadgeColor as getStatusColor, getStatusLabel } from '@/lib/constants';

const ReferralDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: referral, isLoading, refetch } = useQuery({
    queryKey: ['referral', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          organizations!referrals_organization_id_fkey(id, name, type, contact_person, phone, address),
          facility_organization:organizations!referrals_facility_organization_id_fkey(id, name, type, address)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!id
  });

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
            {isAdmin && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Top: basic patient info + responsible party / contacts */}
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
              {referral.date_of_birth && (
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium">{new Date(referral.date_of_birth).toLocaleDateString()}</p>
                </div>
              )}
              {referral.address && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium whitespace-pre-line">{referral.address}</p>
                </div>
              )}
              {(referral.location_type || referral.location_city || referral.patient_location) && (
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">
                    {[referral.location_type, referral.location_city, referral.patient_location]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
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

          {/* Responsible Party & Contacts + Referring Org */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  <span>Responsible Party & Contacts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 text-sm">
                {(referral.responsible_party_name || referral.responsible_party_contact || referral.responsible_party_relationship) ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Responsible Party</p>
                    <p className="font-medium">
                      {referral.responsible_party_name}
                      {referral.responsible_party_relationship ? ` (${referral.responsible_party_relationship})` : ''}
                    </p>
                    {referral.responsible_party_contact && (
                      <a href={`tel:${referral.responsible_party_contact}`} className="text-blue-600 hover:underline">{referral.responsible_party_contact}</a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No responsible party recorded yet. Use Edit Referral to add one.</p>
                )}
                {(referral.caregiver_name || referral.caregiver_contact) && (
                  <div>
                    <p className="text-xs text-muted-foreground">Primary Caregiver</p>
                    <p className="font-medium">
                      {referral.caregiver_name}
                      {referral.caregiver_contact && (
                        <>
                          {referral.caregiver_name ? ' — ' : ''}
                          <a href={`tel:${referral.caregiver_contact}`} className="text-blue-600 hover:underline">{referral.caregiver_contact}</a>
                        </>
                      )}
                    </p>
                  </div>
                )}
                {(referral.emergency_contact || referral.emergency_phone) && (
                  <div>
                    <p className="text-xs text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">
                      {referral.emergency_contact}
                      {referral.emergency_phone && (
                        <>
                          {referral.emergency_contact ? ' — ' : ''}
                          <a href={`tel:${referral.emergency_phone}`} className="text-blue-600 hover:underline">{referral.emergency_phone}</a>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(referral.organizations || referral.facility_organization || referral.address || referral.location_type) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="w-4 h-4" />
                    <span>Source & Residence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4 text-sm">
                  {referral.organizations && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Referring Organization</p>
                      <button
                        type="button"
                        onClick={() => navigate(`/organizations/${referral.organizations.id}`)}
                        className="text-left font-medium text-blue-600 hover:underline"
                      >
                        {referral.organizations.name}
                      </button>
                      {referral.organizations.type && (
                        <p className="text-xs text-muted-foreground">{referral.organizations.type}</p>
                      )}
                      {referral.organizations.address && (
                        <p className="text-xs text-muted-foreground whitespace-pre-line">{referral.organizations.address}</p>
                      )}
                      {referral.organizations.contact_person && (
                        <p className="text-xs mt-1"><span className="text-muted-foreground">Contact: </span>{referral.organizations.contact_person}</p>
                      )}
                      {referral.organizations.phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <a href={`tel:${referral.organizations.phone}`} className="text-blue-600 hover:underline">{referral.organizations.phone}</a>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Patient Residence</p>
                    {referral.facility_organization ? (
                      <>
                        <button
                          type="button"
                          onClick={() => navigate(`/organizations/${referral.facility_organization.id}`)}
                          className="text-left font-medium text-blue-600 hover:underline"
                        >
                          {referral.facility_organization.name}
                        </button>
                        {referral.facility_organization.type && (
                          <p className="text-xs text-muted-foreground">{referral.facility_organization.type}</p>
                        )}
                        {referral.facility_organization.address && (
                          <p className="text-xs text-muted-foreground whitespace-pre-line">{referral.facility_organization.address}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-medium">
                          {referral.location_type
                            ? referral.location_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                            : 'Private Home'}
                        </p>
                        {referral.address && (
                          <p className="text-xs text-muted-foreground whitespace-pre-line">{referral.address}</p>
                        )}
                        {!referral.address && referral.location_city && (
                          <p className="text-xs text-muted-foreground">{referral.location_city}</p>
                        )}
                        {!referral.address && !referral.location_city && (
                          <p className="text-xs text-muted-foreground italic">No address on file</p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Primary focus: the unified update feed */}
        <ReferralActivityLog referralId={id!} />

        {/* Everything else, tucked away */}
        <Collapsible open={showMore} onOpenChange={setShowMore}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>More details (eligibility, timeline, care team, family contacts)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReferralEligibility referralId={id!} compact />

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
                    <p className="font-medium">{new Date(referral.referral_date).toLocaleDateString()}</p>
                  </div>
                  {referral.contact_date && (
                    <div>
                      <p className="text-sm text-gray-600">Contact Date</p>
                      <p className="font-medium">{new Date(referral.contact_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {referral.admission_date && (
                    <div>
                      <p className="text-sm text-gray-600">Admission Date</p>
                      <p className="font-medium">{new Date(referral.admission_date).toLocaleDateString()}</p>
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

              <CareTeamSection
                referralId={id!}
                referral={referral}
                onUpdate={() => refetch()}
              />

              {referral.status === 'admitted' && (
                <div className="lg:col-span-2">
                  <AdmissionDetailsSection referral={referral} onUpdate={() => refetch()} />
                </div>
              )}

              <div className="lg:col-span-2">
                <StatusTimeline referralId={id!} currentStatus={referral.status} />
              </div>

              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  <ReferralFamilyContacts referralId={id!} />
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Referral</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete the referral for <strong>{referral?.patient_name}</strong>?
                This action cannot be easily undone. All activity log entries for this referral will also be hidden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={async () => {
                  const { error } = await supabase
                    .from('referrals')
                    .update({ deleted_at: new Date().toISOString() } as any)
                    .eq('id', id!);
                  if (error) {
                    toast.error('Failed to delete referral: ' + error.message);
                    return;
                  }
                  queryClient.invalidateQueries({ queryKey: ['referrals'] });
                  queryClient.invalidateQueries({ queryKey: ['referrals-kanban'] });
                  queryClient.invalidateQueries({ queryKey: ['palliative-outreach-count'] });
                  toast.success('Referral deleted');
                  navigate('/referrals');
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
};

export default ReferralDetail;
