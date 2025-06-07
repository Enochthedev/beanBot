import { MintAttempt, MintStatus } from '@prisma/client';
import { prisma } from '@libs/prisma';
import { EventEmitter } from 'events';

export interface MintRequest {
  userId: string;
  projectId: string;
  walletAddress: string;
  amount: number;
  priority: 'premium' | 'basic';
}

export class MintQueue extends EventEmitter {
  private premiumQueue: MintRequest[] = [];
  private basicQueue: MintRequest[] = [];
  private processing: Map<string, MintRequest> = new Map();
  private concurrent = 0;
  constructor(private maxConcurrent: number) {
    super();
  }

  add(request: MintRequest) {
    const queue = request.priority === 'premium' ? this.premiumQueue : this.basicQueue;
    queue.push(request);
    this.emit('queued', request);
  }

  async processNext() {
    if (this.concurrent >= this.maxConcurrent) return;
    const request = this.premiumQueue.shift() || this.basicQueue.shift();
    if (!request) return;
    this.processing.set(request.userId, request);
    this.concurrent++;
    try {
      await prisma.mintAttempt.create({
        data: {
          userId: request.userId,
          projectId: request.projectId,
          walletAddress: request.walletAddress,
          amount: request.amount,
          status: MintStatus.PROCESSING
        }
      });
      // Placeholder: actual mint logic should be implemented here
      await new Promise(res => setTimeout(res, 100));
      // mark as confirmed
      await prisma.mintAttempt.updateMany({
        where: { userId: request.userId, projectId: request.projectId },
        data: { status: MintStatus.CONFIRMED }
      });
      this.emit('processed', request);
    } catch (err) {
      await prisma.mintAttempt.updateMany({
        where: { userId: request.userId, projectId: request.projectId },
        data: { status: MintStatus.FAILED, errorMessage: (err as Error).message }
      });
      this.emit('failed', request, err);
    } finally {
      this.processing.delete(request.userId);
      this.concurrent--;
    }
  }
}
