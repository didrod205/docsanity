/** Colored console output for `scan`. */

import pc from "picocolors";
import { DIMENSION_LABELS, type DocsReport, type Dimension, type Severity } from "../types.js";

function sev(severity: Severity, text: string): string {
  if (severity === "error") return pc.red(text);
  if (severity === "warning") return pc.yellow(text);
  if (severity === "info") return pc.blue(text);
  return pc.green(text);
}

const MARK: Record<Severity, string> = { error: "✗", warning: "⚠", info: "ℹ", pass: "✓" };

function gradeColor(grade: string): (s: string) => string {
  if (grade === "A" || grade === "B") return pc.green;
  if (grade === "C" || grade === "D") return pc.yellow;
  return pc.red;
}

export function printReport(report: DocsReport, quiet = false): void {
  for (const page of report.pages) {
    const g = gradeColor(page.grade);
    const head = `${pc.bold(page.path)}  ${g(`${page.score}/100 (${page.grade})`)}`;
    const meta = page.readability
      ? pc.dim(`  grade ${page.readability.grade.toFixed(0)} · ${page.readability.words}w`)
      : "";
    console.log(`\n${head}${meta}`);

    if (quiet) continue;
    if (page.findings.length === 0) {
      console.log(`  ${pc.green("✓ no issues")}`);
      continue;
    }
    for (const f of page.findings) {
      const where = f.line ? pc.dim(`L${f.line}`.padEnd(6)) : "".padEnd(6);
      const mark = sev(f.severity, MARK[f.severity]);
      console.log(`  ${mark} ${where} ${f.message} ${pc.dim(f.rule)}`);
    }
  }

  const s = report.summary;
  const g = gradeColor(s.grade);
  console.log(`\n${pc.bold("Dimensions")}`);
  for (const dim of Object.keys(s.byDimension) as Dimension[]) {
    const b = s.byDimension[dim];
    const status =
      b.errors + b.warnings === 0
        ? pc.green("clean")
        : `${pc.red(`${b.errors}e`)} ${pc.yellow(`${b.warnings}w`)}`;
    console.log(`  ${DIMENSION_LABELS[dim].padEnd(22)} ${status}`);
  }
  console.log(
    `\n${pc.bold("Overall")}  ${g(`${s.score}/100 (${s.grade})`)} ` +
      pc.dim(`· ${s.pages} page(s), ${s.errors} error(s), ${s.warnings} warning(s)`),
  );
}
