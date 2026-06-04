import { describe, expect, it } from "vitest";
import { parseMarkdown } from "../src/markdown.js";

describe("parseMarkdown", () => {
  it("extracts headings with levels and lines", () => {
    const md = parseMarkdown("# Title\n\n## Section\n\ntext");
    expect(md.headings).toEqual([
      { level: 1, text: "Title", line: 1 },
      { level: 2, text: "Section", line: 3 },
    ]);
  });

  it("does not treat # inside a code fence as a heading", () => {
    const md = parseMarkdown(["# Real", "", "```bash", "# a comment", "```", ""].join("\n"));
    expect(md.headings.map((h) => h.text)).toEqual(["Real"]);
    expect(md.fences).toHaveLength(1);
    expect(md.fences[0]!.lang).toBe("bash");
  });

  it("records code fences with and without a language", () => {
    const md = parseMarkdown(["```", "plain", "```", "", "```ts", "code", "```"].join("\n"));
    expect(md.fences.map((f) => f.lang)).toEqual([null, "ts"]);
  });

  it("extracts markdown and HTML images with alt text", () => {
    const md = parseMarkdown('![a cat](cat.png)\n\n<img src="dog.png" alt="a dog">');
    expect(md.images).toEqual([
      { alt: "a cat", src: "cat.png", line: 1 },
      { alt: "a dog", src: "dog.png", line: 3 },
    ]);
  });

  it("flags an empty alt as empty", () => {
    const md = parseMarkdown("![](x.png)");
    expect(md.images[0]!.alt).toBe("");
  });

  it("projects readable prose (links → text, code/images stripped)", () => {
    const md = parseMarkdown("See the [guide](./g.md) and `code` here.");
    expect(md.text).toContain("See the guide and code here.");
  });
});
