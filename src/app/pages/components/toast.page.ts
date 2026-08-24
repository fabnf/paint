import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  IconComponent,
  ToastService,
  type Toast,
  type ToastVariant,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Toast — documentation page.
 */
@Component({
  selector: 'app-toast-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, IconComponent],
  templateUrl: './toast.page.html',
  styleUrl: './components-page.scss',
})
export class ToastPage {
  private readonly toasts = inject(ToastService);

  readonly undone = signal(false);

  readonly variants: ReadonlyArray<{ variant: ToastVariant; title: string; description: string }> = [
    { variant: 'success', title: 'Project saved', description: 'Mural — March is up to date.' },
    { variant: 'info', title: 'Export started', description: 'We’ll email you when it’s ready.' },
    { variant: 'warning', title: 'Storage almost full', description: '92% of 100 GB used.' },
    { variant: 'danger', title: 'Upload failed', description: 'Check your connection and retry.' },
    { variant: 'brand', title: 'New theme mixed', description: 'Wet Paint is now your default.' },
  ];

  /** Static samples for the specimen row — never queued. */
  readonly samples: readonly Toast[] = this.variants.map((item, index) => ({
    id: -(index + 1),
    variant: item.variant,
    title: item.title,
    description: item.description,
    duration: 0,
    dismissible: true,
  }));

  readonly serviceSnippet = `private readonly toast = inject(ToastService);

// Shorthands for the common four
this.toast.success('Project saved');
this.toast.info('Export started', { description: 'We’ll email you when it’s ready.' });
this.toast.warning('Storage almost full');
this.toast.danger('Upload failed', { description: 'Check your connection.' });

// The full option bag
const id = this.toast.show({
  title: 'Label removed',
  description: 'Brand was removed from 3 invoices.',
  variant: 'brand',
  action: { label: 'Undo', run: () => this.restore() },
  duration: 8000,   // 0 keeps it until dismissed
});

this.toast.dismiss(id);
this.toast.clear();`;

  readonly hostSnippet = `<!-- app.component.html — once, anywhere -->
<ds-toast-host placement="bottom-end" />`;

  readonly provideSnippet = `// app.config.ts — defaults for the whole app
providers: [
  { provide: TOAST_CONFIG, useValue: { duration: 5000, limit: 4 } },
]`;

  readonly actionSnippet = `this.toast.show({
  title: 'Label removed',
  variant: 'brand',
  action: { label: 'Undo', run: () => this.restore() },
  duration: 8000,
});`;

  readonly toastApi: readonly ApiRow[] = [
    { name: 'title', type: 'string', default: '—', description: 'Required. Headline; keep it under ~40 characters.' },
    { name: 'description', type: 'string', default: '—', description: 'Optional second line.' },
    {
      name: 'variant',
      type: `'info' | 'success' | 'warning' | 'danger' | 'brand'`,
      default: `'info'`,
      description: 'Paints the stripe and picks the icon.',
    },
    { name: 'icon', type: 'IconName', default: 'per variant', description: 'Overrides the variant’s icon.' },
    { name: 'duration', type: 'number', default: '5000', description: 'Auto-dismiss delay in ms. `0` waits for the user.' },
    { name: 'action', type: '{ label: string; run: () => void }', default: '—', description: 'One affordance — undo, retry, view.' },
    { name: 'dismissible', type: 'boolean', default: 'true', description: 'Shows the dismiss button.' },
  ];

  readonly serviceApi: readonly ApiRow[] = [
    { name: 'show(options)', type: '(options: ToastOptions) => number', default: '—', description: 'Queues a toast, returns its id.' },
    {
      name: 'success / info / warning / danger',
      type: '(title, options?) => number',
      default: '—',
      description: 'Shorthands for the four status variants.',
    },
    { name: 'dismiss(id)', type: '(id: number) => void', default: '—', description: 'Removes one toast.' },
    { name: 'clear()', type: '() => void', default: '—', description: 'Removes every toast. Useful on route change.' },
    { name: 'pause / resume(id)', type: '(id: number) => void', default: '—', description: 'Holds a countdown. The host calls these on hover and focus.' },
    { name: 'toasts', type: 'Signal<readonly Toast[]>', default: '—', description: 'Live queue, oldest first.' },
    { name: 'count', type: 'Signal<number>', default: '—', description: 'How many toasts are on screen.' },
  ];

  readonly hostApi: readonly ApiRow[] = [
    {
      name: 'placement',
      type: `'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end'`,
      default: `'bottom-end'`,
      description: 'Corner the stack grows from.',
    },
    { name: 'label', type: 'string', default: `'Notifications'`, description: 'Accessible name for the live region.' },
  ];

  show(variant: ToastVariant): void {
    const item = this.variants.find((candidate) => candidate.variant === variant)!;
    this.toasts.show({ title: item.title, description: item.description, variant });
  }

  showWithAction(): void {
    this.undone.set(false);
    this.toasts.show({
      title: 'Label removed',
      description: 'Brand was removed from 3 invoices.',
      variant: 'brand',
      duration: 8000,
      action: { label: 'Undo', run: () => this.undone.set(true) },
    });
  }

  showPersistent(): void {
    this.toasts.show({
      title: 'Rendering your export',
      description: 'This toast waits for you — duration: 0.',
      variant: 'info',
      duration: 0,
    });
  }

  showStack(): void {
    this.variants.forEach((item, index) => {
      setTimeout(
        () => this.toasts.show({ title: item.title, description: item.description, variant: item.variant }),
        index * 180,
      );
    });
  }

  clear(): void {
    this.toasts.clear();
  }
}
