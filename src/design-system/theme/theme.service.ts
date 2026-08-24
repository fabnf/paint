import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { themeToBootstrapVariables } from './bootstrap.bridge';
import { paintBrandPack, type BrandPack } from './brand-packs';
import {
  brandOverrideVariables,
  resolveThemeDefinition,
  themeToCssVariables,
  type ThemeDefinition,
  type ThemeMode,
} from './theme.types';

export interface ThemeConfig {
  /** Initial theme mode. Defaults to `'light'`, or `'system'` when enabled. */
  defaultMode?: ThemeMode | 'system';
  /** Persist preference under this localStorage key. Set `false` to disable. */
  storageKey?: string | false;
  /** Follow OS preference when no stored preference exists. */
  followSystem?: boolean;

  /**
   * The brand packs this host offers. Paint is always available: it is the
   * design system's own face and the fallback for every unknown id. Register
   * more to let `setBrand` / `[dsBrand]` reach them.
   */
  packs?: readonly BrandPack[];
  /** Initial brand id. Defaults to `'paint'`. */
  defaultBrand?: string;
  /** Persist the active brand under this key. Set `false` to disable. */
  brandStorageKey?: string | false;
}

export const THEME_CONFIG = new InjectionToken<ThemeConfig>('THEME_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

const DEFAULT_STORAGE_KEY = 'paint-theme-mode';
const DEFAULT_BRAND_STORAGE_KEY = 'paint-theme-brand';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(THEME_CONFIG);

  private readonly storageKey =
    this.config.storageKey === false ? null : (this.config.storageKey ?? DEFAULT_STORAGE_KEY);
  private readonly brandStorageKey =
    this.config.brandStorageKey === false
      ? null
      : (this.config.brandStorageKey ?? DEFAULT_BRAND_STORAGE_KEY);

  /**
   * The registered packs, Paint first. Paint is prepended when a host's list
   * forgot it: components assume the default pack exists, and so does the
   * fallback story for an unknown or stale persisted id.
   */
  readonly brands: readonly BrandPack[] = this.resolvePacks();

  private readonly systemPrefersDark = signal(this.readSystemPreference());
  private readonly modeSignal = signal<ThemeMode>(this.resolveInitialMode());
  private readonly brandSignal = signal<BrandPack>(this.resolveInitialBrand());

  readonly mode = this.modeSignal.asReadonly();
  readonly isDark = computed(() => this.modeSignal() === 'dark');

  /** The active pack. Components never need it — they read `--ds-*`. */
  readonly brand = this.brandSignal.asReadonly();
  readonly brandId = computed(() => this.brandSignal().id);

  /** The active pack, resolved at the active mode. */
  readonly theme = computed<ThemeDefinition>(() =>
    resolveThemeDefinition(this.brandSignal(), this.modeSignal()),
  );

  constructor() {
    this.applyTheme();
    this.bindSystemListener();
  }

  setMode(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    this.persist(this.storageKey, mode);
    this.applyTheme();
  }

  toggle(): void {
    this.setMode(this.modeSignal() === 'light' ? 'dark' : 'light');
  }

  /**
   * Switches the active brand. Every `--ds-*` (and derived `--bs-*`) custom
   * property on the root is remapped; components follow because they never
   * knew a brand existed. Unknown ids are refused, loudly in dev terms —
   * a typo must not silently restyle the product to the fallback.
   */
  setBrand(id: string): void {
    const pack = this.findPack(id);
    if (!pack) {
      console.warn(`[paint] Unknown brand pack "${id}". Registered: ${this.brandIds().join(', ')}`);
      return;
    }

    this.brandSignal.set(pack);
    this.persist(this.brandStorageKey, pack.id);
    this.applyTheme();
  }

  private brandIds(): string[] {
    return this.brands.map((pack) => pack.id);
  }

  private findPack(id: string): BrandPack | undefined {
    return this.brands.find((pack) => pack.id === id);
  }

  private resolvePacks(): readonly BrandPack[] {
    const configured = this.config.packs ?? [];
    return configured.some((pack) => pack.id === paintBrandPack.id)
      ? configured
      : [paintBrandPack, ...configured];
  }

  private syncFromSystem(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    this.applyTheme();
  }

  private resolveInitialMode(): ThemeMode {
    const stored = this.readStored(this.storageKey);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    const fallback = this.config.defaultMode ?? 'light';
    if (fallback === 'system' || this.config.followSystem) {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }

    return fallback;
  }

  /** Stored id first, then the configured default, then Paint. A stale id —
   *  a pack the host stopped registering — falls through, never throws. */
  private resolveInitialBrand(): BrandPack {
    const stored = this.readStored(this.brandStorageKey);
    const storedPack = stored ? this.findPack(stored) : undefined;
    if (storedPack) {
      return storedPack;
    }

    const configured = this.config.defaultBrand
      ? this.findPack(this.config.defaultBrand)
      : undefined;
    return configured ?? this.findPack(paintBrandPack.id) ?? this.brands[0];
  }

  private applyTheme(): void {
    const pack = this.brandSignal();
    const theme = this.theme();
    const root = this.document.documentElement;

    const vars = {
      // The full Paint vocabulary at this pack + mode…
      ...themeToCssVariables(theme),
      // …then the pack's own gradients / radii / fonts, where it has opinions.
      // The base set writes every key each time, so switching packs never
      // leaves the previous pack's overrides behind.
      ...brandOverrideVariables(pack),
      // Paint primitives are built on Bootstrap: keep its `--bs-*` API pointed
      // at the active pack — derived, never a second palette.
      ...themeToBootstrapVariables(theme),
    };

    for (const [property, value] of Object.entries(vars)) {
      root.style.setProperty(property, value);
    }

    root.setAttribute('data-theme', theme.mode);
    root.setAttribute('data-brand', pack.id);
    // Bootstrap's own color-mode hook, kept in sync with Paint's.
    root.setAttribute('data-bs-theme', theme.mode);
    root.style.colorScheme = theme.mode;
  }

  private persist(key: string | null, value: string): void {
    if (!key || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, value);
  }

  private readStored(key: string | null): string | null {
    if (!key || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  }

  private readSystemPreference(): boolean {
    if (typeof matchMedia === 'undefined') {
      return false;
    }
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private bindSystemListener(): void {
    if (typeof matchMedia === 'undefined') {
      return;
    }

    const query = matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      this.systemPrefersDark.set(event.matches);
      if (
        !this.readStored(this.storageKey) &&
        (this.config.followSystem || this.config.defaultMode === 'system')
      ) {
        this.syncFromSystem(event.matches ? 'dark' : 'light');
      }
    };

    query.addEventListener('change', onChange);
  }
}
