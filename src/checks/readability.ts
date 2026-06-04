/**
 * Readability check — leverages the `readlevel` engine on each page's prose and
 * flags pages that read harder than the configured grade ceiling. Docs that are
 * too dense lose readers (and AI answer engines that prefer clear sources).
 */

import { analyze as readlevelAnalyze } from "@didrod2539/readlevel";
import type { Config, Finding, ReadabilitySummary } from "../types.js";
import type { Page } from "../page.js";

export interface ReadabilityResult {
  findings: Finding[];
  summary?: ReadabilitySummary;
}

export function readabilityCheck(page: Page, config: Config): ReadabilityResult {
  const text = page.md.text;
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  // Too little prose to judge (e.g. an API reference table or stub).
  if (wordCount < config.minWordsForReadability) {
    return { findings: [] };
  }

  const a = readlevelAnalyze(text);
  const summary: ReadabilitySummary = {
    grade: a.grade,
    gradeLabel: a.gradeLabel,
    ease: a.ease,
    words: a.words,
    readingTimeSeconds: a.readingTimeSeconds,
  };

  const findings: Finding[] = [];
  if (a.grade > config.maxGrade) {
    findings.push({
      dimension: "readability",
      rule: "readability.too-hard",
      severity: "warning",
      message: `Reads at grade ${a.grade.toFixed(0)} (${a.gradeLabel}); target ≤ grade ${config.maxGrade}`,
      detail: `Flesch ease ${a.readability.fleschReadingEase.toFixed(0)} (${a.ease}), ${a.averageWordsPerSentence.toFixed(0)} words/sentence`,
      fix: "Shorten sentences and prefer common words to lower the reading grade.",
    });
  }
  return { findings, summary };
}
