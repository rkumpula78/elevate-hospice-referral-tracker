import { supabase } from '@/integrations/supabase/client';

/**
 * Geocode an address via the geocode-address edge function.
 * Optionally pass organization_id to auto-update the org's coordinates.
 */
export async function geocodeOrganizationAddress(
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
    console.error('Geocoding failed for address:', address);
    return null;
  }
}
