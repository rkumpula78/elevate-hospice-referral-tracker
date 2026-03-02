import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getQueue, removeFromQueue } from '@/lib/offlineQueue';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function useOfflineSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncQueue = async () => {
      const queue = getQueue();
      if (queue.length === 0) return;

      let synced = 0;
      for (const item of queue) {
        try {
          if (item.table === 'activity_communications') {
            const { error } = await supabase
              .from('activity_communications')
              .insert(item.payload as any);
            if (error) throw error;
          }
          removeFromQueue(item.id);
          synced++;
        } catch (err) {
          console.error('Failed to sync queued item:', item.id, err);
        }
      }

      if (synced > 0) {
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        queryClient.invalidateQueries({ queryKey: ['activity_communications'] });
        toast({
          title: `Synced ${synced} pending update${synced > 1 ? 's' : ''}`,
          className: 'border-green-500',
        });
      }
    };

    window.addEventListener('online', syncQueue);
    // Also try on mount in case we came back online before hook mounted
    if (navigator.onLine) syncQueue();

    return () => window.removeEventListener('online', syncQueue);
  }, [toast, queryClient]);
}
