import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_PRIMITIVES, TONES } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Chip — documentation page.
 */
@Component({
  selector: 'app-chip-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './chip.page.html',
  styleUrl: './primitives-page.scss',
})
export class ChipPage {
  readonly tones = TONES;

  readonly all = ['Brand', 'Accessibility', 'Performance', 'Tokens', 'Documentation'];
  readonly tags = signal<readonly string[]>([...this.all]);

  readonly recipients = signal<readonly string[]>(['Ada Lovelace', 'Grace Hopper']);

  remove(tag: string): void {
    this.tags.update((tags) => tags.filter((item) => item !== tag));
  }

  removeRecipient(name: string): void {
    this.recipients.update((people) => people.filter((person) => person !== name));
  }

  reset(): void {
    this.tags.set([...this.all]);
    this.recipients.set(['Ada Lovelace', 'Grace Hopper']);
  }

  readonly basicSnippet = `<ds-chip>Design system</ds-chip>
<ds-chip tone="primary" icon="palette">Brand</ds-chip>
<ds-chip tone="accent" variant="outline" size="md">Tokens</ds-chip>`;

  readonly removableSnippet = `<!-- The chip asks; the list that owns it decides -->
@for (tag of tags(); track tag) {
  <ds-chip tone="primary" [removable]="true" [removeLabel]="'Remove ' + tag" (removed)="remove(tag)">
    {{ tag }}
  </ds-chip>
}`;

  readonly leadingSnippet = `<!-- Anything can lead: an avatar, a swatch, a flag -->
<ds-chip size="md" [removable]="true" removeLabel="Remove Ada Lovelace">
  <ds-avatar dsChipLeading name="Ada Lovelace" size="xs" [decorative]="true" />
  Ada Lovelace
</ds-chip>`;

  readonly tabbableSnippet = `<!-- Inside a widget that already owns the keyboard (a combobox),
     the remove button stays clickable but leaves the tab order -->
<ds-chip [removable]="true" [removeTabbable]="false" (removed)="unpick()">Ada</ds-chip>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'tone', type: 'Tone', default: `'neutral'`, description: 'What the chip means. Resolved to colour by the theme.' },
    { name: 'variant', type: `'soft' | 'solid' | 'outline'`, default: `'soft'`, description: 'How the tone is painted.' },
    { name: 'size', type: `'sm' | 'md'`, default: `'sm'`, description: 'Chip height.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'Leading icon. Decorative.' },
    { name: 'removable', type: 'boolean', default: 'false', description: 'Grows a real <button> that emits removed.' },
    { name: 'removeLabel', type: 'string', default: `'Remove'`, description: 'Accessible name of the remove button. Say what is being removed.' },
    { name: 'removeTabbable', type: 'boolean', default: 'true', description: 'Keep the remove button in the tab order. Off only inside a widget that owns the keyboard.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Drops the tone and blocks removal.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'removed', type: 'OutputEmitterRef<MouseEvent>', default: '—', description: 'The remove button was pressed. The chip does not remove itself.' },
  ];
}
