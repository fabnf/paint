import axe, { type ElementContext, type RunOptions, type Result } from 'axe-core';

/**
 * axe-core, wired into the unit suite.
 *
 * Automated rules catch maybe a third of what matters — but that third should
 * never regress silently, and it should be checked on the *rendered* component
 * in each of its states, not on a screenshot of the docs site. This helper is
 * deliberately not exported from the public barrel: it is test-only, so
 * axe-core never reaches an application bundle.
 */

/**
 * Rules that only make sense for a whole page. A component fixture has no
 * landmarks, no `<html lang>` and no document title, so these would fail for
 * reasons that say nothing about the component.
 */
const PAGE_LEVEL_RULES = [
  'region',
  'html-has-lang',
  'document-title',
  'landmark-one-main',
  'page-has-heading-one',
  'bypass',
];

export const COMPONENT_AXE_OPTIONS: RunOptions = {
  resultTypes: ['violations'],
  rules: Object.fromEntries(PAGE_LEVEL_RULES.map((rule) => [rule, { enabled: false }])),
};

/** Formats violations so a failure names the rule, the node and the fix. */
export function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `      ${node.target.join(' ')}\n        ${(node.failureSummary ?? '').replace(/\n/g, ' ')}`)
        .join('\n');
      return `  [${violation.impact}] ${violation.id} — ${violation.help}\n${nodes}`;
    })
    .join('\n');
}

/**
 * Runs axe over `element` and fails the spec with a readable report.
 *
 * @example
 * ```ts
 * await expectNoAxeViolations(fixture.nativeElement);
 * ```
 */
export async function expectNoAxeViolations(
  element: ElementContext,
  options: RunOptions = COMPONENT_AXE_OPTIONS,
): Promise<void> {
  const results = await axe.run(element, options);

  expect(results.violations.length)
    .withContext(
      results.violations.length
        ? `axe found ${results.violations.length} violation(s):\n${formatViolations(results.violations)}`
        : '',
    )
    .toBe(0);
}
