
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Calendar, Heart, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EditReferralDialog from '@/components/crm/EditReferralDialog';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['referral', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('id', id)
        .single();

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

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <p>Patient not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Use proper fallbacks for the name display
  const displayName = (patient as any).first_name && (patient as any).last_name 
    ? `${(patient as any).first_name} ${(patient as any).last_name}` 
    : patient.patient_name || 'Unknown Patient';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/patients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patients
            </Button>
            <h1 className="text-2xl font-bold">Patient Details</h1>
          </div>
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Patient
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Patient Information
                <Badge className={getStatusColor(patient.status || (patient as any).patient_status)}>
                  {patient.status || (patient as any).patient_status || 'pending'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{displayName}</span>
              </div>
              {(patient as any).date_of_birth && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>DOB: {new Date((patient as any).date_of_birth).toLocaleDateString()}</span>
                </div>
              )}
              {((patient as any).phone || patient.patient_phone) && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${(patient as any).phone || patient.patient_phone}`} className="text-blue-600 hover:underline">{(patient as any).phone || patient.patient_phone}</a>
                </div>
              )}
              {(patient as any).address && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{(patient as any).address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Medical Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.diagnosis && (
                <div>
                  <p className="text-sm text-gray-600">Diagnosis</p>
                  <p className="font-medium">{patient.diagnosis}</p>
                </div>
              )}
              {((patient as any).physician || patient.referring_physician) && (
                <div>
                  <p className="text-sm text-gray-600">Physician</p>
                  <p className="font-medium">{(patient as any).physician || patient.referring_physician}</p>
                </div>
              )}
              {(patient.insurance || (patient as any).primary_insurance) && (
                <div>
                  <p className="text-sm text-gray-600">Insurance</p>
                  <p className="font-medium">{patient.insurance || (patient as any).primary_insurance}</p>
                </div>
              )}
              {patient.admission_date && (
                <div>
                  <p className="text-sm text-gray-600">Admission Date</p>
                  <p className="font-medium">
                    {new Date(patient.admission_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {(patient as any).emergency_contact && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{(patient as any).emergency_contact}</p>
                {(patient as any).emergency_phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${(patient as any).emergency_phone}`} className="text-blue-600 hover:underline">{(patient as any).emergency_phone}</a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(patient.notes || (patient as any).next_steps) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes & Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p>{patient.notes}</p>
                  </div>
                )}
                {(patient as any).next_steps && (
                  <div>
                    <p className="text-sm text-gray-600">Next Steps</p>
                    <p>{(patient as any).next_steps}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <EditReferralDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          referralId={id!}
        />
      </div>
    </div>
  );
};

export default PatientDetail;
