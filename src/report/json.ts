/** Serialize a DocsReport as pretty JSON. */

import type { DocsReport } from "../types.js";

export function toJSON(report: DocsReport): string {
  return JSON.stringify(report, null, 2) + "\n";
}
