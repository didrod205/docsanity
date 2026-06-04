/**
 * docsanity — one command for docs-site health. It unifies four dimensions over
 * a single page graph:
 *   • Links & references (broken links, dead anchors, orphan pages) — via linklint
 *   • SEO & frontmatter (completeness + site-wide duplicate title/description)
 *   • Readability (per-page reading grade) — via readlevel
 *   • Structure & a11y (single H1, heading order, image alt, code languages)
 *
 * ```ts
 * import { analyzeDocs } from "docsanity";
 * const report = analyzeDocs(root, inputs, config, { version, generatedAt });
 * ```
 */

export { analyzeDocs, type AnalyzeMeta, type InputDoc } from "./analyze.js";
export { parsePage, type Page } from "./page.js";
export { parseFrontmatter, asString, type Frontmatter } from "./frontmatter.js";
export { parseMarkdown, type MarkdownModel, type Heading } from "./markdown.js";
export { buildDuplicateIndex, seoChecks, pageTitle } from "./checks/seo.js";
export { structureChecks } from "./checks/structure.js";
export { readabilityCheck } from "./checks/readability.js";
export { linkFindings } from "./links.js";
export { scorePage, gradeFor } from "./score.js";
export {
  DEFAULT_CONFIG,
  CONFIG_FILENAMES,
  parseConfig,
  mergeConfig,
  isDimensionEnabled,
} from "./config.js";
export {
  DIMENSIONS,
  DIMENSION_LABELS,
  type Config,
  type Dimension,
  type DocsReport,
  type Finding,
  type PageReport,
  type ReadabilitySummary,
  type Severity,
} from "./types.js";
