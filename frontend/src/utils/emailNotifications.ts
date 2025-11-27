
import emailjs from '@emailjs/browser';

interface AdmissionEmailData {
  patient_first_name: string;
  patient_last_name: string;
  patient_dob: string;
  patient_ssn: string;
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
    const templateParams = {
      ...emailData,
      to_email: emailData.intake_specialist_email,
      intake_specialist_name: 'Intake Specialist', // You can customize this
    };

    const result = await emailjs.send(
      'service_6rfreoj', // Your service ID
      'template_9mo8nme', // Your template ID
      templateParams,
      '8RNUuoiff1EDGAsc3' // Your public key
    );

    console.log('Admission email sent successfully:', result);
    return { success: true, result };
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
    intake_specialist_email: 'intake@elevatehospice.com' // You can make this configurable
  };
};
