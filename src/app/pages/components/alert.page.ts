import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, TONES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Alert — documentation page.
 */
@Component({
  selector: 'app-alert-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI],
  templateUrl: './alert.page.html',
  styleUrl: './components-page.scss',
})
export class AlertPage {
  readonly tones = TONES;

  readonly visible = signal(true);
  readonly saveFailed = signal(false);

  save(): void {
    this.saveFailed.set(true);
  }

  readonly basicSnippet = `<ds-alert tone="warning" title="Your trial ends in 3 days">
  Add a payment method to keep your projects.
  <ds-flex dsAlertActions [gap]="2">
    <ds-button size="sm" variant="secondary">Add payment</ds-button>
    <ds-button size="sm" variant="ghost">Remind me later</ds-button>
  </ds-flex>
</ds-alert>`;

  readonly liveSnippet = `<!-- Part of the page. A screen reader is already reading the page. -->
<ds-alert tone="info" title="This project is in beta">…</ds-alert>

<!-- Appears after a failed save: say so, once, without interrupting. -->
@if (error()) {
  <ds-alert tone="danger" live="assertive" title="Could not save" [dismissible]="true"
            (dismissed)="error.set(null)">
    {{ error() }}
  </ds-alert>
}`;

  readonly dismissSnippet = `// The alert does not remove itself — the same bargain as <ds-chip>.
// A component that deletes its own DOM node cannot be undone.
@if (visible()) {
  <ds-alert [dismissible]="true" (dismissed)="visible.set(false)">…</ds-alert>
}`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'tone', type: 'Tone', default: `'info'`, description: 'What the message means. Resolved to colour by the theme.' },
    { name: 'variant', type: `'soft' | 'outline'`, default: `'soft'`, description: 'Tinted block, or a bordered one on the surface.' },
    { name: 'accentuated', type: 'boolean', default: 'false', description: 'A rule down the leading edge, for an alert that must be found in a long page.' },
    { name: 'title', type: 'string', default: `''`, description: 'The headline. The rest is projected content.' },
    { name: 'icon', type: 'IconName | null', default: 'per tone', description: 'Overrides the tone’s icon.' },
    { name: 'showIcon', type: 'boolean', default: 'true', description: 'The icon repeats the tone, which repeats the words. It is decoration.' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'A named close button that emits. The alert does not remove itself.' },
    { name: 'dismissLabel', type: 'string', default: `'Dismiss'`, description: 'The close button’s accessible name.' },
    { name: 'live', type: `'off' | 'polite' | 'assertive'`, default: `'off'`, description: 'role="status" or role="alert". Off for an alert that is part of the page.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'dismissed', type: 'OutputEmitterRef<void>', default: '—', description: 'The dismiss button was pressed.' },
  ];

  readonly slots: readonly ApiRow[] = [
    { name: '(default)', type: 'content', default: '—', description: 'The message, under the title.' },
    { name: '[dsAlertActions]', type: 'content', default: '—', description: 'What to do about it. Buttons, small ones.' },
  ];
}
