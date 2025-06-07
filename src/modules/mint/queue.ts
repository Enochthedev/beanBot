import { MintStatus } from '@prisma/client';
import { prisma } from '@libs/prisma';
import { EventEmitter } from 'events';
import { network } from '@modules/network';
import { estimateGas, sendWithReplacement } from '@modules/tx';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';

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

      const project = await prisma.mintProject.findUnique({ where: { id: request.projectId } });
      if (!project) throw new Error('Project not found');
      const provider: JsonRpcProvider = network.getProvider();
      const wallet = new Wallet(process.env.PRIVATE_KEY ?? '', provider);
      const abi = ["function " + project.mintFunction];
      const contract = new Contract(project.contractAddress, abi, provider);

      const gas = await estimateGas({
        to: project.contractAddress,
        data: contract.interface.encodeFunctionData(project.mintFunction.split('(')[0], [request.amount])
      }, provider);

      await sendWithReplacement(wallet, contract, project.mintFunction.split('(')[0], [request.amount], {
        gasMultiplier: 1.1
      });

      await prisma.mintAttempt.updateMany({
        where: { userId: request.userId, projectId: request.projectId },
        data: { status: MintStatus.CONFIRMED, gasUsed: gas.gasLimit?.toString() }
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
