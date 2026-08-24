import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  CONTRAST_AA_NON_TEXT,
  CONTRAST_AA_TEXT,
  DS_COMPONENTS,
  DS_PRIMITIVES,
  IconComponent,
  ThemeService,
  ToastService,
  contrastRatioRounded,
  darkSemanticColors,
  lightSemanticColors,
  type DataTableColumn,
  type IconName,
  type RowKey,
  type SemanticColors,
} from '../../design-system';
import { DOC_UI } from '../docs';

interface KeyboardRow extends Record<string, unknown> {
  id: string;
  component: string;
  keys: string;
  behaviour: string;
}

interface ContrastRow extends Record<string, unknown> {
  id: string;
  pair: string;
  kind: 'Text' | 'UI';
  ratio: number;
  required: number;
}

/**
 * Accessibility — the contract, and the evidence for it.
 */
@Component({
  selector: 'app-accessibility',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DS_COMPONENTS, DOC_UI, IconComponent],
  templateUrl: './accessibility.page.html',
  styleUrl: './accessibility.page.scss',
})
export class AccessibilityPage {
  private readonly themeService = inject(ThemeService);
  private readonly toasts = inject(ToastService);

  readonly mode = this.themeService.mode;

  /** Demo state for the "try it" panel. */
  readonly demoDialog = signal(false);
  readonly demoValue = signal<string[]>(['keyboard']);

  readonly demoOptions = [
    { value: 'keyboard', label: 'Keyboard', icon: 'zap' as IconName },
    { value: 'screen-reader', label: 'Screen reader', icon: 'bell' as IconName },
    { value: 'contrast', label: 'Contrast', icon: 'palette' as IconName },
    { value: 'motion', label: 'Reduced motion', icon: 'refresh' as IconName },
  ];

  readonly demoEntries = [
    { id: 'rename', label: 'Rename', icon: 'edit' as IconName },
    { id: 'duplicate', label: 'Duplicate', icon: 'copy' as IconName, shortcut: '⌘D', keyShortcuts: 'Meta+D' },
    { type: 'divider' as const },
    { id: 'delete', label: 'Delete', icon: 'trash' as IconName, destructive: true },
  ];

  readonly principles = [
    {
      icon: 'zap' as IconName,
      title: 'Everything by keyboard',
      body: 'Every component implements its ARIA authoring-practices pattern: arrows move, Home and End jump, Escape backs out, and Tab never lands somewhere it cannot leave.',
    },
    {
      icon: 'window' as IconName,
      title: 'Focus is never lost',
      body: 'Overlays trap focus while open and hand it back to the trigger on close. A button that starts loading keeps its place in the tab order instead of going disabled underneath you.',
    },
    {
      icon: 'bell' as IconName,
      title: 'State is spoken, not just drawn',
      body: 'Sorting, selection, loading, toasts and copy-to-clipboard all reach assistive tech through live regions — because a changed icon is invisible to a screen reader.',
    },
    {
      icon: 'palette' as IconName,
      title: 'Contrast is a token, not a review note',
      body: 'Every text role clears 4.5:1 on every surface it is allowed on, and control boundaries clear 3:1. The unit suite fails if a token edit breaks it.',
    },
  ];

  readonly keyboardColumns: readonly DataTableColumn<KeyboardRow>[] = [
    { key: 'component', header: 'Component', sortable: true, width: '9rem' },
    { key: 'keys', header: 'Keys', width: '12rem' },
    { key: 'behaviour', header: 'Behaviour' },
  ];

