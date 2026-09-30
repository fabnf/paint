/**
 * Paint organisms — page-level machinery built from molecules and primitives.
 *
 * | Organism         | Built on                                    |
 * | ---------------- | ------------------------------------------- |
 * | `ds-dialog`            | `.modal`, `.modal-dialog`, `.modal-backdrop` |
 * | `ds-data-table`        | `.table`, `.table-responsive`, `.form-check-input`, `.placeholder` |
 * | `ds-date-picker`       | `ds-date-input` + `ds-calendar`, in an anchored dialog |
 * | `ds-date-range-picker` | two `ds-calendar`s, `ds-date-input` and `ds-time-input` per edge |
 * | `ds-file-uploader`     | `ds-file-dropzone` + `ds-file-queue-item`, and an upload adapter |
 * | `ds-drawer`            | `.offcanvas`, `.modal-backdrop`, and the Dialog's machinery |
 * | `ds-data-grid`         | AG Grid Community, wearing Paint's toolbar, overlays and tokens |
 * | `ds-filter-bar`        | `ds-search-field`, summarising `ds-select`s, `ds-chip` row |
 * | `ds-command-palette`   | a modal combobox: the Dialog's machinery, the Select's ARIA |
 * | `ds-map-viewer`        | Google Maps behind the host's key (or the mock plate), Paint pins, a Paint detail card |
 * | `ds-feed`              | `ds-avatar`/`ds-icon` nodes on a rail, `ds-empty-state`, an injectable clock |
 * | `ds-board`             | lanes of `ds-badge`/`ds-avatar` cards; drag *and* a grab-with-Space keyboard |
 * | `ds-gallery`           | `ds-image`/`ds-figure` thumbnails, a lightbox and a slideshow in one viewer |
 * | `ds-interstitial`      | the full-page interruption: eligible items in the Gallery's viewer |
 * | `ds-tour`              | a guided walkthrough that points at the real UI, step by step |
 * | `ds-chart`             | ten chart types on one contract; Highcharts or the mock plate |
 * | `ds-inbox`             | master–detail threads; the detail is a Drawer on narrow |
 * | `ds-scheduler`         | month, week, day and agenda over host-owned events |
 * | `ds-inbox`             | master–detail threads; the detail is a Drawer on narrow |
 * | `ds-scheduler`         | month, week, day and agenda over host-owned events |
 * | `ds-app-shell`         | top bar + collapsible sidebar (Drawer on narrow), user block, ⌘K, bell |
 */
export * from './dialog';
export * from './data-table';
export * from './date-picker';
export * from './date-range-picker';
export * from './file-uploader';
export * from './drawer';
export * from './filter-bar';
export * from './command-palette';
export * from './map-viewer';
export * from './feed';
export * from './board';
export * from './gallery';
export * from './interstitial';
export * from './tour';
export * from './chart'
export * from './scheduler'
export * from './inbox';
export * from './app-shell';
export * from './data-grid';

/*
 * `chart/highcharts.adapter` is deliberately NOT re-exported — the DataGrid
 * rule. The adapter itself is tiny, but exporting it from the barrel is how a
 * host ends up importing Highcharts from a file that only wanted a type. It is
 * imported from its own door:
 *
 *   import { provideCharts } from '…/design-system/organisms/chart/highcharts.adapter';
 */
