/**
 * SEO & frontmatter checks. Beyond per-page frontmatter completeness, this
 * includes the **site-wide** checks no single-file linter can do: duplicate
 * titles and duplicate meta descriptions across the whole docs set (both hurt
 * search ranking). That cross-page view is the point of a suite.
 */

import { asString } from "../frontmatter.js";
import type { Config, Finding } from "../types.js";
import type { Page } from "../page.js";

export interface DuplicateIndex {
  titles: Map<string, string[]>;
  descriptions: Map<string, string[]>;
}

/** Resolve a page's effective title: explicit frontmatter, else the first H1. */
export function pageTitle(page: Page): { value: string; source: "frontmatter" | "h1" | null } {
  const fm = asString(page.frontmatter.data["title"]);
  if (fm) return { value: fm, source: "frontmatter" };
  const h1 = page.md.headings.find((h) => h.level === 1);
  if (h1) return { value: h1.text, source: "h1" };
  return { value: "", source: null };
}

function description(page: Page): string {
  return asString(page.frontmatter.data["description"]);
}

/** Build the cross-page duplicate index (value → list of page paths). */
export function buildDuplicateIndex(pages: Page[]): DuplicateIndex {
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  for (const page of pages) {
    const t = pageTitle(page).value.trim().toLowerCase();
    if (t) titles.set(t, [...(titles.get(t) ?? []), page.relPath]);
    const d = description(page).trim().toLowerCase();
    if (d) descriptions.set(d, [...(descriptions.get(d) ?? []), page.relPath]);
  }
  return { titles, descriptions };
}

export function seoChecks(page: Page, config: Config, dup: DuplicateIndex): Finding[] {
  const out: Finding[] = [];
  const required = new Set(config.requireFrontmatter);
  const title = pageTitle(page);
  const desc = description(page);

  // Title.
  if (required.has("title")) {
    if (!title.value) {
      out.push({
        dimension: "seo",
        rule: "seo.missing-title",
        severity: "error",
        message: "Page has no title (no frontmatter `title` and no H1)",
        fix: "Add a `title:` to the frontmatter or an `# H1` heading.",
      });
    } else if (title.source === "h1") {
      out.push({
        dimension: "seo",
        rule: "seo.frontmatter-title",
        severity: "info",
        message: "Title comes from the H1; add an explicit frontmatter `title` for SEO control",
        detail: `Using H1: "${title.value}"`,
      });
    }
    if (title.value && title.value.length > config.titleMax) {
      out.push({
        dimension: "seo",
        rule: "seo.title-too-long",
        severity: "warning",
        message: `Title is ${title.value.length} chars (recommended ≤ ${config.titleMax})`,
        fix: "Shorten the title so it isn't truncated in search results.",
      });
    }
  }

  // Description.
  if (required.has("description")) {
    if (!desc) {
      out.push({
        dimension: "seo",
        rule: "seo.missing-description",
        severity: "warning",
        message: "No frontmatter `description`",
        fix: `Add a ${config.descriptionMin}–${config.descriptionMax} char description for the search snippet.`,
      });
    } else if (desc.length < config.descriptionMin) {
      out.push({
        dimension: "seo",
        rule: "seo.description-short",
        severity: "warning",
        message: `Description is ${desc.length} chars (recommended ≥ ${config.descriptionMin})`,
      });
    } else if (desc.length > config.descriptionMax) {
      out.push({
        dimension: "seo",
        rule: "seo.description-long",
        severity: "warning",
        message: `Description is ${desc.length} chars (recommended ≤ ${config.descriptionMax})`,
        fix: "Trim it so search engines don't truncate the snippet.",
      });
    }
  }

  // Other required keys.
  for (const key of config.requireFrontmatter) {
    if (key === "title" || key === "description") continue;
    if (!asString(page.frontmatter.data[key])) {
      out.push({
        dimension: "seo",
        rule: `seo.missing-frontmatter`,
        severity: "warning",
        message: `Missing required frontmatter: \`${key}\``,
      });
    }
  }

  // Site-wide duplicates.
  const tKey = title.value.trim().toLowerCase();
  const others = (dup.titles.get(tKey) ?? []).filter((p) => p !== page.relPath);
  if (tKey && others.length) {
    out.push({
      dimension: "seo",
      rule: "seo.duplicate-title",
      severity: "warning",
      message: `Duplicate title — also used by ${others.length} other page(s)`,
      detail: others.slice(0, 3).join(", "),
      fix: "Give each page a unique title; duplicates compete in search results.",
    });
  }
  const dKey = desc.trim().toLowerCase();
  const dOthers = (dup.descriptions.get(dKey) ?? []).filter((p) => p !== page.relPath);
  if (dKey && dOthers.length) {
    out.push({
      dimension: "seo",
      rule: "seo.duplicate-description",
      severity: "warning",
      message: `Duplicate description — also used by ${dOthers.length} other page(s)`,
      detail: dOthers.slice(0, 3).join(", "),
      fix: "Write a unique description per page.",
    });
  }

  return out;
}
