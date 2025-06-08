import { MintAttempt, MintStatus } from '@prisma/client';
import { prisma } from '@libs/prisma';
import { EventEmitter } from 'events';
import { network } from '@modules/network';
import { estimateGas, sendWithReplacement } from '@modules/tx';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import { config } from '@config/index';
import path from 'path';
import fs from 'fs';
import { client } from '@bot/client';

const LOG_PATH = path.resolve(process.cwd(), 'logs', 'mint-failures.log');
if (!fs.existsSync(path.dirname(LOG_PATH))) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
}
const logStream = fs.createWriteStream(LOG_PATH, { flags: 'a' });

const RECOVERABLE_CODES = new Set([
  'NETWORK_ERROR',
  'TIMEOUT',
  'SERVER_ERROR',
  'NONCE_EXPIRED',
  'REPLACEMENT_UNDERPRICED',
]);

export interface MintRequest {
  userId: string;
  projectId: string;
  walletAddress: string;
  amount: number;
  priority: 'premium' | 'basic';
  attempts?: number;
}

export class MintQueue extends EventEmitter {
  private premiumQueue: MintRequest[] = [];
  private basicQueue: MintRequest[] = [];
  private processing: Map<string, MintRequest> = new Map();
  private concurrent = 0;
  private timer?: NodeJS.Timeout;
  private maxRetries = parseInt(process.env.MINT_MAX_RETRIES ?? '2', 10);

  constructor(private maxConcurrent: number) {
    super();
  }

  get length() {
    return this.premiumQueue.length + this.basicQueue.length;
  }

  add(request: MintRequest) {
    if (this.length >= config.maxQueueSize) {
      if (this.listenerCount('error') > 0) {
        this.emit('error', new Error('Mint queue limit exceeded'));
      }
      return false;
    }
    const queue = request.priority === 'premium' ? this.premiumQueue : this.basicQueue;
    if (queue.length >= config.maxQueueSize) {
      if (this.listenerCount('error') > 0) {
        this.emit('error', new Error('Mint queue limit exceeded'));
      }
      return false;
    }
    queue.push({ ...request, attempts: request.attempts ?? 0 });
    this.emit('queued', request);
    if (!this.timer) this.start();
    return true;
  }

  private start() {
    this.timer = setInterval(() => this.processNext(), 1000);
  }

  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async processNext() {
    if (this.concurrent >= this.maxConcurrent) return;
    const request = this.premiumQueue.shift() || this.basicQueue.shift();
    if (!request) {
      this.stop();
      return;
    }
    
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
        gasMultiplier: config.gasMultiplier,
        privateTx: process.env.USE_FLASHBOTS === 'true'
      });

      await prisma.mintAttempt.updateMany({
        where: { userId: request.userId, projectId: request.projectId },
        data: { status: MintStatus.CONFIRMED, gasUsed: gas.gasLimit?.toString() }
      });

      this.emit('processed', request);
    } catch (err) {
      const code = (err as any)?.code ?? (err as any)?.error?.code;
      await prisma.mintAttempt.updateMany({
        where: { userId: request.userId, projectId: request.projectId },
        data: { status: MintStatus.FAILED, errorMessage: (err as Error).message }
      });

      request.attempts = (request.attempts ?? 0) + 1;
      const shouldRetry = RECOVERABLE_CODES.has(code);

      if (shouldRetry && request.attempts <= this.maxRetries) {
        const delay = Math.pow(2, request.attempts - 1) * 5000;
        setTimeout(() => this.add(request), delay);
      } else {
        logStream.write(
          `${new Date().toISOString()}|user:${request.userId}|project:${request.projectId}|error:${(err as Error).message}\n`
        );
        try {
          const user = await client.users.fetch(request.userId);
          await user.send(
            `❌ Your mint for project ${request.projectId} failed after ${request.attempts} attempts.`
          );
        } catch {
          // ignore DM failures
        }
        this.emit('failed', request, err);
      }
    } finally {
      this.processing.delete(request.userId);
      this.concurrent--;
      setImmediate(() => this.processNext());
    }
  }
}

export const globalMintQueue = new MintQueue(config.maxConcurrentMints);
