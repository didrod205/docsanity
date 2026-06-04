/** Core types for docsanity. */

export type Severity = "error" | "warning" | "info" | "pass";

/** The four health dimensions docsanity unifies into one report. */
export type Dimension = "links" | "seo" | "readability" | "structure";

export const DIMENSIONS: Dimension[] = ["links", "seo", "readability", "structure"];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  links: "Links & references",
  seo: "SEO & frontmatter",
  readability: "Readability",
  structure: "Structure & a11y",
};

export interface Finding {
  dimension: Dimension;
  /** Stable id, e.g. "seo.missing-description". */
  rule: string;
  severity: Severity;
  message: string;
  /** 1-based line number, when known. */
  line?: number;
  detail?: string;
  fix?: string;
}

export interface ReadabilitySummary {
  grade: number;
  gradeLabel: string;
  ease: string;
  words: number;
  readingTimeSeconds: number;
}

export interface PageReport {
  /** Path relative to the scanned root. */
  path: string;
  title: string | null;
  score: number;
  grade: string;
  counts: { error: number; warning: number; info: number };
  findings: Finding[];
  readability?: ReadabilitySummary;
}

export interface DocsReport {
  tool: "docsanity";
  version: string;
  generatedAt: string;
  root: string;
  summary: {
    pages: number;
    score: number;
    grade: string;
    errors: number;
    warnings: number;
    infos: number;
    byDimension: Record<Dimension, { errors: number; warnings: number; infos: number }>;
  };
  pages: PageReport[];
}

export interface Config {
  /** File extensions to scan. */
  extensions: string[];
  /** Frontmatter keys every page must have (non-empty). */
  requireFrontmatter: string[];
  /** Recommended meta-description length window. */
  descriptionMin: number;
  descriptionMax: number;
  /** Warn when a title is longer than this (characters). */
  titleMax: number;
  /** Warn when a page's reading grade exceeds this. */
  maxGrade: number;
  /** Minimum word count before readability is scored. */
  minWordsForReadability: number;
  /** Dimensions to skip entirely. */
  disable: Dimension[];
  /** Rule ids to ignore (e.g. "structure.code-language"). */
  ignore: string[];
  /** CI gate: overall score floor. */
  minScore: number;
}
