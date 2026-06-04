# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and this project adheres to
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-06-04

Initial public release.

### Added

- **Unified docs-site audit** over a whole Markdown/MDX directory, combining four
  dimensions into one score and report:
  - **Links & references** — broken links, dead anchors, missing images, undefined
    references and **orphan pages** (powered by `linklint`).
  - **SEO & frontmatter** — required `title`/`description`, length windows, H1-as-
    title fallback, and **site-wide duplicate title/description** detection.
  - **Readability** — per-page reading grade (powered by `readlevel`), flagged
    against a configurable ceiling.
  - **Structure & a11y** — single H1, no skipped heading levels, image alt text,
    code-fence language tags.
- Dependency-free frontmatter and Markdown extraction (headings, images, fenced
  code, plain-text projection).
- `scan`, `report` and `init` commands with JSON/Markdown export, a CI score gate
  (`--min-score`), per-dimension disabling, and config files.
- Library API: `analyzeDocs`, per-check functions, and full TypeScript types.
