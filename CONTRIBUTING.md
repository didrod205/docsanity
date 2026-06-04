# Contributing to docsanity

Thanks for your interest! docsanity unifies four docs-health dimensions over a
single page graph. Most contributions are a new check in one dimension.

## Getting started

```bash
git clone https://github.com/didrod205/docsanity.git
cd docsanity
npm install
npm test            # vitest
npm run typecheck   # tsc --noEmit
npm run build       # tsup → dist/
node dist/cli.js scan examples/docs
```

## Project layout

```
src/
  frontmatter.ts    # dependency-free YAML frontmatter parser
  markdown.ts       # headings / images / code fences / plain-text projection
  page.ts           # a parsed page (frontmatter + markdown model)
  checks/
    seo.ts          # frontmatter + site-wide duplicate title/description
    structure.ts    # H1, heading order, image alt, code language
    readability.ts  # wraps the readlevel engine
  links.ts          # wraps the linklint engine (graph, broken links, orphans)
  analyze.ts        # orchestrator — runs every dimension over the shared graph
  score.ts          # weighted score + A–F grade
  config.ts         # pure defaults/merge
  load-config.ts    # fs-based config loading
  loader.ts         # discover docs files
  report/           # console / json / markdown renderers
  cli.ts            # cac CLI
tests/              # vitest specs (incl. an integration test over examples/docs)
examples/docs/      # a small docs tree with intentional problems
```

## Adding a check

1. Pick the dimension (`links`, `seo`, `readability`, `structure`) and add the
   check to the matching module in `src/checks/` (or `src/links.ts`).
2. Return `Finding[]` with a stable `rule` id like `dimension.kebab-name`, a
   severity, a message and (ideally) a `fix`.
3. Add a unit test in `tests/checks.test.ts`, and — if it's observable end to end —
   an assertion in `tests/analyze.test.ts` against `examples/docs`.

## Quality bar

- [ ] New checks have a test with a positive case (and a negative one where it
      could false-positive).
- [ ] `npm run typecheck && npm test && npm run build` all pass.
- [ ] Site-wide checks operate on the full page set, not one file at a time.
- [ ] Regenerated `examples/sample-report.*` if the output format changed.
