/**
 * A small, dependency-free YAML-frontmatter parser. Docs sites (Docusaurus,
 * Astro, Nextra, Hugo, Jekyll, …) put metadata in a `---` fenced block at the
 * top of each Markdown file. We only need scalars and simple lists, so we parse
 * those directly rather than pulling in a full YAML engine.
 */

export type FrontmatterValue = string | string[] | boolean | number;

export interface Frontmatter {
  data: Record<string, FrontmatterValue>;
  /** The document body with the frontmatter block removed. */
  body: string;
  /** Number of lines the frontmatter occupied (so body line numbers can be offset). */
  offset: number;
  present: boolean;
}

function unquote(raw: string): string {
  const s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    return s.slice(1, -1);
  }
  return s;
}

function coerce(raw: string): FrontmatterValue {
  const s = raw.trim();
  // Inline list: [a, b, c]
  if (s.startsWith("[") && s.endsWith("]")) {
    return s
      .slice(1, -1)
      .split(",")
      .map((x) => unquote(x))
      .filter((x) => x.length > 0);
  }
  if (s === "true" || s === "false") return s === "true";
  if (s !== "" && !Number.isNaN(Number(s)) && /^-?\d/.test(s)) return Number(s);
  return unquote(s);
}

/** Parse a leading `---` frontmatter block. Returns empty data when absent. */
export function parseFrontmatter(content: string): Frontmatter {
  const normalized = content.replace(/^﻿/, "");
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(normalized);
  if (!match) {
    return { data: {}, body: content, offset: 0, present: false };
  }

  const block = match[1]!;
  const data: Record<string, FrontmatterValue> = {};
  const lines = block.split(/\r?\n/);

  let pendingListKey: string | null = null;
  let pendingList: string[] = [];

  const flush = () => {
    if (pendingListKey !== null) {
      data[pendingListKey] = pendingList;
      pendingListKey = null;
      pendingList = [];
    }
  };

  for (const line of lines) {
    if (/^\s*-\s+/.test(line) && pendingListKey !== null) {
      pendingList.push(unquote(line.replace(/^\s*-\s+/, "")));
      continue;
    }
    flush();
    const kv = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1]!;
    const value = kv[2]!;
    if (value.trim() === "") {
      // Could be the start of a block list.
      pendingListKey = key;
      pendingList = [];
    } else {
      data[key] = coerce(value);
    }
  }
  flush();

  const offset = match[0].split(/\r?\n/).length - 1;
  return { data, body: normalized.slice(match[0].length), offset, present: true };
}

/** Get a frontmatter value as a trimmed string (lists join with ", "). */
export function asString(value: FrontmatterValue | undefined): string {
  if (value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value).trim();
}