  readonly keyboardRows: readonly KeyboardRow[] = [
    { id: 'k1', component: 'Tabs', keys: '← →', behaviour: 'Moves and selects the previous / next enabled tab, wrapping at the ends' },
    { id: 'k2', component: 'Tabs', keys: 'Home / End', behaviour: 'Selects the first / last enabled tab' },
    { id: 'k3', component: 'Tabs', keys: 'Tab', behaviour: 'Leaves the tab list and lands on the selected panel' },
    { id: 'k4', component: 'Menu', keys: '↓ / ↑', behaviour: 'Opens the menu and lands on the first / last item' },
    { id: 'k5', component: 'Menu', keys: 'a–z', behaviour: 'Type-ahead: jumps to the first item whose label starts with the letters' },
    { id: 'k6', component: 'Menu', keys: 'Esc', behaviour: 'Closes and returns focus to the trigger' },
    { id: 'k7', component: 'Menu', keys: 'Tab', behaviour: 'Closes and moves on — a menu never traps focus' },
    { id: 'k8', component: 'Select', keys: '↓ / Enter / Space', behaviour: 'Opens the listbox on the selected option' },
    { id: 'k9', component: 'Select', keys: '↑ ↓ / Home / End', behaviour: 'Moves the active option; aria-activedescendant follows it' },
    { id: 'k10', component: 'Select', keys: 'Enter', behaviour: 'Picks (single) or toggles (multiple) the active option' },
    { id: 'k11', component: 'Select', keys: 'Backspace', behaviour: 'Multiple, empty filter: removes the last chip' },
    { id: 'k12', component: 'Dialog', keys: 'Tab / Shift+Tab', behaviour: 'Cycles inside the sheet; the rest of the page is inert' },
    { id: 'k13', component: 'Dialog', keys: 'Esc', behaviour: 'Dismisses, unless [dismissible]="false", and restores focus' },
    { id: 'k14', component: 'DataTable', keys: 'Enter / Space', behaviour: 'On a header: sorts. On an activatable row: opens it' },
    { id: 'k15', component: 'DataTable', keys: 'Space', behaviour: 'On a checkbox: selects the row; on the master: all rows' },
    { id: 'k16', component: 'Toast', keys: 'Tab', behaviour: 'Reaches the action and the dismiss button; focus pauses the timer' },
    { id: 'k17', component: 'Button', keys: 'Enter / Space', behaviour: 'Activates. While loading it stays focusable and ignores the key' },
    { id: 'k18', component: 'Input', keys: 'Esc', behaviour: 'Clears a clearable field — the clear button is not a tab stop' },
    { id: 'k19', component: 'Checkbox', keys: 'Space', behaviour: 'Toggles. A mixed box resolves to checked (the platform’s)' },
    { id: 'k20', component: 'Radio', keys: 'Tab', behaviour: 'Enters the group once, landing on the selected radio (the platform’s)' },
    { id: 'k21', component: 'Radio', keys: '↑ ↓ ← →', behaviour: 'Moves and selects within the group, skipping disabled radios (the platform’s)' },
    { id: 'k22', component: 'Switch', keys: 'Space', behaviour: 'Toggles (the platform’s)' },
    { id: 'k23', component: 'Switch', keys: 'Enter', behaviour: 'Toggles, and does not submit the form around it' },
    { id: 'k24', component: 'Chip', keys: 'Tab', behaviour: 'Reaches the remove button — the only focusable thing in a chip' },
    { id: 'k25', component: 'Link', keys: 'Enter', behaviour: 'Navigates. Space does not, because a link is not a button' },
    { id: 'k26', component: 'SearchField', keys: 'Enter', behaviour: 'Flushes the pending debounce and searches now' },
    { id: 'k27', component: 'SearchField', keys: 'Esc', behaviour: 'Clears the query, and searches for nothing immediately' },
    { id: 'k28', component: 'PasswordField', keys: 'Tab', behaviour: 'Reaches the visibility toggle, which is a real button' },
    { id: 'k29', component: 'RadioGroup', keys: 'Tab then ↑ ↓ ← →', behaviour: 'One tab stop for the group; arrows move and select inside it (the platform’s)' },
    { id: 'k30', component: 'Calendar', keys: 'Tab', behaviour: 'One tab stop for the grid, resting on the selected day, or today' },
    { id: 'k31', component: 'Calendar', keys: '← →', behaviour: 'The day before / after, crossing the month boundary rather than stopping at it' },
    { id: 'k32', component: 'Calendar', keys: '↑ ↓', behaviour: 'The same weekday, a week earlier / later' },
    { id: 'k33', component: 'Calendar', keys: 'Home / End', behaviour: 'The first / last day of the focused week' },
    { id: 'k34', component: 'Calendar', keys: 'PageUp / PageDown', behaviour: 'The previous / next month. With Shift, the year' },
    { id: 'k35', component: 'Calendar', keys: 'Enter / Space', behaviour: 'Picks the focused day — it is a real button, so this is the platform’s' },
    { id: 'k36', component: 'DateInput', keys: 'Enter', behaviour: 'Commits what was typed, before anything else reads the value' },
    { id: 'k37', component: 'DateInput', keys: '↓', behaviour: 'Asks for a calendar, as a date field has since Windows 95' },
    { id: 'k38', component: 'TimeInput', keys: '↑ ↓', behaviour: 'Steps by the step, clamped to min and max' },
    { id: 'k39', component: 'TimeInput', keys: 'PageUp / PageDown', behaviour: 'Steps by an hour, whatever the step is' },
    { id: 'k40', component: 'Accordion', keys: 'Enter / Space', behaviour: 'Opens the panel — the header is a real button, so this is the platform’s' },
    { id: 'k41', component: 'Accordion', keys: '↑ ↓', behaviour: 'The previous / next header, wrapping. Tab still reaches every one of them' },
    { id: 'k42', component: 'Accordion', keys: 'Home / End', behaviour: 'The first / last header' },
    { id: 'k43', component: 'Toolbar', keys: 'Tab', behaviour: 'Enters the cluster once, and leaves it: eight buttons, one tab stop' },
    { id: 'k44', component: 'Toolbar', keys: '← → / ↑ ↓', behaviour: 'The previous / next control, wrapping. The other axis is left alone' },
    { id: 'k45', component: 'Toolbar', keys: 'Home / End', behaviour: 'The first / last control — unless a text field has the focus' },
    { id: 'k46', component: 'Pagination', keys: 'Tab / Enter', behaviour: 'Each page is a button. The gap is not one' },
  ];

