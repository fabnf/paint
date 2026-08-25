/**
 * Paint — an atomic design system for Angular.
 *
 *   tokens/      foundations: color, type, space, radii, effects
 *   theme/       provider + runtime CSS variables (incl. the Bootstrap bridge)
 *   icons/       SVG registry + <ds-icon>
 *   brand/       brand tokens + <ds-logo>
 *   primitives/  Button, Text, Box, Flex, Stack, Grid
 *                Input, Textarea, Checkbox, Radio, Switch,
 *                Slider, NumberInput, StarRating                (form controls)
 *                Badge, Chip, Avatar, Spinner, Progress,
 *                Skeleton, Divider, Link, Kbd, Image            (display & feedback)
 *   molecules/   Tabs, Menu, Select, Toast
 *                FormField, SearchField, PasswordField,
 *                RadioGroup, CheckboxGroup                       (forms)
 *                Calendar, DateInput, TimeInput                  (date entry)
 *                Accordion, Breadcrumb, Pagination,
 *                EmptyState, Alert, Toolbar                      (structure)
 *                Tooltip, Popover                                (overlays)
 *                FileDropzone, FileQueueItem                     (files)
 *   organisms/   Dialog, Drawer, DataTable, DataGrid,
 *                DatePicker, DateRangePicker, FileUploader,
 *                FilterBar, CommandPalette, MapViewer, Feed, Board, AppShell
 */
export * from './tokens';
export * from './theme';
export * from './icons';
export * from './brand';
export * from './primitives';
export * from './molecules';
export * from './organisms';
export * from './utils';

import { AccordionComponent, AccordionItemComponent } from './molecules/accordion';
import { AlertComponent } from './molecules/alert';
import { BreadcrumbComponent } from './molecules/breadcrumb';
import { CalendarComponent } from './molecules/calendar';
import { EmptyStateComponent } from './molecules/empty-state';
import { PaginationComponent } from './molecules/pagination';
import { ToolbarComponent } from './molecules/toolbar';
import { CheckboxGroupComponent, RadioGroupComponent } from './molecules/choice-group';
import { DateInputComponent } from './molecules/date-input';
import { TimeInputComponent } from './molecules/time-input';
import { FieldControlDirective, FormFieldComponent } from './molecules/form-field';
import { PasswordFieldComponent } from './molecules/password-field';
import { SearchFieldComponent } from './molecules/search-field';
import { TooltipComponent } from './molecules/tooltip';
import { PopoverComponent } from './molecules/popover';
import { FileDropzoneComponent, FileQueueItemComponent } from './molecules/file-upload';
import { DataTableCellDirective } from './organisms/data-table/data-table-cell.directive';
import {
  DataTableActionsDirective,
  DataTableEmptyActionDirective,
  DataTableFooterDirective,
} from './organisms/data-table/data-table-slots';
import { DataTableComponent } from './organisms/data-table/data-table.component';
import { DialogComponent } from './organisms/dialog/dialog.component';
import { DatePickerComponent } from './organisms/date-picker/date-picker.component';
import { DrawerComponent } from './organisms/drawer/drawer.component';
import { FileUploaderComponent } from './organisms/file-uploader/file-uploader.component';
import { FilterBarComponent } from './organisms/filter-bar/filter-bar.component';
import { FilterBarActionsDirective } from './organisms/filter-bar/filter-bar-slots';
import { CommandPaletteComponent } from './organisms/command-palette/command-palette.component';
import { MapViewerComponent } from './organisms/map-viewer/map-viewer.component';
import { MapDetailDirective } from './organisms/map-viewer/map-detail.directive';
import { FeedComponent } from './organisms/feed/feed.component';
import { FeedBodyDirective, FeedEmptyActionDirective } from './organisms/feed/feed-slots';
import { BoardComponent } from './organisms/board/board.component';
import { AppShellComponent } from './organisms/app-shell/app-shell.component';
import { DateRangePickerComponent } from './organisms/date-range-picker/date-range-picker.component';
import { MenuComponent } from './molecules/menu/menu.component';
import { SelectComponent } from './molecules/select/select.component';
import { TabComponent } from './molecules/tabs/tab.component';
import { TabsComponent } from './molecules/tabs/tabs.component';
import { ToastHostComponent } from './molecules/toast/toast-host.component';
import { ToastComponent } from './molecules/toast/toast.component';

/**
 * Convenience bundle for the component layer (molecules + organisms), including
 * the directives that mark their slots.
 *
 * @example
 * ```ts
 * @Component({ imports: [DS_PRIMITIVES, DS_COMPONENTS], … })
 * ```
 */
export const DS_COMPONENTS = [
  TabsComponent,
  TabComponent,
  MenuComponent,
  SelectComponent,
  FormFieldComponent,
  FieldControlDirective,
  SearchFieldComponent,
  PasswordFieldComponent,
  RadioGroupComponent,
  CheckboxGroupComponent,
  CalendarComponent,
  DateInputComponent,
  TimeInputComponent,
  AccordionComponent,
  AccordionItemComponent,
  BreadcrumbComponent,
  PaginationComponent,
  EmptyStateComponent,
  AlertComponent,
  ToolbarComponent,
  TooltipComponent,
  PopoverComponent,
  FileDropzoneComponent,
  FileQueueItemComponent,
  ToastComponent,
  ToastHostComponent,
  DialogComponent,
  DrawerComponent,
  DatePickerComponent,
  DateRangePickerComponent,
  FileUploaderComponent,
  FilterBarComponent,
  FilterBarActionsDirective,
  CommandPaletteComponent,
  MapViewerComponent,
  MapDetailDirective,
  FeedComponent,
  FeedBodyDirective,
  FeedEmptyActionDirective,
  BoardComponent,
  AppShellComponent,
  DataTableComponent,
  DataTableCellDirective,
  DataTableActionsDirective,
  DataTableFooterDirective,
  DataTableEmptyActionDirective,
] as const;

/*
 * DataGridComponent is deliberately NOT in DS_COMPONENTS, and not re-exported
 * from this barrel at all: it carries AG Grid Community (~a megabyte of
 * engine), and a convenience bundle must not smuggle that into apps that never
 * render a grid. Its types travel through the barrel for free; the component
 * is imported from its own door:
 *
 *   import { DataGridComponent, DataGridActionsDirective }
 *     from '…/design-system/organisms/data-grid';
 */
