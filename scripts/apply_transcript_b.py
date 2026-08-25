#!/usr/bin/env python3
"""Apply Model B atom changes from transcript-paint-turn2-B.txt."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT = Path('/Users/fabianafaria/Downloads/transcript-paint-turn2-B.txt')

SKIP_PATHS = {
    '.crop.tmp.mjs',
    '/tmp/pw-test.mjs',
    '/tmp/shots.mjs',
}


def extract_files(text: str) -> dict[str, str]:
    files: dict[str, str] = {}

    create_pattern = re.compile(
        r'<antml:parameter name="command">create</antml:parameter>\s*'
        r'<antml:parameter name="path">(/workspace/paint/[^<]+)</antml:parameter>\s*'
        r'<antml:parameter name="file_text">(.*?)</antml:parameter>\s*'
        r'</antml:invoke>',
        re.DOTALL,
    )
    for m in create_pattern.finditer(text):
        path = m.group(1).replace('/workspace/paint/', '')
        files[path] = m.group(2)

    heredoc_patterns = [
        r"cat > (src/[^\s]+) <<'EOF'\n(.*?)\nEOF",
        r"cat > (e2e/[^\s]+) <<'EOF'\n(.*?)\nEOF",
        r"cat > (playwright\.config\.ts) <<'EOF'\n(.*?)\nEOF",
        r"cat > (karma\.conf\.js) <<'EOF'\n(.*?)\nEOF",
        r"cat > (\.gitignore) <<'EOF'\n(.*?)\nEOF",
        r"cat > (public/showcase/[^\s]+) <<'EOF'\n(.*?)\nEOF",
    ]
    for pat in heredoc_patterns:
        for m in re.finditer(pat, text, re.DOTALL):
            files[m.group(1)] = m.group(2)

    return {p: c for p, c in files.items() if p not in SKIP_PATHS and not p.startswith('/tmp/')}


def write_files(files: dict[str, str]) -> None:
    for rel, content in files.items():
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content)
        print(f'wrote {rel}')


def patch(path: str, old: str, new: str, *, required: bool = True) -> None:
    p = ROOT / path
    s = p.read_text()
    if old not in s:
        if required:
            raise SystemExit(f'PATCH FAILED ({path}): anchor not found')
        print(f'skip patch ({path}): anchor not found')
        return
    p.write_text(s.replace(old, new, 1))
    print(f'patched {path}')


def main() -> int:
    if not TRANSCRIPT.exists():
        print(f'missing transcript: {TRANSCRIPT}', file=sys.stderr)
        return 1

    text = TRANSCRIPT.read_text(errors='replace')
    files = extract_files(text)
    write_files(files)

    # Primitive barrels
    for folder in ('kbd', 'slider', 'number-input', 'star-rating', 'image'):
        idx = ROOT / f'src/design-system/primitives/{folder}/index.ts'
        comp = f'./{folder.replace("-", "-")}.component'
        if folder == 'kbd':
            comp = './kbd.component'
        elif folder == 'image':
            (ROOT / 'src/design-system/primitives/image/index.ts').write_text(
                "export * from './image.component';\n"
            )
            continue
        (ROOT / f'src/design-system/primitives/{folder}/index.ts').write_text(
            f"export * from './{folder}.component';\n"
        )

    # utils/index.ts
    patch(
        'src/design-system/utils/index.ts',
        """ * are all the plumbing the component layer needs — plus the calendar arithmetic
 * the date molecules cannot be written without, which is pure, exported and
 * tested on its own.
 */""",
        """ * are all the plumbing the component layer needs — plus the calendar arithmetic
 * the date molecules cannot be written without, and the step/clamp arithmetic
 * the range controls share, both pure, exported and tested on their own.
 */""",
        required=False,
    )
    utils_index = ROOT / 'src/design-system/utils/index.ts'
    ui = utils_index.read_text()
    if "export * from './number';" not in ui:
        utils_index.write_text(ui.rstrip() + "\nexport * from './number';\n")

    # bootstrap.scss
    patch(
        'src/design-system/styles/bootstrap.scss',
        """@import 'bootstrap/scss/forms/form-check';
@import 'bootstrap/scss/toasts';""",
        """@import 'bootstrap/scss/forms/form-check';