  readonly contrastColumns: readonly DataTableColumn<ContrastRow>[] = [
    { key: 'pair', header: 'Role pair', sortable: true },
    { key: 'kind', header: 'Kind', width: '5rem' },
    { key: 'required', header: 'Required', align: 'end', numeric: true, width: '6rem', format: (row) => `${row.required}:1` },
    { key: 'ratio', header: 'Measured', align: 'end', numeric: true, sortable: true, width: '7rem' },
    { key: 'verdict', header: '', headerLabel: 'Result', align: 'end', width: '5rem' },
  ];

  /** Measured from the tokens of whichever theme is live. */
  readonly contrastRows = computed<readonly ContrastRow[]>(() => {
    const colors: SemanticColors =
      this.mode() === 'dark' ? darkSemanticColors : lightSemanticColors;

    const text: Array<[string, keyof SemanticColors, keyof SemanticColors]> = [
      ['text on surface', 'text', 'surface'],
      ['textMuted on surface', 'textMuted', 'surface'],
      ['textSubtle on background', 'textSubtle', 'background'],
      ['textSubtle on surfaceSunken', 'textSubtle', 'surfaceSunken'],
      ['primary on surface', 'primary', 'surface'],
      ['accent on surface', 'accent', 'surface'],
      ['success on successMuted', 'success', 'successMuted'],
      ['warning on warningMuted', 'warning', 'warningMuted'],
      ['danger on dangerMuted', 'danger', 'dangerMuted'],
      ['info on infoMuted', 'info', 'infoMuted'],
      ['onPrimary on primary', 'onPrimary', 'primary'],
      ['onAccent on accent', 'onAccent', 'accent'],
    ];

    const ui: Array<[string, keyof SemanticColors, keyof SemanticColors]> = [
      ['borderControl on surface', 'borderControl', 'surface'],
      ['borderControl on background', 'borderControl', 'background'],
      ['focusRing on surface', 'focusRing', 'surface'],
      ['focusRing on background', 'focusRing', 'background'],
    ];

    return [
      ...text.map(([pair, fg, bg]) => ({
        id: `t-${pair}`,
        pair,
        kind: 'Text' as const,
        ratio: contrastRatioRounded(colors[fg], colors[bg]),
        required: CONTRAST_AA_TEXT,
      })),
      ...ui.map(([pair, fg, bg]) => ({
        id: `u-${pair}`,
        pair,
        kind: 'UI' as const,
        ratio: contrastRatioRounded(colors[fg], colors[bg]),
        required: CONTRAST_AA_NON_TEXT,
      })),
    ];
  });

  readonly contrastRowKey = (row: ContrastRow): RowKey => row.id;
  readonly keyboardRowKey = (row: KeyboardRow): RowKey => row.id;
  readonly keyboardRowLabel = (row: KeyboardRow): string => `${row.component}: ${row.keys}`;

