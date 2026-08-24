import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DS_PRIMITIVES, ThemeService } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Switch — documentation page.
 */
@Component({
  selector: 'app-switch-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './switch.page.html',
  styleUrl: './primitives-page.scss',
})
export class SwitchPage {
  private readonly theme = inject(ThemeService);

  readonly digests = signal(true);
  readonly mentions = signal(false);
  readonly grain = signal(true);

  /** A switch takes effect immediately — so this one really does re-tint the page. */
  readonly dark = this.theme.isDark;

  setDark(dark: boolean): void {
    this.theme.setMode(dark ? 'dark' : 'light');
  }

  readonly basicSnippet = `<ds-switch label="Email digests" hint="A summary every Monday." [(checked)]="digests" />`;

  readonly themeSnippet = `// A switch is a promise: the change lands the moment it moves
<ds-switch label="Dark mode" [checked]="theme.isDark()" (changed)="theme.setMode($event ? 'dark' : 'light')" />`;

  readonly placementSnippet = `<!-- Settings rows read label-first, and the track lines up down the edge -->
<ds-switch label="Wi-Fi" labelPlacement="start" [(checked)]="wifi" />
<ds-switch label="Bluetooth" labelPlacement="start" [(checked)]="bluetooth" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'checked', type: 'model<boolean>', default: 'false', description: 'On / off. Two-way bindable and form-bound.' },
    { name: 'labelPlacement', type: `'start' | 'end'`, default: `'end'`, description: 'Put the label before the track — the settings-row layout.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label. Also accepts projected content.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label.' },
    { name: 'hint', type: 'string', default: `''`, description: 'Helper text under the label. Wired into aria-describedby.' },
    { name: 'error', type: 'string', default: `''`, description: 'Error text. Implies invalid, announced politely.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Track size, from Paint’s control scale.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets required on the control and marks the label.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Paints the invalid state without a message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control. Forms can disable it too.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'changed', type: 'OutputEmitterRef<boolean>', default: '—', description: 'Emits on user interaction only — never when a form writes the value in.' },
    { name: 'checkedChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'The model output behind [(checked)].' },
  ];
}
