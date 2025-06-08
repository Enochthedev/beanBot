import { blockStreamer } from '@modules/network';
import { analyzeContract } from './contract-analyzer';
import { scoreMintProject } from './scoring';
import { prisma } from '@libs/prisma';
import { network } from '@modules/network';
import { EventEmitter } from 'events';

export const detectionEvents = new EventEmitter();

const SCORE_THRESHOLD = parseFloat(process.env.DETECTION_SCORE_THRESHOLD ?? '1');

export function startDetectionWatcher() {
  blockStreamer.on('block', async (blockNumber: number) => {
    const projects = await prisma.mintProject.findMany({ where: { isActive: true } });
    for (const project of projects) {
      const analysis = await analyzeContract(project.contractAddress, network.getProvider());
      if (!analysis) continue;
      const { score } = scoreMintProject(project);
      if (score >= SCORE_THRESHOLD) {
        detectionEvents.emit('opportunity', { project, score, blockNumber });
        console.log(`Detection: project ${project.name} scored ${score}`);
      }
    }
  });
}
