/**
 * Returns the number of follow-up days based on an organization's account rating.
 * A → 3 days, B → 7 days, C → 14 days, D → 21 days, default → 7.
 */
export const getFollowUpDays = (rating: string | null | undefined): number => {
  const mapping: Record<string, number> = {
    A: 3,
    B: 7,
    C: 14,
    D: 21,
  };
  return mapping[rating || ''] || 7;
};
