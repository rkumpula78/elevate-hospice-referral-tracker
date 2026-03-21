import { supabase } from "@/integrations/supabase/client";

interface AdmissionEmailData {
  patient_first_name: string;
  patient_last_name: string;
  patient_dob: string;
  primary_insurance: string;
  referral_source: string;
  responsible_party: string;
  caregiver_name: string;
  diagnosis: string;
  advanced_directive: string;
  dnr_status: string;
  next_steps: string;
  intake_specialist_email: string;
}

export const sendAdmissionNotification = async (emailData: AdmissionEmailData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-admission-email', {
      body: { emailData }
    });

    if (error) {
      console.error('Failed to send admission email:', error);
      return { success: false, error };
    }

    console.log('Admission email sent successfully');
    return { success: true, result: data };
  } catch (error) {
    console.error('Failed to send admission email:', error);
    return { success: false, error };
  }
};

export const formatEmailData = (referralData: any, patientData: any): AdmissionEmailData => {
  return {
    patient_first_name: patientData?.first_name || referralData?.patient_name?.split(' ')[0] || 'N/A',
    patient_last_name: patientData?.last_name || referralData?.patient_name?.split(' ').slice(1).join(' ') || 'N/A',
    patient_dob: patientData?.date_of_birth || 'N/A',
    patient_ssn: patientData?.ssn || 'N/A',
    primary_insurance: patientData?.primary_insurance || referralData?.insurance || 'N/A',
    referral_source: referralData?.organizations?.name || 'N/A',
    responsible_party: patientData?.responsible_party_name || 'N/A',
    caregiver_name: patientData?.caregiver_name || 'N/A',
    diagnosis: patientData?.diagnosis || referralData?.diagnosis || 'N/A',
    advanced_directive: patientData?.advanced_directive ? 'Yes' : 'No',
    dnr_status: patientData?.dnr_status ? 'Yes' : 'No',
    next_steps: patientData?.next_steps || 'N/A',
    intake_specialist_email: 'intake@elevatehospice.com'
  };
};
