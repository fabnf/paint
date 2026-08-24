import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, IconComponent, type MenuEntry } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Menu — documentation page.
 */
@Component({
  selector: 'app-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, IconComponent],
  templateUrl: './menu.page.html',
  styleUrl: './components-page.scss',
})
export class MenuPage {
  readonly lastAction = signal<string>('—');

  readonly entries: readonly MenuEntry[] = [
    { type: 'header', label: 'Project' },
    { id: 'rename', label: 'Rename', icon: 'edit' },
    { id: 'duplicate', label: 'Duplicate', icon: 'copy', shortcut: '⌘D', keyShortcuts: 'Meta+D' },
    { id: 'export', label: 'Export', icon: 'download', description: 'CSV, JSON or PNG' },
    { type: 'divider' },
    { type: 'header', label: 'Danger zone' },
    { id: 'archive', label: 'Archive', icon: 'box', disabled: true },
    { id: 'delete', label: 'Delete project', icon: 'trash', destructive: true },
  ];

  readonly simpleEntries: readonly MenuEntry[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'copy', label: 'Copy link', icon: 'copy' },
    { id: 'delete', label: 'Delete', icon: 'trash', destructive: true },
  ];

  readonly viewEntries: readonly MenuEntry[] = [
    { type: 'header', label: 'Density' },
    { id: 'comfortable', label: 'Comfortable', icon: 'rows' },
    { id: 'compact', label: 'Compact', icon: 'list' },
    { type: 'divider' },
    { id: 'columns', label: 'Edit columns…', icon: 'columns', shortcut: '⌘K' },
  ];

  readonly basicSnippet = `<ds-menu
  label="Actions"
  [entries]="[
    { type: 'header', label: 'Project' },
    { id: 'rename', label: 'Rename', icon: 'edit' },
    { id: 'duplicate', label: 'Duplicate', icon: 'copy', shortcut: '⌘D', keyShortcuts: 'Meta+D' },
    { type: 'divider' },
    { id: 'delete', label: 'Delete project', icon: 'trash', destructive: true },
  ]"
  (itemSelect)="run($event)"
/>`;

  readonly triggerSnippet = `<!-- Any Button variant can trigger a menu -->
<ds-menu label="Actions" variant="primary" [entries]="entries" />
<ds-menu label="Export" variant="secondary" icon="download" [entries]="entries" />
<ds-menu label="Row actions" variant="ghost" icon="more" [iconOnly]="true" [caret]="false" [entries]="entries" />`;

  readonly alignSnippet = `<!-- Lines the panel up with the trigger's end edge -->
<ds-menu label="Actions" align="end" [entries]="entries" />`;

  readonly typesSnippet = `type MenuEntry = MenuItemOption | MenuHeader | MenuDivider;

interface MenuItemOption {
  id: string;              // what (itemSelect) emits
  label: string;
  icon?: IconName;
  description?: string;    // second line
  shortcut?: string;       // display only — Menu binds no keys
  keyShortcuts?: string;   // machine-readable, e.g. 'Meta+D' → aria-keyshortcuts
  disabled?: boolean;
  destructive?: boolean;   // painted in the danger role
}`;

  readonly inputs: readonly ApiRow[] = [
    {
      name: 'entries',
      type: 'readonly MenuEntry[]',
      default: '—',
      description: 'Required. Items, headers and dividers, in render order.',
    },
    { name: 'label', type: 'string', default: `'Menu'`, description: 'Trigger text, and the menu’s accessible name.' },
    { name: 'icon', type: 'IconName | null', default: 'null', description: 'Leading icon on the trigger.' },
    { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Hides the trigger text, keeps `label` as the name.' },
    { name: 'caret', type: 'boolean', default: 'true', description: 'Shows the trailing chevron.' },
    {
      name: 'variant',
      type: 'ButtonVariant',
      default: `'secondary'`,
      description: 'Any Paint Button variant — the trigger is a Button.',
    },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Trigger size.' },
    { name: 'align', type: `'start' | 'end'`, default: `'start'`, description: 'Which trigger edge the panel lines up with.' },
    { name: 'minWidth', type: 'number', default: '200', description: 'Minimum panel width in px.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the trigger.' },
  ];

  readonly outputs: readonly ApiRow[] = [
    { name: 'itemSelect', type: 'OutputEmitterRef<string>', default: '—', description: 'Emits the selected item’s id.' },
    {
      name: 'itemSelected',
      type: 'OutputEmitterRef<MenuItemOption>',
      default: '—',
      description: 'Emits the whole item, for callers that need more than the id.',
    },
    { name: 'openChange', type: 'OutputEmitterRef<boolean>', default: '—', description: 'Emits on every open and close.' },
  ];

  run(id: string): void {
    this.lastAction.set(id);
  }
}
