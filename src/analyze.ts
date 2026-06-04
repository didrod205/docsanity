/**
 * The orchestrator: parse every page once, run all four dimensions over the
 * shared page set (so site-wide checks like duplicate titles and orphan pages
 * work), and fold everything into one unified report with a combined score.
 */

import { readabilityCheck } from "./checks/readability.js";
import { buildDuplicateIndex, pageTitle, seoChecks } from "./checks/seo.js";
import { structureChecks } from "./checks/structure.js";
import { isDimensionEnabled } from "./config.js";
import { linkFindings } from "./links.js";
import { parsePage, type Page } from "./page.js";
import { gradeFor, scorePage } from "./score.js";
import {
  DIMENSIONS,
  type Config,
  type Dimension,
  type DocsReport,
  type Finding,
  type PageReport,
  type ReadabilitySummary,
} from "./types.js";

export interface InputDoc {
  absPath: string;
  relPath: string;
  content: string;
}

export interface AnalyzeMeta {
  version: string;
  generatedAt: string;
}

/** Analyze a set of documentation pages into a unified {@link DocsReport}. */
export function analyzeDocs(
  root: string,
  inputs: InputDoc[],
  config: Config,
  meta: AnalyzeMeta,
): DocsReport {
  const pages: Page[] = inputs.map((i) => parsePage(i.absPath, i.relPath, i.content));
  const ignore = new Set(config.ignore);

  // Cross-page indexes / engines (computed once over the whole set).
  const dup = buildDuplicateIndex(pages);
  const links = isDimensionEnabled(config, "links")
    ? linkFindings(root, pages)
    : new Map<string, Finding[]>();

  const pageReports: PageReport[] = pages.map((page) => {
    const findings: Finding[] = [];
    let readability: ReadabilitySummary | undefined;

    if (isDimensionEnabled(config, "links")) {
      findings.push(...(links.get(page.relPath) ?? []));
    }
    if (isDimensionEnabled(config, "seo")) {
      findings.push(...seoChecks(page, config, dup));
    }
    if (isDimensionEnabled(config, "structure")) {
      findings.push(...structureChecks(page, config));
    }
    if (isDimensionEnabled(config, "readability")) {
      const r = readabilityCheck(page, config);
      findings.push(...r.findings);
      readability = r.summary;
    }

    const kept = findings.filter((f) => !ignore.has(f.rule));
    const counts = { error: 0, warning: 0, info: 0 };
    for (const f of kept) {
      if (f.severity === "error") counts.error++;
      else if (f.severity === "warning") counts.warning++;
      else if (f.severity === "info") counts.info++;
    }
    const score = scorePage(kept);

    return {
      path: page.relPath,
      title: pageTitle(page).value || null,
      score,
      grade: gradeFor(score),
      counts,
      findings: kept,
      readability,
    };
  });

  pageReports.sort((a, b) => a.path.localeCompare(b.path));

  // Summary.
  const errors = pageReports.reduce((s, p) => s + p.counts.error, 0);
  const warnings = pageReports.reduce((s, p) => s + p.counts.warning, 0);
  const infos = pageReports.reduce((s, p) => s + p.counts.info, 0);
  const score = pageReports.length
    ? Math.round(pageReports.reduce((s, p) => s + p.score, 0) / pageReports.length)
    : 100;

  const byDimension = Object.fromEntries(
    DIMENSIONS.map((d) => [d, { errors: 0, warnings: 0, infos: 0 }]),
  ) as Record<Dimension, { errors: number; warnings: number; infos: number }>;
  for (const p of pageReports) {
    for (const f of p.findings) {
      const bucket = byDimension[f.dimension];
      if (f.severity === "error") bucket.errors++;
      else if (f.severity === "warning") bucket.warnings++;
      else if (f.severity === "info") bucket.infos++;
    }
  }

  return {
    tool: "docsanity",
    version: meta.version,
    generatedAt: meta.generatedAt,
    root,
    summary: { pages: pageReports.length, score, grade: gradeFor(score), errors, warnings, infos, byDimension },
    pages: pageReports,
  };
}
