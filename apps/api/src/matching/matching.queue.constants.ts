export const MATCHING_QUEUE = 'item-matching';

export interface MatchingJobPayload {
  itemType: 'LOST' | 'FOUND';
  itemId: string;
  itemRevision: number;
  universityId: string;
}

/**
 * Deterministic job id so BullMQ treats re-queues of the same item+revision as
 * the same job (idempotency at the queue layer, on top of the DB-level
 * unique constraint on ItemMatch).
 */
export function matchingJobId(payload: MatchingJobPayload): string {
  return `match:${payload.itemType}:${payload.itemId}:rev${payload.itemRevision}`;
}