// Slider -> form-range: Bootstrap resets the native range input across
// browsers; Paint paints the track fill and the thumb from its own tokens.
@import 'bootstrap/scss/forms/form-range';
@import 'bootstrap/scss/toasts';""",
    )

    # field-chrome
    patch(
        'src/design-system/primitives/forms/field-chrome.component.ts',
        '      [attr.for]="for()"\n',
        '      [attr.for]="for() || null"\n',
    )
    patch(
        'src/design-system/primitives/forms/field-chrome.component.ts',
        '  /** Id of the control this label names. */\n  readonly for = input<string>(\'\');',
        """  /**
   * Id of the control this label names. Leave it empty for a control that is
   * named by `aria-labelledby` instead (a star rating's radio group, say): a
   * `for` pointing at a `<div>` is an attribute that points at nothing.
   */
  readonly for = input<string>('');""",
    )

    # icons — append before closing brace
    reg = ROOT / 'src/design-system/icons/icon.registry.ts'
    rs = reg.read_text()
    if 'keyboard:' not in rs:
        patch(
            'src/design-system/icons/icon.registry.ts',
            '} as const satisfies Record<string, IconDefinition>;',
            """  star: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 2.5l2.94 6.2 6.8.78-5.03 4.66 1.34 6.71L12 17.5l-6.05 3.35 1.34-6.71L2.26 9.48l6.8-.78z',
    ],
  },
  image: {
    viewBox: '0 0 24 24',
    paths: [
      'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
      'M9 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'm21 15-5-5L5 21',
    ],
    stroke: true,
  },
  keyboard: {
    viewBox: '0 0 24 24',
    paths: [
      'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
      'M6 10h.01',
      'M10 10h.01',
      'M14 10h.01',
      'M18 10h.01',
      'M8 14h8',
    ],
    stroke: true,
  },
  sliders: {
    viewBox: '0 0 24 24',
    paths: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
    stroke: true,
  },
  hash: {
    viewBox: '0 0 24 24',
    paths: ['M4 9h16', 'M4 15h16', 'M10 3 8 21', 'M16 3l-2 18'],
    stroke: true,
  },
} as const satisfies Record<string, IconDefinition>;""",
        )

    # primitives/index.ts — apply via reading transcript block logic
    pi = ROOT / 'src/design-system/primitives/index.ts'
    s = pi.read_text()
    if 'SliderComponent' not in s:
        s = s.replace(
            """ * | `ds-switch`   | `.form-switch`, `.form-check-input`          |
 * | `ds-badge`    | `.badge`                                     |""",
            """ * | `ds-switch`   | `.form-switch`, `.form-check-input`          |
 * | `ds-slider`   | `.form-range`                                |
 * | `ds-number-input` | `.form-control` + two real `<button>`s   |
 * | `ds-star-rating`  | —  (native radios, or one `role="img"`)  |
 * | `ds-badge`    | `.badge`                                     |""",
        )
        s = s.replace(
            """ * | `ds-link`     | —  (a real `<a>`, and nothing else)          |
 */""",
            """ * | `ds-link`     | —  (a real `<a>`, and nothing else)          |
 * | `ds-kbd`      | a real `<kbd>`, repainted                    |
 * | `ds-image`    | a real `<img>`, framed                       |
 */""",
        )
        s = s.replace(
            """export * from './switch';
export * from './badge';""",
            """export * from './switch';
export * from './slider';
export * from './number-input';
export * from './star-rating';
export * from './badge';""",
        )
        s = s.replace(
            """export * from './link';

import""",
            """export * from './link';
export * from './kbd';
export * from './image';

import""",
        )
        s = s.replace(
            """import { GridComponent, GridItemComponent } from './grid';
