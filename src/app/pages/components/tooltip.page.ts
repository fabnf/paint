import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, IconComponent } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Tooltip — documentation page.
 */
@Component({
  selector: 'app-tooltip-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, IconComponent],
  templateUrl: './tooltip.page.html',
  styleUrl: './components-page.scss',
})
export class TooltipPage {
  readonly basicSnippet = `<ds-tooltip text="Copy to clipboard">
  <ds-button variant="ghost" iconStart="copy" label="Copy" />
</ds-tooltip>`;

  readonly placementSnippet = `<ds-tooltip text="Above (default)" placement="top">…</ds-tooltip>
<ds-tooltip text="Below" placement="bottom">…</ds-tooltip>
<ds-tooltip text="Before" placement="start">…</ds-tooltip>
<ds-tooltip text="After" placement="end">…</ds-tooltip>`;

  readonly nameSnippet = `<!-- The button is named with or without the tooltip. The bubble describes. -->
<ds-tooltip text="Copy to clipboard">
  <ds-button variant="ghost" iconStart="copy" label="Copy" />
</ds-tooltip>

<!-- Never this: take the tooltip away and the button has no name at all. -->
<ds-tooltip text="Copy">
  <ds-button variant="ghost" iconStart="copy" />
</ds-tooltip>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'text', type: 'string', default: 'required', description: 'The description. Short — it disappears when the pointer moves.' },
    { name: 'placement', type: `'top' | 'bottom' | 'start' | 'end'`, default: `'top'`, description: 'Preferred side. Top and bottom flip when the viewport says no.' },
    { name: 'openDelay', type: 'number', default: '300', description: 'Hover delay in ms. Keyboard focus ignores it: whoever tabbed here asked.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Suppresses the bubble without unwiring the accessible description.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'openChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'Emits on every show and hide.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '(default)', type: 'content', default: '—', description: 'The trigger. Its first focusable element gets the aria-describedby.' },
  ];
}
