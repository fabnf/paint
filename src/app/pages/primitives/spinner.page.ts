import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_PRIMITIVES, TONES, type SpinnerSize } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Spinner — documentation page.
 */
@Component({
  selector: 'app-spinner-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './spinner.page.html',
  styleUrl: './primitives-page.scss',
})
export class SpinnerPage {
  readonly tones = TONES;
  readonly sizes: readonly SpinnerSize[] = ['xs', 'sm', 'md', 'lg'];

  readonly saving = signal(false);

  save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 1800);
  }

  readonly basicSnippet = `<ds-spinner />
<ds-spinner size="lg" tone="accent" label="Loading invoices…" />`;

  readonly decorativeSnippet = `<!-- The button already reports aria-busy; two voices is one too many -->
<ds-button [loading]="true">Saving</ds-button>

<!-- which is this, inside <ds-button>: -->
<ds-spinner [size]="iconSize()" tone="inherit" [decorative]="true" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'size', type: `'xs' | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Diameter. The stroke scales with it.' },
    { name: 'tone', type: `Tone | 'inherit'`, default: `'primary'`, description: 'inherit takes the surrounding currentColor — a spinner in a filled button.' },
    { name: 'label', type: 'string', default: `'Loading…'`, description: 'What is being waited for. Announced once, politely, when the spinner appears.' },
    { name: 'decorative', type: 'boolean', default: 'false', description: 'No role, no name. For controls that already say they are busy.' },
  ];
}
