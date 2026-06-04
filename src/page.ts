/** A parsed documentation page: frontmatter + extracted Markdown model. */

import { parseFrontmatter, type Frontmatter } from "./frontmatter.js";
import { parseMarkdown, type MarkdownModel } from "./markdown.js";

export interface Page {
  /** Absolute path (needed for cross-file link resolution). */
  absPath: string;
  /** Path relative to the scanned root (for display). */
  relPath: string;
  content: string;
  frontmatter: Frontmatter;
  md: MarkdownModel;
}

export function parsePage(absPath: string, relPath: string, content: string): Page {
  const frontmatter = parseFrontmatter(content);
  // Offset Markdown line numbers by the frontmatter block so they map to the file.
  const md = parseMarkdown(frontmatter.body, frontmatter.offset);
  return { absPath, relPath, content, frontmatter, md };
}
