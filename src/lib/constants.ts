export const REFERRAL_STATUSES = [
  { value: 'new_referral', label: 'New Referral', color: 'blue' },
  { value: 'contacted', label: 'Contacted', color: 'yellow' },
  { value: 'assessment_scheduled', label: 'Assessment Scheduled', color: 'orange' },
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'admitted', label: 'Admitted', color: 'green' },
  { value: 'palliative_outreach', label: 'Palliative Outreach', color: 'purple' },
  { value: 'not_appropriate', label: 'Not Appropriate', color: 'slate' },
  { value: 'declined', label: 'Declined', color: 'red' },
  { value: 'lost_to_followup', label: 'Lost to Follow-up', color: 'rose' },
  { value: 'closed', label: 'Closed', color: 'gray' },
] as const;

export const FOLLOWUP_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'as_needed', label: 'As Needed' },
] as const;

export const LOCATION_TYPES = [
  { value: 'PH', label: 'Private Home' },
  { value: 'GH', label: 'Group Home' },
  { value: 'ALF', label: 'Assisted Living' },
  { value: 'IL', label: 'Independent Living' },
  { value: 'SNF', label: 'Skilled Nursing' },
  { value: 'MC', label: 'Memory Care' },
  { value: 'Other', label: 'Other' },
] as const;

export type ReferralStatusValue = (typeof REFERRAL_STATUSES)[number]['value'];

export const getStatusLabel = (status: string): string => {
  return REFERRAL_STATUSES.find(s => s.value === status)?.label || status;
};

export const getStatusBadgeColor = (status: string): string => {
  const map: Record<string, string> = {
    new_referral: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    assessment_scheduled: 'bg-orange-100 text-orange-800',
    pending: 'bg-amber-100 text-amber-800',
    admitted: 'bg-green-100 text-green-800',
    palliative_outreach: 'bg-purple-100 text-purple-800',
    not_appropriate: 'bg-slate-100 text-slate-800',
    declined: 'bg-red-100 text-red-800',
    lost_to_followup: 'bg-rose-100 text-rose-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusSolidColor = (status: string): string => {
  const map: Record<string, string> = {
    new_referral: 'bg-blue-600 text-white border-blue-700',
    contacted: 'bg-yellow-600 text-white border-yellow-700',
    assessment_scheduled: 'bg-orange-600 text-white border-orange-700',
    pending: 'bg-amber-600 text-white border-amber-700',
    admitted: 'bg-green-600 text-white border-green-700',
    closed: 'bg-gray-600 text-white border-gray-700',
  };
  return map[status] || 'bg-gray-600 text-white border-gray-700';
};

export const getStatusProgress = (status: string): number => {
  const map: Record<string, number> = {
    new_referral: 15,
    contacted: 35,
    assessment_scheduled: 55,
    pending: 75,
    admitted: 100,
  };
  if (status === 'closed') return 0;
  return map[status] || 0;
};

export const getStatusProgressBarColor = (status: string): string => {
  const map: Record<string, string> = {
    new_referral: 'bg-blue-400',
    contacted: 'bg-yellow-400',
    assessment_scheduled: 'bg-orange-500',
    pending: 'bg-amber-500',
    admitted: 'bg-green-500',
  };
  if (status === 'closed') return 'bg-gray-400';
  return map[status] || 'bg-gray-400';
};

export const getNextStage = (status: string): string => {
  const map: Record<string, string> = {
    new_referral: 'Contacted',
    contacted: 'Assessment Scheduled',
    assessment_scheduled: 'Pending',
    pending: 'Admitted',
    admitted: 'Completed',
  };
  return map[status] || '';
};

/** Legacy status values mapped to current values */
export const LEGACY_STATUS_MAP: Record<string, ReferralStatusValue> = {
  in_progress: 'contacted',
  contact_attempted: 'contacted',
  information_gathering: 'contacted',
  assessment: 'assessment_scheduled',
  assessment_scheduled: 'assessment_scheduled',
  pending_admission: 'pending',
  not_admitted_patient_choice: 'closed',
  not_admitted_not_appropriate: 'closed',
  not_admitted_lost_contact: 'closed',
  deceased_prior_admission: 'closed',
};

export const normalizeStatus = (status: string): ReferralStatusValue => {
  if (REFERRAL_STATUSES.some(s => s.value === status)) return status as ReferralStatusValue;
  return (LEGACY_STATUS_MAP[status] as ReferralStatusValue) || 'new_referral';
};
