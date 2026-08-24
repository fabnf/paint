import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, type BreadcrumbItem } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Breadcrumb — documentation page.
 */
@Component({
  selector: 'app-breadcrumb-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './breadcrumb.page.html',
  styleUrl: './components-page.scss',
})
export class BreadcrumbPage {
  readonly short: readonly BreadcrumbItem[] = [
    { label: 'Overview', link: '/', icon: 'home' },
    { label: 'Molecules', link: '/components/accordion' },
    { label: 'Breadcrumb' },
  ];

  readonly deep: readonly BreadcrumbItem[] = [
    { label: 'Overview', link: '/', icon: 'home' },
    { label: 'Brand', link: '/brand' },
    { label: 'Foundations', link: '/foundations' },
    { label: 'Primitives', link: '/primitives/button' },
    { label: 'Molecules', link: '/components/accordion' },
    { label: 'Breadcrumb' },
  ];

  readonly maxItems = signal(4);

  readonly basicSnippet = `<ds-breadcrumb [items]="[
  { label: 'Home', link: '/' },
  { label: 'Projects', link: '/projects' },
  { label: 'Mural' },
]" />

<!-- The last crumb is not a link. aria-current="page" is what says so. -->`;

  readonly collapseSnippet = `<!-- A path of nine folders does not fit, and the two that matter are the
     first and the last. The rest collapse into a button that says how many. -->
<ds-breadcrumb [items]="deepPath" [maxItems]="4" [itemsBeforeCollapse]="1" [itemsAfterCollapse]="2" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'items', type: 'readonly BreadcrumbItem[]', default: '—', description: 'Required. The path, root first. The last item is the page you are on.' },
    { name: 'label', type: 'string', default: `'Breadcrumb'`, description: 'Names the <nav>. A page with two navs needs two names.' },
    { name: 'maxItems', type: 'number', default: '0', description: 'Collapse once the path is longer than this. 0 never collapses.' },
    { name: 'itemsBeforeCollapse', type: 'number', default: '1', description: 'Crumbs pinned at the start.' },
    { name: 'itemsAfterCollapse', type: 'number', default: '2', description: 'Crumbs pinned at the end, including the current page.' },
    { name: 'expandLabel', type: 'string', default: `'Show {n} hidden breadcrumbs'`, description: '{n} is replaced with the number of crumbs behind the button.' },
    { name: 'separator', type: 'string', default: `''`, description: 'A character instead of the chevron.' },
    { name: 'separatorIcon', type: 'IconName', default: `'chevronRight'`, description: 'A different chevron.' },
  ];

  readonly itemRows: readonly ApiRow[] = [
    { name: 'label', type: 'string', default: '—', description: 'Required. What the crumb says.' },
    { name: 'link', type: 'string | unknown[]', default: '—', description: 'In-app destination, driven by the router.' },
    { name: 'href', type: 'string', default: '—', description: 'Cross-document destination.' },
    { name: 'icon', type: 'IconName', default: '—', description: 'A leading glyph. Usually only on the root.' },
    { name: 'ariaLabel', type: 'string', default: '—', description: 'The accessible name, when the label is an icon or an abbreviation.' },
  ];
}
