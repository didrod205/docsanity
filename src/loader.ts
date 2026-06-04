/** Discover documentation files under the given targets. */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import type { Config } from "./types.js";

export interface InputDoc {
  absPath: string;
  relPath: string;
  content: string;
}

export interface LoadResult {
  root: string;
  docs: InputDoc[];
}

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".docusaurus",
  ".astro",
  ".cache",
  "coverage",
]);

function walk(dir: string, exts: Set<string>, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), exts, out);
    } else if (entry.isFile() && exts.has(extname(entry.name).toLowerCase())) {
      out.push(join(dir, entry.name));
    }
  }
}

export function loadDocs(targets: string[], config: Config): LoadResult {
  const exts = new Set(config.extensions.map((e) => e.toLowerCase()));
  const files: string[] = [];

  // Root: the single directory target, otherwise the current working directory.
  let root = process.cwd();
  if (targets.length === 1) {
    const abs = resolve(targets[0]!);
    if (statSync(abs).isDirectory()) root = abs;
  }

  for (const target of targets) {
    const abs = resolve(target);
    const stat = statSync(abs);
    if (stat.isDirectory()) walk(abs, exts, files);
    else if (exts.has(extname(abs).toLowerCase())) files.push(abs);
  }

  const seen = new Set<string>();
  const docs: InputDoc[] = [];
  for (const file of files.sort()) {
    if (seen.has(file)) continue;
    seen.add(file);
    docs.push({
      absPath: file,
      relPath: relative(root, file) || file,
      content: readFileSync(file, "utf8"),
    });
  }
  return { root, docs };
}
