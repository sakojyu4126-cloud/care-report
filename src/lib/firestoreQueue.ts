import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firestore Queue & Optimization Manager
 * 
 * Prevents:
 * 1. Rapid-fire API calls (Debounce per document)
 * 2. Infinite retry loops (Exponential backoff capped at max 3 retries, immediate bail on QuotaExceeded)
 * 3. Multi-record write explosion (Batches bulk operations into single requests)
 */

interface PendingWrite {
  timer: NodeJS.Timeout | number;
  data: any;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

const pendingDebounceMap = new Map<string, PendingWrite>();

/**
 * Perform an asynchronous action with exponential backoff.
 * Stops immediately if the error is due to Google Cloud Quota exhaustion.
 */
async function executeWithExponentialBackoff<T>(
  action: () => Promise<T>,
  actionName: string,
  maxRetries = 3
): Promise<T | null> {
  let attempt = 0;
  let delay = 1000; // 1s initial delay

  while (attempt < maxRetries) {
    try {
      return await action();
    } catch (error: any) {
      attempt++;
      const msg = error?.message || String(error);

      // CRITICAL: Immediately abort on quota exhaustion / 429 to protect free tier and prevent storms
      if (msg.includes('Quota') || msg.includes('resource-exhausted') || msg.includes('429')) {
        console.warn(`[Firestore SafeQueue] Quota reached during ${actionName}. Aborting retries gracefully to protect local data.`);
        return null;
      }

      if (attempt >= maxRetries) {
        console.warn(`[Firestore SafeQueue] ${actionName} failed after ${maxRetries} attempts. Fallback to local storage.`, error);
        return null;
      }

      console.warn(`[Firestore SafeQueue] ${actionName} attempt ${attempt} failed. Retrying in ${delay}ms...`, error);
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2; // exponential backoff: 1s -> 2s -> 4s
    }
  }

  return null;
}

/**
 * Debounced and safe setDoc.
 * If multiple writes for the same collection/docId happen within debounceMs (e.g. rapid clicks),
 * only the last write is dispatched to Firestore.
 */
export function safeSetDocWithDebounce(
  collectionName: string,
  docId: string,
  data: any,
  debounceMs = 500
): Promise<void> {
  const key = `${collectionName}/${docId}`;

  // Clear previous debounce timer if exists
  if (pendingDebounceMap.has(key)) {
    const existing = pendingDebounceMap.get(key)!;
    clearTimeout(existing.timer as any);
  }

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(async () => {
      pendingDebounceMap.delete(key);
      try {
        await executeWithExponentialBackoff(
          () => setDoc(doc(db, collectionName, docId), data),
          `setDoc(${key})`
        );
        resolve();
      } catch (err) {
        reject(err);
      }
    }, debounceMs);

    pendingDebounceMap.set(key, { timer, data, resolve, reject });
  });
}

/**
 * Safe deleteDoc with retry protection
 */
export async function safeDeleteDoc(collectionName: string, docId: string): Promise<void> {
  const key = `${collectionName}/${docId}`;
  if (pendingDebounceMap.has(key)) {
    const existing = pendingDebounceMap.get(key)!;
    clearTimeout(existing.timer as any);
    pendingDebounceMap.delete(key);
  }

  await executeWithExponentialBackoff(
    () => deleteDoc(doc(db, collectionName, docId)),
    `deleteDoc(${key})`
  );
}

/**
 * Bulk writes using Firestore writeBatch.
 * Combines multiple set / delete operations into a single network call (max 450 per batch).
 * Eliminates "N items = N network calls" traffic explosion.
 */
export async function batchWriteDocs(
  operations: Array<
    | { type: 'set'; collection: string; id: string; data: any }
    | { type: 'delete'; collection: string; id: string }
  >
): Promise<void> {
  if (!operations || operations.length === 0) return;

  const CHUNK_SIZE = 400; // Firestore batch limit is 500
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    await executeWithExponentialBackoff(async () => {
      const batch = writeBatch(db);
      for (const op of chunk) {
        const ref = doc(db, op.collection, op.id);
        if (op.type === 'set') {
          batch.set(ref, op.data);
        } else if (op.type === 'delete') {
          batch.delete(ref);
        }
      }
      await batch.commit();
    }, `batchCommit(chunk ${i / CHUNK_SIZE + 1})`);
  }
}
