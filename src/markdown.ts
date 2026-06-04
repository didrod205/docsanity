/**
 * Lightweight Markdown extraction — headings, images, code fences and a plain
 * text projection — without a full Markdown parser. We track fenced code blocks
 * so `#` inside a code sample is never mistaken for a heading.
 */

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface MdImage {
  alt: string;
  src: string;
  line: number;
}

export interface CodeFence {
  lang: string | null;
  line: number;
}

export interface MarkdownModel {
  headings: Heading[];
  images: MdImage[];
  fences: CodeFence[];
  /** Plain-text projection suitable for readability scoring. */
  text: string;
}

const FENCE_RE = /^(\s*)(`{3,}|~{3,})\s*([A-Za-z0-9_+-]*)/;
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
const HTML_IMG_RE = /<img\b[^>]*>/gi;

function htmlImgAlt(tag: string): string {
  const m = /\balt\s*=\s*["']([^"']*)["']/i.exec(tag);
  return m ? m[1]! : "";
}
function htmlImgSrc(tag: string): string {
  const m = /\bsrc\s*=\s*["']([^"']*)["']/i.exec(tag);
  return m ? m[1]! : "";
}

export function parseMarkdown(body: string, lineOffset = 0): MarkdownModel {
  const lines = body.split(/\r?\n/);
  const headings: Heading[] = [];
  const images: MdImage[] = [];
  const fences: CodeFence[] = [];
  const textParts: string[] = [];

  let inFence = false;
  let fenceMarker = "";

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const lineNo = i + 1 + lineOffset;

    const fence = FENCE_RE.exec(raw);
    if (fence && (!inFence || raw.trim().startsWith(fenceMarker))) {
      const marker = fence[2]!;
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0]!.repeat(3);
        fences.push({ lang: fence[3] ? fence[3] : null, line: lineNo });
      } else {
        inFence = false;
        fenceMarker = "";
      }
      continue;
    }
    if (inFence) continue; // skip code content entirely

    const heading = HEADING_RE.exec(raw);
    if (heading) {
      headings.push({ level: heading[1]!.length, text: heading[2]!.trim(), line: lineNo });
      textParts.push(heading[2]!.trim());
      continue;
    }

    let m: RegExpExecArray | null;
    IMAGE_RE.lastIndex = 0;
    while ((m = IMAGE_RE.exec(raw)) !== null) {
      images.push({ alt: m[1]!, src: m[2]!, line: lineNo });
    }
    HTML_IMG_RE.lastIndex = 0;
    while ((m = HTML_IMG_RE.exec(raw)) !== null) {
      images.push({ alt: htmlImgAlt(m[0]), src: htmlImgSrc(m[0]), line: lineNo });
    }

    textParts.push(stripInline(raw));
  }

  return { headings, images, fences, text: textParts.join("\n").trim() };
}

/** Reduce a Markdown line to readable prose for readability scoring. */
function stripInline(line: string): string {
  return line
    .replace(IMAGE_RE, "") // images contribute no prose
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/<[^>]+>/g, "") // html tags
    .replace(/^[>\s]*>/g, "") // blockquote markers
    .replace(/^\s{0,3}([*+-]|\d+\.)\s+/g, "") // list markers
    .replace(/[*_~]+/g, "") // emphasis
    .trim();
}
