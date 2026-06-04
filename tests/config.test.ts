import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG, parseConfig, mergeConfig, isDimensionEnabled } from "../src/config.js";
import { loadConfig } from "../src/load-config.js";
import { gradeFor, scorePage } from "../src/score.js";

describe("config", () => {
  it("parses and merges over defaults", () => {
    const cfg = parseConfig(JSON.stringify({ minScore: 90, maxGrade: 10 }));
    expect(cfg.minScore).toBe(90);
    expect(cfg.maxGrade).toBe(10);
    expect(cfg.extensions).toEqual(DEFAULT_CONFIG.extensions);
  });

  it("throws a clear error on invalid JSON", () => {
    expect(() => parseConfig("{ bad")).toThrow(/invalid config/);
  });

  it("mergeConfig ignores undefined overrides", () => {
    const cfg = mergeConfig(DEFAULT_CONFIG, { minScore: undefined as unknown as number });
    expect(cfg.minScore).toBe(DEFAULT_CONFIG.minScore);
  });

  it("isDimensionEnabled respects the disable list", () => {
    expect(isDimensionEnabled({ ...DEFAULT_CONFIG, disable: ["links"] }, "links")).toBe(false);
    expect(isDimensionEnabled(DEFAULT_CONFIG, "seo")).toBe(true);
  });

  it("loadConfig returns defaults when no file is present", () => {
    const dir = mkdtempSync(join(tmpdir(), "docsanity-"));
    expect(loadConfig(undefined, dir).minScore).toBe(DEFAULT_CONFIG.minScore);
    rmSync(dir, { recursive: true, force: true });
  });

  it("loadConfig reads an explicit file", () => {
    const dir = mkdtempSync(join(tmpdir(), "docsanity-"));
    const file = join(dir, "docsanity.config.json");
    writeFileSync(file, JSON.stringify({ minScore: 75 }));
    expect(loadConfig(file).minScore).toBe(75);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("score", () => {
  it("penalizes by severity and clamps at 0", () => {
    expect(scorePage([])).toBe(100);
    expect(scorePage([{ dimension: "seo", rule: "x", severity: "warning", message: "" }])).toBe(96);
    expect(scorePage([{ dimension: "seo", rule: "x", severity: "error", message: "" }])).toBe(88);
  });

  it("maps scores to grades", () => {
    expect(gradeFor(95)).toBe("A");
    expect(gradeFor(82)).toBe("B");
    expect(gradeFor(50)).toBe("F");
  });
});
