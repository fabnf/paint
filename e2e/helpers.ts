import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

/**
 * Shared helpers for the showcase suite.
 */

/** axe-core, read once from the unit suite's own dependency. */
const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: Array<{ target: string[]; failureSummary?: string }>;
}

/**
 * Runs axe over the routed page content and fails with a readable report.
 *
 * Page-level rules (landmarks, `<html lang>`, a single `<h1>`) are the shell's
 * business and are asserted once, in the shell smoke test; the atom pages
 * are scanned for everything else.
 */
export async function expectNoAxeViolations(page: Page, selector = '#content'): Promise<void> {
  await page.addScriptTag({ content: AXE_SOURCE });
  const violations = await page.evaluate(async (context) => {
    // axe is attached to window by the script above.
    const axe = (window as unknown as { axe: { run: Function } }).axe;
    const results = (await axe.run(context, {
      resultTypes: ['violations'],
      rules: {
        region: { enabled: false },
        'page-has-heading-one': { enabled: false },
      },
    })) as { violations: AxeViolation[] };
    return results.violations;
  }, selector);

  const report = violations
    .map(
      (violation) =>
        `  [${violation.impact}] ${violation.id} — ${violation.help}\n` +
        violation.nodes
          .map((node) => `      ${node.target.join(' ')}\n        ${(node.failureSummary ?? '').replace(/\n/g, ' ')}`)
          .join('\n'),
    )
    .join('\n');

  expect(violations.length, report ? `axe found violations:\n${report}` : undefined).toBe(0);
}

/** Navigates to a showcase page and waits for its header to render. */
export async function openPage(page: Page, path: string, title: string): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveTitle(`${title} · Paint`);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}