import { InputComponent } from './input';
import { LinkComponent } from './link';
import { ProgressComponent } from './progress';
import { RadioComponent } from './radio';
import { SkeletonComponent } from './skeleton';
import { SpinnerComponent } from './spinner';
import { StackComponent } from './stack';
import { SwitchComponent } from './switch';
import { TextComponent } from './text';
import { TextareaComponent } from './textarea';""",
            """import { GridComponent, GridItemComponent } from './grid';
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
import { TextareaComponent } from './textarea';""",
        )
        s = s.replace(
            """export const DS_FORM_CONTROLS = [
  InputComponent,
  TextareaComponent,
  CheckboxComponent,
  RadioComponent,
  SwitchComponent,
] as const;""",
            """export const DS_FORM_CONTROLS = [
  InputComponent,
  TextareaComponent,
  CheckboxComponent,
  RadioComponent,
  SwitchComponent,
  SliderComponent,
  NumberInputComponent,
  StarRatingComponent,
] as const;""",
        )
        s = s.replace(
            """  DividerComponent,
  LinkComponent,
] as const;""",
            """  DividerComponent,
  LinkComponent,
  KbdComponent,
  ImageComponent,
  ImageFallbackDirective,
] as const;""",
        )
        pi.write_text(s)
        print('patched primitives/index.ts')

    # design-system/index.ts comment
    patch(
        'src/design-system/index.ts',
        """ *   primitives/  Button, Text, Box, Flex, Stack, Grid
 *                Input, Textarea, Checkbox, Radio, Switch       (form controls)
 *                Badge, Chip, Avatar, Spinner, Progress,
 *                Skeleton, Divider, Link                        (display & feedback)""",
        """ *   primitives/  Button, Text, Box, Flex, Stack, Grid
 *                Input, Textarea, Checkbox, Radio, Switch,
 *                Slider, NumberInput, StarRating                (form controls)
 *                Badge, Chip, Avatar, Spinner, Progress,
 *                Skeleton, Divider, Link, Kbd, Image            (display & feedback)""",
        required=False,
    )

    # karma + angular test target
    karma = ROOT / 'karma.conf.js'
    if not karma.exists() and 'karma.conf.js' in files:
        pass  # already written
    ang = ROOT / 'angular.json'
    d = json.loads(ang.read_text())
    test_opts = d['projects']['paint']['architect']['test']['options']
    test_opts['karmaConfig'] = 'karma.conf.js'
    spo = test_opts.get('stylePreprocessorOptions', {})
    spo.pop('sass', None)
    test_opts['stylePreprocessorOptions'] = spo
    ang.write_text(json.dumps(d, indent=2) + '\n')
    print('patched angular.json')

    # package.json
    pkg = json.loads((ROOT / 'package.json').read_text())
    pkg.setdefault('scripts', {})
    pkg['scripts']['e2e'] = 'playwright test'
    pkg['scripts']['e2e:ui'] = 'playwright test --ui'
    dev = pkg.setdefault('devDependencies', {})
    dev.setdefault('@playwright/test', '^1.62.1')
    (ROOT / 'package.json').write_text(json.dumps(pkg, indent=2) + '\n')
    print('patched package.json')

    # kbd.page IconComponent
    kpt = ROOT / 'src/app/pages/primitives/kbd.page.ts'
    if kpt.exists():
        ks = kpt.read_text()
        if 'IconComponent' not in ks:
            ks = ks.replace(
                "import { DS_PRIMITIVES } from '../../../design-system';",
                "import { DS_PRIMITIVES, IconComponent } from '../../../design-system';",
            )
            ks = ks.replace(
                'imports: [DS_PRIMITIVES, DOC_UI],',
                'imports: [DS_PRIMITIVES, DOC_UI, IconComponent],',
            )
            kpt.write_text(ks)

    # image.page readonly fix
    ipt = ROOT / 'src/app/pages/primitives/image.page.ts'
    if ipt.exists():
        ipt.write_text(
            ipt.read_text().replace(
                '  loadedAt = signal<string>',
                '  readonly loadedAt = signal<string>',
            )
        )

    # app.routes
    routes = ROOT / 'src/app/app.routes.ts'
    rs = routes.read_text()
    if "path: 'slider'" not in rs:
        if rs.count("path: 'badge'") > 1:
            dup_start = rs.index("      {\n        path: 'badge',", rs.index("path: 'link'"))
            dup_end = rs.index("      {\n        path: 'text',")
            rs = rs[:dup_start] + rs[dup_end:]
        rs = rs.replace(
            """      {
        path: 'switch',
        title: title('Switch'),
        loadComponent: () => import('./pages/primitives/switch.page').then((m) => m.SwitchPage),
      },
