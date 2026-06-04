import { describe, expect, it } from "vitest";
import { parseFrontmatter, asString } from "../src/frontmatter.js";

describe("parseFrontmatter", () => {
  it("parses scalars, quotes, booleans and numbers", () => {
    const fm = parseFrontmatter(
      ['---', 'title: "Hello World"', "draft: false", "weight: 3", "---", "", "# Body"].join("\n"),
    );
    expect(fm.present).toBe(true);
    expect(fm.data.title).toBe("Hello World");
    expect(fm.data.draft).toBe(false);
    expect(fm.data.weight).toBe(3);
    expect(fm.body.trim()).toBe("# Body");
  });

  it("parses inline and block lists", () => {
    const inline = parseFrontmatter(["---", "tags: [a, b, c]", "---", "x"].join("\n"));
    expect(inline.data.tags).toEqual(["a", "b", "c"]);

    const block = parseFrontmatter(["---", "tags:", "  - one", "  - two", "---", "x"].join("\n"));
    expect(block.data.tags).toEqual(["one", "two"]);
  });

  it("reports no frontmatter when absent", () => {
    const fm = parseFrontmatter("# Just a heading\n");
    expect(fm.present).toBe(false);
    expect(fm.data).toEqual({});
    expect(fm.body).toBe("# Just a heading\n");
  });

  it("reports an offset so body line numbers map back to the file", () => {
    const fm = parseFrontmatter(["---", "title: X", "---", "line4"].join("\n"));
    expect(fm.offset).toBe(3);
  });

  it("asString joins lists and trims", () => {
    expect(asString(["a", "b"])).toBe("a, b");
    expect(asString("  hi  ")).toBe("hi");
    expect(asString(undefined)).toBe("");
  });
});
