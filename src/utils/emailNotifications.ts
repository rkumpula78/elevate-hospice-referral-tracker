import { supabase } from "@/integrations/supabase/client";

// HIPAA: this notification is intentionally PHI-free. EmailJS is a third-party
// provider without a BAA, so we only send operational metadata (no patient
// name, DOB, diagnosis, or clinical flags). Staff open the CRM for details.
interface AdmissionEmailData {
  referral_id: string;
  referral_source: string;
  priority: string;
  admitted_at: string;
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

    return { success: true, result: data };
  } catch (error) {
    console.error('Failed to send admission email:', error);
    return { success: false, error };
  }
};

export const formatEmailData = (referralData: {
  id: string;
  priority?: string | null;
  organizations?: { name?: string | null } | null;
}): AdmissionEmailData => {
  return {
    referral_id: referralData.id,
    referral_source: referralData.organizations?.name || 'Unknown source',
    priority: referralData.priority || 'routine',
    admitted_at: new Date().toISOString(),
    intake_specialist_email: 'intake@elevatehospiceaz.com'
  };
};
