/**
 * Paint primitives — the atomic building blocks.
 *
 * Built as typed façades over Bootstrap utilities / components:
 *
 * | Primitive     | Bootstrap substrate                          |
 * |---------------|----------------------------------------------|
 * | `ds-box`      | spacing / bg / border / radius / shadow      |
 * | `ds-flex`     | `.d-flex` + flex utilities                   |
 * | `ds-stack`    | `.vstack` / `.hstack` + `.gap-*`             |
 * | `ds-grid`     | `.row`, `.row-cols-*`, `.col-*`, `.g-*`      |
 * | `ds-button`   | `.btn`, `.spinner-border`                    |
 * | `ds-input`    | `.form-control`, `.form-label`, `.form-text` |
 * | `ds-textarea` | `.form-control`                              |
 * | `ds-checkbox` | `.form-check`, `.form-check-input`           |
 * | `ds-radio`    | `.form-check`, `.form-check-input`           |
 * | `ds-switch`   | `.form-switch`, `.form-check-input`          |
 * | `ds-slider`   | `.form-range`                                |
 * | `ds-number-input` | `.form-control` + two real `<button>`s   |
 * | `ds-star-rating`  | —  (native radios, or one `role="img"`)  |
 * | `ds-badge`    | `.badge`                                     |
 * | `ds-chip`     | —  (a badge that the user owns)              |
 * | `ds-avatar`   | —                                            |
 * | `ds-spinner`  | `.spinner-border`                            |
 * | `ds-progress` | `.progress`, `.progress-bar`                 |
 * | `ds-skeleton` | `.placeholder`, `.placeholder-glow/-wave`    |
 * | `ds-divider`  | —                                            |
 * | `ds-link`     | —  (a real `<a>`, and nothing else)          |
 * | `ds-kbd`      | a real `<kbd>`, repainted                    |
 * | `ds-image`    | a real `<img>`, framed                       |
 */
export * from './primitives.types';
export * from './tone.types';
export * from './box';
export * from './flex';
export * from './stack';
export * from './grid';
export * from './text';
export * from './button';
export * from './forms';
export * from './input';
export * from './textarea';
export * from './checkbox';
export * from './radio';
export * from './switch';
export * from './slider';
export * from './number-input';
export * from './star-rating';
export * from './badge';
export * from './chip';
export * from './avatar';
export * from './spinner';
export * from './progress';
export * from './skeleton';
export * from './divider';
export * from './link';
export * from './kbd';
export * from './image';

import { AvatarComponent } from './avatar';
import { BadgeComponent } from './badge';
import { BoxComponent } from './box';
import { ButtonComponent } from './button';
import { CheckboxComponent } from './checkbox';
import { ChipComponent } from './chip';
import { DividerComponent } from './divider';
import { FlexComponent } from './flex';
import { GridComponent, GridItemComponent } from './grid';
import { ImageComponent, ImageFallbackDirective } from './image';
import { InputComponent } from './input';
import { KbdComponent } from './kbd';
import { LinkComponent } from './link';
import { NumberInputComponent } from './number-input';
import { ProgressComponent } from './progress';
import { RadioComponent } from './radio';
import { SkeletonComponent } from './skeleton';
import { SliderComponent } from './slider';
import { SpinnerComponent } from './spinner';
import { StackComponent } from './stack';
import { StarRatingComponent } from './star-rating';
import { SwitchComponent } from './switch';
import { TextComponent } from './text';
import { TextareaComponent } from './textarea';

/**
 * The form-control atoms, as one import.
 *
 * Every one of them is a real native control with Paint's chrome around it, and
 * every one implements `ControlValueAccessor`.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_FORM_CONTROLS, ReactiveFormsModule], … })
 * ```
 */
export const DS_FORM_CONTROLS = [
  InputComponent,
  TextareaComponent,
  CheckboxComponent,
  RadioComponent,
  SwitchComponent,
  SliderComponent,
  NumberInputComponent,
  StarRatingComponent,
] as const;

/**
 * The display & feedback atoms, as one import.
 *
 * The small pieces every product UI reinvents: what a thing *is* (Badge, Chip,
 * Avatar), what it is *doing* (Spinner, Progress, Skeleton), and how it is
 * separated from or connected to the rest (Divider, Link).
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_DISPLAY], … })
 * ```
 */
export const DS_DISPLAY = [
  BadgeComponent,
  ChipComponent,
  AvatarComponent,
  SpinnerComponent,
  ProgressComponent,
  SkeletonComponent,
  DividerComponent,
  LinkComponent,
  KbdComponent,
  ImageComponent,
  ImageFallbackDirective,
] as const;

/**
 * Convenience bundle for templates that use the whole primitive set.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_PRIMITIVES], … })
 * ```
 */
export const DS_PRIMITIVES = [
  BoxComponent,
  FlexComponent,
  StackComponent,
  GridComponent,
  GridItemComponent,
  TextComponent,
  ButtonComponent,
  ...DS_FORM_CONTROLS,
  ...DS_DISPLAY,
] as const;
