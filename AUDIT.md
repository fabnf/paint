# Paint — production-readiness audit

*Scope: `src/design-system/`, with emphasis on organisms and everything exported to host apps.
Coverage figures from `ng test --code-coverage` over the full suite (1112 specs, all green).*

## Verdict, in one line

The library layer is safe to treat as production-ready; the residual risk is concentrated in
browser-geometry branches (overlay flip-up placement) and in engine behaviour we deliberately
do not own (AG Grid internals, the live Google Maps script).

## What is in good shape

- **Host wiring carries no secrets.** The only credential in the system is the Google Maps key,
  and it is a host-supplied `provideMaps({ apiKey })` token; grep for key/secret/token literals
  comes back empty. Theme persistence is the only storage use, keyed and disableable.
- **Every interactive organism is in the axe harness** (`a11y.spec.ts`) — all 12 organisms and
  the overlay molecules, scanned in their *open/active* states (dialog open, drawer open, palette
  open, grid mid-selection, board card grabbed, uploader failing, feed unread).
- **No hard-coded colour outside the token layer.** The single exception is
  `google-maps.adapter.ts`, where hex values are documented *fallbacks* behind
  `getComputedStyle` token reads (they equal the Paint tokens). Brand packs re-paint every
  organism, map basemap included, because everything reads `--ds-*`.
- **Heavy engines stay behind seams, measured.** AG Grid is value-excluded from the barrel and
  `DS_COMPONENTS` (production chunk analysis on record in `organisms/index.ts`); Google Maps is a
  runtime script behind `MapAdapter`, with a watermarked mock for keyless hosts/CI; uploads go
  through `UploadAdapter` with a simulated stub. Each seam has an offline test double.
- **A showcase route exists for every public organism** (12/12) and molecule.
- **Keyboard/focus is specified, not assumed**, on the pieces that own it: Dialog/Drawer (trap,
  restore, reasons), Menu/Select (full ARIA patterns), pickers (grid walking, Escape layering),
  palette (combobox keys incl. Home/End), board (grab-with-Space journey incl. focus-follow),
  calendar, toolbar roving. Pieces with zero custom key handling (filter bar, feed, uploader)
  correctly delegate to native buttons and tested molecules.
- **Coverage where it matters**: design-system totals 95.9% statements / 86.4% branches /
  95.9% functions; `moveCard`, `matchesAccept`, `scoreCommand`, `fitCameraTo`, `relativeTime`,
  contrast math — every exported pure helper is direct-tested.

## Where it is weak (evidence)

1. **Overlay flip-up placement is untested everywhere.** `updatePlacement()`/`dropUp` in Menu,
   Popover, Select, DatePicker, DateRangePicker, and the Tooltip's top/bottom flip share the same
   viewport arithmetic, and no spec stages a bottom-of-viewport host. It is the common cause of
   "panel renders off-screen" bugs. (Branch coverage: menu 79%, the uncovered branches are
   exactly these.) Needs a harness that positions the trigger near the viewport edge.
2. **Google Maps live-script path.** After this audit the adapter is tested against a stubbed
   `google` namespace (camera, pins, geocoder, teardown — 79% stmts); the remaining dark lines
   are the `<script>` injection/onerror branch itself, which requires a network. Accepted risk;
   the component's error state (engine rejects → Paint alert) is now specified.
3. **AG Grid internals are the engine's word.** Karma defeats AG's style probing (documented in
   the spec), so density pixels and grid a11y are verified against the real browser, not CI.
   Keyboard *inside* the grid is AG's contract, untested by us. Accepted, but worth a line in the
   DataGrid docs if hosts ask.
4. **Non-zero search debounce paths** (FilterBar/SearchField compositions are tested at
   `debounce=0`) and **board `dragleave`** cosmetics are untested — low risk, listed for
   completeness.
5. **Packaging posture, not a code fault:** `ag-grid-community`/`ag-grid-angular` sit in the
   app's `dependencies`. If Paint is ever published as a standalone library, they must become
   optional peer dependencies or the grid must move to a secondary entry point.

## Priority list (smallest useful fixes)

Done in this audit (tiny, test-only):
1. ✅ Google adapter spec against a stubbed `google` namespace — 16% → 79% statements.
2. ✅ MapViewer engine-failure path (reject → Paint alert, `aria-busy` cleared).
3. ✅ DateRangePicker same-day time-swap normalization spec.
4. ✅ `ScrollLockService`/`PageInertService` ref-counting + exemption specs — the stacked-overlay
   case (palette over drawer) no component spec stages. 86/60 → 96/90 and 87/50 → 100/87.
5. ✅ CommandPalette Home/End spec.
6. ✅ README: the DataGrid deep-import rule, stated where hosts will read it.

Planned, not done here (not tiny, or not ours):
7. **Flip-up placement harness** — one shared spec utility that mounts a trigger at the viewport
   bottom and asserts the `--up` class across Menu/Popover/Select/pickers (est. half a day; the
   highest-value remaining gap).
8. **Peer-dependency split for AG Grid** — decide when/if Paint packages as a library; until
   then the barrel exclusion carries the weight.
