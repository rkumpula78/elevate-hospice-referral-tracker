import { supabase } from '@/integrations/supabase/client';

/**
 * Geocode an address via the geocode-address edge function.
 * Optionally pass organization_id to auto-update the org's coordinates.
 */
export async function geocodeAddress(
  address: string,
  organizationId?: string
): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || address.trim().length < 5) return null;

  try {
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address, organization_id: organizationId },
    });

    if (error || !data?.latitude) return null;
    return { latitude: data.latitude, longitude: data.longitude };
  } catch {
    console.error('Geocoding failed');
    return null;
  }
}

/** @deprecated Use geocodeAddress instead */
export const geocodeOrganizationAddress = geocodeAddress;

/**
 * Geocode a patient address and update the patient record.
 * Fails silently — admission should never be blocked by geocoding.
 */
export async function geocodePatientAddress(
  patientId: string,
  address: string
): Promise<void> {
  try {
    const coords = await geocodeAddress(address);
    if (coords) {
      await supabase
        .from('patients')
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq('id', patientId);
    }
  } catch {
    console.warn('Patient geocoding failed for patient:', patientId);
  }
}
