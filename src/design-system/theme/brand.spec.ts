import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import {
  builtInBrandPacks,
  emberBrandPack,
  paintBrandPack,
  tidewaterBrandPack,
} from './brand-packs';
import { BrandDirective } from './brand.directive';
import { ThemeDirective } from './theme.directive';
import { THEME_CONFIG, ThemeService } from './theme.service';
import type { ThemeMode } from './theme.types';

const rootVar = (name: string) => document.documentElement.style.getPropertyValue(name).trim();

describe('ThemeService — brands', () => {
  afterEach(() => {
    // A themed root must not leak into the next spec file.
    const root = document.documentElement;
    root.removeAttribute('data-brand');
    root.removeAttribute('data-theme');
    root.removeAttribute('data-bs-theme');
    root.removeAttribute('style');
    localStorage.clear();
  });

  const setup = (config: object = {}) => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: THEME_CONFIG,
          useValue: { storageKey: false, brandStorageKey: false, packs: builtInBrandPacks, ...config },
        },
      ],
    });
    return TestBed.inject(ThemeService);
  };

  it('defaults to Paint, which still looks like Wet Paint', () => {
    const service = setup();

    expect(service.brandId()).toBe('paint');
    expect(rootVar('--ds-color-primary')).toBe('#6a1bf5');
    expect(rootVar('--ds-color-accent')).toBe('#c80b6c');
    expect(document.documentElement.getAttribute('data-brand')).toBe('paint');
  });

  it('switching brand remaps the semantic set on the root', () => {
    const service = setup();
    service.setBrand('tidewater');

    // The whole vocabulary moves, not just the headline role.
    expect(rootVar('--ds-color-primary')).toBe(tidewaterBrandPack.colors.light.primary);
    expect(rootVar('--ds-color-accent')).toBe(tidewaterBrandPack.colors.light.accent);
    expect(rootVar('--ds-color-background')).toBe(tidewaterBrandPack.colors.light.background);
    expect(rootVar('--ds-color-text')).toBe(tidewaterBrandPack.colors.light.text);
    expect(rootVar('--ds-color-focus-ring')).toBe(tidewaterBrandPack.colors.light.focusRing);
    expect(rootVar('--ds-color-overlay')).toBe(tidewaterBrandPack.colors.light.overlay);
    expect(document.documentElement.getAttribute('data-brand')).toBe('tidewater');
    expect(service.brand().name).toBe('Tidewater');
  });

  it('keeps the Bootstrap bridge in lockstep — derived, never a second palette', () => {
    const service = setup();
    service.setBrand('ember');

    expect(rootVar('--bs-primary')).toBe(emberBrandPack.colors.light.primary);
    expect(rootVar('--bs-body-bg')).toBe(emberBrandPack.colors.light.background);
    expect(rootVar('--bs-link-color')).toBe(emberBrandPack.colors.light.primary);

    service.setBrand('paint');
    expect(rootVar('--bs-primary')).toBe(paintBrandPack.colors.light.primary);
  });

  it('applies the pack overrides, and the next pack takes them back', () => {
    const service = setup();

    service.setBrand('tidewater');
    expect(rootVar('--ds-radius-md')).toBe('0.375rem');
    expect(rootVar('--ds-font-display')).toContain('DM Sans');
    expect(rootVar('--ds-type-h1-family')).toContain('DM Sans');
    expect(rootVar('--ds-gradient-brand')).toContain('#0f6f68');

    // Paint overrides nothing — so everything returns to the base tokens.
    service.setBrand('paint');
    expect(rootVar('--ds-radius-md')).toBe('0.625rem');
    expect(rootVar('--ds-font-display')).toContain('Fraunces');
    expect(rootVar('--ds-type-h1-family')).toContain('Fraunces');
    expect(rootVar('--ds-gradient-brand')).not.toContain('#0f6f68');
  });

  it('brand and mode are independent axes', () => {
    const service = setup();
    service.setBrand('ember');
    service.setMode('dark');

    expect(rootVar('--ds-color-primary')).toBe(emberBrandPack.colors.dark.primary);
    expect(rootVar('--ds-color-background')).toBe(emberBrandPack.colors.dark.background);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-brand')).toBe('ember');

    service.setMode('light');
    expect(rootVar('--ds-color-primary')).toBe(emberBrandPack.colors.light.primary);
  });

  it('persists the brand alongside the mode, and restores it', () => {
    const first = setup({ brandStorageKey: 'test-brand', storageKey: 'test-mode' });
    first.setBrand('tidewater');
    first.setMode('dark');

    expect(localStorage.getItem('test-brand')).toBe('tidewater');
    expect(localStorage.getItem('test-mode')).toBe('dark');

    // A second app boot reads both back.
    TestBed.resetTestingModule();
    const second = setup({ brandStorageKey: 'test-brand', storageKey: 'test-mode' });
    expect(second.brandId()).toBe('tidewater');
    expect(second.mode()).toBe('dark');
  });

  it('refuses an unknown brand id instead of silently restyling', () => {
    const service = setup();
    const warn = spyOn(console, 'warn');

    service.setBrand('contoso');

    expect(service.brandId()).toBe('paint');
    expect(rootVar('--ds-color-primary')).toBe('#6a1bf5');
    expect(warn).toHaveBeenCalled();
  });

  it('a stale persisted id falls back to the default, never throws', () => {
    localStorage.setItem('test-brand', 'retired-brand');
    const service = setup({ brandStorageKey: 'test-brand' });
    expect(service.brandId()).toBe('paint');
  });

  it('always keeps Paint registered, even when a host forgets it', () => {
    const service = setup({ packs: [emberBrandPack] });
    expect(service.brands.map((pack) => pack.id)).toEqual(['paint', 'ember']);
    expect(service.brandId()).toBe('paint');
  });

  it('honours a configured default brand', () => {
    const service = setup({ defaultBrand: 'ember' });
    expect(service.brandId()).toBe('ember');
    expect(rootVar('--ds-color-primary')).toBe(emberBrandPack.colors.light.primary);
  });
});

