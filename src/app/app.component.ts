import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// Deep imports, not the barrel: `export *` plus the `DS_*` bundle arrays means
// importing anything from the barrel pulls every component into the main chunk,
// where none of them are used. The pages are lazy; the shell should be too.
import { LogoComponent, brand } from '../design-system/brand';
import { IconComponent } from '../design-system/icons';
import { ToastHostComponent } from '../design-system/molecules/toast';
import { BadgeComponent } from '../design-system/primitives/badge';
import { ButtonComponent } from '../design-system/primitives/button';
import { MenuComponent, type MenuEntry } from '../design-system/molecules/menu';
import { ThemeService } from '../design-system/theme';
import { TourComponent } from '../design-system/organisms/tour';
import { ShowcaseTourService } from './showcase-tour';
import { NAV_SECTIONS } from './nav';

/**
 * Documentation shell: brand navbar, atomic-layer sidebar, routed content.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LogoComponent,
    IconComponent,
    ButtonComponent,
    BadgeComponent,
    MenuComponent,
    ToastHostComponent,
    TourComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The showcase's own walkthrough: the shell owns the instance. */
  readonly showcaseTour = inject(ShowcaseTourService);
  private readonly tourRef = viewChild(TourComponent);

  readonly brand = brand;
  readonly sections = NAV_SECTIONS;

  readonly mode = this.themeService.mode;
  readonly isDark = this.themeService.isDark;

  /** The registered brand packs, as a menu. The shell itself is brand-agnostic. */
  readonly activeBrand = this.themeService.brand;
  readonly brandEntries = computed<MenuEntry[]>(() =>
    this.themeService.brands.map((pack) => ({
      id: pack.id,
      label: pack.name,
      icon: pack.id === this.activeBrand().id ? ('check' as const) : undefined,
    })),
  );

  readonly themeLabel = computed(() => (this.isDark() ? 'Switch to light mode' : 'Switch to dark mode'));

  /** Mobile navigation drawer state. */
  readonly navOpen = signal(false);

  constructor() {
    // Hand the instance to the service the Tour page talks to.
    effect(() => {
      const tour = this.tourRef();
      if (tour) {
        this.showcaseTour.register(tour);
      }
    });

    // Close the mobile drawer whenever a route completes.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.navOpen.set(false));
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  setBrand(id: string): void {
    this.themeService.setBrand(id);
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  /** Escape closes the mobile drawer and hands focus back to its trigger. */
  closeNav(): void {
    if (!this.navOpen()) {
      return;
    }

    this.navOpen.set(false);
    queueMicrotask(() =>
      this.host.nativeElement
        .querySelector<HTMLButtonElement>('.app-navbar ds-button button')
        ?.focus(),
    );
  }
}
