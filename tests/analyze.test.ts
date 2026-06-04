import { describe, expect, it } from "vitest";
import { analyzeDocs } from "../src/analyze.js";
import { loadDocs } from "../src/loader.js";
import { DEFAULT_CONFIG } from "../src/config.js";

const META = { version: "test", generatedAt: "2026-06-04T00:00:00Z" };

function scanExamples() {
  const { root, docs } = loadDocs(["examples/docs"], DEFAULT_CONFIG);
  return analyzeDocs(root, docs, DEFAULT_CONFIG, META);
}

function findingsFor(report: ReturnType<typeof scanExamples>, path: string) {
  return new Set((report.pages.find((p) => p.path === path)?.findings ?? []).map((f) => f.rule));
}

describe("analyzeDocs (integration over examples/docs)", () => {
  const report = scanExamples();

  it("scans all example pages", () => {
    expect(report.pages.length).toBe(5);
    expect(report.tool).toBe("docsanity");
  });

  it("finds broken links, images and dead anchors via the links dimension", () => {
    const rules = findingsFor(report, "broken.md");
    expect(rules.has("links.broken-file-link")).toBe(true);
    expect(rules.has("links.broken-cross-anchor")).toBe(true);
  });

  it("detects orphan pages (whole-graph view)", () => {
    expect(findingsFor(report, "orphan.md").has("links.orphan-document")).toBe(true);
  });

  it("detects site-wide duplicate titles & descriptions", () => {
    const rules = findingsFor(report, "orphan.md");
    expect(rules.has("seo.duplicate-title")).toBe(true);
    expect(rules.has("seo.duplicate-description")).toBe(true);
  });

  it("flags hard-to-read prose", () => {
    expect(findingsFor(report, "dense.md").has("readability.too-hard")).toBe(true);
  });

  it("flags structure problems (skipped heading, image alt, code language)", () => {
    const rules = findingsFor(report, "broken.md");
    expect(rules.has("structure.skipped-heading")).toBe(true);
    expect(rules.has("structure.image-alt")).toBe(true);
  });

  it("rolls findings into a combined score and per-dimension summary", () => {
    expect(report.summary.score).toBeGreaterThan(0);
    expect(report.summary.score).toBeLessThan(100);
    expect(report.summary.byDimension.links.errors).toBeGreaterThan(0);
  });

  it("a clean page scores 100 with no findings", () => {
    const clean = report.pages.find((p) => p.path === "getting-started.md");
    expect(clean?.score).toBe(100);
    expect(clean?.findings).toHaveLength(0);
  });

  it("respects disabled dimensions", () => {
    const { root, docs } = loadDocs(["examples/docs"], DEFAULT_CONFIG);
    const noLinks = analyzeDocs(root, docs, { ...DEFAULT_CONFIG, disable: ["links"] }, META);
    const all = noLinks.pages.flatMap((p) => p.findings);
    expect(all.some((f) => f.dimension === "links")).toBe(false);
  });
});
