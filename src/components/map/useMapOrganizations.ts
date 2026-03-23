import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear } from 'date-fns';

export interface MapFiltersState {
  ratings: string[];
  lastVisit: 'all' | 'overdue' | 'recent';
  orgTypes: string[];
}

export interface MapOrganization {
  id: string;
  name: string;
  type: string;
  account_rating: string | null;
  gps_latitude: number;
  gps_longitude: number;
  address: string | null;
  ytd_referrals: number;
  last_visit_date: string | null;
}

export function useMapOrganizations() {
  const orgsQuery = useQuery({
    queryKey: ['map-organizations'],
    queryFn: async () => {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, type, account_rating, gps_latitude, gps_longitude, address')
        .not('gps_latitude', 'is', null)
        .not('gps_longitude', 'is', null);

      if (error) throw error;

      const ytdStart = startOfYear(new Date()).toISOString();

      const { data: referralCounts } = await supabase
        .from('referrals' as any)
        .select('referring_organization_id')
        .gte('created_at', ytdStart);

      const refCountMap: Record<string, number> = {};
      (referralCounts || []).forEach((r: any) => {
        if (r.referring_organization_id) {
          refCountMap[r.referring_organization_id] = (refCountMap[r.referring_organization_id] || 0) + 1;
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

      return (orgs || []).map(org => ({
        id: org.id,
        name: org.name,
        type: org.type,
        account_rating: org.account_rating,
        gps_latitude: Number(org.gps_latitude),
        gps_longitude: Number(org.gps_longitude),
        address: org.address,
        ytd_referrals: refCountMap[org.id] || 0,
        last_visit_date: lastVisitMap[org.id] || null,
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

  return {
    organizations: orgsQuery.data || [],
    orgTypes: orgTypesQuery.data || [],
    isLoading: orgsQuery.isLoading,
    error: orgsQuery.error,
  };
}

export function filterOrganizations(orgs: MapOrganization[], filters: MapFiltersState): MapOrganization[] {
  return orgs.filter(org => {
    if (filters.ratings.length > 0 && !filters.ratings.includes(org.account_rating || 'C')) {
      return false;
    }
    if (filters.orgTypes.length > 0 && !filters.orgTypes.includes(org.type)) {
      return false;
    }
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
          ytd_referrals: org.ytd_referrals,
          last_visit_date: org.last_visit_date,
          needs_visit: needsVisit,
        },
      };
    }),
  };
}
