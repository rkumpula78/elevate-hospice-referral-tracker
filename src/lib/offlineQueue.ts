/**
 * HIPAA WARNING: localStorage is NOT encrypted. Never store PHI
 * (patient names, SSNs, diagnoses, etc.) in the offline queue.
 * All sensitive fields are stripped before storage and re-fetched
 * from the server on sync.
 */

const QUEUE_KEY = 'elevate-offline-queue';

/** Fields that must never be persisted to localStorage */
const PHI_FIELDS = [
  'ssn', 'patient_ssn', 'medicare_number', 'medicaid_number',
  'date_of_birth', 'diagnosis', 'primary_diagnosis',
  'patient_address', 'address', 'phone', 'patient_phone',
  'emergency_contact', 'emergency_phone', 'caregiver_contact',
  'contact_phone', 'contact_email',
];

const REDACTED = '[stored-server-side]';

export interface QueuedAction {
  id: string;
  table: string;
  payload: Record<string, unknown>;
  /** Original field names that were redacted before storage */
  redactedFields?: string[];
  timestamp: string;
  type: 'insert';
}

function sanitizeForStorage(payload: Record<string, unknown>): {
  sanitized: Record<string, unknown>;
  redactedFields: string[];
} {
  const sanitized = { ...payload };
  const redactedFields: string[] = [];

  for (const key of PHI_FIELDS) {
    if (key in sanitized && sanitized[key] != null && sanitized[key] !== '') {
      sanitized[key] = REDACTED;
      redactedFields.push(key);
    }
  }

  return { sanitized, redactedFields };
}

export function addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'redactedFields'>): void {
  const { sanitized, redactedFields } = sanitizeForStorage(action.payload);
  const queue = getQueue();
  queue.push({
    ...action,
    payload: sanitized,
    redactedFields,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event('offline-queue-changed'));
}

export function getQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event('offline-queue-changed'));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
  window.dispatchEvent(new Event('offline-queue-changed'));
}

export function getQueueLength(): number {
  return getQueue().length;
}
