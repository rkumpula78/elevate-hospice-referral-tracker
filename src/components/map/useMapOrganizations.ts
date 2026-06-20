import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear } from 'date-fns';

export interface MapFiltersState {
  ratings: string[];
  lastVisit: 'all' | 'overdue' | 'recent';
  orgTypes: string[];
  marketers: string[];
  bdTiers: string[];
  routingWeeks: number[];
  contractOnFile: 'all' | 'yes' | 'no';
  activeStatus: 'all' | 'active' | 'inactive';
  cities: string[];
  zipQuery: string;
  myAccountsOnly: boolean;
}

export const DEFAULT_MAP_FILTERS: MapFiltersState = {
  ratings: [],
  lastVisit: 'all',
  orgTypes: [],
  marketers: [],
  bdTiers: [],
  routingWeeks: [],
  contractOnFile: 'all',
  activeStatus: 'active',
  cities: [],
  zipQuery: '',
  myAccountsOnly: false,
};

export interface MapOrganization {
  id: string;
  name: string;
  type: string;
  account_rating: string | null;
  gps_latitude: number;
  gps_longitude: number;
  address: string | null;
  assigned_marketer: string | null;
  ytd_referrals: number;
  last_visit_date: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  bd_tier: string | null;
  routing_week: number | null;
  is_active: boolean | null;
  contract_on_file: boolean | null;
  next_scheduled_visit: string | null;
}

export function useMapOrganizations() {
  const orgsQuery = useQuery({
    queryKey: ['map-organizations'],
    queryFn: async () => {
      // select('*') keeps the map resilient if a newer column (city/zip/routing_week/
      // next_scheduled_visit) hasn't been applied to this DB yet.
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .not('gps_latitude', 'is', null)
        .not('gps_longitude', 'is', null);

      if (error) throw error;

      const ytdStart = startOfYear(new Date()).toISOString();

      const { data: referralCounts } = await supabase
        .from('referrals' as any)
        .select('organization_id')
        .gte('created_at', ytdStart);

      const refCountMap: Record<string, number> = {};
      (referralCounts || []).forEach((r: any) => {
        if (r.organization_id) {
          refCountMap[r.organization_id] = (refCountMap[r.organization_id] || 0) + 1;
        }
      });

      const orgIds = (orgs || []).map(o => o.id);
      const { data: activities } = await supabase
        .from('activity_communications')
        .select('organization_id, activity_date')
        .in('organization_id', orgIds.length > 0 ? orgIds : ['none'])
        .order('activity_date', { ascending: false });

      const lastVisitMap: Record<string, string> = {};
      (activities || []).forEach((a) => {
        if (a.organization_id && !lastVisitMap[a.organization_id]) {
          lastVisitMap[a.organization_id] = a.activity_date;
        }
      });

      return (orgs || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        type: org.type,
        account_rating: org.account_rating,
        gps_latitude: Number(org.gps_latitude),
        gps_longitude: Number(org.gps_longitude),
        address: org.address,
        assigned_marketer: org.assigned_marketer ?? null,
        ytd_referrals: refCountMap[org.id] || 0,
        last_visit_date: lastVisitMap[org.id] || null,
        city: org.city ?? null,
        state: org.state ?? null,
        zip_code: org.zip_code ?? null,
        bd_tier: org.bd_tier ?? null,
        routing_week: org.routing_week ?? null,
        is_active: org.is_active ?? null,
        contract_on_file: org.contract_on_file ?? null,
        next_scheduled_visit: org.next_scheduled_visit ?? null,
      })) as MapOrganization[];
    },
  });

  const orgTypesQuery = useQuery({
    queryKey: ['map-org-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('type')
        .not('gps_latitude', 'is', null);
      const types = new Set((data || []).map(d => d.type));
      return Array.from(types).sort();
    },
  });

  const marketersQuery = useQuery({
    queryKey: ['profile-marketers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, staff_type')
        .eq('staff_type', 'marketer')
        .not('first_name', 'is', null);
      if (error) throw error;
      return (data || [])
        .map((p: any) => `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim())
        .filter((n: string) => n.length > 0)
        .sort();
    },
  });

  const marketers = marketersQuery.data || [];

  // Count of orgs that have an address but no coordinates (they never show on the map).
  const missingCoordsQuery = useQuery({
    queryKey: ['map-missing-coords'],
    queryFn: async () => {
      const { count } = await supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .is('gps_latitude', null)
        .not('address', 'is', null);
      return count || 0;
    },
  });

  return {
    organizations: orgsQuery.data || [],
    orgTypes: orgTypesQuery.data || [],
    marketers,
    missingCoordsCount: missingCoordsQuery.data || 0,
    isLoading: orgsQuery.isLoading,
    error: orgsQuery.error,
  };
}

export function filterOrganizations(
  orgs: MapOrganization[],
  filters: MapFiltersState,
  currentMarketerName?: string | null,
): MapOrganization[] {
  const myName = (currentMarketerName || '').toLowerCase().trim();
  return orgs.filter(org => {
    if (filters.ratings.length > 0 && !filters.ratings.includes(org.account_rating || 'C')) {
      return false;
    }
    if (filters.orgTypes.length > 0 && !filters.orgTypes.includes(org.type)) {
      return false;
    }
    if (filters.marketers && filters.marketers.length > 0) {
      const m = org.assigned_marketer || '__unassigned__';
      if (!filters.marketers.includes(m)) return false;
    }
    if (filters.myAccountsOnly && myName) {
      if (!(org.assigned_marketer || '').toLowerCase().includes(myName)) return false;
    }
    if (filters.bdTiers.length > 0 && !filters.bdTiers.includes(org.bd_tier || '__none__')) {
      return false;
    }
    if (filters.routingWeeks.length > 0) {
      if (org.routing_week == null || !filters.routingWeeks.includes(org.routing_week)) return false;
    }
    if (filters.contractOnFile === 'yes' && !org.contract_on_file) return false;
    if (filters.contractOnFile === 'no' && org.contract_on_file) return false;
    if (filters.activeStatus === 'active' && org.is_active === false) return false;
    if (filters.activeStatus === 'inactive' && org.is_active !== false) return false;
    if (filters.cities.length > 0 && !filters.cities.includes(org.city || '__none__')) {
      return false;
    }
    const zq = (filters.zipQuery || '').trim();
    if (zq && !(org.zip_code || '').startsWith(zq)) return false;
    if (filters.lastVisit === 'overdue') {
      if (!org.last_visit_date) return true;
      const daysSince = (Date.now() - new Date(org.last_visit_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 14;
    }
    if (filters.lastVisit === 'recent') {
      if (!org.last_visit_date) return false;
      const daysSince = (Date.now() - new Date(org.last_visit_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }
    return true;
  });
}

export function toGeoJSON(orgs: MapOrganization[]): GeoJSON.FeatureCollection {
  const now = Date.now();
  return {
    type: 'FeatureCollection',
    features: orgs.map(org => {
      const needsVisit = !org.last_visit_date || (now - new Date(org.last_visit_date).getTime()) / 86400000 > 14;
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [org.gps_longitude, org.gps_latitude],
        },
        properties: {
          id: org.id,
          name: org.name,
          type: org.type,
          account_rating: org.account_rating || 'C',
          assigned_marketer: org.assigned_marketer || '__unassigned__',
          ytd_referrals: org.ytd_referrals,
          last_visit_date: org.last_visit_date,
          next_scheduled_visit: org.next_scheduled_visit,
          city: org.city,
          zip_code: org.zip_code,
          needs_visit: needsVisit,
        },
      };
    }),
  };
}
