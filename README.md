# Paint — an atomic design system

Paint turns design decisions into typed, themeable code for Angular. Foundations at the
bottom, primitives and components on top, products on the shoulders of all of it.


**Shipped** — `Inbox` and `Scheduler`: two organisms, one Ops workspace (Mail / Calendar). Host-owned
threads and events; narrow inbox detail is a Drawer; scheduler covers month, week, day and agenda.
The intro tour stops at Chart, Inbox and Scheduler on real routes.

**Next** — `Chart`: Highcharts behind a Paint adapter, and **ten types on one component** — line,
spline, area, column, bar, stacked-column, pie, donut, scatter and gauge. The host passes a `type`,
`categories` and named series of plain numbers (no engine types, anywhere); Paint owns the chrome
products keep rebuilding: series colours from the live tokens, loading and empty states, a legend
that is real buttons, and a visually-hidden data table. The engine is a seam: `provideCharts({ highcharts })`
is deep-imported, the host owns the licence and the megabyte, and without it the organism draws a
token-styled preview plate. The showcase is a metrics dashboard of all ten.

**Then** — `Tour`: a guided walkthrough that points at the **real** UI. The host passes ordered steps
(`id`, `title`, `body`, a CSS `target`, and a `route` when the step lives on another page); the tour
goes there, *waits for the target to exist*, cuts a spotlight around it and opens a card beside it —
Next, Back, Skip, Done. While a step is open the page is treated the way Dialog treats it: everything
outside the card `inert`, the body scroll locked through the same reference-counted service, focus on
the card and back again at the end. `Escape` skips when the tour allows it, and an optional
"don't show again" keeps that `tourId` away for good. The showcase runs a real nine-step tour of
Paint itself across its own pages — foundations, a primitive, a molecule, Chart,
Inbox, Scheduler, and brand packs.

**Then** — `Interstitial`: the full-page interruption, once per user per item. A content API returns
zero or more things the product wants to say (`id`, `title`, optional body, picture and learn-more
link); everything already **seen or dismissed** is dropped, and whatever is left opens in the
Gallery's viewer — one item alone, several as a deck you can walk. Dismissal is permanent, and
following the link counts as seen. The wire is a seam: `provideInterstitials()` takes a source, the
default one is `fetch` over three endpoints, and the repo ships the **WireMock** stub that serves
them (`npm run mock:api`, proxied at `/api`) — so the showcase and the Playwright suite do a real
`GET`, not a fake adapter.

**Then** — `Gallery`: the product- and marketing-page gallery, and an organism rather than a grid of
thumbnails. One `items` array feeds everything — thumbnails (`grid` or a snapping `strip`, three
sizes, `<ds-image>` ratios and radii), a lightbox, and a slideshow over the *same* list, because
"clicked a thumb" and "start the deck" are one viewer in two modes. The big view is a `<ds-figure>`
when the item has words about it and a plain picture when it does not. The modal behaviour is
`<ds-dialog>`'s note for note — focus trap, scroll lock, the rest of the page `inert`, `Escape`
closes, focus goes back to the thumbnail. Arrows and `Home`/`End` walk the set, the position sits in
a polite live region, and filtering works both ways: the gallery's own `aria-pressed` tag control, or
a host that passes a shorter list.

**Then** — four small compositions on top of the new atoms: `RangeControl` (a slider and a number
field sharing one value, one label and one `min`/`max`/`step`), `Figure` (a real `<figure>` around
`<ds-image>`, with a `<figcaption>` for the caption and the credit — a figure, not a card),
`RatingSummary` (stars, score and review count said to a screen reader **once**) and `ShortcutHint`
(a label and a `<ds-kbd>` in a row — never a tab stop). The atoms inside keep their own chrome; the
molecules only own the label where one label genuinely names two things.

**Then** — the small atoms apps keep inventing by hand: `Kbd`, `StarRating`, `Slider`,
`NumberInput` and `Image`. A keycap that is a real `<kbd>` and never a tab stop; stars that are one
`role="img"` when read and a native radio group when given; a range on Bootstrap's `.form-range` with
six keys stated in one place; a quantity field that clamps and snaps when you step or leave, not while
you type; and a picture with a shape, a radius and a fallback that still has a name. Three more
`ControlValueAccessor`s on the same field contract, two more display atoms on the same tones — and a
Playwright suite that presses the real keys on the real pages.

**Then** — `Feed`: the activity list and the notification inbox as one organism — a rail of
moments with avatar/icon nodes, relative time off an injectable clock (absolute for screen
readers), unread as weight + dot + a word, host-owned bodies via `[dsFeedBody]`, and an empty state
with a way out. Vertical by default, horizontal for the feeds that earn it. The inbox is the same
component inside `ds-popover`, with `countUnread()` powering the bell badge; `itemOpen`/`markRead`
are reports — the host owns the items and flips the flags.

**Then** — `MapViewer`: Google Maps JS API behind the host's key (`provideMaps({ apiKey })`),
wearing Paint — a token-styled basemap, Paint SVG pins, and a Paint detail card on selection (never
a raw InfoWindow; the card's body is the host's `[dsMapDetail]` template with the marker in scope).
Optional search composes `ds-search-field`: markers first, the Google geocoder second. The engine is
an adapter seam: without a key — in tests, in CI, in prototypes — the organism runs a watermarked
mock plate with real projected, focusable pins, and every behaviour stays identical.

