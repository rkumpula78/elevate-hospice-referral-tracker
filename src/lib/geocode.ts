import { supabase } from '@/integrations/supabase/client';

/**
 * Geocode an address via the geocode-address edge function.
 * Optionally pass organization_id to auto-update the org's coordinates.
 */
export interface GeocodeResult {
  latitude: number;
  longitude: number;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

export async function geocodeAddress(
  address: string,
  organizationId?: string
): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 5) return null;

  try {
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address, organization_id: organizationId },
    });

    if (error || !data?.latitude) return null;
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city ?? null,
      state: data.state ?? null,
      zip_code: data.zip_code ?? null,
    };
  } catch {
    console.error('Geocoding failed');
    return null;
  }
}

/**
 * One-time backfill: geocode existing organizations that have an address but are
 * missing coordinates or city/zip. Runs sequentially to stay gentle on the
 * Mapbox rate limit. `onProgress` reports (done, total) so the UI can show status.
 */
export async function backfillOrgLocations(
  onProgress?: (done: number, total: number) => void
): Promise<{ total: number; updated: number; failed: number }> {
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, address, gps_latitude, city, zip_code')
    .not('address', 'is', null);

  if (error) throw error;

  // Only process rows that are actually missing location data.
  const pending = (orgs || []).filter((o: any) => {
    const hasAddress = (o.address || '').trim().length >= 5;
    const missing = o.gps_latitude == null || !o.city || !o.zip_code;
    return hasAddress && missing;
  });

  let updated = 0;
  let failed = 0;
  for (let i = 0; i < pending.length; i++) {
    const org: any = pending[i];
    const result = await geocodeAddress(org.address, org.id);
    if (result) updated++; else failed++;
    onProgress?.(i + 1, pending.length);
    // Small pause between calls to avoid hammering the geocoding API.
    await new Promise((r) => setTimeout(r, 120));
  }

  return { total: pending.length, updated, failed };
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
