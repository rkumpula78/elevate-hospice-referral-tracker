const QUEUE_KEY = 'elevate-offline-queue';

export interface QueuedAction {
  id: string;
  table: string;
  payload: Record<string, unknown>;
  timestamp: string;
  type: 'insert';
}

export function addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp'>): void {
  const queue = getQueue();
  queue.push({
    ...action,
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