""",
            """      {
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
""",
        )
        rs = rs.replace(
            """      {
        path: 'link',
        title: title('Link'),
        loadComponent: () => import('./pages/primitives/link.page').then((m) => m.LinkPage),
      },
""",
            """      {
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
""",
        )
        routes.write_text(rs)
        print('patched app.routes.ts')

    # nav.ts
    nav = ROOT / 'src/app/nav.ts'
    ns = nav.read_text()
    if "path: '/primitives/slider'" not in ns:
        ns = ns.replace('nineteen atoms', 'twenty-four atoms')
        ns = ns.replace('not an list', 'not a list')
        ns = ns.replace(
            """      { label: 'Switch', path: '/primitives/switch', icon: 'toggle' },
    ],""",
            """      { label: 'Switch', path: '/primitives/switch', icon: 'toggle' },
      { label: 'Slider', path: '/primitives/slider', icon: 'sliders', badge: 'New' },
      { label: 'NumberInput', path: '/primitives/number-input', icon: 'hash', badge: 'New' },
      { label: 'StarRating', path: '/primitives/star-rating', icon: 'star', badge: 'New' },
    ],""",
        )
        ns = ns.replace(
            """      { label: 'Link', path: '/primitives/link', icon: 'externalLink', badge: 'New' },
    ],""",
            """      { label: 'Link', path: '/primitives/link', icon: 'externalLink', badge: 'New' },
      { label: 'Kbd', path: '/primitives/kbd', icon: 'keyboard', badge: 'New' },
      { label: 'Image', path: '/primitives/image', icon: 'image', badge: 'New' },
    ],""",
        )
        nav.write_text(ns)
        print('patched nav.ts')

    # overview
    ov = ROOT / 'src/app/pages/overview.page.ts'
    os = ov.read_text()
    if "name: 'Slider'" not in os:
        if os.count("name: 'Badge'") > 1:
            first_link = os.index("{ name: 'Link', path: '/primitives/link'")
            second_badge = os.index("    { name: 'Badge', path: '/primitives/badge'", first_link)
            text_card = os.index("    { name: 'Text', path: '/primitives/text'")
            os = os[:second_badge] + os[text_card:]
        os = os.replace(
            """    { name: 'Switch', path: '/primitives/switch', icon: 'toggle', builtOn: '.form-switch', summary: 'Immediate effect. role="switch" on a real checkbox.' },
""",
            """    { name: 'Switch', path: '/primitives/switch', icon: 'toggle', builtOn: '.form-switch', summary: 'Immediate effect. role="switch" on a real checkbox.' },
    { name: 'Slider', path: '/primitives/slider', icon: 'sliders', builtOn: '.form-range', summary: 'A position on a range. Six keys, from one place.' },
    { name: 'NumberInput', path: '/primitives/number-input', icon: 'hash', builtOn: '.form-control + buttons', summary: 'A quantity that honours min, max and step.' },
    { name: 'StarRating', path: '/primitives/star-rating', icon: 'star', builtOn: 'native radios / role="img"', summary: 'Stars to read, stars to give. Half stars when reading.' },
