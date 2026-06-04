/** Weighted scoring: turn findings into a 0–100 score and an A–F grade. */

import type { Finding } from "./types.js";

const PENALTY: Record<string, number> = { error: 12, warning: 4, info: 1, pass: 0 };

/** Page score: 100 minus capped, weighted penalties for its findings. */
export function scorePage(findings: Finding[]): number {
  let penalty = 0;
  for (const f of findings) penalty += PENALTY[f.severity] ?? 0;
  return Math.max(0, 100 - penalty);
}

export function gradeFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
