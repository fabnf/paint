import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  IconComponent,
  LogoComponent,
  ToastService,
  brand,
  colorPrimitives,
  iconRegistry,
  spacingScale,
  type IconName,
  type SelectOption,
} from '../../design-system';
import { DOC_UI } from '../docs';

interface LayerCard {
  layer: string;
  icon: IconName;
  status: 'Shipped' | 'Shipping now' | 'Next';
  summary: string;
  items: readonly string[];
}

interface ComponentCard {
  name: string;
  path: string;
  icon: IconName;
  builtOn: string;
  summary: string;
}

/**
 * Overview — what Paint is, what shipped, and where it is heading.
 */
@Component({
  selector: 'app-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, IconComponent, LogoComponent, RouterLink],
  templateUrl: './overview.page.html',
  styleUrl: './overview.page.scss',
})
export class OverviewPage {
  private readonly toasts = inject(ToastService);

  readonly brand = brand;

  /** Hero demo state. */
  readonly demoDialog = signal(false);
  readonly demoLabels = signal<string[]>(['brand', 'tokens']);

  readonly labelOptions: readonly SelectOption[] = [
    { value: 'brand', label: 'Brand', icon: 'palette' },
    { value: 'tokens', label: 'Tokens', icon: 'ruler' },
    { value: 'a11y', label: 'Accessibility', icon: 'success' },
    { value: 'perf', label: 'Performance', icon: 'zap' },
  ];

  readonly primitives: readonly ComponentCard[] = [
    { name: 'Button', path: '/primitives/button', icon: 'zap', builtOn: '.btn', summary: 'Eight intents, three sizes, icons, loading, icon-only.' },
    { name: 'Input', path: '/primitives/input', icon: 'textCursor', builtOn: '.form-control', summary: 'A real <input>, with label, hint, error and affixes.' },
    { name: 'Textarea', path: '/primitives/textarea', icon: 'rows', builtOn: '.form-control', summary: 'Multi-line, auto-growing, counted.' },
    { name: 'Checkbox', path: '/primitives/checkbox', icon: 'checkbox', builtOn: '.form-check', summary: 'Independent choice, with a native mixed state.' },
    { name: 'Radio', path: '/primitives/radio', icon: 'radio', builtOn: '.form-check', summary: 'One of many — the browser owns the arrow keys.' },
    { name: 'Switch', path: '/primitives/switch', icon: 'toggle', builtOn: '.form-switch', summary: 'Immediate effect. role="switch" on a real checkbox.' },
    { name: 'Slider', path: '/primitives/slider', icon: 'sliders', builtOn: '.form-range', summary: 'A position on a range. Six keys, from one place.' },
    { name: 'NumberInput', path: '/primitives/number-input', icon: 'hash', builtOn: '.form-control + buttons', summary: 'A quantity that honours min, max and step.' },
    { name: 'StarRating', path: '/primitives/star-rating', icon: 'star', builtOn: 'native radios / role="img"', summary: 'Stars to read, stars to give. Half stars when reading.' },
    { name: 'Badge', path: '/primitives/badge', icon: 'tag', builtOn: '.badge', summary: 'A status the system wrote. Seven tones, three variants.' },
    { name: 'Chip', path: '/primitives/chip', icon: 'tag', builtOn: 'tones + <button>', summary: 'A value the user put there — and can take away.' },
    { name: 'Avatar', path: '/primitives/avatar', icon: 'user', builtOn: 'tones + avatar scale', summary: 'Image, initials, icon. Tinted from the name.' },
    { name: 'Spinner', path: '/primitives/spinner', icon: 'refresh', builtOn: '.spinner-border', summary: 'A wait with no length, named out loud.' },
    { name: 'Progress', path: '/primitives/progress', icon: 'ruler', builtOn: '.progress', summary: 'A wait you can count — or deliberately cannot.' },
    { name: 'Skeleton', path: '/primitives/skeleton', icon: 'layers', builtOn: '.placeholder', summary: 'The shape of what is coming, so nothing jumps.' },
    { name: 'Divider', path: '/primitives/divider', icon: 'minus', builtOn: 'a border + a role', summary: 'A rule, optionally with a word in it.' },
    { name: 'Link', path: '/primitives/link', icon: 'externalLink', builtOn: 'a real <a>', summary: 'Goes somewhere. Buttons do something.' },
    { name: 'Kbd', path: '/primitives/kbd', icon: 'keyboard', builtOn: 'a real <kbd>', summary: 'Which key. Never a tab stop, never a listener.' },
    { name: 'Image', path: '/primitives/image', icon: 'image', builtOn: 'a real <img>', summary: 'A picture with a shape, and a fallback with a name.' },
    { name: 'Text', path: '/primitives/text', icon: 'type', builtOn: '.h1–.h4', summary: 'The ramp as a component — level and element, decoupled.' },
    { name: 'Box', path: '/primitives/box', icon: 'box', builtOn: 'spacing utils', summary: 'Spacing, surface, radius, elevation — tokens only.' },
    { name: 'Flex', path: '/primitives/flex', icon: 'columns', builtOn: '.d-flex', summary: 'One axis, both alignments, typed and responsive.' },
    { name: 'Stack', path: '/primitives/stack', icon: 'rows', builtOn: '.vstack', summary: 'Rhythm between siblings — the stack owns the gap.' },
    { name: 'Grid', path: '/primitives/grid', icon: 'grid', builtOn: '.row / .col', summary: 'Two dimensions on the 12-column grid.' },
  ];

