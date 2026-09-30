import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DS_COMPONENTS, DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * RangeControl — documentation page.
 */
@Component({
  selector: 'app-range-control-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, ReactiveFormsModule],
  templateUrl: './range-control.page.html',
  styleUrl: './components-page.scss',
})
export class RangeControlPage {
  readonly volume = signal(40);
  readonly opacity = signal(0.6);
  readonly budget = signal(1200);

  readonly control = new FormControl<number | null>(25);

  readonly basicSnippet = `<ds-range-control label="Volume" [(value)]="volume" suffix="%" />`;

  readonly rulesSnippet = `<!-- One min, max and step for both. Decimal steps round to their own precision. -->
<ds-range-control label="Opacity" [min]="0" [max]="1" [step]="0.05" [(value)]="opacity" />

<!-- The unit is spoken with the slider's value: "$1,200", not "1200" -->
<ds-range-control label="Budget" [max]="5000" [step]="100" prefix="$" [(value)]="budget"
                  hint="In whole hundreds." />`;

  readonly formSnippet = `readonly control = new FormControl<number | null>(25);

// template — one ControlValueAccessor, two controls
<ds-range-control label="Brightness" [formControl]="control" suffix="%" />

// or inside a field, which then owns the label
<ds-form-field label="Brightness" hint="Of the backlight.">
  <ds-range-control [formControl]="control" suffix="%" />
</ds-form-field>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'model<number>', default: '0', description: 'The one value both controls show. Clamped and snapped on the way in.' },
    { name: 'min / max', type: 'number', default: '0 / 100', description: 'The bounds, for both controls.' },
    { name: 'step', type: 'number', default: '1', description: 'The grid, for both controls. Anchored at min.' },
    { name: 'prefix / suffix', type: 'string', default: `''`, description: 'Static text around the digits — $, %. Also spoken with the slider’s value.' },
    { name: 'tone', type: 'Tone', default: `'primary'`, description: 'Colour of the slider’s filled track.' },
    { name: 'decrementLabel / incrementLabel', type: 'string', default: `'Decrease' / 'Increase'`, description: 'Accessible names of the − / + buttons.' },
    { name: 'label', type: 'string', default: `''`, description: 'One visible label: a <label for> on the slider, aria-labelledby on the number field.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name for both, when there is no visible label.' },
    { name: 'hint / error', type: 'string', default: `''`, description: 'Drawn once; describes both controls. An error sets aria-invalid on both.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Control scale, for both.' },
    { name: 'required / disabled / invalid', type: 'boolean', default: 'false', description: 'As on every form atom. Forms can disable it too.' },
    { name: 'id / name', type: 'string', default: `''`, description: 'Id of the slider (the number field is id + "-number"); name of the slider.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'valueInput', type: 'OutputEmitterRef<number>', default: '—', description: 'Emits on every change, from either control.' },
    { name: 'changed', type: 'OutputEmitterRef<number>', default: '—', description: 'Emits when a gesture is over: the thumb is released, a key is pressed, the field settles.' },
    { name: 'valueChange', type: 'OutputEmitterRef<number>', default: '—', description: 'The model output behind [(value)].' },
  ];
}