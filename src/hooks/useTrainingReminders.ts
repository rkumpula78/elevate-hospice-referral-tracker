import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingReminder {
  id: string;
  name: string;
  last_training_review: string | null;
  quarter: number; // current calendar quarter (1-4)
}

// Annual in-service training must be completed at least once per calendar year
// for each contracted organization. We remind every quarter until it's done for
// the current year — i.e. a contracted org shows here whenever its last training
// is missing or happened in a previous calendar year.
export const useTrainingReminders = () => {
  return useQuery({
    queryKey: ['training-reminders'],
    queryFn: async (): Promise<TrainingReminder[]> => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, last_training_review, contract_on_file')
        .eq('is_active', true)
        .eq('contract_on_file', true);
      if (error) throw error;

      const now = new Date();
      const currentYear = now.getFullYear();
      const quarter = Math.floor(now.getMonth() / 3) + 1;

      return (data || [])
        .filter((o: any) => {
          if (!o.last_training_review) return true;
          const year = new Date(o.last_training_review).getFullYear();
          return year < currentYear;
        })
        .map((o: any) => ({
          id: o.id,
          name: o.name,
          last_training_review: o.last_training_review,
          quarter,
        }));
    },
    refetchInterval: 5 * 60 * 1000,
  });
};
