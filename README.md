<div align="center">

# 🩺 docsanity

### One command for docs-site health — broken links, orphan pages, SEO, readability & structure in a single score.

[![npm version](https://img.shields.io/npm/v/docsanity.svg?color=success)](https://www.npmjs.com/package/docsanity)
[![CI](https://github.com/didrod205/docsanity/actions/workflows/ci.yml/badge.svg)](https://github.com/didrod205/docsanity/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/docsanity.svg)](https://www.npmjs.com/package/docsanity)
[![license](https://img.shields.io/npm/l/docsanity.svg)](./LICENSE)

</div>

Your docs site looks fine — until a reader hits a 404 from a link you moved, lands
on a page Google shows with a *duplicate* title, or bounces off a wall of
grad-school prose. These problems live **between** files (which page links where,
which titles repeat, what's orphaned), so single-file linters miss them and no one
notices until it ships.

**docsanity audits a whole docs directory in one pass** and unifies four health
dimensions into one score and one report — **100% locally, no API key:**

- 🔗 **Links & references** — broken relative links, dead `#anchors`, missing
  images, and **orphan pages** nothing links to.
- 🔎 **SEO & frontmatter** — missing/oversized `title` & `description`, plus
  **site-wide duplicate titles and descriptions** across every page.
- 📖 **Readability** — a per-page reading grade; flags pages that read too hard.
- ♿ **Structure & a11y** — single H1, no skipped heading levels, image alt text,
  fenced code blocks that declare a language.

```bash
npx docsanity scan ./docs
```

```
broken.md  50/100 (F)
  ✗ L5     Link target not found: "./nope.md"            links.broken-file-link
  ✗ L5     Anchor "#does-not-exist" not found in index.md links.broken-cross-anchor
  ⚠ L7     Image has no alt text: ./diagram.png           structure.image-alt
orphan.md  88/100 (B)
  ⚠        Orphan page — nothing links here               links.orphan-document
  ⚠        Duplicate title — also used by 1 other page(s) seo.duplicate-title

Overall  82/100 (B) · 5 page(s), 4 error(s), 10 warning(s)
```

---

## Why a suite (and not four separate tools)?

The valuable checks need the **whole-site view**, which only a unified pass can
give you:

- **Orphan pages** and **broken cross-file anchors** require the full page graph.
- **Duplicate titles/descriptions** require comparing every page to every other.
- A single **score + grade** you can gate in CI means one number to watch, not four
  tools to wire up and reconcile.

docsanity builds the page graph once and runs every dimension over it, then folds
everything into a per-page and per-dimension report. Under the hood it leverages
the focused engines [`linklint`](https://www.npmjs.com/package/@didrod2539/linklint)
(link graph) and [`readlevel`](https://www.npmjs.com/package/@didrod2539/readlevel)
(readability), and adds the SEO-frontmatter and structure checks that tie them into
a docs-site audit.

Why not just ask an LLM to "check my docs"? It can't hold 300 interlinked files in
context, it can't run in CI deterministically, and "did this link break" is a graph
lookup, not a guess.

## Install

```bash
# run it now, no install
npx docsanity scan ./docs

# or add it
npm install -g docsanity      # global CLI
npm install -D docsanity      # CI dependency
```

Node ≥ 18. Works with Docusaurus, Astro, Nextra, Hugo, Jekyll, VitePress — any
Markdown/MDX docs tree.

## Quick start

```bash
docsanity scan ./docs                       # audit a folder
docsanity scan ./docs --min-score 85        # CI gate: fail under 85
docsanity scan ./docs --md docs-report.md   # write a Markdown report
docsanity scan ./docs --disable readability # turn a dimension off
docsanity init                              # write docsanity.config.json
```

See [`examples/sample-report.md`](./examples/sample-report.md) and
[`examples/sample-report.json`](./examples/sample-report.json) for full reports.

## Real scenarios

**1. CI gate for your docs.** A PR that moves a page and forgets to fix the inbound
links — or ships a new page with no description — fails the build:

```yaml
# .github/workflows/docs.yml
- run: npx docsanity scan ./docs --min-score 90 --md docs-report.md
```

**2. Pre-launch audit of an inherited site.** Point it at a docs tree you didn't
write and instantly see the orphans, duplicate titles and dead anchors that
accumulated over time — one report, ranked by page score.

**3. Keep AI answer engines happy.** Clear, well-structured, well-linked pages are
what answer engines quote. Fix the readability and structure findings to make your
docs the source they cite.

## What each dimension checks

| Dimension | Checks |
| --------- | ------ |
| **Links & references** | broken relative links, dead `#anchors`, broken cross-file anchors, missing images, undefined references, **orphan pages** |
| **SEO & frontmatter** | required `title`/`description`, length windows, H1-as-title fallback, **site-wide duplicate titles & descriptions** |
| **Readability** | Flesch–Kincaid / Gunning Fog / SMOG average grade per page, flagged against a configurable ceiling |
| **Structure & a11y** | single H1, no skipped heading levels, image alt text, code-fence language tags |

Scoring is transparent: each finding is a weighted error / warning / info; pages
roll up to a 0–100 score and an A–F grade, averaged into the overall.

## Configuration

`docsanity init` writes `docsanity.config.json`:

```jsonc
{
  "extensions": [".md", ".mdx", ".markdown"],
  "requireFrontmatter": ["title", "description"],
  "descriptionMin": 50,
  "descriptionMax": 160,
  "titleMax": 60,
  "maxGrade": 14,
  "minWordsForReadability": 80,
  "disable": [],            // e.g. ["readability"]
  "ignore": [],             // rule ids, e.g. ["structure.code-language"]
  "minScore": 0             // CI gate threshold
}
```

## Library API

```ts
import { analyzeDocs } from "docsanity";

const report = analyzeDocs(root, inputs, config, {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
});
for (const page of report.pages) {
  console.log(page.path, page.score, page.findings.length);
}
```

Also exported: `parsePage`, `parseFrontmatter`, `parseMarkdown`, `seoChecks`,
`structureChecks`, `readabilityCheck`, `linkFindings`, `DEFAULT_CONFIG`, and types.

## Roadmap

- More frontmatter conventions (Hugo/Jekyll specifics, custom required schemas).
- HTML docs input (not just Markdown/MDX).
- Per-rule severity overrides and inline ignore comments.
- `--baseline` to fail only on *new* issues vs a committed snapshot.
- A web playground (drop a zip of docs, get the report — nothing uploaded).

## 💖 Sponsor

docsanity is free and MIT-licensed, built and maintained in spare time. If it
caught a broken link before your readers did, please consider supporting it:

- ⭐ **Star this repo** — the simplest free way to help others find it.
- 🍋 **[Sponsor via Lemon Squeezy](https://elab-studio.lemonsqueezy.com/checkout/buy/5d059b89-51d0-456b-b33a-ed56994f7010)** — one-time or recurring.

## License

[MIT](./LICENSE) © docsanity contributors
