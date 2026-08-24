import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_PRIMITIVES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Divider — documentation page.
 */
@Component({
  selector: 'app-divider-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './divider.page.html',
  styleUrl: './primitives-page.scss',
})
export class DividerPage {
  readonly basicSnippet = `<ds-divider />
<ds-divider variant="dashed" [spacing]="6" />
<ds-divider [strong]="true" weight="2px" />`;

  readonly labelSnippet = `<ds-divider label="or" />
<ds-divider label="Archived" labelPosition="start" variant="dashed" />`;

  readonly verticalSnippet = `<ds-flex align="center" [gap]="3">
  <ds-text>Draft</ds-text>
  <ds-divider orientation="vertical" [spacing]="0" />
  <ds-text>Edited 2h ago</ds-text>
</ds-flex>`;

  readonly stackSnippet = `<!-- Between every child of a list, reach for the Stack instead -->
<ds-stack [gap]="3" [divided]="true">
  <div>Tokens</div>
  <div>Icons</div>
  <div>Components</div>
</ds-stack>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'orientation', type: `'horizontal' | 'vertical'`, default: `'horizontal'`, description: 'A vertical divider stretches to its flex parent.' },
    { name: 'variant', type: `'solid' | 'dashed'`, default: `'solid'`, description: 'The line style.' },
    { name: 'label', type: 'string', default: `''`, description: 'A word in the middle of the rule. Horizontal only, and it becomes the separator’s name.' },
    { name: 'labelPosition', type: `'start' | 'center' | 'end'`, default: `'center'`, description: 'Where the word sits.' },
    { name: 'spacing', type: 'SpaceValue', default: '4', description: 'Margin on the axis the divider cuts across, in space tokens.' },
    { name: 'strong', type: 'boolean', default: 'false', description: 'A heavier rule, for the edge of a region rather than between two rows.' },
    { name: 'weight', type: 'string', default: `'1px'`, description: 'Line thickness. A divider is a hairline; this is here for the 2px case.' },
    { name: 'decorative', type: 'boolean', default: 'false', description: 'Removes role="separator", so a screen reader does not count rules.' },
  ];
}
