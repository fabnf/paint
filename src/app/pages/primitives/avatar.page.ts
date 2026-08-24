import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DS_PRIMITIVES, type AvatarSize, type AvatarStatus } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Avatar — documentation page.
 */
@Component({
  selector: 'app-avatar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './avatar.page.html',
  styleUrl: './primitives-page.scss',
})
export class AvatarPage {
  readonly people = [
    'Ada Lovelace',
    'Grace Hopper',
    'Alan Turing',
    'Katherine Johnson',
    'Mary Jackson',
    'Dorothy Vaughan',
  ];

  readonly sizes: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  readonly statuses: readonly AvatarStatus[] = ['online', 'away', 'busy', 'offline'];

  /** An inline SVG, so the example never depends on the network. */
  readonly photo =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
        '<stop offset="0" stop-color="#ef2d92"/><stop offset="1" stop-color="#7c3dff"/>',
        '</linearGradient></defs>',
        '<rect width="64" height="64" fill="url(#g)"/>',
        '<circle cx="32" cy="23" r="11" fill="#ffffff" opacity="0.92"/>',
        '<path d="M8 64c0-14 11-22 24-22s24 8 24 22z" fill="#ffffff" opacity="0.92"/>',
        '</svg>',
      ].join(''),
    );

  readonly brokenPhoto = '/this-photo-does-not-exist.png';

  readonly basicSnippet = `<ds-avatar name="Ada Lovelace" src="/ada.jpg" />
<ds-avatar name="Grace Hopper" />          <!-- initials -->
<ds-avatar icon="palette" />               <!-- no name: decoration -->`;

  readonly statusSnippet = `<!-- The dot is hidden; the presence is part of the one name -->
<ds-avatar name="Grace Hopper" status="online" />
<!-- Screen reader: "Grace Hopper, Online" -->

<ds-avatar name="Ada Lovelace" status="busy" statusLabel="In a meeting" />`;

  readonly decorativeSnippet = `<!-- Beside the name it repeats, the avatar is decoration -->
<ds-flex align="center" [gap]="2">
  <ds-avatar name="Ada Lovelace" size="xs" [decorative]="true" />
  <ds-text>Ada Lovelace</ds-text>
</ds-flex>`;

  readonly groupSnippet = `<!-- A stack of avatars is a Flex with a negative gap — no component needed -->
<ds-flex class="avatar-stack" align="center">
  @for (person of people.slice(0, 4); track person) {
    <ds-avatar [name]="person" size="sm" />
  }
  <ds-avatar name="+2 more" size="sm" [decorative]="true" />
</ds-flex>`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'name', type: 'string', default: `''`, description: 'The person or thing. Becomes the initials, the tint and the accessible name.' },
    { name: 'src', type: 'string | null', default: 'null', description: 'Photo. Falls back to initials if it fails to load.' },
    { name: 'alt', type: 'string', default: `''`, description: 'Overrides the accessible name, which is otherwise the name.' },
    { name: 'size', type: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`, default: `'md'`, description: 'From the avatar scale in the token layer.' },
    { name: 'shape', type: `'circle' | 'square'`, default: `'circle'`, description: 'People are round; projects, teams and files are square.' },
    { name: 'icon', type: 'IconName', default: `'user'`, description: 'Fallback when there is no src and no name.' },
    { name: 'status', type: `'online' | 'away' | 'busy' | 'offline' | null`, default: 'null', description: 'Presence dot. Folded into the accessible name, never announced separately.' },
    { name: 'statusLabel', type: 'string', default: 'from status', description: 'Overrides the spoken presence, e.g. “In a meeting”.' },
    { name: 'decorative', type: 'boolean', default: 'false', description: 'Hides the avatar from assistive tech — for when the name is already beside it.' },
    { name: 'title', type: 'string', default: `''`, description: 'Native tooltip. Off by default: a tooltip is not an accessible name.' },
  ];
}