  readonly components: readonly ComponentCard[] = [
    {
      name: 'FormField',
      path: '/components/form-field',
      icon: 'textCursor',
      builtOn: 'the field chrome',
      summary: 'Label, hint, error — wired to the control through DI.',
    },
    {
      name: 'SearchField',
      path: '/components/search-field',
      icon: 'search',
      builtOn: 'ds-input + ds-spinner',
      summary: 'Debounced, with the count in a live region.',
    },
    {
      name: 'PasswordField',
      path: '/components/password-field',
      icon: 'eye',
      builtOn: 'ds-input + ds-button',
      summary: 'A real toggle button, and a meter that stays quiet.',
    },
    {
      name: 'Choice groups',
      path: '/components/choice-group',
      icon: 'checkbox',
      builtOn: 'fieldset / legend',
      summary: 'Radio and checkbox groups. A question, and its answers.',
    },
    {
      name: 'RangeControl',
      path: '/components/range-control',
      icon: 'sliders',
      builtOn: 'ds-slider + ds-number-input',
      summary: 'One value, one label, two ways in.',
    },
    {
      name: 'Figure',
      path: '/components/figure',
      icon: 'image',
      builtOn: '<figure> + ds-image',
      summary: 'A picture with a caption and a credit. Not a card.',
    },
    {
      name: 'RatingSummary',
      path: '/components/rating-summary',
      icon: 'star',
      builtOn: 'ds-star-rating + a sentence',
      summary: 'Stars, score, count — heard once.',
    },
    {
      name: 'ShortcutHint',
      path: '/components/shortcut-hint',
      icon: 'keyboard',
      builtOn: 'a label + ds-kbd',
      summary: 'What it does, which key does it. Never a tab stop.',
    },
    {
      name: 'Calendar',
      path: '/components/calendar',
      icon: 'calendar',
      builtOn: 'a table role="grid"',
      summary: 'A month you can walk with the arrow keys. Not a picker.',
    },
    {
      name: 'Date & time',
      path: '/components/date-input',
      icon: 'clock',
      builtOn: 'ds-input + ds-button',
      summary: 'Typed dates and times. yyyy-mm-dd, never a Date.',
    },
    {
      name: 'Accordion',
      path: '/components/accordion',
      icon: 'rows',
      builtOn: 'heading + button + region',
      summary: 'Disclosures that know about each other. One is a disclosure.',
    },
    {
      name: 'Breadcrumb',
      path: '/components/breadcrumb',
      icon: 'chevronRight',
      builtOn: '<nav> / <ol>',
      summary: 'The path up. The last crumb is not a link.',
    },
    {
      name: 'Pagination',
      path: '/components/pagination',
      icon: 'more',
      builtOn: '.pagination',
      summary: 'A width that never changes as the page travels.',
    },
    {
      name: 'EmptyState',
      path: '/components/empty-state',
      icon: 'box',
      builtOn: 'icon + type ramp',
      summary: 'Nothing yet, nothing found, nothing allowed.',
    },
    {
      name: 'Alert',
      path: '/components/alert',
      icon: 'info',
      builtOn: 'the tone properties',
      summary: 'A callout in the page. Not a toast.',
    },
    {
      name: 'Toolbar',
      path: '/components/toolbar',
      icon: 'settings',
      builtOn: 'role="toolbar"',
      summary: 'Eight buttons, one tab stop.',
    },
    {
      name: 'Tabs',
      path: '/components/tabs',
      icon: 'tabs',
      builtOn: '.nav / .tab-content',
      summary: 'Three flavours, lazy panels, the full ARIA tab pattern.',
    },
    {
      name: 'Menu',
      path: '/components/menu',
      icon: 'more',
      builtOn: '.dropdown-menu',
      summary: 'Actions with icons, shortcuts, type-ahead and focus return.',
    },
    {
      name: 'Select',
      path: '/components/select',
      icon: 'list',
      builtOn: '.form-control',
      summary: 'Single or multiple, searchable, chips — and a real CVA.',
    },
    {
      name: 'Toast',
      path: '/components/toast',
      icon: 'bell',
      builtOn: '.toast',
      summary: 'A service, a live region, and one action per announcement.',
    },
    {
      name: 'Dialog',
      path: '/components/dialog',
      icon: 'window',
      builtOn: '.modal',
      summary: 'Focus trap, scroll lock, Escape, and focus restored.',
    },
    {
      name: 'Gallery',
      path: '/components/gallery',
      icon: 'image',
      builtOn: 'ds-image + ds-figure + the Dialog',
      summary: 'Thumbnails, a lightbox and a slideshow over one list.',
    },
    {
      name: 'Chart',
      path: '/components/chart',
      icon: 'ruler',
      builtOn: 'Highcharts, behind a seam',
      summary: 'Ten chart types on one contract, coloured from the tokens.',
    },
    {
      name: 'Inbox & Scheduler',
      path: '/components/workspace',
      icon: 'bell',
      builtOn: 'master–detail + four calendar views',
      summary: 'A support queue and a calendar. Two organisms, one workspace.',
    },
    {
      name: 'Tour',
      path: '/components/tour',
      icon: 'sparkle',
      builtOn: 'a spotlight + the Dialog’s machinery',
      summary: 'A walkthrough that points at the real UI, across routes.',
    },
    {
      name: 'Interstitial',
      path: '/components/interstitial',
      icon: 'bell',
      builtOn: 'ds-gallery + a content seam',
      summary: 'The full-page interruption, once per user per item.',
    },
    {
      name: 'DataTable',
      path: '/components/data-table',
      icon: 'table',
      builtOn: '.table',
      summary: 'Typed columns, sorting, selection, skeleton, empty state.',
    },
  ];