  readonly srNotes = [
    {
      component: 'Dialog',
      note: 'role="dialog" + aria-modal, named by its title and described by its lede. Everything outside goes inert, so browsing, find-in-page and touch exploration stay inside the sheet.',
    },
    {
      component: 'Menu',
      note: 'role="menu" with real menuitems. A labelled header becomes a role="group", shortcuts are exposed as aria-keyshortcuts (the ⌘ glyphs are hidden), and hints are aria-describedby rather than folded into the name.',
    },
    {
      component: 'Select',
      note: 'An ARIA combobox named by its label *and* its value, with a listbox of plain options — no control is nested inside another. The filter field carries the combobox role while it holds focus, because aria-activedescendant has to live on the focused element.',
    },
    {
      component: 'Toast',
      note: 'The host owns two permanent live regions — polite for status, assertive for problems — so nothing is announced twice and nothing is missed because the region was born with its content.',
    },
    {
      component: 'DataTable',
      note: 'A named table with aria-sort on the sorted column, checkboxes named after the row, and a live region that says “Sorted by Amount, descending”, “3 rows selected” or “Loading rows”.',
    },
    {
      component: 'Tabs',
      note: 'A tablist with roving tabindex; each panel is labelled by its tab and focusable, so a keyboard user lands in the content after the tab strip.',
    },
    {
      component: 'Form controls',
      note: 'Input, Textarea, Checkbox, Radio and Switch are native controls, not ARIA impressions of them. Each is named by a real <label for>, described by its hint and its error, and reports aria-invalid whenever it shows a message. The error lives in a live region that was already on the page, so the message is announced when it arrives.',
    },
    {
      component: 'Switch',
      note: 'A checkbox with role="switch": a screen reader says “on” and “off” instead of “checked”. Nothing else changes — the keyboard, focus and forced-colours behaviour stay the platform’s.',
    },
    {
      component: 'Radio',
      note: 'Radios grouped by name, so the browser supplies one tab stop and arrow-key selection. The group itself needs a name: a <fieldset> with a <legend>, or role="radiogroup" with a label.',
    },
    {
      component: 'Badge & Chip',
      note: 'A badge is plain text with no role: it is never a tab stop. When the visible content is a count or a glyph, srLabel hides it and speaks the words instead. A chip that can be removed grows one real button, named after what it removes — never a button inside a button.',
    },
    {
      component: 'Avatar',
      note: 'An image with its alt text, or initials behind a role="img" named after the person. Presence is folded into that one name ("Grace Hopper, Online") rather than announced as a separate mystery dot. An avatar with no name, or one that repeats the name beside it, is hidden entirely.',
    },
    {
      component: 'Spinner & Skeleton',
      note: 'A spinner is a polite live region with a hidden name — unless the control around it already reports aria-busy, in which case it goes silent. Skeletons are aria-hidden by default: the loading region says it is busy once, rather than a dozen rectangles announcing themselves.',
    },
    {
      component: 'Progress',
      note: 'role="progressbar" named by its own visible label, with aria-valuetext carrying what the number means ("18 of 20 GB used"). An indeterminate bar has no aria-valuenow at all, which is how ARIA says "in progress, amount unknown".',
    },
    {
      component: 'Divider',
      note: 'role="separator" with aria-orientation. A separator\'s children are presentational, so a labelled divider hides its visible word and takes the same word as its accessible name. A decorative rule drops the role rather than making a screen reader count lines.',
    },
    {
      component: 'Link',
      note: 'A real anchor with a real href. A new tab is announced as one, and carries rel="noreferrer noopener". The inherit variant keeps its underline, because colour alone cannot mark a link in running text.',
    },
    {
      component: 'FormField',
      note: 'One <label for> per field, pointing at the control inside it — including a Select, whose trigger is a <button> and therefore labelable. The hint and the error become the control\'s aria-describedby, in reading order, and an error sets aria-invalid on the control rather than only colouring its border. The control is told all of this through DI, so none of it can be forgotten at the call site.',
    },
    {
      component: 'SearchField',
      note: 'The result count lives in one polite region that exists before the first query, so the first answer is heard. It is also the field\'s description, so it survives a re-focus. The spinner inside the field is decorative: two voices saying "busy" is one too many.',
    },
    {
      component: 'PasswordField',
      note: 'The visibility toggle is a real button with aria-pressed and aria-controls, and its name changes with its state. Revealing swaps type="password" for type="text" — a custom mask would lose selection, IME and autofill. The strength meter is a progressbar, never a live region: it must not narrate every keystroke.',
    },
    {
      component: 'Calendar',
      note: 'A <table role="grid"> whose name is the month on screen — and which is also a polite live region, so paging is heard without leaving the grid. Every day is a button named in full ("4 March 2026"), because a number in a column is only unambiguous to the eye. Today carries aria-current="date"; the selected cell carries aria-selected. Days that cannot be picked carry aria-disabled rather than disabled, so the arrows can still read them: a grid you can get stuck in is worse than one that lets you read a day you cannot choose.',
    },
    {
      component: 'Date & time inputs',
      note: 'Text fields, not native pickers: the value is a yyyy-mm-dd string, so no time zone can move it by a day. A polite live region speaks the committed value in full, because "04/03/2026" is March in London and April in Boston. Unreadable text is an error, never a silent guess, and the calendar trigger reports aria-expanded, aria-haspopup and aria-controls without opening anything — the overlay is the organism\'s.',
    },
    {
      component: 'Accordion',
      note: 'Each header is a real heading wrapping a real button, with aria-expanded and aria-controls pointing at a role="region" labelled by that button. A closed panel keeps its DOM — so a half-filled form survives a collapse — and takes visibility: hidden, which is what removes it from the tab order and the accessibility tree. A disabled header carries aria-disabled, never disabled: a heading the arrow keys cannot reach is a heading a screen-reader user cannot read.',
    },
    {
      component: 'Toolbar',
      note: 'role="toolbar" with a roving tabindex over whatever is projected into it — one tab stop for the cluster. Controls inside an open menu, listbox or dialog belong to that overlay, and anything born with tabindex="-1" keeps its own mind. A focused text field keeps its arrow keys until the caret is at the edge it is being pressed towards.',
    },
    {
      component: 'Breadcrumb',
      note: 'A named <nav> around an <ol>. The last crumb is a <span aria-current="page">, not a link to the page you are on, and the separators are aria-hidden because a list already announces itself as one. A collapsed path hides behind a button that says how many crumbs it is holding, and expands in place — a menu would hide the path from anyone who arrived with a keyboard.',
    },
    {
      component: 'Pagination',
      note: 'A named <nav> of buttons — nothing here changes the URL. The current page carries aria-current="page"; the ellipsis is aria-hidden and unfocusable, because the pages it stands for are reachable from the ones beside it. "Page 3 of 12" goes into a polite region that existed before the first click, because the list changed and focus did not move.',
    },
    {
      component: 'Alert & EmptyState',
      note: 'Neither is a live region by default: a message rendered with the page is not an announcement, and a screen reader is already reading the page. `live` turns on role="status" for something that appeared in response to an action, and role="alert" only for what the user must know before doing anything else. An EmptyState title is a <p> until you ask for a heading — an <h2> in the middle of a table would lie about the outline.',
    },
    {
      component: 'Choice groups',
      note: 'A <fieldset> with a <legend> is the only markup that attaches a question to its answers. RadioGroup adds role="radiogroup" and one shared name — which is where the browser\'s arrow-key pattern comes from. A checkbox group stays a plain fieldset, because there is no role="checkboxgroup" and the browser has nothing special to do with one. aria-invalid goes on the controls, where focus lands, not on the group as well.',
    },
  ];

