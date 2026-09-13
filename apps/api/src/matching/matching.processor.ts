import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MATCHING_QUEUE, MatchingJobPayload } from './matching.queue.constants';
import { MatchingService } from './matching.service';

/**
 * NestJS-owned BullMQ worker (the "Match Orchestrator"). Consumes matching
 * jobs and calls out to the FastAPI ML service for embeddings/scoring, then
 * writes results back via MatchingService. Python never consumes queue jobs
 * directly - it is a stateless scoring/embedding API called by this worker.
 */
@Processor(MATCHING_QUEUE)
export class MatchingProcessor extends WorkerHost {
  private readonly logger = new Logger('MatchingProcessor');

  constructor(private readonly matchingService: MatchingService) {
    super();
  }

  async process(job: Job<MatchingJobPayload>): Promise<void> {
    this.logger.log(`Processing ${job.name} job=${job.id}`);
    await this.matchingService.processItem(job.data);
  }
}