  readonly layers: readonly LayerCard[] = [
    {
      layer: 'Foundations',
      icon: 'ruler',
      status: 'Shipped',
      summary: 'Typed tokens and a theme provider that writes CSS variables at runtime.',
      items: ['Color', 'Type', 'Space', 'Effects', 'Icons', 'Theme'],
    },
    {
      layer: 'Primitives',
      icon: 'layers',
      status: 'Shipped',
      summary: 'The smallest components: one job each, zero product opinions.',
      items: [
        'Button',
        'Input',
        'Textarea',
        'Checkbox',
        'Radio',
        'Switch',
        'Slider',
        'NumberInput',
        'StarRating',
        'Badge',
        'Chip',
        'Avatar',
        'Spinner',
        'Progress',
        'Skeleton',
        'Divider',
        'Link',
        'Kbd',
        'Image',
        'Text',
        'Box',
        'Flex',
        'Stack',
        'Grid',
      ],
    },
    {
      layer: 'Molecules',
      icon: 'box',
      status: 'Shipping now',
      summary: 'Primitives composed into units that carry their own behaviour.',
      items: [
        'FormField',
        'SearchField',
        'PasswordField',
        'RadioGroup',
        'CheckboxGroup',
        'Calendar',
        'DateInput',
        'TimeInput',
        'Accordion',
        'Breadcrumb',
        'Pagination',
        'EmptyState',
        'Alert',
        'Toolbar',
        'RangeControl',
        'Figure',
        'RatingSummary',
        'ShortcutHint',
        'Tooltip',
        'Popover',
        'FileDropzone',
        'FileQueueItem',
        'Tabs',
        'Menu',
        'Select',
        'Toast',
      ],
    },
    {
      layer: 'Organisms',
      icon: 'table',
      status: 'Shipping now',
      summary: 'Page-level machinery: modality, selection, sorting, density.',
      items: ['Dialog', 'Drawer', 'DataTable', 'DataGrid', 'DatePicker', 'DateRangePicker', 'FileUploader', 'FilterBar', 'CommandPalette', 'MapViewer', 'Feed', 'Board', 'Gallery', 'Interstitial', 'Tour', 'Chart', 'Inbox', 'Scheduler', 'AppShell'],
    },
  ];

