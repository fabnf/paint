import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  effect,
  input,
  model,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { IconComponent } from '../../icons';
import { firstEnabledIndex, rovingIndex, uniqueId } from '../../utils';
import { TabComponent } from './tab.component';

export type TabsVariant = 'underline' | 'pills' | 'segmented';
export type TabsAlign = 'start' | 'center' | 'end' | 'fitted';

/**
 * Tabs — one surface, several panels.
 *
 * Built on Bootstrap's `.nav` / `.nav-pills` / `.tab-content`, with the full
 * ARIA tab pattern on top: roving tabindex, arrow/Home/End keys, and only the
 * selected panel in the DOM.
 *
 * Selection is a `model`, so it works uncontrolled, one-way or two-way.
 *
 * @example
 * ```html
 * <!-- Uncontrolled: the first enabled tab wins -->
 * <ds-tabs>
 *   <ds-tab label="Overview">…</ds-tab>
 *   <ds-tab label="Activity" [badge]="12">…</ds-tab>
 *   <ds-tab label="Archive" [disabled]="true">…</ds-tab>
 * </ds-tabs>
 *
 * <!-- Two-way bound, pill flavour -->
 * <ds-tabs variant="pills" [(selected)]="tab">
 *   <ds-tab tabId="api" label="API" icon="code">…</ds-tab>
 * </ds-tabs>
 * ```
 */
@Component({
  selector: 'ds-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, IconComponent],
  template: `
    <div class="ds-tabs" [class.ds-tabs--segmented]="variant() === 'segmented'">
      <div
        class="nav ds-tabs__list"
        [class.nav-pills]="variant() === 'pills'"
        [class.ds-tabs__list--underline]="variant() === 'underline'"
        [class.ds-tabs__list--segmented]="variant() === 'segmented'"
        [class.justify-content-center]="align() === 'center'"
        [class.justify-content-end]="align() === 'end'"
        [class.nav-fill]="align() === 'fitted'"
        role="tablist"
        [attr.aria-label]="label() || null"
        [attr.aria-orientation]="'horizontal'"
        (keydown)="onKeydown($event)"
      >
        @for (tab of tabs(); track tab.uid; let i = $index) {
          <button
            #tabButton
            type="button"
            class="nav-link ds-tabs__tab"
            role="tab"
            [class.active]="i === selectedIndex()"
            [class.disabled]="tab.disabled()"
            [id]="tab.uid + '-tab'"
            [attr.aria-selected]="i === selectedIndex()"
            [attr.aria-controls]="tab.uid + '-panel'"
            [attr.aria-disabled]="tab.disabled() ? 'true' : null"
            [attr.aria-label]="tabName(tab)"
            [disabled]="tab.disabled()"
            [tabIndex]="i === selectedIndex() ? 0 : -1"
            (click)="select(i)"
          >
            @if (tab.icon()) {
              <ds-icon [name]="tab.icon()!" size="sm" />
            }
            <span class="ds-tabs__label">{{ tab.label() }}</span>
            @if (tab.badge() !== null) {
              <!-- Folded into the tab's name instead: flush against the label it
                   would be read as "Activity12". -->
              <span class="ds-tabs__badge" aria-hidden="true">{{ tab.badge() }}</span>
            }
          </button>
        }
      </div>

      <div class="tab-content ds-tabs__content">
        @if (activeTab(); as tab) {
          <div
            class="tab-pane active show"
            role="tabpanel"
            [id]="tab.uid + '-panel'"
            [attr.aria-labelledby]="tab.uid + '-tab'"
            tabindex="0"
          >
            <ng-container [ngTemplateOutlet]="tab.content()" />
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .ds-tabs__list {
      gap: var(--ds-space-1);
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .ds-tabs__list::-webkit-scrollbar {
      display: none;
    }

    .ds-tabs__tab {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-space-2);
      border: 0;
      background: none;
      white-space: nowrap;
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text-muted);
      cursor: pointer;
      transition:
        color 140ms ease,
        background-color 140ms ease;
    }

    .ds-tabs__tab:hover:not(.disabled) {
      color: var(--ds-color-text);
    }

    .ds-tabs__tab.disabled {
      color: var(--ds-color-text-subtle);
      cursor: not-allowed;
    }

    .ds-tabs__badge {
      padding-inline: var(--ds-space-1_5);
      border-radius: var(--ds-radius-full);
      background: var(--ds-color-surface-sunken);
      color: var(--ds-color-text-muted);
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
    }

    .ds-tabs__tab.active .ds-tabs__badge {
      background: var(--ds-color-primary-muted);
      color: var(--ds-color-primary);
    }

    /* —— underline: the brush stroke sits under the active tab —— */
    .ds-tabs__list--underline {
      gap: var(--ds-space-4);
      border-bottom: 1px solid var(--ds-color-border);
    }

    .ds-tabs__list--underline .ds-tabs__tab {
      position: relative;
      padding-inline: 0;
      padding-block: var(--ds-space-2_5);
      border-radius: 0;
    }

    .ds-tabs__list--underline .ds-tabs__tab::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      inset-block-end: -1px;
      height: 3px;
      border-radius: var(--ds-radius-full);
      background: var(--ds-gradient-brand);
      transform: scaleX(0);
      transform-origin: left center;
      transition: transform 180ms cubic-bezier(0.16, 0.84, 0.44, 1);
    }

    .ds-tabs__list--underline .ds-tabs__tab.active {
      color: var(--ds-color-text);
    }

    .ds-tabs__list--underline .ds-tabs__tab.active::after {
      transform: scaleX(1);
    }

    /* —— pills —— */
    .nav-pills .ds-tabs__tab.active {
      color: var(--ds-color-primary);
      background: var(--ds-color-primary-muted);
    }

    /* —— segmented: one inked track —— */
    .ds-tabs__list--segmented {
      gap: var(--ds-space-1);
      padding: var(--ds-space-1);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-color-surface-sunken);
      border: 1px solid var(--ds-color-border);
      display: inline-flex;
    }

    .ds-tabs__list--segmented .ds-tabs__tab {
      border-radius: var(--ds-radius-md);
      padding: var(--ds-space-1_5) var(--ds-space-3);
    }

    .ds-tabs__list--segmented .ds-tabs__tab.active {
      color: var(--ds-color-text);
      background: var(--ds-color-surface);
      box-shadow: var(--ds-shadow-sm);
    }

    .ds-tabs__content {
      padding-block-start: var(--ds-space-5);
    }

    .tab-pane:focus-visible {
      outline: 2px solid var(--ds-color-focus-ring);
      outline-offset: 4px;
      border-radius: var(--ds-radius-sm);
    }

    @media (prefers-reduced-motion: reduce) {
      .ds-tabs__tab,
      .ds-tabs__list--underline .ds-tabs__tab::after {
        transition: none;
      }
    }
  `,
})
export class TabsComponent {
  /** Visual flavour. `underline` is the default; `segmented` suits toolbars. */
  readonly variant = input<TabsVariant>('underline');
  /** Horizontal distribution of the tab list. */
  readonly align = input<TabsAlign>('start');
  /** Accessible name for the tab list. */
  readonly label = input<string>('');

