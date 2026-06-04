/**
 * Links & references — leverages the `linklint` engine, which already builds a
 * cross-file project graph and finds broken relative links, dead `#anchors`,
 * missing images, undefined references and **orphan pages** (nothing links to
 * them). docsanity runs it once over the whole set and folds its findings into
 * the unified per-page report, keyed by each page's root-relative path.
 */

import { relative } from "node:path";
import {
  analyze as linklintAnalyze,
  buildProjectFromInputs,
  DEFAULT_CONFIG as LINKLINT_DEFAULTS,
  findOrphans,
  type Issue,
} from "@didrod2539/linklint";
import type { Finding, Severity } from "./types.js";
import type { Page } from "./page.js";

function mapSeverity(s: Issue["severity"]): Severity {
  return s === "error" || s === "warning" || s === "info" ? s : "warning";
}

/** Run linklint over all pages; return findings keyed by root-relative path. */
export function linkFindings(root: string, pages: Page[]): Map<string, Finding[]> {
  const inputs = pages.map((p) => ({ path: p.absPath, content: p.content }));
  const project = buildProjectFromInputs(root, inputs);
  const report = linklintAnalyze(project, LINKLINT_DEFAULTS);

  // linklint reports document paths relative to the project root.
  const byPath = new Map<string, Finding[]>();
  for (const doc of report.documents) {
    byPath.set(
      doc.path,
      doc.issues.map((i) => ({
        dimension: "links" as const,
        rule: `links.${i.rule}`,
        severity: mapSeverity(i.severity),
        message: i.message,
        line: i.line,
        detail: i.detail,
        fix: i.fix,
      })),
    );
  }

  // Orphan detection (off by default in linklint's config) — run it explicitly.
  for (const abs of findOrphans(project)) {
    const rel = relative(root, abs) || abs;
    const list = byPath.get(rel) ?? [];
    list.push({
      dimension: "links",
      rule: "links.orphan-document",
      severity: "warning",
      message: "Orphan page — nothing links here",
      fix: "Link to it from an index/README, or remove it if it's obsolete.",
    });
    byPath.set(rel, list);
  }

  return byPath;
}