  readonly stats = [
    { value: '54', label: 'Components' },
    { value: String(Object.keys(iconRegistry).length), label: 'Icons' },
    { value: String(Object.keys(spacingScale).length), label: 'Space tokens' },
    { value: '2', label: 'Themes' },
  ];

  readonly palette = [
    { name: 'magenta', value: colorPrimitives.magenta[500] },
    { name: 'violet', value: colorPrimitives.violet[500] },
    { name: 'violet 800', value: colorPrimitives.violet[800] },
    { name: 'lime', value: colorPrimitives.lime[300] },
    { name: 'ink', value: colorPrimitives.ink[950] },
  ];

  readonly principles = [
    {
      icon: 'layers' as IconName,
      title: 'Tokens, not values',
      body: 'Components only accept tokens. If a value is not in the scale, it is not available — consistency by construction.',
    },
    {
      icon: 'palette' as IconName,
      title: 'Themeable to the core',
      body: 'Semantic roles resolve per theme at runtime. Light and dark are data, not duplicated stylesheets.',
    },
    {
      icon: 'code' as IconName,
      title: 'Bootstrap underneath',
      body: 'Paint renders Bootstrap’s classes and supplies the behaviour its JS would have: focus, keyboard, dismissal.',
    },
    {
      icon: 'success' as IconName,
      title: 'Accessible by default',
      body: 'Keyboard patterns, focus management, live regions and AA contrast are part of each component — and asserted by axe-core and contrast specs on every run.',
    },
  ];

  readonly usageSnippet = `import { Component, inject, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, ToastService } from './design-system';

@Component({
  selector: 'app-invoice-actions',
  imports: [DS_PRIMITIVES, DS_COMPONENTS],
  template: \`
    <ds-flex justify="between" align="center" [gap]="3">
      <ds-text variant="h4">Invoice #1042</ds-text>

      <ds-flex [gap]="2">
        <ds-select [options]="owners" [(value)]="owner" placeholder="Assign" />
        <ds-menu label="Actions" [entries]="entries" (itemSelect)="run($event)" />
        <ds-button variant="danger" (clicked)="confirm.set(true)">Delete</ds-button>
      </ds-flex>
    </ds-flex>

    <ds-dialog [(open)]="confirm" title="Delete invoice?" tone="danger" icon="warning">
      <ds-text>This cannot be undone.</ds-text>
      <ds-flex dsDialogActions [gap]="2" justify="end">
        <ds-button variant="ghost" (clicked)="confirm.set(false)">Cancel</ds-button>
        <ds-button variant="danger" (clicked)="destroy()">Delete</ds-button>
      </ds-flex>
    </ds-dialog>
  \`,
})
export class InvoiceActionsComponent {
  private readonly toast = inject(ToastService);
  readonly confirm = signal(false);

  destroy() {
    this.confirm.set(false);
    this.toast.danger('Invoice deleted', {
      action: { label: 'Undo', run: () => this.restore() },
    });
  }
}`;

  celebrate(): void {
    this.toasts.show({
      title: `Wet Paint, v${brand.version}`,
      description: 'Six components, a mark that looks like paint, and an accessibility pass.',
      variant: 'brand',
      duration: 4000,
    });
  }
}