  readonly testingSnippet = `// Every interactive component is checked by axe-core, in each state
// it actually appears in (src/design-system/a11y.spec.ts)
await expectNoAxeViolations(fixture.nativeElement);

// …and contrast is asserted against the tokens, per theme
// (src/design-system/tokens/colors.a11y.spec.ts)
expect(contrastRatio(colors.textSubtle, colors.background))
  .toBeGreaterThanOrEqual(CONTRAST_AA_TEXT);`;

  readonly forcedColorsSnippet = `/* Windows High Contrast replaces the palette and drops box-shadows.
   Paint draws focus with outline, which survives — and anything that
   leans on a shadow or a fill to carry meaning gets a border to fall
   back on. */
@media (forced-colors: active) {
  :focus-visible { outline: 2px solid; outline-offset: 2px; }

  .btn, .form-control, .form-check-input,
  .dropdown-menu, .modal-content, .toast { border: 1px solid; }
}`;

  readonly motionSnippet = `/* Components switch off their own motion… */
@media (prefers-reduced-motion: reduce) {
  .ds-menu__panel { animation: none; }
}

/* …and the foundation backs them up system-wide, so a future
   component cannot forget. Animations collapse to a frame rather
   than vanish, so animationend listeners still fire. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}`;

  readonly focusSnippet = `<!-- Loading keeps the control focusable: it reports aria-disabled and
     aria-busy instead of going disabled, so focus is never dropped. -->
<ds-button [loading]="saving()" (clicked)="save()">Save changes</ds-button>

<!-- Dialogs restore focus to whatever opened them, and mark the page inert -->
<ds-dialog [(open)]="open" title="Delete project">
  <input class="form-control" dsDialogAutofocus aria-label="Project name" />
</ds-dialog>`;

  verdictTone(row: ContrastRow): 'success' | 'danger' {
    return row.ratio >= row.required ? 'success' : 'danger';
  }

  announce(): void {
    this.toasts.success('Saved', {
      description: 'Announced politely through the toast host’s live region.',
    });
  }

  announceProblem(): void {
    this.toasts.danger('Upload failed', {
      description: 'Announced assertively, because a problem interrupts.',
      action: { label: 'Retry', run: () => this.announce() },
    });
  }
}
