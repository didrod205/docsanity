/** Configuration defaults, parsing, and resolution (pure — no file I/O). */

import type { Config, Dimension } from "./types.js";

export const DEFAULT_CONFIG: Config = {
  extensions: [".md", ".mdx", ".markdown"],
  requireFrontmatter: ["title", "description"],
  descriptionMin: 50,
  descriptionMax: 160,
  titleMax: 60,
  maxGrade: 14,
  minWordsForReadability: 80,
  disable: [],
  ignore: [],
  minScore: 0,
};

export const CONFIG_FILENAMES = ["docsanity.config.json", ".docsanityrc.json", ".docsanityrc"];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function mergeConfig(base: Config, override: Partial<Config>): Config {
  const out = { ...base } as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(override ?? {})) {
    if (v !== undefined) out[k] = v;
  }
  return out as unknown as Config;
}

export function parseConfig(json: string, label = "config"): Config {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    throw new Error(`invalid ${label}: ${(e as Error).message}`);
  }
  if (!isPlainObject(data)) throw new Error(`invalid ${label}: must be a JSON object`);
  return mergeConfig(DEFAULT_CONFIG, data as Partial<Config>);
}

export function isDimensionEnabled(config: Config, dim: Dimension): boolean {
  return !config.disable.includes(dim);
}