**Then** — the list-page organisms: `FilterBar` (search + summarising filter selects + an
active-chip row + clear/apply, one serialisable `FilterState`) and `CommandPalette` (a `⌘K` modal
combobox over mixed commands, links and entities — the Dialog's modality, the Select's ARIA, the
Menu's rows, and a deliberately predictable matcher).

**Then** — multi-brand. Paint now ships typed **brand packs**: a pack is an id, a name, a full
light + dark semantic colour set (the same roles `ThemeDefinition` has always published), and
optional gradient / radius / font-stack overrides. `Paint` is the default pack and is still Wet
Paint — violet, magenta, ink. `Tidewater` (cool teal corporate) and `Ember` (warm amber) ship
alongside it, tellable apart at a glance, each clearing the same AA contrast table as Paint's own
palette, in both modes.

**Then** — `DataGrid`: AG Grid Community, wearing Paint, for the screens the DataTable politely
declines — thousands of rows, per-column filters, resize and reorder, virtualised scrolling. The
wrapper is deliberately thin: the DataTable's toolbar, empty/loading story and selection shape, plus
a token bridge (`themeQuartz` re-pointed at `--ds-*`) so the grid follows the theme at runtime.
Columns are AG `ColDef`s and `(gridReady)` hands out the real `GridApi`. No Enterprise, ever.

**Then** — the organisms people actually embed: `FileUploader` and `Drawer`. The multi-file flow
assembled from the dropzone and the queue rows — concurrency, cancel-on-remove, retry, and a
one-function upload adapter so the organism never owns the wire — and the side-anchored sibling of
`Dialog`, for the detail a table row holds, with the Dialog's modal machinery note for note.

**Then** — the picker organisms: `DatePicker` and `DateRangePicker`. The date molecules finally
assembled: a typed field with a calendar in an anchored dialog, and a filter-style range where both
months are always on screen — drag from one end to the other and the band follows the pointer,
across the month boundary too, with a time on each edge when asked. The overlay and focus contracts
are the ones Menu, Select and Dialog already keep.

**Then** — the light overlays and the file pieces: `Tooltip`, `Popover`, `FileDropzone` and
`FileQueueItem`. The mid-level building blocks apps keep inventing as one-offs — a bubble that is
actually wired to its trigger, an anchored panel that does not take the page hostage, a drop target
that is a real file input, and the row a multi-file uploader renders once per file. Deliberately
molecules: the drawer and the uploader organisms will be made of these.

**Then** — hierarchy and disclosure: `Accordion`, `Breadcrumb`, `Pagination`, `EmptyState`, `Alert`
and `Toolbar`. The pieces every app re-rolls by hand, and gets subtly wrong: a toolbar that is eight
tab stops, a pagination that changes width as you page through it, an empty state that offers to
"create your first invoice" to someone whose filter hid fifty of them.

**Also** — the date-entry building blocks: `Calendar`, `DateInput` and `TimeInput`, plus the pure
calendar arithmetic underneath them. A month you can walk with the arrow keys, a date you can type,
a time you can type — and deliberately **no picker**: no popover, no range, no presets. Those are
decisions a product makes, and the organism that makes them will make them out of these.

**Also** — the form molecules: `FormField`, `SearchField`, `PasswordField`, `RadioGroup` and
`CheckboxGroup`. Nobody wires a label to a hint to an error by hand any more — a field publishes its
id, its description and its validity, and the control inside asks for them. The atoms did not get
smarter: `<ds-input>` still has no idea what a password is.

*Form controls:* `Input`, `Textarea`, `Checkbox`, `Radio` and `Switch`. Five real native controls
with one contract: the control scale they share with `Button`, a `<label for>` that is not a
placeholder, hint and error text wired into `aria-describedby`, and `ControlValueAccessor` on every
one of them.

*Display & feedback:* `Badge`, `Chip`, `Avatar`, `Spinner`, `Progress`, `Skeleton`, `Divider` and
`Link` — the small pieces every product UI reinvents, now with one tone vocabulary, one pulse, one
loading story. Paint's own components stopped reinventing them too: `<ds-button>`'s spinner and
`<ds-data-table>`'s skeleton are the atoms.

**v0.3.1** — an accessibility pass across the interactive layer: full keyboard patterns, focus
management, screen-reader semantics, live regions, reduced motion, and a palette retuned so
every text role clears WCAG AA. All of it asserted by the test suite.

**v0.3.0 “Wet Paint”** — the component layer (`Tabs`, `Menu`, `Select`, `Toast`, `Dialog`,
`DataTable`), and a visual identity to match: an electric violet palette with a magenta bleed,
ink-tinted elevation, grain, and a mark that looks like paint.

## What's included

| Layer | Location | Purpose |
| --- | --- | --- |
| Design tokens | `src/design-system/tokens/` | Typed color, typography, spacing and effect primitives |
| CSS variables | `src/design-system/styles/tokens.scss` | Runtime-ready custom properties + texture utilities |
| Bootstrap layer | `src/design-system/styles/bootstrap.scss` | Bootstrap configured with Paint's foundations |
| Icons | `src/design-system/icons/` | SVG registry + `<ds-icon>` |
| Theme provider | `src/design-system/theme/` | `provideTheme()`, `ThemeService`, Bootstrap bridge |
| Brand | `src/design-system/brand/` | Brand tokens + `<ds-logo>` |
| Primitives | `src/design-system/primitives/` | Button, Text, Box, Flex, Stack, Grid |
| **Form controls** | `src/design-system/primitives/` | **Input, Textarea, Checkbox, Radio, Switch, Slider, NumberInput, StarRating** |
| **Display & feedback** | `src/design-system/primitives/` | **Badge, Chip, Avatar, Spinner, Progress, Skeleton, Divider, Link, Kbd, Image** |
| **Form molecules** | `src/design-system/molecules/` | **FormField, SearchField, PasswordField, RadioGroup, CheckboxGroup** |
| **Date entry** | `src/design-system/molecules/` | **Calendar, DateInput, TimeInput** |
| **Structure** | `src/design-system/molecules/` | **Accordion, Breadcrumb, Pagination, EmptyState, Alert, Toolbar** |
| **Overlays & files** | `src/design-system/molecules/` | **Tooltip, Popover, FileDropzone, FileQueueItem** |
| **Compositions** | `src/design-system/molecules/` | **RangeControl, Figure, RatingSummary, ShortcutHint** |
| Molecules | `src/design-system/molecules/` | Tabs, Menu, Select, Toast |
| Organisms | `src/design-system/organisms/` | Chart, Tour, Interstitial, Gallery, Dialog, DataTable, DatePicker, DateRangePicker, Drawer, FileUploader, DataGrid, FilterBar, CommandPalette, MapViewer, **Feed** |
| Utils | `src/design-system/utils/` | ARIA ids, focus trap, roving index, scroll lock, calendar and step arithmetic |

## Quick start

```bash
npm install
npm start          # showcase at http://localhost:4200
npm test           # 1,300+ unit tests (Karma; set CHROME_BIN to your Chromium in CI)
npm run mock:api   # WireMock, for the Interstitial's content API (:8088)
npm run e2e        # Playwright (starts `ng serve` *and* WireMock itself)
npm run build      # production build
```

## The form controls

Five atoms, one contract. Each is a **native control** — not an ARIA impression of one — with
Paint's chrome around it, and each implements `ControlValueAccessor`.

| Atom | Built on | Brings |
| --- | --- | --- |
| `<ds-input>` | `.form-control`, `.form-label`, `.form-text` | 7 types, icons & affixes, clear (and `Escape`), `number` in/out |
| `<ds-textarea>` | `.form-control` | Auto-grow, character count, the same field chrome |
| `<ds-checkbox>` | `.form-check`, `.form-check-input` | Native `indeterminate` (announced *mixed*), hint + error |
| `<ds-radio>` | `.form-check`, `.form-check-input` | `[(groupValue)]` across a `name`; the browser owns the arrow keys |
| `<ds-switch>` | `.form-switch`, `.form-check-input` | `role="switch"`, `Enter` as well as `Space`, label on either side |

```html
<ds-input label="Email" type="email" autocomplete="email" [(value)]="email"
          hint="We only use it to sign you in." [error]="emailError()" />

<ds-textarea label="Notes" resize="auto" [maxLength]="280" [showCount]="true" [(value)]="notes" />

<ds-checkbox label="Select all" [checked]="allChecked()" [indeterminate]="someChecked()"
             (changed)="toggleAll($event)" />

<fieldset>
  <legend>Deploy target</legend>
  <ds-radio name="target" value="staging" label="Staging" [(groupValue)]="target" />
  <ds-radio name="target" value="prod" label="Production" [(groupValue)]="target" />
</fieldset>

<ds-switch label="Dark mode" [(checked)]="dark" />
```

Decisions worth knowing:

- **`error` *is* the invalid state.** A message sets `aria-invalid` and joins `aria-describedby`,
  so the red border and the announcement can never disagree. The live region exists before the
  message does, or nothing observes it arriving.
- **A placeholder is not a label.** `label` renders a real `<label for>`; `ariaLabel` is the only
  alternative. There is no way to ship a nameless field by accident.
- **The platform keeps its keyboard.** `Space` on a checkbox, arrows inside a radio group, the
  whole text-editing keymap, IME, autofill, password managers and forced colours are the browser's.
  Paint adds exactly two keys: `Escape` clears a clearable Input, `Enter` toggles a Switch.
- **Switch means *now*.** `role="switch"` promises the change has already happened. If it lands on
  *Save*, it is a `<ds-checkbox>`.
- **One control scale.** `sm | md | lg` comes from `controlSizes` in the token layer, shared with
  `<ds-button>`, so a field and the button beside it line up.

## The tour

```ts
readonly steps: TourStep[] = [
  { id: 'welcome', layer: 'Overview', title: 'This is Paint', body: 'A design system in layers.' },
  {
    id: 'tokens',
    layer: 'Foundation',
    title: 'Colour is a role, not a hex',
    body: 'A component asks for “danger”; the theme decides what that is.',
    route: '/foundations',   // another page: the tour goes there…
    target: '#color',        // …and waits for this to exist before opening
  },
];
```

```html
<!-- In the app shell, not in a page -->
<ds-tour #tour tourId="paint-intro" [steps]="steps" [dontShowAgain]="true" (ended)="log($event)" />
<ds-button (clicked)="tour.start()">Take the tour</ds-button>
```

- **It points at the product, not at a mock-up.** `target` is a CSS selector resolved against the
  live document. A walkthrough of three fake buttons teaches three fake buttons.
- **It waits.** After a navigation the target may not have rendered; the tour polls, says so in the
  card, and opens the step when it arrives. If the selector has really gone it opens **centred** after
  `targetTimeout` rather than stranding the user in a tour that cannot advance.
- **Dialog's modality, again.** `inert` outside the card, the shared reference-counted scroll lock,
  focus to the card, focus back at the end — and when "back" no longer exists (six routes later), the
  main landmark instead of `<body>`.
- **One spotlight element** with a hole cut around the target (`box-shadow: 0 0 0 9999px`), so the
  target stays at full contrast and there are no four overlay panels to keep in sync.
- **It takes no for an answer.** Skip and `Escape` end it (unless `dismissible` is false);
  `dontShowAgain` ticks a box that `TourMemory` remembers per `tourId`, so a second tour later is
  unaffected. `localStorage` by default, `MemoryTourMemory` in tests, `provideTour()` to choose.
- **A cross-route tour must live outside the router outlet** — the router would destroy it on the
  first `Next`. The showcase's own tour lives in the app shell for exactly that reason, which is the
  kind of thing a design system should find out before its users do.

## The interstitial

`<ds-interstitial>` is the interruption a product shows a user *once*: a release note, a brand
announcement, an onboarding card. The hard parts are not the panel — they are "who has already seen
this" and "never show it again".

```ts
// the seam, once, at the root
provideInterstitials({ baseUrl: '/api/interstitials' });

// in a page
private readonly interstitials = inject(InterstitialService);

async ngOnInit() {
  // Zero eligible items is the normal case: nothing renders.
  if ((await this.interstitials.load()).length) this.showing.set(true);
}
```

```html
<ds-interstitial
  [items]="interstitials.eligible()"
  [(open)]="showing"
  (seen)="interstitials.markSeen($event.item.id)"
  (dismissed)="interstitials.markDismissed($event.item.id)"
  (learnMore)="interstitials.markSeen($event.item.id)"
/>
```

- **It is the Gallery underneath.** One eligible item opens alone; several become a deck with the
  Gallery's counter, dots, two buttons and keyboard — driven through `[thumbnails]="false"` and a
  host-owned `[dsGallerySlide]` template (new, and the reason the Gallery did not have to learn what
  an announcement is). So the modality is the Dialog's note for note: focus trap, reference-counted
  scroll lock, the rest of the page `inert`, `Escape` closes, focus returns.
- **Seen and dismissed are different promises with the same effect.** Showing an item marks it seen —
  and so does following its link, because it has been put in front of the user. `Dismiss` is the
  stronger, permanent one. Both are *outputs*: the organism never owns the user's history.
- **The rule is a function.** `eligibleItems(items, seen, dismissed)` — readable and tested without a
  component or a network. `InterstitialService` is load + that rule + the record store.
- **The deck is taken when it opens.** Marking the current slide seen removes it from `eligible()`;
  reading the input live would delete the slide under the user's eyes.
- **The wire is someone else's.** `InterstitialSource` is `load` / `markSeen` / `markDismissed`.
  `HttpInterstitialSource` (the default) is plain `fetch` over `GET {base}`,
  `POST {base}/{id}/seen`, `POST {base}/{id}/dismissed` — no `HttpClient` dependency for a content
  stub. `StaticInterstitialSource` is the offline double the unit suite uses.
- **WireMock is the mock, committed.** `mock/wiremock/` holds the mappings and the payload;
  `npm run mock:api` runs it on `:8088`, `proxy.conf.json` points the dev server's `/api` at it, and
  Playwright starts it as a second web server — the e2e suite asserts the real `GET` response and
  reads WireMock's request journal to prove the `seen`/`dismissed` POSTs happened. With the stub
  down, the showcase shows the organism's failure path and says so.
- **Records survive a reload.** `LocalInterstitialStore` keeps seen/dismissed in `localStorage`
  (`MemoryInterstitialStore` for tests), so a dismissal is not undone by a refresh.

## The gallery

`<ds-gallery>` is the organism for a set of pictures: thumbnails, a way to see one properly, and a
way to walk all of them — over **one** `items` array.

```html
<ds-gallery
  label="Product shots"
  [items]="shots"
  layout="grid"
  thumbSize="md"
  ratio="4/3"
  [filterable]="true"
  [presentable]="true"
  (itemOpen)="selected.set($event.item)"
  (itemChange)="selected.set($event.item)"
/>

<!-- The same viewer, from anywhere -->
<ds-gallery #deck [items]="shots" />
<ds-button iconStart="play" (clicked)="deck.present()">Play the deck</ds-button>
```

| Item field | For |
| --- | --- |
| `src`, `alt` | the picture, and the thumbnail button's name |
| `thumb` | a smaller source, when the host has one |
| `caption`, `credit` | words about the picture — either one makes the big view a `<ds-figure>` |
| `href` / `link` | where the picture goes; offered as a link *inside* the viewer |
| `tags` | what makes filtering mean something |
| `data` | whatever the host wants back on `itemOpen` / `itemChange` |

- **One list, one viewer.** Lightbox and slideshow are `mode` on the same overlay over the same
  array, so they cannot drift apart — and `next` always means "next in what is on screen", which is
  why the viewer walks the *filtered* list.
- **Nothing new was invented.** Thumbnails are `<ds-image>` in the existing ratio and radius tokens;
  the big view is a `<ds-figure>` when there are words and a `<ds-image>` when there is only a
  photograph and its alt. Three thumbnail sizes, two layouts (`grid`, and a snapping `strip`).
- **The Dialog's modality, note for note.** Focus trap, reference-counted scroll lock, everything
  outside `inert`, `Escape` to close, focus back to the thumbnail that opened it. Opening is treated
  as a *render* event (an effect, as in Dialog), because the sheet does not exist at click time.
- **Every thumbnail is a real button**, named by the picture's alt, with the picture inside it
  decorative — never an `<img>` with a click handler. The position line ("3 of 6 — The mug") is a
  polite live region, so moving is heard without leaving the viewer, and it is the *only* thing
  announced: the picture's name travels with the picture.
- **Filtering, two ways that compose.** `filterable` builds one `aria-pressed` toggle per tag found
  in the items, with `[(activeTag)]`; or the host filters and passes a shorter `items` — the right
  answer when the filter is shared with the rest of the page.
- **No autoplay.** A picture that moves on its own is a picture nobody finished reading.

## The small compositions

Four molecules made of the new atoms, each the size of a pattern apps draw by hand. Bundled as
`DS_DISPLAY_MOLECULES` (Figure, RatingSummary, ShortcutHint); RangeControl joins `DS_FORM_MOLECULES`.

| Molecule | Composed from | Brings |
| --- | --- | --- |
| `<ds-range-control>` | `ds-slider` + `ds-number-input` | One value, one label, one `min`/`max`/`step`. A `ControlValueAccessor` for the pair |
| `<ds-figure>` | `<figure>` + `ds-image` + `<figcaption>` | Caption, credit (optionally a link), and the picture as a link — named by its alt |
| `<ds-rating-summary>` | `ds-star-rating` + one sentence | Stars, score and count for the eye; *"4.3 out of 5 stars, 1,204 reviews"* for the ear, once |
| `<ds-shortcut-hint>` | a label + `ds-kbd` | The settings-row / shortcuts-sheet row. No role, no tab stop, no listener |

```html
<ds-range-control label="Volume" [(value)]="volume" suffix="%" />
<ds-form-field label="Brightness" hint="Of the backlight.">
  <ds-range-control formControlName="brightness" />
</ds-form-field>

<ds-figure src="/plates/3.jpg" alt="A violet wash with a magenta bleed" ratio="16/9"
           caption="Plate 3 — the first swatch." credit="Photo: Ada Lovelace" creditHref="/ada" />

<ds-rating-summary [value]="4.3" [count]="1204" reviewsHref="#reviews" />

<ds-stack [gap]="0" [divided]="true">
  <ds-shortcut-hint label="Search" keys="⌘K" />
  <ds-shortcut-hint label="Save" description="Also saves drafts." keys="⌘S" />
</ds-stack>
```

Decisions worth knowing:

- **The atoms keep their chrome; the molecule owns the label only when it must.** Slider, NumberInput
  and StarRating already draw a label, a hint and an error. RangeControl is the one case where a
  single label genuinely names two controls, so it draws the chrome once and hands the atoms none:
  a `<label for>` on the slider, the same element through `aria-labelledby` on the number field, one
  hint and one error describing both. Inside a `<ds-form-field>` the molecule adopts the field and
  **shields the atoms from it** (`viewProviders` blank `DS_FIELD`; the molecule reads it with
  `skipSelf`), because two controls cannot share the field's one id.
- **Typing stays free in the pair.** The model is clamped on every keystroke so the slider and any
  form only see a legal value; the digits are rewritten only when the field settles.
- **A figure is named by its caption, a picture by its alt, and they are different words.** A
  caption that says everything may come with `alt=""` — the picture is then decorative and the figure
  is still named. The picture link is a plain `<a>` around the image (named by the alt, nothing
  added); the credit link is a `<ds-link>`.
- **A summary is one sentence.** The stars, the number and the count are `aria-hidden`; one
  visually-hidden sentence says them. When the count is a link it has to be reachable, so it moves
  out of the sentence and speaks for itself — two things, because two things is what they are.
- **A shortcut hint does nothing.** It shows a key; the component that owns the behaviour owns the
  keydown. `alternatives` exists for the rare action with two real shortcuts, not for ⌘ vs Ctrl.

## The range-style atoms

Three more form controls, one more contract. Each is a `ControlValueAccessor` on `FormControlBase` —
the same label / hint / error / disabled / `size` plumbing as Input, the same `<ds-form-field>`
adoption — and each owns a number that has *rules*.

| Atom | Built on | Brings |
| --- | --- | --- |
| `<ds-slider>` | `.form-range` | A filled track, `valueText` as `aria-valuetext`, and six keys stated in one place: arrows step, `Page` keys jump ten, `Home`/`End` hit the ends |
| `<ds-number-input>` | `.form-control` + two real `<button>`s | − / + steppers that are not tab stops, typing that is never corrected mid-thought, and a value that is clamped and snapped when you step or leave |
| `<ds-star-rating>` | native radios, or one `role="img"` | Stars to read (half stars, one announcement) and stars to give (a radio group, every star named); `clearable` adds `Backspace` |

```html
<ds-slider label="Volume" [(value)]="volume" [showValue]="true" />
<ds-slider label="Budget" [max]="5000" [step]="100" [valueText]="'$' + budget()" formControlName="budget" />

<ds-number-input label="Seats" [min]="1" [max]="12" [(value)]="seats" />
<ds-number-input label="Price" [min]="0" [step]="0.01" prefix="$" formControlName="price" />

<ds-star-rating [value]="3.5" [readOnly]="true" ariaLabel="Average rating" />
<ds-star-rating label="Your rating" [(value)]="rating" [clearable]="true" />
<ds-star-rating label="Service" [starLabels]="['Terrible', 'Poor', 'OK', 'Good', 'Great']" formControlName="service" />
```

Decisions worth knowing:

- **One arithmetic.** `utils/number.ts` — `clamp`, `snapToGrid`, `stepValue`, `roundToStep` — is the
  only place a step is computed. The grid is anchored at `min`, as HTML anchors it (`min=1 step=2`
  steps 1, 3, 5), and every result is written with the step's own precision, so `0.1 × 3` is `0.3`.
  Slider and NumberInput cannot disagree, because neither has an opinion.
- **The keyboard is stated, not hoped for.** Browsers do not agree about `Home`, `End` and the `Page`
  keys on a range input, so the Slider re-states all six keys in one `keydown` and the suite asserts
  them — in Karma with synthetic events, and in Playwright with real ones. The pointer, the drag and
  forced colours stay the platform's.
- **When the quantity rules apply.** Typing is free: `"1"` on the way to `"12"` is not yet out of
  range, and a field that corrected it would fight the caret. Stepping is always on the grid and
  inside the bounds, and the buttons disable at the ends. Leaving the field — blur or `Enter` — clamps
  and snaps. A `min` of `1` does not stop anyone typing `0`; it stops them leaving with it.
- **The steppers are not tab stops.** Keyboard users step with `↑`/`↓`; the buttons are pointer
  affordances, the way the clear button of `<ds-input>` is. They are still real, named buttons.
- **A rating is two controls.** Read-only is one `role="img"` named *"Average rating, 3.5 of 5
  stars"* — one announcement, not five. Editable is five visually-hidden native radios with the stars
  as their labels: `Tab` lands on the chosen star, the arrows move and choose, `Space` chooses, and
  every radio is named (*"4 stars, Good"* with `starLabels`). Paint adds only what a radio group
  cannot do natively — un-choosing — behind `clearable`. No rating library; no slider pretending.
- **Whole stars when giving, halves when reading.** Nobody means three and a half. A `3.7` written
  in by a form checks the fourth radio; the same `3.7` in read-only draws three and a half.

## The display atoms that were missing

| Atom | Built on | Brings |
| --- | --- | --- |
| `<ds-kbd>` | a real `<kbd>` | A keycap: one per key, `+` between them, mono type, an edge. Never a tab stop, never a listener |
| `<ds-image>` | a real `<img>`, framed | `aspect-ratio`, `object-fit` / `position`, the radius tokens, native lazy loading, and a fallback with a name |

```html
<ds-kbd>Esc</ds-kbd>
<ds-kbd keys="Ctrl+Enter" size="md" />
<ds-kbd keys="⌘K" />                                  <!-- announced "Command K" -->

<ds-image src="/covers/wet-paint.jpg" alt="Cover of Wet Paint" ratio="16/9" radius="lg" />
<ds-image [src]="null" alt="Floor plan" fallbackText="No plan uploaded" ratio="4/3" />
<ds-image [src]="texture" alt="" [decorative]="true" ratio="21/9" />
<ds-image [src]="cover()" alt="Cover" ratio="1/1">
  <ds-avatar dsImageFallback name="Wet Paint" shape="square" [decorative]="true" />
</ds-image>
```

- **Glyphs for eyes, words for ears.** `⌘` is announced as *"place of interest sign"*. When `keys`
  contain a glyph Paint knows, the keycaps are hidden and the words are spoken instead (`srLabel`
  overrides). `Ctrl+Enter` already reads as words and is left alone.
- **Every picture says what it is, or says it is decoration.** `alt` is the name; `decorative` is the
  explicit way out, and it empties the alt *and* hides the fallback. A picture with neither is a
  mistake, and Paint warns in development. A missing `src` and a failed one look the same — a quiet,
  textured block — and the frame is still `role="img"` with the alt as its name, so a screen reader
  hears *"Cover of Wet Paint"*, not a file name, and not nothing.
- **Nothing jumps.** `ratio` is CSS `aspect-ratio`; the frame holds its space from the first paint.
  Outcomes are remembered *per source*, so a new `src` is a fresh attempt with nothing to reset.

## The display & feedback atoms

The pieces product UI keeps re-inventing, one-off by one-off. Eight atoms, and between them a single
vocabulary of **tones**: `neutral | primary | accent | success | warning | danger | info`.

| Atom | Built on | Brings |
| --- | --- | --- |
| `<ds-badge>` | `.badge` | A status the *system* wrote. 7 tones × 3 variants, a dot, `srLabel` for counts |
| `<ds-chip>` | tones + a real `<button>` | A value the *user* put there — and can remove. `removeTabbable` for composite widgets |
| `<ds-avatar>` | tones + the avatar scale | Image → initials → icon, a tint hashed from the name, presence folded into one name |
| `<ds-spinner>` | `.spinner-border` | A wait with no length, named out loud — or `decorative` inside something already busy |
| `<ds-progress>` | `.progress` | A wait you can count, `aria-valuetext` for what the number *means*, and a real indeterminate state |
| `<ds-skeleton>` | `.placeholder`, `-glow`, `-wave` | The shape of what is coming. Silent by default |
| `<ds-divider>` | a border and a role | `role="separator"`, both orientations, a word in the middle |
| `<ds-link>` | a real `<a href>` | Router or document, `_blank` secured and announced, an `inherit` variant for running text |

```html
<ds-badge tone="danger" variant="solid" icon="warning">2 failures</ds-badge>
<ds-badge tone="accent" [pill]="true" srLabel="12 unread messages">12</ds-badge>

<ds-chip tone="primary" [removable]="true" [removeLabel]="'Remove ' + tag" (removed)="drop(tag)">
  {{ tag }}
</ds-chip>

<ds-avatar name="Grace Hopper" status="online" />      <!-- "Grace Hopper, Online" -->
<ds-spinner size="lg" label="Loading invoices…" />
<ds-progress label="Storage" [value]="18" [max]="20" valueText="18 of 20 GB used" tone="warning" />
<ds-skeleton label="Loading the invoice…" [lines]="3" />
<ds-divider label="or" />
<ds-link href="https://angular.dev" target="_blank">Angular</ds-link>
```

### A tone is a meaning, not a colour

`styles/primitives.scss` declares every tone as four custom properties — `--ds-tone-fg`, `-bg`,
`-solid`, `-on-solid` — and the atoms read those. No component names a colour, so `tone="danger"`
is the same red in a Badge, a Chip and a Progress bar, and re-tints with the theme for free.

`onSolid` is the existing `onPrimary` role: white on paper, ink on a lit canvas. The token layer
asserts it clears 4.5:1 on **every** filled tone in **both** themes, which is why a solid badge is
safe and why there is no `onDanger` token.

Two new token groups came with them: `--ds-avatar-size-*` (the avatar scale, whose `sm`/`md`/`lg`
line up with the control heights) and `--ds-motion-pulse` + `--ds-skeleton-color` — one tempo and one
grey, so two skeletons never breathe at different speeds.

Two new token groups came with them: `--ds-avatar-size-*` (the avatar scale, whose `sm`/`md`/`lg`
line up with the control heights) and `--ds-motion-pulse` + `--ds-skeleton-color` — one tempo and one
grey, so two skeletons never breathe at different speeds.

### Three ways to say "wait", and they are not interchangeable

- **Spinner** — the wait has no length and the result has no shape.
- **Progress** — you can count it. The moment you can say "4 of 10", this is the component.
  `indeterminate` keeps the bar and drops `aria-valuenow`, which is exactly how ARIA says
  *"in progress, amount unknown"*.
- **Skeleton** — the shape of the answer is known, so the page does not jump when it lands.
  Skeletons are `aria-hidden` by default: a dozen announcing rectangles is noise. The region says it
  is busy once.

### Badge or chip?

A badge is a fact the system wrote about a thing — *failed*, *Pro*, *12*. A chip is a value the user
put there — a tag, a filter, a recipient. Which is why a chip can carry a remove button, and a badge
never does. Neither is ever a tab stop except for that one button.

### The one-offs they replace

The atoms existed already — as private markup, in four places, drifting.

| Was | Now | Why it was worth the swap |
| --- | --- | --- |
| `<ds-button>`'s `.spinner-border` span | `<ds-spinner [decorative]="true" tone="inherit">` | One spinner, one reduced-motion rule. The button still reports `aria-busy` and the ring still takes the button's ink |
| `<ds-data-table>`'s `.ds-table__skeleton` | `<ds-skeleton>` | Deleted a keyframe, a colour and a `prefers-reduced-motion` block that had already drifted from the rest of the system |
| The docs site's three header `.badge` spans, its version chip and its nav pills | `<ds-badge>` | The showcase is a consumer of the system, and now it proves it |

Two deliberately left alone, because the swap is not tiny:

- **`<ds-select>`'s chips.** `<ds-chip [removable] [removeTabbable]="false">` is the shape of them,
  and it is why that input exists — but the Select's chips live inside a combobox that owns
  `Backspace` and the arrow keys, so the swap is a change to a molecule's keyboard contract, not to
  its markup. Next pass.
- **`<ds-tabs>`'s count badge.** It is `aria-hidden`, it inherits the active tab's colour, and the
  tab's accessible name already says "Activity, 12 items". A `<ds-badge srLabel>` would say it twice.

### The one-offs they replace

The atoms existed already — as private markup, in four places, drifting.

| Was | Now | Why it was worth the swap |
| --- | --- | --- |
| `<ds-button>`'s `.spinner-border` span | `<ds-spinner [decorative]="true" tone="inherit">` | One spinner, one reduced-motion rule. The button still reports `aria-busy` and the ring still takes the button's ink |
| `<ds-data-table>`'s `.ds-table__skeleton` | `<ds-skeleton>` | Deleted a keyframe, a colour and a `prefers-reduced-motion` block that had already drifted from the rest of the system |
| The docs site's three header `.badge` spans, its version chip and its nav pills | `<ds-badge>` | The showcase is a consumer of the system, and now it proves it |

Two deliberately left alone, because the swap is not tiny:

- **`<ds-select>`'s chips.** `<ds-chip [removable] [removeTabbable]="false">` is the shape of them,
  and it is why that input exists — but the Select's chips live inside a combobox that owns
  `Backspace` and the arrow keys, so the swap is a change to a molecule's keyboard contract, not to
  its markup. Next pass.
- **`<ds-tabs>`'s count badge.** It is `aria-hidden`, it inherits the active tab's colour, and the
  tab's accessible name already says "Activity, 12 items". A `<ds-badge srLabel>` would say it twice.

## The display & feedback atoms

The pieces product UI keeps re-inventing, one-off by one-off. Eight atoms, and between them a single
vocabulary of **tones**: `neutral | primary | accent | success | warning | danger | info`.

| Atom | Built on | Brings |
| --- | --- | --- |
| `<ds-badge>` | `.badge` | A status the *system* wrote. 7 tones × 3 variants, a dot, `srLabel` for counts |
| `<ds-chip>` | tones + a real `<button>` | A value the *user* put there — and can remove. `removeTabbable` for composite widgets |
| `<ds-avatar>` | tones + the avatar scale | Image → initials → icon, a tint hashed from the name, presence folded into one name |
| `<ds-spinner>` | `.spinner-border` | A wait with no length, named out loud — or `decorative` inside something already busy |
| `<ds-progress>` | `.progress` | A wait you can count, `aria-valuetext` for what the number *means*, and a real indeterminate state |
| `<ds-skeleton>` | `.placeholder`, `-glow`, `-wave` | The shape of what is coming. Silent by default |
| `<ds-divider>` | a border and a role | `role="separator"`, both orientations, a word in the middle |
| `<ds-link>` | a real `<a href>` | Router or document, `_blank` secured and announced, an `inherit` variant for running text |

```html
<ds-badge tone="danger" variant="solid" icon="warning">2 failures</ds-badge>
<ds-badge tone="accent" [pill]="true" srLabel="12 unread messages">12</ds-badge>

<ds-chip tone="primary" [removable]="true" [removeLabel]="'Remove ' + tag" (removed)="drop(tag)">
  {{ tag }}
</ds-chip>

<ds-avatar name="Grace Hopper" status="online" />      <!-- "Grace Hopper, Online" -->
<ds-spinner size="lg" label="Loading invoices…" />
<ds-progress label="Storage" [value]="18" [max]="20" valueText="18 of 20 GB used" tone="warning" />
<ds-skeleton label="Loading the invoice…" [lines]="3" />
<ds-divider label="or" />
<ds-link href="https://angular.dev" target="_blank">Angular</ds-link>
```

### A tone is a meaning, not a colour

`styles/primitives.scss` declares every tone as four custom properties — `--ds-tone-fg`, `-bg`,
`-solid`, `-on-solid` — and the atoms read those. No component names a colour, so `tone="danger"`
is the same red in a Badge, a Chip and a Progress bar, and re-tints with the theme for free.

`onSolid` is the existing `onPrimary` role: white on paper, ink on a lit canvas. The token layer
asserts it clears 4.5:1 on **every** filled tone in **both** themes, which is why a solid badge is
safe and why there is no `onDanger` token.

Two new token groups came with them: `--ds-avatar-size-*` (the avatar scale, whose `sm`/`md`/`lg`
line up with the control heights) and `--ds-motion-pulse` + `--ds-skeleton-color` — one tempo and one
grey, so two skeletons never breathe at different speeds.

### Three ways to say "wait", and they are not interchangeable

- **Spinner** — the wait has no length and the result has no shape.
- **Progress** — you can count it. The moment you can say "4 of 10", this is the component.
  `indeterminate` keeps the bar and drops `aria-valuenow`, which is exactly how ARIA says
  *"in progress, amount unknown"*.
- **Skeleton** — the shape of the answer is known, so the page does not jump when it lands.
  Skeletons are `aria-hidden` by default: a dozen announcing rectangles is noise. The region says it
  is busy once.

### Badge or chip?

A badge is a fact the system wrote about a thing — *failed*, *Pro*, *12*. A chip is a value the user
put there — a tag, a filter, a recipient. Which is why a chip can carry a remove button, and a badge
never does. Neither is ever a tab stop except for that one button.

### The one-offs they replace

The atoms existed already — as private markup, in four places, drifting.

| Was | Now | Why it was worth the swap |
| --- | --- | --- |
| `<ds-button>`'s `.spinner-border` span | `<ds-spinner [decorative]="true" tone="inherit">` | One spinner, one reduced-motion rule. The button still reports `aria-busy` and the ring still takes the button's ink |
| `<ds-data-table>`'s `.ds-table__skeleton` | `<ds-skeleton>` | Deleted a keyframe, a colour and a `prefers-reduced-motion` block that had already drifted from the rest of the system |
| The docs site's three header `.badge` spans, its version chip and its nav pills | `<ds-badge>` | The showcase is a consumer of the system, and now it proves it |

Two deliberately left alone, because the swap is not tiny:

- **`<ds-select>`'s chips.** `<ds-chip [removable] [removeTabbable]="false">` is the shape of them,
  and it is why that input exists — but the Select's chips live inside a combobox that owns
  `Backspace` and the arrow keys, so the swap is a change to a molecule's keyboard contract, not to
  its markup. Next pass.
- **`<ds-tabs>`'s count badge.** It is `aria-hidden`, it inherits the active tab's colour, and the
  tab's accessible name already says "Activity, 12 items". A `<ds-badge srLabel>` would say it twice.

## Multi-brand

Components are **brand-agnostic**: they read `--ds-*` custom properties and never learn which pack
filled them. A brand pack is data, poured over the same variables:

```ts
import { provideTheme, builtInBrandPacks, type BrandPack } from './design-system/theme';

// 1. Register the packs the host offers. Paint is always available and is the default.
provideTheme({
  packs: builtInBrandPacks, // [paintBrandPack, tidewaterBrandPack, emberBrandPack]
  defaultBrand: 'paint',
  brandStorageKey: 'my-app-brand', // persisted alongside the mode; false to disable
});

// Or bring your own. The type insists on the full semantic set for light *and* dark —
// a brand that forgets a role would be shipping a bug, so it will not compile.
const acme: BrandPack = {
  id: 'acme',
  name: 'Acme',
  colors: { light: { /* full SemanticColors */ }, dark: { /* full SemanticColors */ } },
  gradients: { brand: 'linear-gradient(…)' }, // optional
  radii: { md: '0.25rem' },                   // optional
  fonts: { display: '"Inter", sans-serif' },  // optional — stacks, not font files
};
```

```ts
// 2. Switch globally. Every --ds-* (and derived --bs-*) on the root is remapped;
//    mode and brand are independent, separately persisted axes.
const theme = inject(ThemeService);
theme.setBrand('tidewater');
theme.setMode('dark');
```

```html
<!-- 3. Scope a subtree. Vars land on that host; children inherit, siblings never hear about it. -->
<section dsBrand="tidewater">
  …
  <aside [dsTheme]="'dark'" dsBrand="ember">…a nested scope may differ again…</aside>
</section>
```

The static Sass fallbacks in `styles/tokens.scss` / `styles/bootstrap.scss` stay Wet Paint — no
brand hex is duplicated into Sass. First paint is Paint; the runtime pack wins once `provideTheme`
runs. The Bootstrap bridge (`--bs-*`) is always derived from the active pack, never a second
palette. Every pack — built-in or host-authored — is held to the same AA contrast table as Paint's
own palette (`tokens/contrast.pairs.ts`), and `<ds-logo>` remains the design system's mark: packs
are palettes, not lockups.

## The form molecules

The atoms can each draw their own label, hint and error. A form of eight fields then repeats the same
four inputs eight times, and the day the asterisk moves, it moves in eight places.

| Molecule | Composed from | Brings |
| --- | --- | --- |
| `<ds-form-field>` | the field chrome + any control | One `<label for>`, `aria-describedby`, `aria-invalid`, `required`, `disabled` — pushed into the control |
| `<ds-search-field>` | `ds-input`, `ds-spinner` | Debounce, a spinner *inside* the field, and the result count in a live region |
| `<ds-password-field>` | `ds-input`, `ds-button`, `ds-progress` | A real `aria-pressed` toggle, `autocomplete` that means something, an optional strength meter |
| `<ds-radio-group>` | `ds-radio` | `<fieldset role="radiogroup">` + `<legend>`, one shared `name`, `[(value)]`, CVA |
| `<ds-checkbox-group>` | `ds-checkbox` | `<fieldset>` + `<legend>`, an array instead of five booleans, a tri-state "select all" |

```html
<ds-form-field label="Email" hint="We only use it to sign you in." [error]="emailError()">
  <ds-input type="email" autocomplete="email" [(value)]="email" />
</ds-form-field>

<!-- A Select's trigger is a <button>, and a <button> is a labelable element -->
<ds-form-field label="Owner" [required]="true">
  <ds-select [options]="people" formControlName="owner" />
</ds-form-field>

<!-- Anything else takes one attribute -->
<ds-form-field label="Brand colour" hint="Hex, or pick one.">
  <input dsFieldControl type="color" class="form-control" />
</ds-form-field>

<ds-form-field label="Password" hint="At least 12 characters.">
  <ds-password-field purpose="new" [showStrength]="true" formControlName="password" />
</ds-form-field>

<ds-radio-group legend="Deploy target" [options]="targets" [(value)]="target" />
<ds-checkbox-group legend="Scopes" [options]="scopes" [selectAll]="true" [(value)]="granted" />
```

### The wiring is DI, not DOM

`<ds-form-field>` publishes a `FieldContext`; the control asks for it, optionally, and folds it into
its own state. Nothing is queried after render, nothing reaches into anything, and a control written
outside a field behaves exactly as it did before.

```ts
// primitives/forms/field-context.ts — the contract lives in the atom layer,
// so the control never imports the molecule that wraps it.
export interface FieldContext {
  controlId: Signal<string>;        // the id <label for> points at
  labelId: Signal<string | null>;   // for controls named by aria-labelledby
  describedByIds: Signal<string | null>;
  invalid: Signal<boolean>;
  required: Signal<boolean>;
  disabled: Signal<boolean>;
}

// FormControlBase — inherited by all five form atoms
protected readonly field = inject(DS_FIELD, { optional: true });
```

Consequences worth knowing:

- **The field owns the id.** Its label has to point at the control, and only one of them can win.
  Pass `id` to the field, never to the control.
- **`<ds-select>` fits.** Its trigger is a `<button>`, which HTML lists as labelable, so the field's
  `<label for>` names it — and the ARIA combobox pattern still names it by that label *and* its value.
- **The groups opt out.** `<ds-radio-group>` and `<ds-checkbox-group>` provide `DS_FIELD: null`, or a
  `<ds-form-field>` above them would hand every radio the same id and the same label.
- **Not for a checkbox.** A checkbox's label belongs *beside* it. `<label for>` over a *set* of them
  would name the first and leave the rest anonymous — which is what the groups are for.

### What the molecules refuse to do

- **SearchField does not fire per keystroke.** It debounces, de-duplicates, answers a clear at once
  (emptying a filter is not a thought in progress), and flushes the pending wait on `Enter` rather
  than racing it. The result count goes into *one* polite region, born empty so the first answer is
  heard, and doubles as the field's description so it survives a re-focus.
- **PasswordField keeps the atom dumb.** `<ds-input>` gained a `[dsInputTrailing]` slot — not a
  password feature, just somewhere for a control to sit inside the field. Revealing swaps
  `type="password"` for `type="text"`, because a custom mask loses selection, IME, autofill and the
  password manager that was about to fill it. The strength meter is a `progressbar`, never a live
  region; it must not narrate "Weak. Fair. Good." on every keystroke.
- **The groups do not invent ARIA.** A radio group is a `<fieldset role="radiogroup">` with one shared
  `name` — which is where the browser's arrow keys come from. A checkbox group is a plain `<fieldset>`,
  because `role="checkboxgroup"` does not exist and the browser has nothing to do with one.

## The form molecules

The atoms can each draw their own label, hint and error. A form of eight fields then repeats the same
four inputs eight times, and the day the asterisk moves, it moves in eight places.

| Molecule | Composed from | Brings |
| --- | --- | --- |
| `<ds-form-field>` | the field chrome + any control | One `<label for>`, `aria-describedby`, `aria-invalid`, `required`, `disabled` — pushed into the control |
| `<ds-search-field>` | `ds-input`, `ds-spinner` | Debounce, a spinner *inside* the field, and the result count in a live region |
| `<ds-password-field>` | `ds-input`, `ds-button`, `ds-progress` | A real `aria-pressed` toggle, `autocomplete` that means something, an optional strength meter |
| `<ds-radio-group>` | `ds-radio` | `<fieldset role="radiogroup">` + `<legend>`, one shared `name`, `[(value)]`, CVA |
| `<ds-checkbox-group>` | `ds-checkbox` | `<fieldset>` + `<legend>`, an array instead of five booleans, a tri-state "select all" |

```html
<ds-form-field label="Email" hint="We only use it to sign you in." [error]="emailError()">
  <ds-input type="email" autocomplete="email" [(value)]="email" />
</ds-form-field>

<!-- A Select's trigger is a <button>, and a <button> is a labelable element -->
<ds-form-field label="Owner" [required]="true">
  <ds-select [options]="people" formControlName="owner" />
</ds-form-field>

<!-- Anything else takes one attribute -->
<ds-form-field label="Brand colour" hint="Hex, or pick one.">
  <input dsFieldControl type="color" class="form-control" />
</ds-form-field>

<ds-form-field label="Password" hint="At least 12 characters.">
  <ds-password-field purpose="new" [showStrength]="true" formControlName="password" />
</ds-form-field>

<ds-radio-group legend="Deploy target" [options]="targets" [(value)]="target" />
<ds-checkbox-group legend="Scopes" [options]="scopes" [selectAll]="true" [(value)]="granted" />
```

### The wiring is DI, not DOM

`<ds-form-field>` publishes a `FieldContext`; the control asks for it, optionally, and folds it into
its own state. Nothing is queried after render, nothing reaches into anything, and a control written
outside a field behaves exactly as it did before.

```ts
// primitives/forms/field-context.ts — the contract lives in the atom layer,
// so the control never imports the molecule that wraps it.
export interface FieldContext {
  controlId: Signal<string>;        // the id <label for> points at
  labelId: Signal<string | null>;   // for controls named by aria-labelledby
  describedByIds: Signal<string | null>;
  invalid: Signal<boolean>;
  required: Signal<boolean>;
  disabled: Signal<boolean>;
}

// FormControlBase — inherited by all five form atoms
protected readonly field = inject(DS_FIELD, { optional: true });
```

Consequences worth knowing:

- **The field owns the id.** Its label has to point at the control, and only one of them can win.
  Pass `id` to the field, never to the control.
- **`<ds-select>` fits.** Its trigger is a `<button>`, which HTML lists as labelable, so the field's
  `<label for>` names it — and the ARIA combobox pattern still names it by that label *and* its value.
- **The groups opt out.** `<ds-radio-group>` and `<ds-checkbox-group>` provide `DS_FIELD: null`, or a
  `<ds-form-field>` above them would hand every radio the same id and the same label.
- **Not for a checkbox.** A checkbox's label belongs *beside* it. `<label for>` over a *set* of them
  would name the first and leave the rest anonymous — which is what the groups are for.

### What the molecules refuse to do

- **SearchField does not fire per keystroke.** It debounces, de-duplicates, answers a clear at once
  (emptying a filter is not a thought in progress), and flushes the pending wait on `Enter` rather
  than racing it. The result count goes into *one* polite region, born empty so the first answer is
  heard, and doubles as the field's description so it survives a re-focus.
- **PasswordField keeps the atom dumb.** `<ds-input>` gained a `[dsInputTrailing]` slot — not a
  password feature, just somewhere for a control to sit inside the field. Revealing swaps
  `type="password"` for `type="text"`, because a custom mask loses selection, IME, autofill and the
  password manager that was about to fill it. The strength meter is a `progressbar`, never a live
  region; it must not narrate "Weak. Fair. Good." on every keystroke.
- **The groups do not invent ARIA.** A radio group is a `<fieldset role="radiogroup">` with one shared
  `name` — which is where the browser's arrow keys come from. A checkbox group is a plain `<fieldset>`,
  because `role="checkboxgroup"` does not exist and the browser has nothing to do with one.

## Hierarchy & disclosure

Six molecules for the structure around the content. Composed from the atoms, and from each other's
good ideas — `ds-alert` and `ds-empty-state` read the same tone properties as `ds-badge`, the
accordion's count is a `ds-badge`, the toolbar's separator is a `ds-divider`.

| Molecule | Built on | Brings |
| --- | --- | --- |
| `<ds-accordion>` + `<ds-accordion-item>` | a real heading, a real button, a region | One open or many, ids not indexes, `↑` `↓` `Home` `End`. **One item alone is a disclosure** |
| `<ds-breadcrumb>` | `<nav>` + `<ol>` + `ds-link` | The last crumb is `aria-current`, not a link. Long paths collapse into a button that says how many |
| `<ds-pagination>` | `.pagination` | A width that never changes as the page travels; a polite "Page 3 of 12" |
| `<ds-empty-state>` | `ds-icon` + the type ramp | Nothing yet / nothing found / nothing allowed — three empties, three messages |
| `<ds-alert>` | the tone properties | A callout *in* the page. Silent unless you ask it to announce |
| `<ds-toolbar>` | `role="toolbar"` | Eight buttons, **one tab stop**. It manages whatever is projected into it |

```html
<ds-accordion [(expanded)]="open" [multiple]="true" variant="separated">
  <ds-accordion-item itemId="security" label="Security" [badge]="1" badgeLabel="1 issue" badgeTone="warning">
    <ds-switch dsAccordionTrailing ariaLabel="Two-factor" [(checked)]="twoFactor" />
    …
  </ds-accordion-item>
</ds-accordion>

<ds-toolbar ariaLabel="Document actions">
  <ds-button variant="ghost" iconStart="edit" label="Rename" />
  <ds-divider orientation="vertical" [spacing]="0" />
  <ds-menu label="Export" icon="download" [entries]="entries" />
</ds-toolbar>

<ds-pagination [(page)]="page" [total]="43" [pageSize]="5" [showSummary]="true" />

<ds-empty-state icon="search" title="No invoices match" description="Try another filter." [live]="true">
  <ds-button dsEmptyStateActions size="sm" variant="secondary" (clicked)="clear()">Clear filters</ds-button>
</ds-empty-state>
```

### What they refuse to do

- **The toolbar does not own the buttons.** It reads the DOM and writes one `tabindex`, so a
  `<ds-menu>` trigger, a `<ds-select>` and your own `<button>` all work without knowing. Controls
  inside an open menu or listbox belong to that overlay; anything born with `tabindex="-1"` keeps its
  own mind; and a focused text field keeps its arrow keys **until the caret is at the edge it is
  being pressed towards**. It is an actions cluster, not a filter bar: it will not grow a "clear all".
- **The pagination's width never changes.** Seven slots at page 1, seven at page 200 — a button that
  moves out from under the cursor between clicks is a button that gets clicked twice. An ellipsis is
  drawn only where it hides *more than one* page, because a "…" standing for a single page is wider
  than the page it hid. The range is a pure function with its own property tests.
- **The accordion closes panels without destroying them.** A settings form that forgets what you
  typed because you collapsed its section is a bug. The panel keeps its DOM and takes
  `visibility: hidden`, which is what removes it from the tab order and the accessibility tree.
  Interactive content goes *beside* the header button, never inside it.
- **The breadcrumb collapses into a button, not a "…".** It says how many crumbs it is holding, and
  expands in place — a menu would hide the path from anyone who arrived with a keyboard. It refuses
  to collapse a single crumb, because the button is wider than the page it would hide.
- **The alert is silent.** An alert rendered with the page is not an announcement; a screen reader is
  already reading the page. `live="polite"` is for one that *appears*, `assertive` only for what the
  user must know before doing anything else. And it never removes itself — the same bargain as
  `<ds-chip>`: a node that deletes itself cannot be undone.
- **The empty state makes you say which empty it is.** *Nothing yet* is an invitation. *Nothing found*
  is a filter, and must never offer "create your first invoice". *Nothing allowed* is a permission.
  Its title is a `<p>` until you ask for a heading, because an `<h2>` in the middle of a table lies
  about the document's outline.

### The one-off it replaces

`<ds-data-table>`'s empty state was a private copy of this block — its own icon disc, its own title
styles, its own action slot. It now renders `<ds-empty-state>`. The hatched band and the live region
stayed with the table, because they belong to the table and not to the message.

## Date entry

Three pieces, and no picker. A picker is a product decision — two months or one, a range or a day,
presets or none, a dialog or a disclosure — and the organism that makes those decisions will make
them out of these.

| Molecule | Built on | Brings |
| --- | --- | --- |
| `<ds-calendar>` | a real `<table role="grid">` | One tab stop, the full ARIA grid keyboard, `min`/`max`, a `dateDisabled` predicate, week numbers, a controllable `month` |
| `<ds-date-input>` | `ds-input` + `ds-button` | A forgiving parser, an exact result, and a trigger that reports `aria-expanded` without opening anything |
| `<ds-time-input>` | `ds-input` | `9` → `09:00`, `9:30 pm` → `21:30`; arrow keys step, clamped to `min`/`max` |

```html
<ds-calendar [(value)]="date" [min]="today" [dateDisabled]="isWeekend" (daySelected)="close()" />

<ds-form-field label="Invoice date" hint="Any format: 4/3/26, 2026-03-04…">
  <ds-date-input [(value)]="date" [(open)]="open" [ariaControls]="calendarId" />
</ds-form-field>

<ds-time-input [(value)]="start" [step]="15" [hour12]="true" />
```

### A date is not an instant

`value` is `'2026-03-04'`. Not a `Date`, which is a moment in UTC that renders as the 3rd in Lima;
not a timestamp, which is the same mistake with fewer letters. The whole layer speaks `yyyy-mm-dd` —
the format `<input type="date">` uses, the format JSON uses, and the only one that cannot silently
shift a day because of where the user is sitting. `Date` appears in exactly two places: to ask the
system what day it is, and to hand something to `Intl`. Both pin the time zone to UTC.

The arithmetic is pure, exported and tested on its own, because the bugs in a calendar are never in
the calendar:

```ts
import { addMonths, monthGrid, isoWeekNumber, parseDateInput, todayIso } from './design-system';

addMonths('2026-01-31', 1);          // '2026-02-28' — not 3 March
isoWeekNumber('2027-01-01');         // 53 — still week 53 of 2026
parseDateInput('4/3/26', 'dmy');     // '2026-03-04'
parseDateInput('31/02/2026', 'dmy'); // null — say so, do not guess
todayIso(new Date(2026, 2, 4, 23, 30)); // '2026-03-04' — the local day, at 23:30, east of Greenwich
```

### What the molecules refuse to do

- **The calendar is a grid, and behaves like one.** One tab stop; arrows walk the days and *cross the
  month boundary*, because the 1st is a Wednesday and the user wants the Monday before it. Days that
  cannot be picked carry `aria-disabled`, not `disabled` — a grid you can get stuck in is worse than
  one that lets you read a day you cannot choose.
- **The date input commits on blur and on `Enter`, never on a keystroke.** `2026-03-0` is neither a
  date nor a mistake yet. Unreadable text stays in the box so it can be fixed, and the value goes to
  `null`, because keeping the old date would be a lie about what the field says.
- **The trigger only asks.** It reports `aria-expanded`, points at whatever you give it, and emits.
  There is no overlay, no focus trap and no dismissal policy here, and `triggerHasPopup` exists so it
  can tell the truth about whichever one you build.
- **The time input has no dropdown.** Ninety-six quarter-hours is not a picker, it is a punishment.
  `hour12` changes the display and what the parser accepts back — never what the model holds.

## The components

Each one is a typed, token-driven façade over Bootstrap's markup — and each one supplies the
behaviour Bootstrap's JavaScript would otherwise own: open state, keyboard patterns, focus
management and dismissal are Angular, so there is no jQuery-era bundle and no second source
of truth.

| Component | Built on | Brings |
| --- | --- | --- |
| `<ds-tabs>` + `<ds-tab>` | `.nav`, `.nav-pills`, `.tab-content` | 3 variants, lazy panels, roving tabindex, arrow/Home/End |
| `<ds-menu>` | `.dropdown-menu`, `.dropdown-item` | Icons, shortcuts, type-ahead, Esc, outside click, focus return |
| `<ds-select>` | `.form-control`, `.dropdown-menu`, `.form-check-input` | Single **or multiple**, chips, search, groups, `ControlValueAccessor` |
| `<ds-toast>` + `ToastService` | `.toast`, `.toast-container` | Queue + limit, auto-dismiss, pause on hover, polite live region |
| `<ds-dialog>` | `.modal`, `.modal-backdrop` | Focus trap + restore, counted scroll lock, Escape/backdrop, ARIA |
| `<ds-data-table>` | `.table`, `.form-check-input`, `.placeholder` | Typed columns, sorting, selection, cell templates, skeleton, empty state |

```ts
import { Component, inject, signal } from '@angular/core';
import { DS_COMPONENTS, DS_PRIMITIVES, ToastService } from './design-system';

@Component({
  selector: 'app-invoice-actions',
  imports: [DS_PRIMITIVES, DS_COMPONENTS],
  template: `
    <ds-flex justify="between" align="center" [gap]="3">
      <ds-text variant="h4">Invoice #1042</ds-text>

      <ds-flex [gap]="2">
        <ds-select [options]="owners" [(value)]="owner" placeholder="Assign" />
        <ds-menu label="Actions" [entries]="entries" (itemSelect)="run($event)" />
        <ds-button variant="danger" (clicked)="confirm.set(true)">Delete</ds-button>
      </ds-flex>
    </ds-flex>

    <ds-dialog [(open)]="confirm" title="Delete invoice?" tone="danger" icon="warning">
      <ds-text>This cannot be undone.</ds-text>
      <ds-flex dsDialogActions [gap]="2" justify="end">
        <ds-button variant="ghost" (clicked)="confirm.set(false)">Cancel</ds-button>
        <ds-button variant="danger" (clicked)="destroy()">Delete</ds-button>
      </ds-flex>
    </ds-dialog>
  `,
})
export class InvoiceActionsComponent {
  private readonly toast = inject(ToastService);
  readonly confirm = signal(false);

  destroy() {
    this.confirm.set(false);
    this.toast.danger('Invoice deleted', {
      action: { label: 'Undo', run: () => this.restore() },
    });
  }
}
```

Drop the toast host in once, in the app shell:

```html
<ds-toast-host placement="bottom-end" />
```

### Rules every component follows

- **Tokens, not values.** Spacing, radius, surface and tone inputs accept scale keys.
  `[padding]="6"` is valid; `padding="23px"` is not expressible.
- **Signals in, signals out.** `[(selected)]`, `[(value)]`, `[(open)]`, `[(selection)]`,
  `[(sort)]` are `model()`s — uncontrolled, one-way or two-way, your call.
- **Ids, never indexes.** Menu emits an item id, Tabs a tab id, DataTable a row key — so
  selection survives sorting, filtering and refetching.
- **Accessible by default.** See below — it is a contract, not an aspiration.

## Accessibility

Paint targets **WCAG 2.2 AA**, and treats accessibility as part of the component rather than a
review at the end. The showcase has a dedicated **Accessibility** page with the full keyboard
map, the screen-reader semantics per component, and a contrast table measured from the live
theme.

**Keyboard.** Every component implements its ARIA authoring-practices pattern: roving tabindex
in Tabs, Menu and Toolbar, `aria-activedescendant` in Select, the grid pattern in Calendar (arrows,
Home/End, PageUp/PageDown, and `Shift` for the year), arrows/Home/End everywhere, type-ahead in
Menu, `Backspace` to unpick the last chip in a multiple Select, `Enter`/`Space` on sortable
headers and activatable table rows. `Escape` always backs out of an overlay. The form atoms are
native controls, so their keyboard is the platform's and cannot rot: Paint adds only `Escape` to
clear an Input and `Enter` to toggle a Switch.

**Focus.** One visible ring from one token. Dialogs trap Tab while open, mark the rest of the
page `inert` (so screen-reader browsing, find-in-page and touch exploration stay inside too),
and return focus to whatever opened them. Menus and Selects never trap: Tab closes and moves
on. A loading button reports `aria-disabled` + `aria-busy` instead of going `disabled`, because
a control that leaves the tab order mid-action takes the user's place with it.

**Screen readers.** Every form atom is named by a real `<label for>`, described by its hint *and*
its error, and reports `aria-invalid` whenever it shows a message — by itself, or because the
`<ds-form-field>` around it said so. A Calendar's name is the month on screen, and that name is a
polite live region, so paging is heard without leaving the grid; every day is announced in full
("4 March 2026"), because a number in a column is only unambiguous to the eye. The display atoms are just as
careful about *not* speaking: a badge has no role, a skeleton is `aria-hidden`, a spinner inside a
button that already reports `aria-busy` says nothing, and an avatar that repeats the name beside it
disappears from the tree entirely. A presence dot is folded into the avatar's one name
("Grace Hopper, Online") rather than left as a mystery image. Select is a combobox named by its label *and* its value, with a listbox of
plain options — no control nested inside another. Menu turns headers into labelled `role="group"`
sections and exposes shortcuts as `aria-keyshortcuts`. DataTable stays a plain named table (no
invented grid ARIA), with `aria-sort` and a live region that says *"Sorted by Amount,
descending"* or *"3 rows selected"*. Toast's host owns two permanent live regions — polite for
status, assertive for problems — so nothing is announced twice and nothing is missed.

**Contrast.** Every text role clears 4.5:1 on every surface it is allowed on; control
boundaries and the focus ring clear 3:1. The palette was retuned to get there — status colours
moved to their 700 steps in light mode, dark-mode brand roles to their 300 steps, and
`borderControl` exists precisely so a field's edge is visible.

**Reduced motion.** Components switch off their own transitions, and the foundation backs them
up system-wide so a future component cannot forget.

**Enforced, not claimed:**

```bash
npm test   # 854 specs, including:
           #   · axe-core over every component, in each state
           #     (closed/open, loading/empty, single/multiple,
           #      labelled/described/invalid/mixed/disabled,
           #      searching, password revealed, every tone × variant)
           #   · the calendar's keyboard, and 55 assertions on the date
           #     arithmetic alone — leap years, ISO weeks, month clamping
           #   · the pagination range as a property: the current page is always
           #     drawn, the width never changes, no page is drawn twice
           #   · 111 contrast assertions computed from the tokens, per theme
           #   · keyboard, focus-restore, inert and live-region behaviour
```

Automated rules only cover part of the problem, so the component specs assert the behaviour
directly: that Escape returns focus to the trigger, that the page behind a dialog is inert, that
a sort change reaches a live region, that an option is not a nested control.

## Why Bootstrap underneath

Paint owns the decisions; Bootstrap renders them. Nothing is consumed stock:

1. **Compile time** — `styles/bootstrap.scss` feeds Paint's foundations into Bootstrap's Sass
   API. Bootstrap's `$spacers` *is* Paint's 4px scale, so `gap-6`, `p-1_5` and `g-4` speak in
   space tokens. Only the partials the components need are imported.
2. **Utility API** — Paint's roles are registered as Bootstrap utility values, producing
   `bg-surface`, `bg-accent`, `text-on-primary`, `rounded-2xl`, `shadow-glow` and the brand
   gradients alongside the stock set.
3. **Runtime** — `ThemeService` writes `--ds-*` to `:root` and derives Bootstrap's `--bs-*`
   (`theme/bootstrap.bridge.ts`), including the RGB triplets its utilities need, plus
   `data-bs-theme`. One `theme.toggle()` re-tints every Bootstrap component instantly.
   Where Bootstrap compiles literals instead of variables (`.form-control`,
   `.form-check-input`, `.page-link`, the switch thumb's inline SVG), Paint re-points them by hand —
   including `:indeterminate`, which Bootstrap's own rule would otherwise let paint every radio in an
   untouched group, and `.placeholder`, whose `currentColor` fill would tie a skeleton's colour to
   whatever text happens to surround it.
4. **Behaviour** — Bootstrap's JS is not used at all. Paint's own Angular code owns open
   state, keyboard patterns, focus and dismissal.
5. **Extension** — variants Bootstrap lacks (`.btn-ghost`, `.btn-accent`) are generated with
   Bootstrap's own `button-variant` mixin, so their states stay identical.

```
tokens (*.tokens.ts)  →  provideTheme()  →  --ds-* on :root
                                         ↘  --bs-* on :root
<ds-dialog>           →  .modal .modal-backdrop  →  painted with Paint's tokens
                      ↘  focus trap, scroll lock, Escape  (Paint, not Bootstrap JS)
```

## The look: “Wet Paint”

| Token group | What changed |
| --- | --- |
| Neutrals | `ink` — violet-cast, so dark mode reads as a studio, not a grey box |
| Primary | `violet` — electric, with `magenta` as the brand `accent` role |
| Energy | `lime` — the unmixed dab; brand only, never semantic |
| Elevation | `--ds-shadow-*`: ink-tinted shadows + a `glow` for brand emphasis |
| Texture | `--ds-texture-grain` / `hatch` + `.ds-grain`, `.ds-hatch`, `.ds-marker` |
| Gradients | `--ds-gradient-brand` / `wash` / `energy` — the three paint mixes |
| Pigment | `--ds-blend-pigment`: `multiply` on paper, `screen` on a lit canvas |
| Type | Fraunces 900 at display size, tighter tracking, heavier labels |
| Radii | Rounder across the board, plus `2xl` and a deliberately organic `blob` |

The mark is the paint: one brush stroke pulls the `P`, a magenta dab multiplies where it
crosses it, and a lime drip runs off the bowl. It is inline SVG, crisp from 16px to 64px,
with a mono lockup that inherits `currentColor`. See the **Brand** page in the showcase for
lockups, clear space, textures and voice.

## Usage

```ts
// app.config.ts
import { provideTheme } from './design-system';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTheme({ defaultMode: 'system', followSystem: true }),
    // Optional toast defaults
    { provide: TOAST_CONFIG, useValue: { duration: 5000, limit: 4 } },
  ],
};
```

```ts
// Deep-import in an application shell; the barrel is for consumers who want
// everything, and for the showcase's (lazy) pages.
import { provideTheme } from './design-system/theme';
import { ButtonComponent } from './design-system/primitives/button';
```

```scss
// styles.scss — order matters: Bootstrap first, Paint always has the final word
@use './design-system/styles/bootstrap';
@use './design-system/styles/tokens';
@use './design-system/styles/primitives';
```

```ts
const theme = inject(ThemeService);
theme.toggle();       // light ↔ dark
theme.setMode('dark');
```

```scss
.panel {
  padding: var(--ds-space-surface-padding);
  color: var(--ds-color-text);
  background: var(--ds-color-surface);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-md);
}
```

## Atomic design map

```
tokens/          ← foundations: color, type, space, radii, effects
styles/          ← CSS variables + the Bootstrap substrate
icons/           ← <ds-icon> + registry
brand/           ← brand tokens + <ds-logo>
utils/           ← focus trap, roving index, scroll lock, ARIA ids, date/time/step arithmetic
primitives/      ← Button, Text, Box, Flex, Stack, Grid
                 ← Input, Textarea, Checkbox, Radio, Switch,
                   Slider, NumberInput, StarRating                  (form controls)
                 ← Badge, Chip, Avatar, Spinner, Progress,
                   Skeleton, Divider, Link, Kbd, Image              (display & feedback)
molecules/       ← Tabs, Menu, Select, Toast
                 ← FormField, SearchField, PasswordField,
                   RadioGroup, CheckboxGroup                        (forms)
                 ← Calendar, DateInput, TimeInput                   (date entry)
                 ← Accordion, Breadcrumb, Pagination,
                   EmptyState, Alert, Toolbar                       (structure)
                 ← Tooltip, Popover, FileDropzone, FileQueueItem    (overlays & files)
                 ← RangeControl, Figure, RatingSummary,
                   ShortcutHint                                     (compositions)
organisms/       ← Chart, Tour, Interstitial, Gallery, Dialog, DataTable
                 ← DatePicker, Form, Card, FilterBar                (next)
```

## Upgrading from 0.2.0

The refresh renames palette scales and re-tunes values. Tokens are the contract, so this is a
breaking change for anything that reached past the semantic roles:

- `colorPrimitives.slate` → `colorPrimitives.ink`, `colorPrimitives.cobalt` → `violet`;
  `magenta` and `lime` are new.
- New semantic roles: `accent`, `accentHover`, `accentMuted`, `onAccent`, `surfaceSunken`,
  `overlay`. New token groups: `shadows`, `textures`, `gradients`, `blendModes`.
- `brandAccents.drop` → `brandAccents.drip`; `brandGradient` gained a `via` stop.
- `radii` values are rounder; `2xl` and `blob` are new.
- Anything referencing `--ds-color-*` roles, `<ds-*>` components or Bootstrap utility classes
  keeps working — that is the point of the roles.

## Notes

- Bootstrap 5 is still `@import`-based Sass; `angular.json` silences those deprecation
  warnings for the `bootstrap.scss` layer only.
- The production `initial` budget is 650 kB, most of it Bootstrap's component CSS (~245 kB raw,
  ~21 kB transferred) and `@angular/forms` (the CVA of every control). **The showcase's shell deep-
  imports** (`design-system/theme`, `design-system/primitives/button`, …) rather than reaching for
  the barrel: `export *` plus the `DS_*` bundle arrays means one import from `design-system/` pulls
  every component into the main chunk, where almost none of them are used. Doing that correctly took
  the initial bundle from 820 kB to 586 kB. The pages are lazy; each one pays for what it renders. The twenty-four atoms cost
  ~75 kB of it, raw — about 11 kB over the wire.
- **Tests need a Chromium.** Karma runs `ChromeHeadlessCI` (`karma.conf.js`: `--no-sandbox`, no
  `/dev/shm`) and Playwright launches the same binary; both read `CHROME_BIN` when it is set, so a
  container needs one browser, not two. `npm run e2e` starts `ng serve` on port 4273 on its own
  (`E2E_PORT` to change it) and reuses a running one outside CI.
- Overlays (Dialog, Menu, Select panels) render in place rather than in a portal. Avoid
  putting them inside a `transform`ed or `backdrop-filter`ed ancestor; a portal arrives with
  the overlay service.
- `<ds-button>` takes `link` for in-app navigation, not `routerLink`: Angular's `RouterLink`
  directive matches on that attribute name, so it would also apply itself to the host element
  and add a second, roleless tab stop.