  /**
   * Selected tab id (`tabId`, or the label when no id is given).
   * Two-way bindable; leave unset to let Tabs manage it.
   */
  readonly selected = model<string | null>(null);

  /** Emits the newly selected tab id on every change. */
  readonly selectedChanged = output<string>();

  protected readonly tabs = contentChildren(TabComponent);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  /** Index of the tab to show — falls back to the first enabled tab. */
  protected readonly selectedIndex = computed(() => {
    const tabs = this.tabs();
    const id = this.selected();
    const fromId = tabs.findIndex((tab) => tab.resolvedId === id);

    if (fromId !== -1 && !tabs[fromId].disabled()) {
      return fromId;
    }

    return firstEnabledIndex(tabs.length, (index) => tabs[index].disabled());
  });

  protected readonly activeTab = computed(() => this.tabs()[this.selectedIndex()] ?? null);

  /**
   * Accessible name for a tab: the label, plus the badge in words when there is
   * one. Starts with the visible label, so voice control still works (WCAG 2.5.3).
   */
  protected tabName(tab: TabComponent): string | null {
    const badge = tab.badge();
    if (badge === null) {
      return null;
    }
    return `${tab.label()}, ${tab.badgeLabel() || `${badge} items`}`;
  }

  /** Index the user is keyboard-focused on, for roving tabindex. */
  private readonly focusIndex = signal(-1);

  constructor() {
    // Keep `selected` honest: publish the resolved tab when it was never set,
    // or pointed at a missing/disabled tab.
    effect(() => {
      const active = this.activeTab();
      if (active && this.selected() !== active.resolvedId) {
        this.selected.set(active.resolvedId);
      }
    });
  }

  select(index: number): void {
    const tab = this.tabs()[index];
    if (!tab || tab.disabled() || index === this.selectedIndex()) {
      return;
    }

    this.selected.set(tab.resolvedId);
    this.selectedChanged.emit(tab.resolvedId);
  }

  /** Arrow keys move *and* select, per the ARIA authoring practices. */
  protected onKeydown(event: KeyboardEvent): void {
    const tabs = this.tabs();
    const disabled = (index: number) => tabs[index].disabled();
    const current = this.focusIndex() === -1 ? this.selectedIndex() : this.focusIndex();
    let next = -1;

    switch (event.key) {
      case 'ArrowRight':
        next = rovingIndex(tabs.length, current, 1, disabled);
        break;
      case 'ArrowLeft':
        next = rovingIndex(tabs.length, current, -1, disabled);
        break;
      case 'Home':
        next = firstEnabledIndex(tabs.length, disabled, 1);
        break;
      case 'End':
        next = firstEnabledIndex(tabs.length, disabled, -1);
        break;
      default:
        return;
    }

    if (next === -1) {
      return;
    }

    event.preventDefault();
    this.focusIndex.set(next);
    this.select(next);
    this.tabButtons()[next]?.nativeElement.focus();
  }
}
