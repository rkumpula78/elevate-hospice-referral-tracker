import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget webhook notification for new referrals.
 * Never blocks the UI or throws errors to the user.
 */
export function notifyNewReferral(referralId: string): void {
  fireWebhook({ event: 'new_referral', referral_id: referralId });
}

/**
 * Fire-and-forget webhook notification for referral status changes.
 * Only call when oldStatus !== newStatus.
 */
export function notifyStatusChange(
  referralId: string,
  oldStatus: string,
  newStatus: string
): void {
  fireWebhook({
    event: 'status_change',
    referral_id: referralId,
    old_status: oldStatus,
    new_status: newStatus,
  });
}

function fireWebhook(payload: Record<string, string>): void {
  // Fire-and-forget — no await, no error surfacing
  supabase.functions
    .invoke('notify-webhook', { body: payload })
    .then(({ error }) => {
      if (error) {
        console.warn('[webhook] notification failed silently:', error.message);
      }
    })
    .catch((err) => {
      console.warn('[webhook] notification failed silently:', err);
    });
}
