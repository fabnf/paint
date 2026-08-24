import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  DS_COMPONENTS,
  DS_PRIMITIVES,
  IconComponent,
  ToastService,
  type DialogSize,
  type SelectOption,
} from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Dialog — documentation page.
 */
@Component({
  selector: 'app-dialog-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, IconComponent],
  templateUrl: './dialog.page.html',
  styleUrl: './components-page.scss',
})
export class DialogPage {
  private readonly toasts = inject(ToastService);

  readonly confirm = signal(false);
  readonly form = signal(false);
  readonly brand = signal(false);
  readonly sized = signal(false);
  readonly locked = signal(false);
  readonly scrolling = signal(false);

  readonly size = signal<DialogSize>('md');
  readonly sizes: readonly DialogSize[] = ['sm', 'md', 'lg', 'xl'];

  readonly visibility: readonly SelectOption[] = [
    { value: 'private', label: 'Private', icon: 'user', description: 'Only you' },
    { value: 'team', label: 'Team', icon: 'layers', description: 'Everyone in the workspace' },
    { value: 'public', label: 'Public', icon: 'externalLink', description: 'Anyone with the link' },
  ];

  readonly projectName = signal('Mural — March');
  readonly projectVisibility = signal<string | null>('team');
  readonly paragraphs = Array.from({ length: 8 }, (_, index) => index);

  readonly confirmSnippet = `<ds-dialog
  [(open)]="confirmOpen"
  title="Delete project"
  description="This cannot be undone."
  tone="danger"
  icon="warning"
  (closed)="onClosed($event)"
>
  <ds-text>Everything in “Mural — March” will be removed.</ds-text>

  <ds-flex dsDialogActions [gap]="2" justify="end">
    <ds-button variant="ghost" (clicked)="confirmOpen.set(false)">Cancel</ds-button>
    <ds-button variant="danger" iconStart="trash" (clicked)="destroy()">Delete</ds-button>
  </ds-flex>
</ds-dialog>`;

  readonly formSnippet = `<ds-dialog [(open)]="open" title="Project settings" size="md" icon="settings">
  <ds-stack [gap]="4">
    <ds-stack [gap]="2">
      <ds-text variant="label" as="label">Name</ds-text>
      <input class="form-control" dsDialogAutofocus [value]="name()" />
    </ds-stack>
    <ds-stack [gap]="2">
      <ds-text variant="label" as="label">Visibility</ds-text>
      <ds-select [options]="visibility" [(value)]="visibility" />
    </ds-stack>
  </ds-stack>

  <ds-flex dsDialogActions [gap]="2" justify="end">
    <ds-button variant="ghost" (clicked)="open.set(false)">Cancel</ds-button>
    <ds-button variant="primary" (clicked)="save()">Save changes</ds-button>
  </ds-flex>
</ds-dialog>`;

  readonly focusSnippet = `<!-- Focus lands on the sheet itself, so screen readers read the title
     before anything else. Mark one control to take it instead: -->
<input class="form-control" dsDialogAutofocus />`;

  readonly lockedSnippet = `<!-- No Escape, no backdrop click, no close button:
     the user must make a choice -->
<ds-dialog [(open)]="open" title="Session expired" [dismissible]="false">…</ds-dialog>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'open', type: 'model<boolean>', default: 'false', description: 'Visibility. Two-way bindable.' },
    { name: 'title', type: 'string', default: '—', description: 'Required: a dialog that cannot be announced is not a dialog.' },
    { name: 'description', type: 'string', default: `''`, description: 'Supporting line; wired up as aria-describedby.' },
    { name: 'size', type: `'sm' | 'md' | 'lg' | 'xl'`, default: `'md'`, description: 'Sheet width, from Bootstrap’s modal sizes.' },
    { name: 'tone', type: `'default' | 'danger' | 'brand'`, default: `'default'`, description: 'Inks the top edge and the icon.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'Icon beside the title.' },
    { name: 'dismissible', type: 'boolean', default: 'true', description: 'Allows Escape, backdrop click and the close button.' },
    { name: 'scrollable', type: 'boolean', default: 'false', description: 'Scrolls the body inside the sheet instead of the page.' },
    { name: 'closeLabel', type: 'string', default: `'Close dialog'`, description: 'Accessible name for the dismiss button.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    {
      name: 'closed',
      type: `OutputEmitterRef<'dismiss' | 'escape' | 'backdrop' | 'api'>`,
      default: '—',
      description: 'Emits how the dialog closed — useful for analytics and “are you sure”.',
    },
    { name: 'opened', type: 'OutputEmitterRef<void>', default: '—', description: 'Emits once focus has moved inside.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '(default)', type: 'content', default: '—', description: 'The body.' },
    { name: '[dsDialogActions]', type: 'content', default: '—', description: 'Footer actions. The footer disappears when empty.' },
    { name: '[dsDialogAutofocus]', type: 'attribute', default: '—', description: 'Marks the control that should take focus on open.' },
  ];

  onClosed(reason: string): void {
    this.toasts.info(`Dialog closed`, { description: `reason: ${reason}`, duration: 2500 });
  }

  destroy(): void {
    this.confirm.set(false);
    this.toasts.danger('Project deleted', {
      description: 'Mural — March is gone.',
      action: { label: 'Undo', run: () => this.toasts.success('Project restored') },
      duration: 6000,
    });
  }

  save(): void {
    this.form.set(false);
    this.toasts.success('Settings saved', { description: this.projectName() });
  }

  openSized(size: DialogSize): void {
    this.size.set(size);
    this.sized.set(true);
  }
}