describe('BrandDirective — a scoped brand on a subtree', () => {
  @Component({
    standalone: true,
    imports: [BrandDirective, ThemeDirective],
    template: `
      <div id="shell">
        <section id="scoped" [dsBrand]="scopedBrand()">
          <div id="inside">
            <div id="nested" [dsBrand]="nestedBrand()"></div>
          </div>
        </section>
        <section id="sibling"></section>
        <section id="dark-region" [dsTheme]="'dark'" [dsBrand]="'ember'"></section>
      </div>
    `,
  })
  class HostComponent {
    readonly scopedBrand = signal('tidewater');
    readonly nestedBrand = signal('');
  }

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let service: ThemeService;

  const el = (id: string): HTMLElement => fixture.nativeElement.querySelector(`#${id}`);
  const varOn = (id: string, name: string) => el(id).style.getPropertyValue(name).trim();
  const computedVar = (id: string, name: string) =>
    getComputedStyle(el(id)).getPropertyValue(name).trim();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: THEME_CONFIG,
          useValue: { storageKey: false, brandStorageKey: false, packs: builtInBrandPacks },
        },
      ],
    });
    service = TestBed.inject(ThemeService);
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    const root = document.documentElement;
    root.removeAttribute('data-brand');
    root.removeAttribute('data-theme');
    root.removeAttribute('data-bs-theme');
    root.removeAttribute('style');
    localStorage.clear();
  });

  it('paints the pack onto the host element, and children inherit', () => {
    expect(varOn('scoped', '--ds-color-primary')).toBe(tidewaterBrandPack.colors.light.primary);
    expect(varOn('scoped', '--bs-primary')).toBe(tidewaterBrandPack.colors.light.primary);
    expect(el('scoped').getAttribute('data-brand')).toBe('tidewater');

    // Inheritance, not restyling: the child has no inline vars of its own,
    // yet resolves the scoped brand.
    expect(varOn('inside', '--ds-color-primary')).toBe('');
    expect(computedVar('inside', '--ds-color-primary')).toBe(
      tidewaterBrandPack.colors.light.primary,
    );
  });

  it('does not leak to siblings', () => {
    expect(varOn('sibling', '--ds-color-primary')).toBe('');
    expect(computedVar('sibling', '--ds-color-primary')).toBe(
      paintBrandPack.colors.light.primary,
    );
    expect(el('sibling').getAttribute('data-brand')).toBeNull();
  });

  it('a nested scope wins inside itself, and stays nested', () => {
    host.nestedBrand.set('ember');
    fixture.detectChanges();

    expect(computedVar('nested', '--ds-color-primary')).toBe(
      emberBrandPack.colors.light.primary,
    );
    // The outer scope is untouched by what happened inside it.
    expect(computedVar('inside', '--ds-color-primary')).toBe(
      tidewaterBrandPack.colors.light.primary,
    );
  });

  it('combines with [dsTheme]: a dark region takes the pack in its dark mode', () => {
    expect(varOn('dark-region', '--ds-color-primary')).toBe(emberBrandPack.colors.dark.primary);
    expect(varOn('dark-region', '--ds-color-background')).toBe(
      emberBrandPack.colors.dark.background,
    );
    expect(el('dark-region').getAttribute('data-theme')).toBe('dark');
  });

  it('follows a global mode flip: a brand is two palettes', () => {
    service.setMode('dark');
    fixture.detectChanges();

    expect(varOn('scoped', '--ds-color-primary')).toBe(tidewaterBrandPack.colors.dark.primary);

    service.setMode('light');
    fixture.detectChanges();
    expect(varOn('scoped', '--ds-color-primary')).toBe(tidewaterBrandPack.colors.light.primary);
  });

  it('clearing the scope removes every property it wrote', () => {
    host.scopedBrand.set('');
    fixture.detectChanges();

    expect(varOn('scoped', '--ds-color-primary')).toBe('');
    expect(varOn('scoped', '--bs-primary')).toBe('');
    expect(el('scoped').getAttribute('data-brand')).toBeNull();
    expect(computedVar('scoped', '--ds-color-primary')).toBe(
      paintBrandPack.colors.light.primary,
    );
  });

  it('an unknown id warns and scopes nothing', () => {
    const warn = spyOn(console, 'warn');
    host.scopedBrand.set('contoso');
    fixture.detectChanges();

    expect(warn).toHaveBeenCalled();
    expect(varOn('scoped', '--ds-color-primary')).toBe('');
  });
});
