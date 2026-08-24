import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_PRIMITIVES, type ButtonVariant } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Button — documentation page.
 */
@Component({
  selector: 'app-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './button.page.html',
  styleUrl: './primitives-page.scss',
})
export class ButtonPage {
  readonly variants: ReadonlyArray<{ variant: ButtonVariant; when: string }> = [
    { variant: 'primary', when: 'The one obvious action on the screen.' },
    { variant: 'secondary', when: 'Supporting actions that sit next to a primary.' },
    { variant: 'outline', when: 'Emphasis without a filled block of color.' },
    { variant: 'ghost', when: 'Toolbars, icon actions, low-noise controls.' },
    { variant: 'success', when: 'Confirming a positive, irreversible step.' },
    { variant: 'danger', when: 'Destructive actions. Never the default.' },
    { variant: 'link', when: 'Navigation that behaves like text.' },
  ];

  /** Demonstrates the loading state end to end. */
  readonly saving = signal(false);
  readonly saved = signal(false);

  save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.saved.set(false);
    setTimeout(() => {
      this.saving.set(false);
      this.saved.set(true);
    }, 1400);
  }

  readonly variantSnippet = `<ds-button variant="primary">Save changes</ds-button>
<ds-button variant="secondary">Cancel</ds-button>
<ds-button variant="outline">Duplicate</ds-button>
<ds-button variant="ghost">Rename</ds-button>
<ds-button variant="success">Approve</ds-button>
<ds-button variant="danger">Delete</ds-button>
<ds-button variant="link">Learn more</ds-button>`;

  readonly sizeSnippet = `<ds-button size="sm">Small</ds-button>
<ds-button size="md">Medium</ds-button>
<ds-button size="lg">Large</ds-button>`;

  readonly iconSnippet = `<ds-button iconStart="plus">New file</ds-button>
<ds-button variant="secondary" iconEnd="arrowRight">Continue</ds-button>

<!-- Icon-only: label becomes the accessible name -->
<ds-button variant="ghost" iconStart="settings" label="Settings" />`;

  readonly stateSnippet = `<ds-button [loading]="saving()" (clicked)="save()">Save changes</ds-button>
<ds-button [disabled]="true">Unavailable</ds-button>
<ds-button variant="ghost" [active]="true">Selected</ds-button>`;

  readonly linkSnippet = `<!-- Renders <button> -->
<ds-button (clicked)="save()">Save</ds-button>

<!-- Renders <a class="btn"> driven by the router. The input is "link", not
     "routerLink": Angular's RouterLink directive matches that attribute, and
     would add a second tab stop on the host element. -->
<ds-button variant="link" link="/foundations" iconEnd="arrowRight">Foundations</ds-button>

<!-- Renders <a class="btn"> with a real href -->
<ds-button variant="secondary" href="https://getbootstrap.com" target="_blank" iconEnd="externalLink">
  Bootstrap
</ds-button>`;

  readonly fullWidthSnippet = `<ds-button variant="primary" [fullWidth]="true" iconStart="check">
  Confirm and continue
</ds-button>`;

  readonly inputs: readonly ApiRow[] = [
    {
      name: 'variant',
      type: `'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'link'`,
      default: `'primary'`,
      description: 'Semantic intent. Maps to a Bootstrap .btn-* class.',
    },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Control height from Paint’s control scale.' },
    { name: 'type', type: `'button' | 'submit' | 'reset'`, default: `'button'`, description: 'Native type. Ignored for links.' },
    { name: 'href', type: 'string | null', default: 'null', description: 'Renders an <a class="btn"> for cross-document links.' },
    {
      name: 'link',
      type: 'string | unknown[] | null',
      default: 'null',
      description:
        'In-app destination: renders an <a class="btn"> driven by the router. Not called routerLink, which would put a second tab stop on the host.',
    },
    { name: 'target', type: 'string | null', default: 'null', description: 'Anchor target. _blank adds rel="noreferrer noopener".' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction and dims the control.' },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description:
        'Spinner + aria-busy + aria-disabled. Stays focusable on purpose: going disabled mid-action would drop focus to the body.',
    },
    { name: 'iconStart', type: 'IconName | null', default: 'null', description: 'Icon before the label.' },
    { name: 'iconEnd', type: 'IconName | null', default: 'null', description: 'Icon after the label.' },
    { name: 'label', type: 'string', default: `''`, description: 'Accessible name. With an icon and no text, renders icon-only.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretches the control to the container width.' },
    { name: 'pill', type: 'boolean', default: 'false', description: 'Fully rounded corners.' },
    { name: 'active', type: 'boolean', default: 'false', description: 'Reflects a pressed or selected state.' },
    { name: 'ariaExpanded', type: 'boolean | null', default: 'null', description: 'Forwards aria-expanded for disclosure triggers.' },
    { name: 'ariaControls', type: 'string | null', default: 'null', description: 'Forwards aria-controls.' },
    { name: 'ariaPressed', type: 'boolean | null', default: 'null', description: 'Forwards aria-pressed for toggle buttons.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    {
      name: 'clicked',
      type: 'OutputEmitterRef<MouseEvent>',
      default: '—',
      description: 'Emits on click. Disabled and loading buttons never emit.',
    },
  ];
}
