import { Routes } from '@angular/router';
import { brand } from '../design-system/brand';

const title = (page: string) => `${page} · ${brand.name}`;

export const routes: Routes = [
  {
    path: '',
    title: `${brand.name} — ${brand.tagline}`,
    loadComponent: () => import('./pages/overview.page').then((m) => m.OverviewPage),
  },
  {
    path: 'brand',
    title: title('Brand'),
    loadComponent: () => import('./pages/brand.page').then((m) => m.BrandPage),
  },
  {
    path: 'accessibility',
    title: title('Accessibility'),
    loadComponent: () =>
      import('./pages/accessibility.page').then((m) => m.AccessibilityPage),
  },
  {
    path: 'brand-packs',
    title: title('Brand packs'),
    loadComponent: () => import('./pages/brand-packs.page').then((m) => m.BrandPacksPage),
  },
  {
    path: 'foundations',
    title: title('Foundations'),
    loadComponent: () => import('./pages/foundations.page').then((m) => m.FoundationsPage),
  },
  {
    path: 'primitives',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'button' },
      {
        path: 'button',
        title: title('Button'),
        loadComponent: () => import('./pages/primitives/button.page').then((m) => m.ButtonPage),
      },
      {
        path: 'input',
        title: title('Input'),
        loadComponent: () => import('./pages/primitives/input.page').then((m) => m.InputPage),
      },
      {
        path: 'textarea',
        title: title('Textarea'),
        loadComponent: () => import('./pages/primitives/textarea.page').then((m) => m.TextareaPage),
      },
      {
        path: 'checkbox',
        title: title('Checkbox'),
        loadComponent: () => import('./pages/primitives/checkbox.page').then((m) => m.CheckboxPage),
      },
      {
        path: 'radio',
        title: title('Radio'),
        loadComponent: () => import('./pages/primitives/radio.page').then((m) => m.RadioPage),
      },
      {
        path: 'switch',
        title: title('Switch'),
        loadComponent: () => import('./pages/primitives/switch.page').then((m) => m.SwitchPage),
      },
      {
        path: 'slider',
        title: title('Slider'),
        loadComponent: () => import('./pages/primitives/slider.page').then((m) => m.SliderPage),
      },
      {
        path: 'number-input',
        title: title('NumberInput'),
        loadComponent: () =>
          import('./pages/primitives/number-input.page').then((m) => m.NumberInputPage),
      },
      {
        path: 'star-rating',
        title: title('StarRating'),
        loadComponent: () =>
          import('./pages/primitives/star-rating.page').then((m) => m.StarRatingPage),
      },
      {
        path: 'badge',
        title: title('Badge'),
        loadComponent: () => import('./pages/primitives/badge.page').then((m) => m.BadgePage),
      },
      {
        path: 'chip',
        title: title('Chip'),
        loadComponent: () => import('./pages/primitives/chip.page').then((m) => m.ChipPage),
      },
      {
        path: 'avatar',
        title: title('Avatar'),
        loadComponent: () => import('./pages/primitives/avatar.page').then((m) => m.AvatarPage),
      },
      {
        path: 'spinner',
        title: title('Spinner'),
        loadComponent: () => import('./pages/primitives/spinner.page').then((m) => m.SpinnerPage),
      },
      {
        path: 'progress',
        title: title('Progress'),
        loadComponent: () => import('./pages/primitives/progress.page').then((m) => m.ProgressPage),
      },
      {
        path: 'skeleton',
        title: title('Skeleton'),
        loadComponent: () => import('./pages/primitives/skeleton.page').then((m) => m.SkeletonPage),
      },
      {
        path: 'divider',
        title: title('Divider'),
        loadComponent: () => import('./pages/primitives/divider.page').then((m) => m.DividerPage),
      },
      {
        path: 'link',
        title: title('Link'),
        loadComponent: () => import('./pages/primitives/link.page').then((m) => m.LinkPage),
      },
      {
        path: 'kbd',
        title: title('Kbd'),
        loadComponent: () => import('./pages/primitives/kbd.page').then((m) => m.KbdPage),
      },
      {
        path: 'image',
        title: title('Image'),
        loadComponent: () => import('./pages/primitives/image.page').then((m) => m.ImagePage),
      },
      {
        path: 'text',
        title: title('Text'),
        loadComponent: () => import('./pages/primitives/text.page').then((m) => m.TextPage),
      },
      {
        path: 'box',
        title: title('Box'),
        loadComponent: () => import('./pages/primitives/box.page').then((m) => m.BoxPage),
      },
      {
        path: 'flex',
        title: title('Flex'),
        loadComponent: () => import('./pages/primitives/flex.page').then((m) => m.FlexPage),
      },
      {
        path: 'stack',
        title: title('Stack'),
        loadComponent: () => import('./pages/primitives/stack.page').then((m) => m.StackPage),
      },
      {
        path: 'grid',
        title: title('Grid'),
        loadComponent: () => import('./pages/primitives/grid.page').then((m) => m.GridPage),
      },
    ],
  },
  {
    path: 'components',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tabs' },
      {
        path: 'tabs',
        title: title('Tabs'),
        loadComponent: () => import('./pages/components/tabs.page').then((m) => m.TabsPage),
      },
      {
        path: 'menu',
        title: title('Menu'),
        loadComponent: () => import('./pages/components/menu.page').then((m) => m.MenuPage),
      },
      {
        path: 'select',
        title: title('Select'),
        loadComponent: () => import('./pages/components/select.page').then((m) => m.SelectPage),
      },
      {
        path: 'form-field',
        title: title('FormField'),
        loadComponent: () => import('./pages/components/form-field.page').then((m) => m.FormFieldPage),
      },
      {
        path: 'search-field',
        title: title('SearchField'),
        loadComponent: () =>
          import('./pages/components/search-field.page').then((m) => m.SearchFieldPage),
      },
      {
        path: 'password-field',
        title: title('PasswordField'),
        loadComponent: () =>
          import('./pages/components/password-field.page').then((m) => m.PasswordFieldPage),
      },
      {
        path: 'choice-group',
        title: title('Choice groups'),
        loadComponent: () =>
          import('./pages/components/choice-group.page').then((m) => m.ChoiceGroupPage),
      },
      {
        path: 'calendar',
        title: title('Calendar'),
        loadComponent: () => import('./pages/components/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'date-input',
        title: title('Date & time inputs'),
        loadComponent: () =>
          import('./pages/components/date-input.page').then((m) => m.DateInputPage),
      },
      {
        path: 'accordion',
        title: title('Accordion'),
        loadComponent: () => import('./pages/components/accordion.page').then((m) => m.AccordionPage),
      },
      {
        path: 'breadcrumb',
        title: title('Breadcrumb'),
        loadComponent: () =>
          import('./pages/components/breadcrumb.page').then((m) => m.BreadcrumbPage),
      },
      {
        path: 'pagination',
        title: title('Pagination'),
        loadComponent: () =>
          import('./pages/components/pagination.page').then((m) => m.PaginationPage),
      },
      {
        path: 'empty-state',
        title: title('EmptyState'),
        loadComponent: () =>
          import('./pages/components/empty-state.page').then((m) => m.EmptyStatePage),
      },
      {
        path: 'alert',
        title: title('Alert'),
        loadComponent: () => import('./pages/components/alert.page').then((m) => m.AlertPage),
      },
      {
        path: 'toolbar',
        title: title('Toolbar'),
        loadComponent: () => import('./pages/components/toolbar.page').then((m) => m.ToolbarPage),
      },
      {
        path: 'tooltip',
        title: title('Tooltip'),
        loadComponent: () => import('./pages/components/tooltip.page').then((m) => m.TooltipPage),
      },
      {
        path: 'popover',
        title: title('Popover'),
        loadComponent: () => import('./pages/components/popover.page').then((m) => m.PopoverPage),
      },
      {
        path: 'file-dropzone',
        title: title('FileDropzone'),
        loadComponent: () =>
          import('./pages/components/file-dropzone.page').then((m) => m.FileDropzonePage),
      },
      {
        path: 'file-queue-item',
        title: title('FileQueueItem'),
        loadComponent: () =>
          import('./pages/components/file-queue-item.page').then((m) => m.FileQueueItemPage),
      },
      {
        path: 'toast',
        title: title('Toast'),
        loadComponent: () => import('./pages/components/toast.page').then((m) => m.ToastPage),
      },
      {
        path: 'dialog',
        title: title('Dialog'),
        loadComponent: () => import('./pages/components/dialog.page').then((m) => m.DialogPage),
      },
      {
        path: 'filter-bar',
        title: title('FilterBar'),
        loadComponent: () =>
          import('./pages/components/filter-bar.page').then((m) => m.FilterBarPage),
      },
      {
        path: 'command-palette',
        title: title('CommandPalette'),
        loadComponent: () =>
          import('./pages/components/command-palette.page').then((m) => m.CommandPalettePage),
      },
      {
        path: 'app-shell',
        title: title('AppShell'),
        loadComponent: () =>
          import('./pages/components/app-shell.page').then((m) => m.AppShellPage),
      },
      {
        path: 'board',
        title: title('Board'),
        loadComponent: () => import('./pages/components/board.page').then((m) => m.BoardPage),
      },
      {
        path: 'feed',
        title: title('Feed'),
        loadComponent: () => import('./pages/components/feed.page').then((m) => m.FeedPage),
      },
      {
        path: 'map-viewer',
        title: title('MapViewer'),
        loadComponent: () =>
          import('./pages/components/map-viewer.page').then((m) => m.MapViewerPage),
      },
      {
        path: 'data-grid',
        title: title('DataGrid'),
        loadComponent: () =>
          import('./pages/components/data-grid.page').then((m) => m.DataGridPage),
      },
      {
        path: 'file-uploader',
        title: title('FileUploader'),
        loadComponent: () =>
          import('./pages/components/file-uploader.page').then((m) => m.FileUploaderPage),
      },
      {
        path: 'drawer',
        title: title('Drawer'),
        loadComponent: () => import('./pages/components/drawer.page').then((m) => m.DrawerPage),
      },
      {
        path: 'date-picker',
        title: title('DatePicker'),
        loadComponent: () =>
          import('./pages/components/date-picker.page').then((m) => m.DatePickerPage),
      },
      {
        path: 'date-range-picker',
        title: title('DateRangePicker'),
        loadComponent: () =>
          import('./pages/components/date-range-picker.page').then((m) => m.DateRangePickerPage),
      },
      {
        path: 'data-table',
        title: title('DataTable'),
        loadComponent: () =>
          import('./pages/components/data-table.page').then((m) => m.DataTablePage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
