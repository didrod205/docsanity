/**
 * Structure & accessibility checks on Markdown — the docs-relevant subset of an
 * HTML a11y linter: a single H1, no skipped heading levels, images with alt
 * text, and fenced code blocks that declare a language (for correct syntax
 * highlighting and screen-reader hints).
 */

import type { Config, Finding } from "../types.js";
import type { Page } from "../page.js";

export function structureChecks(page: Page, _config: Config): Finding[] {
  const out: Finding[] = [];
  const { headings, images, fences } = page.md;

  // Single H1.
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) {
    out.push({
      dimension: "structure",
      rule: "structure.no-h1",
      severity: "warning",
      message: "No H1 heading",
      fix: "Start the page with a single `# Title`.",
    });
  } else if (h1s.length > 1) {
    out.push({
      dimension: "structure",
      rule: "structure.multiple-h1",
      severity: "warning",
      message: `${h1s.length} H1 headings (use exactly one)`,
      line: h1s[1]!.line,
      fix: "Demote the extra H1s to H2/H3 so the outline has one top level.",
    });
  }

  // No skipped heading levels (e.g. H2 → H4).
  let prev = 0;
  for (const h of headings) {
    if (prev !== 0 && h.level > prev + 1) {
      out.push({
        dimension: "structure",
        rule: "structure.skipped-heading",
        severity: "warning",
        message: `Heading jumps from H${prev} to H${h.level} ("${h.text}")`,
        line: h.line,
        fix: "Don't skip levels — screen readers and outlines rely on order.",
      });
    }
    prev = h.level;
  }

  // Images need alt text.
  for (const img of images) {
    if (img.alt.trim() === "") {
      out.push({
        dimension: "structure",
        rule: "structure.image-alt",
        severity: "warning",
        message: `Image has no alt text: ${img.src}`,
        line: img.line,
        fix: "Add descriptive alt text: `![what it shows](src)`.",
      });
    }
  }

  // Code fences should declare a language.
  for (const fence of fences) {
    if (fence.lang === null) {
      out.push({
        dimension: "structure",
        rule: "structure.code-language",
        severity: "info",
        message: "Code block has no language tag",
        line: fence.line,
        fix: "Add a language after the opening fence (e.g. ```ts) for highlighting.",
      });
    }
  }

  return out;
}
