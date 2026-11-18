import { FieldValue, getFirestore } from 'firebase-admin/firestore';

export const NOMINATIM_OUTBOUND_INTERVAL_MS = 1000;
const NOMINATIM_OUTBOUND_DOC = 'system/nominatimOutbound';

export type PlannedNominatimSlot = {
  executeAtMs: number;
  nextStoredSlotAtMs: number;
};

/** Pure slot planner used for tests and transactional reservations. */
export function planNominatimOutboundSlot(
  nowMs: number,
  storedNextSlotAtMs: number | undefined,
  intervalMs = NOMINATIM_OUTBOUND_INTERVAL_MS,
): PlannedNominatimSlot {
  const executeAtMs = Math.max(nowMs, storedNextSlotAtMs ?? 0);
  return {
    executeAtMs,
    nextStoredSlotAtMs: executeAtMs + intervalMs,
  };
}

function sleepMs(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function reserveNominatimOutboundSlot(): Promise<void> {
  const db = getFirestore();
  const ref = db.doc(NOMINATIM_OUTBOUND_DOC);
  const now = Date.now();

  const executeAtMs = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const stored =
      typeof snapshot.data()?.nextSlotAtMs === 'number'
        ? (snapshot.data()?.nextSlotAtMs as number)
        : undefined;
    const plan = planNominatimOutboundSlot(now, stored);
    transaction.set(
      ref,
      {
        nextSlotAtMs: plan.nextStoredSlotAtMs,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return plan.executeAtMs;
  });

  await sleepMs(executeAtMs - Date.now());
}