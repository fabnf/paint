import type { IconName } from '../design-system/icons';

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  /** Optional trailing hint, e.g. "New". */
  badge?: string;
}

export interface NavSection {
  /** Atomic design layer this group belongs to. */
  title: string;
  /** Short explanation of the layer, shown in the sidebar. */
  caption?: string;
  items: readonly NavItem[];
}

/**
 * Sidebar information architecture, ordered by atomic design layer:
 * foundations → primitives → molecules → organisms.
 *
 * The primitives are split into three groups — layout & action, form controls,
 * display & feedback — because twenty-four atoms in one list is not a list, it is
 * a wall. They are all the same layer.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'Start',
    items: [
      { label: 'Overview', path: '/', icon: 'home' },
      { label: 'Brand', path: '/brand', icon: 'palette' },
    ],
  },
  {
    title: 'Foundations',
    caption: 'What every component inherits',
    items: [
      { label: 'Tokens', path: '/foundations', icon: 'ruler' },
      { label: 'Brand packs', path: '/brand-packs', icon: 'palette', badge: 'New' },
      { label: 'Accessibility', path: '/accessibility', icon: 'success' },
    ],
  },
  {
    title: 'Primitives',
    caption: 'The smallest components',
    items: [
      { label: 'Button', path: '/primitives/button', icon: 'zap' },
      { label: 'Text', path: '/primitives/text', icon: 'type' },
      { label: 'Box', path: '/primitives/box', icon: 'box' },
      { label: 'Flex', path: '/primitives/flex', icon: 'columns' },
      { label: 'Stack', path: '/primitives/stack', icon: 'rows' },
      { label: 'Grid', path: '/primitives/grid', icon: 'grid' },
    ],
  },
  {
    title: 'Form controls',
    caption: 'Native controls, wearing Paint',
    items: [
      { label: 'Input', path: '/primitives/input', icon: 'textCursor' },
      { label: 'Textarea', path: '/primitives/textarea', icon: 'rows' },
      { label: 'Checkbox', path: '/primitives/checkbox', icon: 'checkbox' },
      { label: 'Radio', path: '/primitives/radio', icon: 'radio' },
      { label: 'Switch', path: '/primitives/switch', icon: 'toggle' },
      { label: 'Slider', path: '/primitives/slider', icon: 'sliders', badge: 'New' },
      { label: 'NumberInput', path: '/primitives/number-input', icon: 'hash', badge: 'New' },
      { label: 'StarRating', path: '/primitives/star-rating', icon: 'star', badge: 'New' },
    ],
  },
  {
    title: 'Display & feedback',
    caption: 'The small atoms everything else reinvents',
    items: [
      { label: 'Badge', path: '/primitives/badge', icon: 'tag', badge: 'New' },
      { label: 'Chip', path: '/primitives/chip', icon: 'tag', badge: 'New' },
      { label: 'Avatar', path: '/primitives/avatar', icon: 'user', badge: 'New' },
      { label: 'Spinner', path: '/primitives/spinner', icon: 'refresh', badge: 'New' },
      { label: 'Progress', path: '/primitives/progress', icon: 'ruler', badge: 'New' },
      { label: 'Skeleton', path: '/primitives/skeleton', icon: 'layers', badge: 'New' },
      { label: 'Divider', path: '/primitives/divider', icon: 'minus', badge: 'New' },
      { label: 'Link', path: '/primitives/link', icon: 'externalLink', badge: 'New' },
      { label: 'Kbd', path: '/primitives/kbd', icon: 'keyboard', badge: 'New' },
      { label: 'Image', path: '/primitives/image', icon: 'image', badge: 'New' },
    ],
  },
  {
    title: 'Molecules',
    caption: 'Primitives, composed',
    items: [
      { label: 'FormField', path: '/components/form-field', icon: 'textCursor' },
      { label: 'SearchField', path: '/components/search-field', icon: 'search' },
      { label: 'PasswordField', path: '/components/password-field', icon: 'eye' },
      { label: 'Choice groups', path: '/components/choice-group', icon: 'checkbox' },
      { label: 'RangeControl', path: '/components/range-control', icon: 'sliders', badge: 'New' },
      { label: 'Figure', path: '/components/figure', icon: 'image', badge: 'New' },
      { label: 'RatingSummary', path: '/components/rating-summary', icon: 'star', badge: 'New' },
      { label: 'ShortcutHint', path: '/components/shortcut-hint', icon: 'keyboard', badge: 'New' },
      { label: 'Calendar', path: '/components/calendar', icon: 'calendar' },
      { label: 'Date & time', path: '/components/date-input', icon: 'clock' },
      { label: 'Accordion', path: '/components/accordion', icon: 'rows', badge: 'New' },
      { label: 'Breadcrumb', path: '/components/breadcrumb', icon: 'chevronRight', badge: 'New' },
      { label: 'Pagination', path: '/components/pagination', icon: 'more', badge: 'New' },
      { label: 'EmptyState', path: '/components/empty-state', icon: 'box', badge: 'New' },
      { label: 'Alert', path: '/components/alert', icon: 'info', badge: 'New' },
      { label: 'Toolbar', path: '/components/toolbar', icon: 'settings', badge: 'New' },
      { label: 'Tooltip', path: '/components/tooltip', icon: 'info', badge: 'New' },
      { label: 'Popover', path: '/components/popover', icon: 'window', badge: 'New' },
      { label: 'FileDropzone', path: '/components/file-dropzone', icon: 'upload', badge: 'New' },
      { label: 'FileQueueItem', path: '/components/file-queue-item', icon: 'file', badge: 'New' },
      { label: 'Tabs', path: '/components/tabs', icon: 'tabs' },
      { label: 'Menu', path: '/components/menu', icon: 'more' },
      { label: 'Select', path: '/components/select', icon: 'list' },
      { label: 'Toast', path: '/components/toast', icon: 'bell' },
    ],
  },
  {
    title: 'Organisms',
    caption: 'Page-level machinery',
    items: [
      { label: 'Dialog', path: '/components/dialog', icon: 'window' },
      { label: 'Drawer', path: '/components/drawer', icon: 'window', badge: 'New' },
      { label: 'FileUploader', path: '/components/file-uploader', icon: 'upload', badge: 'New' },
      { label: 'FilterBar', path: '/components/filter-bar', icon: 'filter', badge: 'New' },
      { label: 'CommandPalette', path: '/components/command-palette', icon: 'search', badge: 'New' },
      { label: 'MapViewer', path: '/components/map-viewer', icon: 'home', badge: 'New' },
      { label: 'Feed', path: '/components/feed', icon: 'bell', badge: 'New' },
      { label: 'Gallery', path: '/components/gallery', icon: 'image', badge: 'New' },
      { label: 'Interstitial', path: '/components/interstitial', icon: 'bell', badge: 'New' },
      { label: 'Tour', path: '/components/tour', icon: 'sparkle', badge: 'New' },
      { label: 'Chart', path: '/components/chart', icon: 'ruler', badge: 'New' },
      { label: 'Inbox & Scheduler', path: '/components/workspace', icon: 'calendar', badge: 'New' },
      { label: 'Board', path: '/components/board', icon: 'columns', badge: 'New' },
      { label: 'AppShell', path: '/components/app-shell', icon: 'window', badge: 'New' },
      { label: 'DataTable', path: '/components/data-table', icon: 'table' },
      { label: 'DataGrid', path: '/components/data-grid', icon: 'grid', badge: 'New' },
      { label: 'DatePicker', path: '/components/date-picker', icon: 'calendar', badge: 'New' },
      { label: 'DateRangePicker', path: '/components/date-range-picker', icon: 'calendar', badge: 'New' },
    ],
  },
];
