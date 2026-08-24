import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Link — documentation page.
 */
@Component({
  selector: 'app-link-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './link.page.html',
  styleUrl: './primitives-page.scss',
})
export class LinkPage {
  readonly routerSnippet = `<!-- In-app: driven by Angular's router -->
<ds-link link="/foundations">Design tokens</ds-link>

<!-- Cross-document or external -->
<ds-link href="https://angular.dev" target="_blank">Angular</ds-link>`;

  readonly variantSnippet = `<ds-link variant="primary">Primary</ds-link>
<ds-link variant="subtle" underline="hover">Subtle</ds-link>
<p>Running text with an <ds-link variant="inherit" href="#">inherited link</ds-link> in it.</p>`;

  readonly externalSnippet = `<!-- target="_blank" implies external: the glyph, the rel, and the words -->
<ds-link href="https://angular.dev" target="_blank">Angular</ds-link>

<!-- Renders:
<a href="…" target="_blank" rel="noreferrer noopener">
  Angular <svg …/> <span class="visually-hidden">(opens in a new tab)</span>
</a> -->`;

  readonly namingSnippet = `<!-- "Read more" is not a destination -->
<ds-link href="/invoices/1042" ariaLabel="Read more about invoice #1042">Read more</ds-link>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'href', type: 'string | null', default: 'null', description: 'Cross-document or external destination.' },
    { name: 'link', type: 'string | unknown[] | null', default: 'null', description: 'In-app destination, driven by the router. Named link, not routerLink — see below.' },
    { name: 'target', type: 'string | null', default: 'null', description: 'Anchor target. _blank implies external and adds rel="noreferrer noopener".' },
    { name: 'variant', type: `'primary' | 'subtle' | 'inherit'`, default: `'primary'`, description: 'inherit is for links inside running text.' },
    { name: 'underline', type: `'always' | 'hover' | 'none'`, default: `'always'`, description: 'always, unless the link is unmistakable from context.' },
    { name: 'iconStart / iconEnd', type: 'IconName | null', default: 'null', description: 'Decorative icon inside the link.' },
    { name: 'external', type: 'boolean | null', default: 'from target', description: 'Marks the destination as leaving the site. Adds the arrow glyph.' },
    { name: 'newTabLabel', type: 'string', default: `'(opens in a new tab)'`, description: 'What a new tab is called out loud.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name, when the visible text is not one.' },
  ];
}
