import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { MATCHING_QUEUE, MatchingJobPayload, matchingJobId } from './matching.queue.constants';

@Injectable()
export class MatchingProducer {
  constructor(@InjectQueue(MATCHING_QUEUE) private readonly queue: Queue) {}

  /**
   * Enqueues background matching work for a newly created or edited item.
   * Called synchronously from the request path but only does an in-memory
   * enqueue - actual ML work happens asynchronously in the worker, so item
   * creation never blocks on embeddings/matching.
   */
  async enqueueItemForMatching(
    payload: MatchingJobPayload,
    options?: { forceUnique?: boolean },
  ) {
    const jobId = options?.forceUnique
      ? `${matchingJobId(payload)}:image:${randomUUID()}`
      : matchingJobId(payload);

    await this.queue.add('match-item', payload, {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }
}
