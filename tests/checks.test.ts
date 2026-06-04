import { describe, expect, it } from "vitest";
import { parsePage } from "../src/page.js";
import { buildDuplicateIndex, seoChecks } from "../src/checks/seo.js";
import { structureChecks } from "../src/checks/structure.js";
import { readabilityCheck } from "../src/checks/readability.js";
import { DEFAULT_CONFIG } from "../src/config.js";

const page = (rel: string, content: string) => parsePage(`/docs/${rel}`, rel, content);
const ruleSet = (fs: { rule: string }[]) => new Set(fs.map((f) => f.rule));

describe("seoChecks", () => {
  it("flags a missing description", () => {
    const p = page("a.md", "---\ntitle: A\n---\n# A\ntext");
    const dup = buildDuplicateIndex([p]);
    expect(ruleSet(seoChecks(p, DEFAULT_CONFIG, dup)).has("seo.missing-description")).toBe(true);
  });

  it("flags a too-long description", () => {
    const desc = "x".repeat(200);
    const p = page("a.md", `---\ntitle: A\ndescription: ${desc}\n---\n# A`);
    const dup = buildDuplicateIndex([p]);
    expect(ruleSet(seoChecks(p, DEFAULT_CONFIG, dup)).has("seo.description-long")).toBe(true);
  });

  it("detects duplicate titles across pages (site-wide)", () => {
    const a = page("a.md", "---\ntitle: Same\ndescription: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n---\n# A");
    const b = page("b.md", "---\ntitle: Same\ndescription: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n---\n# B");
    const dup = buildDuplicateIndex([a, b]);
    expect(ruleSet(seoChecks(a, DEFAULT_CONFIG, dup)).has("seo.duplicate-title")).toBe(true);
  });

  it("uses the H1 as a title and suggests an explicit one", () => {
    const p = page("a.md", "# Heading Title\nbody");
    const dup = buildDuplicateIndex([p]);
    const rules = ruleSet(seoChecks(p, DEFAULT_CONFIG, dup));
    expect(rules.has("seo.missing-title")).toBe(false);
    expect(rules.has("seo.frontmatter-title")).toBe(true);
  });
});

describe("structureChecks", () => {
  it("flags a skipped heading level", () => {
    const p = page("a.md", "# One\n### Three");
    expect(ruleSet(structureChecks(p, DEFAULT_CONFIG)).has("structure.skipped-heading")).toBe(true);
  });

  it("flags images without alt text and untagged code blocks", () => {
    const p = page("a.md", "# T\n![](x.png)\n\n```\ncode\n```");
    const rules = ruleSet(structureChecks(p, DEFAULT_CONFIG));
    expect(rules.has("structure.image-alt")).toBe(true);
    expect(rules.has("structure.code-language")).toBe(true);
  });

  it("flags missing and multiple H1s", () => {
    expect(ruleSet(structureChecks(page("a.md", "## no h1"), DEFAULT_CONFIG)).has("structure.no-h1")).toBe(true);
    expect(ruleSet(structureChecks(page("a.md", "# one\n# two"), DEFAULT_CONFIG)).has("structure.multiple-h1")).toBe(true);
  });
});

describe("readabilityCheck", () => {
  it("skips pages with too little prose", () => {
    const p = page("a.md", "# T\nshort.");
    expect(readabilityCheck(p, DEFAULT_CONFIG).findings).toHaveLength(0);
  });

  it("flags dense prose above the grade ceiling", () => {
    const dense =
      "Notwithstanding the aforementioned considerations, the architectural ramifications of the instantiation methodology necessitate a comprehensive reconceptualization of the underlying infrastructural paradigm, insofar as the multifaceted interdependencies between heterogeneous subsystems engender emergent complexities that fundamentally compromise maintainability.";
    const p = page("a.md", `# T\n${dense}`);
    const r = readabilityCheck(p, { ...DEFAULT_CONFIG, minWordsForReadability: 10, maxGrade: 12 });
    expect(r.findings.some((f) => f.rule === "readability.too-hard")).toBe(true);
    expect(r.summary?.grade).toBeGreaterThan(12);
  });
});
