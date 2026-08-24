/**
 * Documentation chrome for the Paint showcase.
 *
 * These helpers are *not* part of the design system — they are a consumer of
 * it, assembled entirely from Paint primitives to prove the set is enough to
 * build real UI.
 */
export * from './doc-page-header.component';
export * from './doc-section.component';
export * from './doc-example.component';
export * from './doc-code.component';
export * from './doc-api-table.component';

import { DocApiTableComponent } from './doc-api-table.component';
import { DocCodeComponent } from './doc-code.component';
import { DocExampleComponent } from './doc-example.component';
import { DocPageHeaderComponent } from './doc-page-header.component';
import { DocSectionComponent } from './doc-section.component';

export const DOC_UI = [
  DocPageHeaderComponent,
  DocSectionComponent,
  DocExampleComponent,
  DocCodeComponent,
  DocApiTableComponent,
] as const;