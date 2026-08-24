import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { brand, provideTheme, ThemeService } from '../design-system';
import { AppComponent } from './app.component';
import { NAV_SECTIONS } from './nav';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideTheme({ defaultMode: 'light', storageKey: false })],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('creates the shell', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('leads with the Paint brand', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('ds-logo')).toBeTruthy();
    expect(compiled.querySelector('.ds-logo__word')?.textContent).toContain(brand.name);
    expect(compiled.querySelector('.app-navbar__version')?.textContent).toContain(brand.version);
  });

  it('renders every navigation section and item', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.app-sidebar__link');
    const expected = NAV_SECTIONS.flatMap((section) => section.items);

    expect(links.length).toBe(expected.length);
    expect(compiled.textContent).toContain('Foundations');
    expect(compiled.textContent).toContain('Primitives');
  });

  it('toggles the theme from the brand bar', () => {
    const theme = TestBed.inject(ThemeService);
    expect(theme.mode()).toBe('light');

    fixture.componentInstance.toggleTheme();
    fixture.detectChanges();

    expect(theme.mode()).toBe('dark');
  });

  it('keeps the mobile drawer closed until requested', () => {
    const component = fixture.componentInstance;
    expect(component.navOpen()).toBeFalse();

    component.toggleNav();
    fixture.detectChanges();

    expect(component.navOpen()).toBeTrue();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.app-sidebar--open'),
    ).toBeTruthy();
  });
});
