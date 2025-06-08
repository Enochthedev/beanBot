import { MintProject } from '@prisma/client';

export interface OpportunityScore {
  score: number;
  reasons: string[];
}

/**
 * Score a mint opportunity based on basic heuristics.
 * Higher score indicates a better opportunity.
 */
export function scoreMintProject(project: MintProject): OpportunityScore {
  const reasons: string[] = [];
  let score = 0;

  const price = BigInt(project.mintPrice);
  if (price < 1_000_000_000_000_000_00n) {
    score += 1;
    reasons.push('Low mint price');
  }
  if (project.requiresWhitelist) {
    score -= 1;
    reasons.push('Whitelist required');
  }
  const remaining = project.maxSupply - project.currentSupply;
  if (remaining < project.maxSupply / 10) {
    score += 1;
    reasons.push('Limited supply remaining');
  }

  return { score, reasons };
}
