import { supabase } from '@/integrations/supabase/client';

const PHI_REDACTED_FIELDS = ['ssn', 'patient_ssn'];

type ChangeEntry = { old: unknown; new: unknown };

export function computeChanges(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>
): Record<string, ChangeEntry> | null {
  if (!oldData) return null;

  const changes: Record<string, ChangeEntry> = {};

  for (const key of Object.keys(newData)) {
    const oldVal = oldData[key];
    const newVal = newData[key];

    // Skip if values are the same (simple JSON comparison)
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

    if (PHI_REDACTED_FIELDS.includes(key)) {
      changes[key] = { old: '[redacted]', new: '[redacted]' };
    } else {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

export async function logAuditEvent({
  action,
  tableName,
  recordId,
  changes,
}: {
  action: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  changes?: Record<string, ChangeEntry> | null;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('admin_audit_log').insert({
      admin_user_id: user?.id ?? null,
      action: `${action}:${tableName}`,
      target_user_id: null,
      details: {
        table_name: tableName,
        record_id: recordId,
        changes: changes ?? null,
      },
    });
  } catch (err) {
    // Audit logging should never block the main operation
    console.error('Audit log error:', (err as Error).message);
  }
}
