import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Slider — documentation page.
 */
@Component({
  selector: 'app-slider-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, ReactiveFormsModule],
  templateUrl: './slider.page.html',
  styleUrl: './primitives-page.scss',
})
export class SliderPage {
  readonly volume = signal(40);
  readonly opacity = signal(0.6);
  readonly budget = signal(1200);
  readonly budgetText = computed(() => `$${this.budget().toLocaleString()}`);
  readonly opacityText = computed(() => `${Math.round(this.opacity() * 100)}%`);

  /** The pair: a slider for the position, a number input for the exact value. */
  readonly quality = signal(72);

  readonly control = new FormControl<number | null>(25);

  readonly basicSnippet = `<ds-slider label="Volume" [(value)]="volume" [showValue]="true" />`;

  readonly stepSnippet = `<!-- Decimal steps round to their own precision: 0.1 + 0.2 is 0.3 -->
<ds-slider label="Opacity" [min]="0" [max]="1" [step]="0.05" [(value)]="opacity"
           [valueText]="opacityText()" [showValue]="true" />

<!-- valueText is aria-valuetext too: "$1,200", not "1200" -->
<ds-slider label="Budget" [max]="5000" [step]="100" [(value)]="budget"
           [valueText]="budgetText()" [showValue]="true" hint="In whole hundreds." />`;

  readonly pairSnippet = `<!-- The slider for the position, the number input for the exact value -->
<ds-slider label="Quality" [(value)]="quality" [showValue]="true" />
<ds-number-input ariaLabel="Quality" [min]="0" [max]="100" [(value)]="quality" suffix="%" />`;

  readonly formSnippet = `readonly control = new FormControl<number | null>(25);

// template
<ds-slider label="Brightness" [formControl]="control" [showValue]="true" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<number>', default: '0', description: 'The position on the range. Snapped to the step grid and kept inside [min, max].' },
    { name: 'min / max', type: 'number', default: '0 / 100', description: 'The ends of the track. Home and End jump to them.' },
    { name: 'step', type: 'number', default: '1', description: 'Distance between two positions. Arrows move one; Page keys move ten.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Show the value (or valueText) next to the label.' },
    { name: 'valueText', type: 'string', default: `''`, description: 'What the number means: “18 GB”, “45%”. Becomes aria-valuetext and the visible value.' },
    { name: 'tone', type: 'Tone', default: `'primary'`, description: 'Colour of the filled track and the thumb’s ring.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label, rendered as a real <label for>.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the track. Wired into aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely, joins aria-describedby.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Track and thumb size, from the control scale.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control. Forms can disable it too.' },
    { name: 'id / name', type: 'string', default: `''`, description: 'Id is generated when omitted; name is what a native submission sends.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'valueInput', type: 'OutputEmitterRef<number>', default: '—', description: 'Emits on every movement: each drag step, each key press.' },
    { name: 'changed', type: 'OutputEmitterRef<number>', default: '—', description: 'Emits when a movement is over: the pointer is released, or a key was pressed.' },
    { name: 'valueChange', type: 'OutputEmitterRef<number>', default: '—', description: 'The model output behind [(value)].' },
  ];
}