import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, type AccordionVariant } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Accordion — documentation page.
 */
@Component({
  selector: 'app-accordion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './accordion.page.html',
  styleUrl: './components-page.scss',
})
export class AccordionPage {
  /** The settings demo: ids, never indexes. */
  readonly open = signal<readonly string[]>(['notifications']);
  readonly variant = signal<AccordionVariant>('separated');
  readonly multiple = signal(true);

  readonly digests = signal(true);
  readonly mentions = signal(false);
  readonly twoFactor = signal(false);
  readonly theme = signal<string | null>('system');

  readonly themes = [
    { value: 'system', label: 'Follow the system' },
    { value: 'light', label: 'Always light' },
    { value: 'dark', label: 'Always dark' },
  ];

  readonly issues = computed(() => (this.twoFactor() ? 0 : 1));

  /** The disclosure demo. */
  readonly advanced = signal(false);

  readonly settingsSnippet = `<ds-accordion [(expanded)]="open" [multiple]="true" variant="separated">
  <ds-accordion-item itemId="notifications" label="Notifications" icon="bell"
                     description="What reaches you, and how">
    <!-- Interactive content sits outside the button: a switch inside a button
         is a control inside a control, and neither can be operated. -->
    <ds-switch dsAccordionTrailing ariaLabel="Notifications" [(checked)]="digests" />
    …
  </ds-accordion-item>

  <ds-accordion-item itemId="security" label="Security" icon="toggle"
                     [badge]="issues()" badgeLabel="1 issue" badgeTone="warning">
    …
  </ds-accordion-item>
</ds-accordion>`;

  readonly disclosureSnippet = `<!-- One item, on its own, owning its own state. That is a disclosure,
     and it is not a different component. -->
<ds-accordion-item label="Advanced options" [(expanded)]="advanced">
  …
</ds-accordion-item>`;

  readonly keyboardSnippet = `// Enter, Space   the button's own — the header is a <button>
// ↑ ↓            the previous / next header, wrapping
// Home End       the first / last header
// Tab            the next header, then out: a header is where the content is`;

  readonly accordionInputs: readonly ApiRow[] = [
    { name: 'expanded', type: 'model<readonly string[]>', default: '[]', description: 'The open items, by id. A panel that opens because the list was re-sorted is a fortnight of debugging.' },
    { name: 'multiple', type: 'boolean', default: 'false', description: 'Several panels open at once. The default is one, like a filing cabinet.' },
    { name: 'collapsible', type: 'boolean', default: 'true', description: 'In single mode, can the open panel be closed? false when closing everything leaves a blank screen.' },
    { name: 'variant', type: `'bordered' | 'separated' | 'flush'`, default: `'bordered'`, description: 'One box, a card per item, or rules only.' },
    { name: 'iconPosition', type: `'start' | 'end'`, default: `'end'`, description: 'Which side the chevron sits on.' },
    { name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3', description: 'The level of the real heading each header is wrapped in. Only the page knows what is above it.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Every header. They stay focusable — see below.' },
  ];

  readonly accordionOutputs: readonly ApiRow[] = [
    { name: 'itemToggled', type: 'OutputEmitterRef<{ id, expanded }>', default: '—', description: 'Which item opened or closed, and which way.' },
    { name: 'expandedChange', type: 'OutputEmitterRef<readonly string[]>', default: '—', description: 'The model output behind [(expanded)].' },
  ];

  readonly itemInputs: readonly ApiRow[] = [
    { name: 'label', type: 'string', default: '—', description: 'Required. The header’s text, inside the button.' },
    { name: 'itemId', type: 'string', default: 'generated', description: 'Identity inside the accordion.' },
    { name: 'description', type: 'string', default: `''`, description: 'A second line under the label, inside the button.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'A leading icon. Decorative.' },
    { name: 'badge', type: 'string | number | null', default: 'null', description: 'Drawn inside the button: “2” is part of what the header says.' },
    { name: 'badgeLabel', type: 'string', default: `''`, description: 'What the badge is, in words: “2 issues”.' },
    { name: 'badgeTone', type: 'Tone', default: `'neutral'`, description: 'The badge’s tone.' },
    { name: 'expanded', type: 'model<boolean>', default: 'false', description: 'Standalone only. Inside an accordion, the accordion owns this.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'aria-disabled, not disabled: the header stays reachable.' },
    { name: 'headingLevel / variant', type: '…', default: '3 / flush', description: 'Standalone only. An accordion sets these for all of its items.' },
  ];

  readonly itemOutputs: readonly ApiRow[] = [
    { name: 'toggled', type: 'OutputEmitterRef<boolean>', default: '—', description: 'Emits on every open and close, however it happened.' },
  ];
}
