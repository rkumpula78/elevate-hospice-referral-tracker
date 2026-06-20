import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DuplicateTable = 'organizations' | 'referrals';

export interface DuplicateMatch {
  id: string;
  label: string;
  sublabel?: string;
}

interface Options {
  excludeId?: string | null;
  enabled?: boolean;
}

/**
 * Soft duplicate detection: looks for existing records whose name matches the
 * value the user is typing (case-insensitive exact match). Returns matches so
 * the UI can warn — it never blocks creation.
 *
 * - organizations: matched on `name`
 * - referrals: matched on `patient_name` (also covers admitted patients, since
 *   each patient row is created from a referral)
 */
export function useDuplicateCheck(
  table: DuplicateTable,
  value: string,
  opts: Options = {},
): { matches: DuplicateMatch[]; isChecking: boolean } {
  const { excludeId = null, enabled = true } = opts;
  const trimmed = (value || '').trim();

  // Debounce so we don't query on every keystroke.
  const [debounced, setDebounced] = useState(trimmed);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(trimmed), 300);
    return () => clearTimeout(t);
  }, [trimmed]);

  const active = enabled && debounced.length >= 2;

  const query = useQuery({
    queryKey: ['duplicate-check', table, debounced, excludeId],
    enabled: active,
    queryFn: async (): Promise<DuplicateMatch[]> => {
      if (table === 'organizations') {
        let q = supabase
          .from('organizations')
          .select('id, name, type, city')
          .ilike('name', debounced)
          .limit(5);
        if (excludeId) q = q.neq('id', excludeId);
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map((o: any) => ({
          id: o.id,
          label: o.name,
          sublabel: [o.type, o.city].filter(Boolean).join(' · ') || undefined,
        }));
      }

      let q = supabase
        .from('referrals')
        .select('id, patient_name, status, created_at')
        .ilike('patient_name', debounced)
        .limit(5);
      if (excludeId) q = q.neq('id', excludeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        label: r.patient_name,
        sublabel: [r.status?.replace(/_/g, ' '), r.created_at ? new Date(r.created_at).toLocaleDateString() : null]
          .filter(Boolean).join(' · ') || undefined,
      }));
    },
  });

  return {
    matches: active ? (query.data || []) : [],
    isChecking: active && query.isFetching,
  };
}
