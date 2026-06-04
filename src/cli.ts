#!/usr/bin/env node
/** docsanity command-line interface. */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cac } from "cac";
import pc from "picocolors";
import pkg from "../package.json";
import { analyzeDocs } from "./analyze.js";
import { DEFAULT_CONFIG } from "./config.js";
import { loadConfig } from "./load-config.js";
import { loadDocs } from "./loader.js";
import { printReport } from "./report/console.js";
import { toJSON } from "./report/json.js";
import { toMarkdown } from "./report/markdown.js";
import { DIMENSIONS, type Config, type DocsReport, type Dimension } from "./types.js";

const cli = cac("docsanity");

function fail(message: string): never {
  console.error(`${pc.red("docsanity:")} ${message}`);
  process.exit(2);
}

interface ScanOptions {
  config?: string;
  disable?: string;
  maxGrade?: string;
  json?: string;
  md?: string;
  minScore?: string;
  quiet?: boolean;
}

function parseDimensions(value: string | undefined): Dimension[] {
  if (!value) return [];
  const known = new Set<string>(DIMENSIONS);
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((d) => {
      if (!known.has(d)) fail(`unknown dimension "${d}". Known: ${DIMENSIONS.join(", ")}`);
      return d as Dimension;
    });
}

cli
  .command("scan [...targets]", "Audit a docs directory or files")
  .option("--config <file>", "Path to a config file")
  .option("--disable <dims>", "Comma-separated dimensions to skip (links,seo,readability,structure)")
  .option("--max-grade <n>", "Flag pages reading above this grade level")
  .option("--json <file>", "Write a JSON report to this path")
  .option("--md <file>", "Write a Markdown report to this path")
  .option("--min-score <n>", "CI gate: exit non-zero if the overall score is below this")
  .option("--quiet", "Show only per-page headers")
  .example("  docsanity scan ./docs")
  .example("  docsanity scan ./docs --min-score 85 --md docs-report.md")
  .example("  docsanity scan ./docs --disable readability")
  .action((targets: string[], options: ScanOptions) => {
    if (!targets || targets.length === 0) fail("provide a docs directory or files to scan.");
    try {
      const config: Config = loadConfig(options.config);
      const disable = parseDimensions(options.disable);
      if (disable.length) config.disable = [...new Set([...config.disable, ...disable])];
      if (options.maxGrade !== undefined) config.maxGrade = Number(options.maxGrade);

      const { root, docs } = loadDocs(targets, config);
      if (docs.length === 0) fail(`no matching files (${config.extensions.join(", ")}) found.`);

      const report = analyzeDocs(root, docs, config, {
        version: pkg.version,
        generatedAt: new Date().toISOString(),
      });

      printReport(report, Boolean(options.quiet));

      if (options.json) {
        writeFileSync(resolve(options.json), toJSON(report));
        console.log(pc.dim(`\nWrote JSON report → ${options.json}`));
      }
      if (options.md) {
        writeFileSync(resolve(options.md), toMarkdown(report));
        console.log(pc.dim(`Wrote Markdown report → ${options.md}`));
      }

      const minScore = options.minScore !== undefined ? Number(options.minScore) : config.minScore;
      if (report.summary.score < minScore) {
        console.error(
          `\n${pc.red("docsanity:")} score ${report.summary.score} is below the minimum ${minScore}.`,
        );
        process.exit(1);
      }
    } catch (e) {
      fail((e as Error).message);
    }
  });

cli
  .command("report <input>", "Render a saved JSON report as Markdown")
  .option("--md <file>", "Write Markdown to this path instead of stdout")
  .action((input: string, options: { md?: string }) => {
    try {
      const report = JSON.parse(readFileSync(resolve(input), "utf8")) as DocsReport;
      const md = toMarkdown(report);
      if (options.md) {
        writeFileSync(resolve(options.md), md);
        console.log(`Wrote ${options.md}`);
      } else {
        process.stdout.write(md);
      }
    } catch (e) {
      fail((e as Error).message);
    }
  });

cli
  .command("init", "Write a docsanity.config.json with the defaults")
  .option("--force", "Overwrite an existing config")
  .action((options: { force?: boolean }) => {
    const file = resolve("docsanity.config.json");
    if (existsSync(file) && !options.force) {
      console.error(`${pc.red("docsanity:")} docsanity.config.json already exists (use --force).`);
      process.exit(1);
    }
    writeFileSync(file, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
    console.log("Created docsanity.config.json");
  });

cli.help();
cli.version(pkg.version);
cli.parse();
