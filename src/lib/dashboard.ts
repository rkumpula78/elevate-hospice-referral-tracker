import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { startOfDay, startOfMonth, subDays, format } from 'date-fns';

type Referral = Database['public']['Tables']['referrals']['Row'];
type CensusEntry = Database['public']['Tables']['census_entries']['Row'];

// Helper function to calculate conversion rate from a list of referrals
const calculateConversionRate = (referrals: Pick<Referral, 'status'>[]): number => {
  if (!referrals || referrals.length === 0) return 0;
  const admitted = referrals.filter(r => r.status === 'admitted' || r.status === 'admitted_our_hospice').length;
  return Math.round((admitted / referrals.length) * 100);
};

// Helper function to calculate average response time from a list of referrals
const calculateAvgResponseTime = (referrals: Pick<Referral, 'referral_date' | 'contact_date'>[]): number => {
  if (!referrals || referrals.length === 0) return 0;
  const validReferrals = referrals.filter(r => r.referral_date && r.contact_date);
  if (validReferrals.length === 0) return 0;

  const totalHours = validReferrals.reduce((sum, ref) => {
    const referralTime = new Date(ref.referral_date!).getTime();
    const contactTime = new Date(ref.contact_date!).getTime();
    return sum + (contactTime - referralTime) / (1000 * 60 * 60);
  }, 0);

  return totalHours / validReferrals.length;
};

export const fetchDashboardStats = async () => {
  const today = startOfDay(new Date());
  const thisMonth = startOfMonth(new Date());
  const thirtyDaysAgo = subDays(new Date(), 30);
  const sixtyDaysAgo = subDays(new Date(), 60);
  const lastMonth = subDays(thisMonth, 1);
  const lastMonthStart = startOfMonth(lastMonth);

  // All queries will run in parallel
  const [
    censusData,
    referralCounts,
    crmCounts,
    referralStatusData,
    responseTimeData
  ] = await Promise.all([
    // 1. Fetch Census Data
    (async () => {
      try {
         const { data: latestCensus } = await supabase
          .from('census_entries')
          .select('*')
          .order('census_date', { ascending: false })
          .limit(1)
          .single<CensusEntry>();

        const { data: previousCensus } = await supabase
          .from('census_entries')
          .select('*')
          .eq('census_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
          .maybeSingle<CensusEntry>();

        return { latestCensus, previousCensus };
      } catch {
        // Fallback if census table doesn't exist or has issues
        const { count } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .in('status', ['admitted', 'admitted_our_hospice']);
        return { latestCensus: { patient_count: count || 0 }, previousCensus: null };
      }
    })(),

    // 2. Fetch Referral Counts
    (async () => {
      const { count: todayReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: monthlyReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());

      const { count: lastMonthReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', thisMonth.toISOString());

      return { todayReferrals, monthlyReferrals, lastMonthReferrals };
    })(),

    // 3. Fetch CRM Counts
    (async () => {
      const { count: pendingFollowUps } = await supabase
        .from('activity_communications')
        .select('*', { count: 'exact', head: true })
        .eq('follow_up_required', true)
        .eq('follow_up_completed', false);

      const { count: activePartners } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .in('partnership_stage', ['prospect', 'active'])
        .eq('is_active', true);

      return { pendingFollowUps, activePartners };
    })(),

    // 4. Fetch data for Conversion Rate
    supabase
      .from('referrals')
      .select('status')
      .gte('created_at', sixtyDaysAgo.toISOString()),

    // 5. Fetch data for Response Time
    supabase
      .from('referrals')
      .select('referral_date, contact_date')
      .not('contact_date', 'is', null)
      .gte('created_at', sixtyDaysAgo.toISOString()),
  ]);

  // --- Process Census Data ---
  const currentCensus = censusData.latestCensus?.patient_count || 0;
  const censusPrevious = censusData.previousCensus?.patient_count || 0;
  const censusTrend = censusPrevious > 0
    ? Math.round(((currentCensus - censusPrevious) / censusPrevious) * 100)
    : 0;

  // --- Process Referral Counts ---
  const monthlyTrend = (referralCounts.lastMonthReferrals || 0) > 0
    ? Math.round((((referralCounts.monthlyReferrals || 0) - (referralCounts.lastMonthReferrals || 0)) / (referralCounts.lastMonthReferrals || 0)) * 100)
    : 0;

  // --- Process Conversion Rate ---
  const recentReferrals = referralStatusData.data?.filter(r => new Date(r.created_at!) >= thirtyDaysAgo) || [];
  const previousReferrals = referralStatusData.data?.filter(r => new Date(r.created_at!) < thirtyDaysAgo) || [];
  const conversionRate = calculateConversionRate(recentReferrals);
  const previousConversionRate = calculateConversionRate(previousReferrals);
  const conversionTrend = previousConversionRate > 0 ? conversionRate - previousConversionRate : 0;

  // --- Process Response Time ---
  const recentResponseData = responseTimeData.data?.filter(r => new Date(r.created_at!) >= thirtyDaysAgo) || [];
  const previousResponseData = responseTimeData.data?.filter(r => new Date(r.created_at!) < thirtyDaysAgo) || [];
  const avgResponseHours = calculateAvgResponseTime(recentResponseData);
  const previousAvgResponseHours = calculateAvgResponseTime(previousResponseData);
  const responseTrend = previousAvgResponseHours > 0
    ? Math.round(((avgResponseHours - previousAvgResponseHours) / previousAvgResponseHours) * 100)
    : 0;

  return {
    census: currentCensus,
    censusTrend,
    conversionRate,
    conversionTrend,
    responseTime: avgResponseHours,
    responseTrend,
    activePartners: crmCounts.activePartners || 0,
    todayReferrals: referralCounts.todayReferrals || 0,
    pendingFollowUps: crmCounts.pendingFollowUps || 0,
    monthlyReferrals: referralCounts.monthlyReferrals || 0,
    monthlyTrend
  };
};
