/**
 * Paint molecules — primitives composed into single-responsibility units.
 *
 * Like the primitives, each one is a typed, token-driven façade over Bootstrap's
 * components and utilities — and each one supplies the behaviour Bootstrap's JS
 * would otherwise own (open state, keyboard patterns, focus, dismissal).
 *
 * | Molecule             | Composed from                                          |
 * | -------------------- | ------------------------------------------------------ |
 * | `ds-tabs`            | `.nav`, `.nav-pills`, `.tab-content`                   |
 * | `ds-menu`            | `.dropdown-menu`, `.dropdown-item`                     |
 * | `ds-select`          | `.form-control`, `.dropdown-menu`, `.form-check-input` |
 * | `ds-toast`           | `.toast`, `.toast-container`                            |
 * | `ds-form-field`      | the label / hint / error chrome, and any control        |
 * | `ds-search-field`    | `ds-input`, `ds-spinner`, a live region                 |
 * | `ds-password-field`  | `ds-input`, `ds-button`, `ds-progress`                  |
 * | `ds-radio-group`     | `ds-radio` in a `<fieldset role="radiogroup">`          |
 * | `ds-checkbox-group`  | `ds-checkbox` in a `<fieldset>`, with a mixed master     |
 * | `ds-calendar`        | a keyboardable month grid — no popover, no range        |
 * | `ds-date-input`      | `ds-input` + a calendar trigger that only asks          |
 * | `ds-time-input`      | `ds-input` + arrow-key stepping                         |
 * | `ds-accordion`       | disclosures that know about each other                  |
 * | `ds-breadcrumb`      | `<nav>` + `<ol>` + `ds-link`, ending in `aria-current`  |
 * | `ds-pagination`      | `.pagination`, and a range that never changes width     |
 * | `ds-empty-state`     | an icon, a sentence, and the way out                    |
 * | `ds-alert`           | a callout, in the page — not a toast                    |
 * | `ds-toolbar`         | `role="toolbar"`: eight buttons, one tab stop           |
 * | `ds-tooltip`         | a bubble on hover and focus, wired by `aria-describedby`|
 * | `ds-popover`         | an anchored, non-modal `role="dialog"`                  |
 * | `ds-file-dropzone`   | a native file input, stretched over a drop target       |
 * | `ds-file-queue-item` | `ds-progress`, `ds-button`, and one file's status       |
 * | `ds-range-control`   | `ds-slider` + `ds-number-input`, one value, one label    |
 * | `ds-figure`          | `<figure>` + `ds-image` + a `<figcaption>`              |
 * | `ds-rating-summary`  | `ds-star-rating`, a score and a count, said once        |
 * | `ds-shortcut-hint`   | a label and a `ds-kbd`, for a row of shortcuts          |
 */
export * from './tabs';
export * from './menu';
export * from './select';
export * from './toast';
export * from './form-field';
export * from './search-field';
export * from './password-field';
export * from './choice-group';
export * from './calendar';
export * from './date-input';
export * from './time-input';
export * from './accordion';
export * from './breadcrumb';
export * from './pagination';
export * from './empty-state';
export * from './alert';
export * from './toolbar';
export * from './tooltip';
export * from './popover';
export * from './file-upload';
export * from './range-control';
export * from './figure';
export * from './rating-summary';
export * from './shortcut-hint';

import { AccordionComponent, AccordionItemComponent } from './accordion';
import { AlertComponent } from './alert';
import { BreadcrumbComponent } from './breadcrumb';
import { CalendarComponent } from './calendar';
import { EmptyStateComponent } from './empty-state';
import { PaginationComponent } from './pagination';
import { ToolbarComponent } from './toolbar';
import { CheckboxGroupComponent, RadioGroupComponent } from './choice-group';
import { DateInputComponent } from './date-input';
import { TimeInputComponent } from './time-input';
import { FieldControlDirective, FormFieldComponent } from './form-field';
import { PasswordFieldComponent } from './password-field';
import { SearchFieldComponent } from './search-field';
import { TooltipComponent } from './tooltip';
import { PopoverComponent } from './popover';
import { FileDropzoneComponent, FileQueueItemComponent } from './file-upload';
import { FigureCaptionDirective, FigureComponent } from './figure';
import { RangeControlComponent } from './range-control';
import { RatingSummaryComponent } from './rating-summary';
import { ShortcutHintComponent } from './shortcut-hint';

/**
 * The form molecules, as one import: everything that stops a product wiring a
 * label, a hint and an error together by hand.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_FORM_CONTROLS, DS_FORM_MOLECULES], … })
 * ```
 */
export const DS_FORM_MOLECULES = [
  FormFieldComponent,
  FieldControlDirective,
  SearchFieldComponent,
  PasswordFieldComponent,
  RadioGroupComponent,
  CheckboxGroupComponent,
  DateInputComponent,
  TimeInputComponent,
  RangeControlComponent,
] as const;

/**
 * The small display compositions: a picture with its words, a rating with its
 * count, a shortcut with its label. None of them is interactive on its own;
 * each says one thing, once.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_DISPLAY, DS_DISPLAY_MOLECULES], … })
 * ```
 */
export const DS_DISPLAY_MOLECULES = [
  FigureComponent,
  FigureCaptionDirective,
  RatingSummaryComponent,
  ShortcutHintComponent,
] as const;

/**
 * The date-entry building blocks, as one import.
 *
 * Three pieces, no picker: a month grid you can walk, a date you can type, and a
 * time you can type. The organism that wires them into a popover is not here.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_DATE_ENTRY], … })
 * ```
 */
export const DS_DATE_ENTRY = [CalendarComponent, DateInputComponent, TimeInputComponent] as const;

/**
 * Hierarchy, disclosure and the small structural pieces every app re-invents.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_STRUCTURE], … })
 * ```
 */
export const DS_STRUCTURE = [
  AccordionComponent,
  AccordionItemComponent,
  BreadcrumbComponent,
  PaginationComponent,
  EmptyStateComponent,
  AlertComponent,
  ToolbarComponent,
] as const;

/**
 * The light overlays: the description that follows hover and focus, and the
 * anchored panel that does not take the page hostage. A `<ds-dialog>` is the
 * organism above both.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_OVERLAYS], … })
 * ```
 */
export const DS_OVERLAYS = [TooltipComponent, PopoverComponent] as const;

/**
 * The file building blocks: a place to put files, and a row per file once they
 * are in. The multi-file uploader organism that owns the list and the transport
 * is not here — it will be made of these.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_FILE_UPLOAD], … })
 * ```
 */
export const DS_FILE_UPLOAD = [FileDropzoneComponent, FileQueueItemComponent] as const;