""",
        )
        os = os.replace(
            """    { name: 'Link', path: '/primitives/link', icon: 'externalLink', builtOn: 'a real <a>', summary: 'Goes somewhere. Buttons do something.' },
    { name: 'Text',""",
            """    { name: 'Link', path: '/primitives/link', icon: 'externalLink', builtOn: 'a real <a>', summary: 'Goes somewhere. Buttons do something.' },
    { name: 'Kbd', path: '/primitives/kbd', icon: 'keyboard', builtOn: 'a real <kbd>', summary: 'Which key. Never a tab stop, never a listener.' },
    { name: 'Image', path: '/primitives/image', icon: 'image', builtOn: 'a real <img>', summary: 'A picture with a shape, and a fallback with a name.' },
    { name: 'Text',""",
        )
        os = os.replace(
            """        'Radio',
        'Switch',
        'Badge',""",
            """        'Radio',
        'Switch',
        'Slider',
        'NumberInput',
        'StarRating',
        'Badge',""",
        )
        os = os.replace(
            """        'Divider',
        'Link',
        'Text',""",
            """        'Divider',
        'Link',
        'Kbd',
        'Image',
        'Text',""",
        )
        ov.write_text(os)
        print('patched overview.page.ts')

    ovh = ROOT / 'src/app/pages/overview.page.html'
    ohs = ovh.read_text()
    if 'twenty-four' not in ohs:
        ovh.write_text(
            ohs.replace('nineteen typed', 'twenty-four typed')
        )

    # primitives-page.scss append
    scss = ROOT / 'src/app/pages/primitives/primitives-page.scss'
    extra = """

/* Kbd page: a menu-like row with the shortcut on the far side. */
.kbd-row {
  padding: var(--ds-space-2) var(--ds-space-3);
  border-radius: var(--ds-radius-md);
}

/* Image page: a gallery tile is a column, not a canvas-wide block. */
.image-tile {
  width: 100%;
}

.image-row > ds-image {
  flex: 1 1 0;
  min-width: 8rem;
}

/* Slider page: a range beside a number field. */
.range-row {
  align-items: end;
}

.range-row ds-slider,
.range-row ds-number-input {
  flex: 1 1 0;
  min-width: 10rem;
}
"""
    if '.kbd-row' not in scss.read_text():
        scss.write_text(scss.read_text().rstrip() + extra + '\n')

    # a11y.spec.ts — large patch
    a11y = ROOT / 'src/design-system/a11y.spec.ts'
    a = a11y.read_text()
    if 'ds-slider label="Volume"' not in a:
        patch(
            'src/design-system/a11y.spec.ts',
            """      <ds-switch label="Dark mode" [(checked)]="dark" />
      <ds-switch label="Email digests" hint="A summary every Monday." labelPlacement="start" />
      <ds-switch label="Unavailable" [disabled]="true" />
""",
            """      <ds-switch label="Dark mode" [(checked)]="dark" />
      <ds-switch label="Email digests" hint="A summary every Monday." labelPlacement="start" />
      <ds-switch label="Unavailable" [disabled]="true" />

      <!-- The range-style atoms: a track, a quantity, and a rating both ways -->
      <ds-slider label="Volume" [value]="40" [showValue]="true" hint="Louder is not better." />
      <ds-slider label="Opacity" [min]="0" [max]="1" [step]="0.05" [value]="0.6" valueText="60%" size="sm" />
      <ds-slider label="Broken" [value]="10" error="Too loud for the room." />
      <ds-slider label="Locked" [value]="70" [disabled]="true" />
      <ds-form-field label="Budget" hint="In whole hundreds.">
        <ds-slider [max]="5000" [step]="100" [value]="1200" />
      </ds-form-field>
      <ds-number-input label="Seats" [min]="1" [max]="12" [value]="3" hint="Up to twelve." />
      <ds-number-input label="Price" [min]="0" [step]="0.01" prefix="$" [value]="19.99" size="lg" />
      <ds-number-input label="Empty" [value]="null" error="Pick at least one." [required]="true" />
      <ds-number-input label="Frozen" [value]="2" [disabled]="true" />
      <ds-form-field label="Quantity" hint="Per line.">
        <ds-number-input [min]="1" [value]="1" />
      </ds-form-field>
      <ds-star-rating label="Average rating" [value]="3.5" [readOnly]="true" [showValue]="true" />
      <ds-star-rating [value]="4" [readOnly]="true" ariaLabel="Service" tone="warning" />
      <ds-star-rating label="Your rating" [value]="3" [clearable]="true" hint="Tap a star." />
      <ds-star-rating
        label="Service"
        [value]="null"
        [starLabels]="['Terrible', 'Poor', 'OK', 'Good', 'Great']"
        [showValue]="true"
        error="Please rate the service."
        [required]="true"
      />
      <ds-star-rating label="Closed" [value]="2" [disabled]="true" />
      <ds-form-field label="Food" hint="Honestly.">
        <ds-star-rating [value]="5" />
      </ds-form-field>
""",
        )
        patch(
            'src/design-system/a11y.spec.ts',
            """      <ds-link href="/docs">Read the docs</ds-link>
      <ds-link href="https://angular.dev" target="_blank">Angular</ds-link>
      <ds-link link="/foundations" variant="subtle" iconEnd="arrowRight">Tokens</ds-link>
""",
            """      <ds-link href="/docs">Read the docs</ds-link>
      <ds-link href="https://angular.dev" target="_blank">Angular</ds-link>
      <ds-link link="/foundations" variant="subtle" iconEnd="arrowRight">Tokens</ds-link>

      <!-- Keycaps: projected, combined, glyph-spoken -->
      <ds-flex [gap]="2" align="center">
        <ds-kbd>Esc</ds-kbd>
        <ds-kbd keys="Ctrl+Enter" size="md" />
        <ds-kbd keys="⌘K" />
        <ds-kbd [keys]="['Shift', '?']" srLabel="Shift question mark" />
      </ds-flex>

      <!-- Pictures: loaded, missing, failed, decorative, custom fallback -->
      <ds-flex [gap]="3" [wrap]="'wrap'">
        <ds-image src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="A single pixel" ratio="1/1" />
        <ds-image [src]="null" alt="Floor plan" fallbackText="No plan uploaded" ratio="16/9" />
        <ds-image [src]="null" alt="" [decorative]="true" ratio="4/3" radius="full" />
        <ds-image [src]="null" alt="Cover" ratio="1/1">
          <ds-avatar dsImageFallback name="Wet Paint" shape="square" [decorative]="true" />
        </ds-image>
      </ds-flex>
""",
        )
        if "toBe(23)" in a:
            patch(
                'src/design-system/a11y.spec.ts',
                """    expect(fixture.nativeElement.querySelectorAll('ds-badge').length).toBe(23);""",
                """    // 22 in the tone grid above, one in the accordion item, one on a board card.
    expect(fixture.nativeElement.querySelectorAll('ds-badge').length).toBe(24);""",
            )
        patch(
            'src/design-system/a11y.spec.ts',
            """  it('has no violations across the form-control atoms, in every state', async () => {""",
            """  it('has no violations across the range-style atoms, in every state', async () => {
    const main = fixture.nativeElement.querySelector('main') as HTMLElement;
    expect(main.querySelectorAll('input[type="range"]').length).toBe(5);
    expect(main.querySelectorAll('ds-number-input input[type="number"]').length).toBe(5);
    expect(main.querySelectorAll('ds-star-rating [role="radiogroup"]').length).toBe(4);
    expect(main.querySelectorAll('ds-star-rating [role="img"]').length).toBe(2);
    const steppers = Array.from(main.querySelectorAll('.ds-number__step')) as HTMLButtonElement[];
    expect(steppers.length).toBe(10);
    expect(steppers.every((button) => button.getAttribute('aria-label') && button.tabIndex === -1)).toBeTrue();
    await scan(main);
  });

  it('has no violations across the keycaps and the pictures', async () => {
    const main = fixture.nativeElement.querySelector('main') as HTMLElement;
    expect(main.querySelectorAll('ds-kbd kbd').length).toBeGreaterThan(4);
    expect(main.querySelectorAll('ds-image [role="img"]').length).toBe(2);
    expect(main.querySelectorAll('ds-image [aria-hidden="true"].ds-image').length).toBe(1);
    await scan(main);
  });

  it('has no violations across the form-control atoms, in every state', async () => {""",
        )

    # star-rating readOnlyName patch
    sr = ROOT / 'src/design-system/primitives/star-rating/star-rating.component.ts'
    if sr.exists() and 'readOnlyName' not in sr.read_text():
        patch(
            'src/design-system/primitives/star-rating/star-rating.component.ts',
            """            [attr.aria-labelledby]="readOnlyLabelledBy()"
            [attr.aria-label]="readOnlyLabelledBy() ? null : spokenValue()\"""",
            """            [attr.aria-labelledby]="readOnlyLabelledBy()"
            [attr.aria-label]="readOnlyLabelledBy() ? null : readOnlyName()\"""",
        )
        patch(
            'src/design-system/primitives/star-rating/star-rating.component.ts',
            """  protected readonly readOnlyLabelledBy = computed(() => {
    const label = this.groupLabelledBy();
    return label ? `${label} ${this.valueId()}` : null;
  });
""",
            """  protected readonly readOnlyLabelledBy = computed(() => {
    const label = this.groupLabelledBy();
    return label ? `${label} ${this.valueId()}` : null;
  });

  protected readonly readOnlyName = computed(() => {
    const name = this.ariaLabel();
    return name ? `${name}, ${this.spokenValue()}` : this.spokenValue();
  });
""",
        )

    # form molecules count fix if present
    if 'toBe(8)' in a11y.read_text():
        a11y.write_text(
            a11y.read_text().replace(
                "expect(fixture.nativeElement.querySelectorAll('ds-form-field').length).toBe(8);",
                "expect(fixture.nativeElement.querySelectorAll('ds-form-field').length).toBe(11);",
            )
        )

    print('done')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
