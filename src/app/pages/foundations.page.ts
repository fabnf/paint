import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  DS_PRIMITIVES,
  IconComponent,
  ThemeService,
  blendModes,
  colorPrimitives,
  gradients,
  iconRegistry,
  radii,
  spacingScale,
  spacingSemantic,
  textures,
  typeRamp,
  type ElevationToken,
  type IconName,
  type TextVariant,
} from '../../design-system';
import { DOC_UI } from '../docs';

/**
 * Foundations — the token layer every primitive inherits from.
 */
@Component({
  selector: 'app-foundations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI, IconComponent],
  templateUrl: './foundations.page.html',
  styleUrl: './foundations.page.scss',
})
export class FoundationsPage {
  private readonly themeService = inject(ThemeService);

  readonly mode = this.themeService.mode;
  readonly isDark = this.themeService.isDark;
  readonly themeLabel = computed(() => (this.isDark() ? 'Dark' : 'Light'));

  readonly colorRoles = [
    { name: 'background', var: '--ds-color-background', usage: 'App canvas' },
    { name: 'surface', var: '--ds-color-surface', usage: 'Cards, sheets' },
    { name: 'surface-sunken', var: '--ds-color-surface-sunken', usage: 'Wells, table heads' },
    { name: 'border', var: '--ds-color-border', usage: 'Hairlines' },
    { name: 'text', var: '--ds-color-text', usage: 'Primary copy' },
    { name: 'text-muted', var: '--ds-color-text-muted', usage: 'Secondary copy' },
    { name: 'primary', var: '--ds-color-primary', usage: 'Actions, focus' },
    { name: 'accent', var: '--ds-color-accent', usage: 'Brand moments' },
    { name: 'success', var: '--ds-color-success', usage: 'Positive states' },
    { name: 'warning', var: '--ds-color-warning', usage: 'Caution states' },
    { name: 'danger', var: '--ds-color-danger', usage: 'Destructive states' },
    { name: 'info', var: '--ds-color-info', usage: 'Neutral emphasis' },
    { name: 'focus-ring', var: '--ds-color-focus-ring', usage: 'Keyboard focus' },
    { name: 'overlay', var: '--ds-color-overlay', usage: 'Dialog scrim' },
  ] as const;

  /** Elevation ramp — resolved per theme (ink-tinted in light, abyssal in dark). */
  readonly elevations: readonly ElevationToken[] = ['sm', 'md', 'lg', 'xl', 'glow'];

  readonly mixes = Object.entries(gradients).map(([name, css]) => ({
    name,
    css,
    token: `--ds-gradient-${name}`,
  }));

  readonly textures = Object.keys(textures).map((name) => ({
    name,
    token: `--ds-texture-${name}`,
    utility: `.ds-${name}`,
  }));

  readonly blend = blendModes;

  readonly primitiveScales = (
    [
      ['ink', colorPrimitives.ink],
      ['violet', colorPrimitives.violet],
      ['magenta', colorPrimitives.magenta],
      ['lime', colorPrimitives.lime],
      ['emerald', colorPrimitives.emerald],
      ['amber', colorPrimitives.amber],
      ['rose', colorPrimitives.rose],
      ['sky', colorPrimitives.sky],
    ] as const
  ).map(([name, scale]) => ({
    name,
    shades: Object.entries(scale).map(([key, value]) => ({ key, value })),
  }));

  readonly typeStyles = Object.entries(typeRamp).map(([name, style]) => ({
    name,
    variant: name as TextVariant,
    sample:
      name === 'code'
        ? 'const token = spacing[4]'
        : name.startsWith('h') || name === 'display'
          ? 'The quick brown fox'
          : 'Design tokens keep interfaces consistent.',
    meta: `${style.fontSize} / ${style.fontWeight}`,
  }));

  readonly fontStacks = [
    { name: 'Display', family: 'Fraunces', role: 'display, h1, h2', token: '--ds-font-display' },
    { name: 'Sans', family: 'DM Sans', role: 'UI and body copy', token: '--ds-font-sans' },
    { name: 'Mono', family: 'IBM Plex Mono', role: 'code and tokens', token: '--ds-font-mono' },
  ] as const;

  readonly spacingTokens = Object.entries(spacingScale)
    .filter(([key]) => key !== '0' && key !== 'px')
    // Object key order puts '0.5' after '24'; the scale reads better in order.
    .sort(([a], [b]) => Number.parseFloat(a) - Number.parseFloat(b))
    .map(([key, value]) => ({ key, value }));

  readonly semanticSpacing = Object.entries(spacingSemantic).map(([key, value]) => ({ key, value }));

  readonly radii = Object.entries(radii).map(([key, value]) => ({ key, value }));

  readonly icons = Object.keys(iconRegistry) as IconName[];

  readonly tokenSnippet = `import { spacingScale, typeRamp, colorPrimitives, gradients } from './design-system';

spacingScale[6];              // '1.5rem'
typeRamp.display.fontWeight;  // 900
colorPrimitives.violet[600];  // '#6a1bf5'
gradients.brand;              // magenta → violet → ink`;

  readonly cssSnippet = `.panel {
  padding: var(--ds-space-surface-padding);
  color: var(--ds-color-text);
  background: var(--ds-color-surface);
  border-radius: var(--ds-radius-lg);
}`;

  readonly bridgeSnippet = `// Paint authors --ds-*, the theme provider derives Bootstrap's --bs-*
root.style.setProperty('--ds-color-primary', colors.primary);
root.style.setProperty('--bs-primary', colors.primary);
root.style.setProperty('--bs-primary-rgb', hexToRgbTriplet(colors.primary));
root.setAttribute('data-theme', mode);
root.setAttribute('data-bs-theme', mode);`;

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
