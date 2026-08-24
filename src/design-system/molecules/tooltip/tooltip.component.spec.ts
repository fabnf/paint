import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick, type ComponentFixture } from '@angular/core/testing';
import { TooltipComponent, type TooltipPlacement } from './tooltip.component';

@Component({
  standalone: true,
  imports: [TooltipComponent],
  template: `
    <ds-tooltip
      [text]="text()"
      [placement]="placement()"
      [openDelay]="200"
      [disabled]="disabled()"
      (openChange)="opens.push($event)"
    >
      <button type="button" id="trigger">Copy</button>
    </ds-tooltip>
    <button type="button" id="outside">outside</button>
  `,
})
class HostComponent {
  readonly text = signal('Copy to clipboard');
  readonly placement = signal<TooltipPlacement>('top');
  readonly disabled = signal(false);
  opens: boolean[] = [];
}

describe('TooltipComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const root = (): HTMLElement => fixture.nativeElement.querySelector('ds-tooltip');
  const bubble = (): HTMLElement => fixture.nativeElement.querySelector('[role="tooltip"]');
  const trigger = (): HTMLButtonElement => fixture.nativeElement.querySelector('#trigger');
  const isOpen = () => bubble().classList.contains('ds-tooltip__bubble--open');

  const dispatch = (target: EventTarget, type: string, init: EventInit = {}) => {
    target.dispatchEvent(new Event(type, { bubbles: true, ...init }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps the bubble in the DOM, hidden, so the description always resolves', () => {
    expect(bubble()).toBeTruthy();
    expect(bubble().textContent).toContain('Copy to clipboard');
    expect(isOpen()).toBeFalse();
  });

  it('wires aria-describedby onto the focusable trigger', () => {
    expect(trigger().getAttribute('aria-describedby')).toBe(bubble().id);
  });

  it('appends to an existing description instead of clobbering it', () => {
    @Component({
      standalone: true,
      imports: [TooltipComponent],
      template: `
        <span id="existing">Existing description</span>
        <ds-tooltip text="More">
          <button type="button" id="described" aria-describedby="existing">Go</button>
        </ds-tooltip>
      `,
    })
    class DescribedHost {}

    const described = TestBed.createComponent(DescribedHost);
    described.detectChanges();

    const button = described.nativeElement.querySelector('#described') as HTMLElement;
    const id = (described.nativeElement.querySelector('[role="tooltip"]') as HTMLElement).id;
    expect(button.getAttribute('aria-describedby')).toBe(`existing ${id}`);
  });

  it('shows on hover, after the delay', fakeAsync(() => {
    dispatch(root(), 'mouseenter');
    expect(isOpen()).toBeFalse();

    tick(200);
    fixture.detectChanges();
    expect(isOpen()).toBeTrue();
    expect(host.opens).toEqual([true]);
  }));

  it('does not show for a pointer that was only passing through', fakeAsync(() => {
    dispatch(root(), 'mouseenter');
    tick(100);
    dispatch(root(), 'mouseleave');
    tick(300);
    fixture.detectChanges();

    expect(isOpen()).toBeFalse();
    expect(host.opens).toEqual([]);
  }));

  it('hides when the pointer leaves', fakeAsync(() => {
    dispatch(root(), 'mouseenter');
    tick(200);
    fixture.detectChanges();

    dispatch(root(), 'mouseleave');
    expect(isOpen()).toBeFalse();
    expect(host.opens).toEqual([true, false]);
  }));

  it('shows immediately on keyboard focus — no delay for someone who asked', () => {
    trigger().focus();
    dispatch(trigger(), 'focusin');
    expect(isOpen()).toBeTrue();

    dispatch(trigger(), 'focusout');
    expect(isOpen()).toBeFalse();
  });

  it('dismisses on Escape without letting the key escape the tooltip', fakeAsync(() => {
    dispatch(root(), 'mouseenter');
    tick(200);
    fixture.detectChanges();
    expect(isOpen()).toBeTrue();

    // WCAG 1.4.13: dismissible. And only the tooltip — the event must not go on
    // to close a surrounding dialog.
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    const stop = spyOn(escape, 'stopPropagation').and.callThrough();
    document.dispatchEvent(escape);
    fixture.detectChanges();

    expect(isOpen()).toBeFalse();
    expect(stop).toHaveBeenCalled();
  }));

  it('lets Escape pass when there is nothing to dismiss', () => {
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    const stop = spyOn(escape, 'stopPropagation').and.callThrough();
    document.dispatchEvent(escape);
    fixture.detectChanges();

    expect(stop).not.toHaveBeenCalled();
  });

  it('stays put while the bubble itself is hovered (the host contains it)', fakeAsync(() => {
    dispatch(root(), 'mouseenter');
    tick(200);
    fixture.detectChanges();

    // The bubble is a child of the host, so crossing onto it never fires
    // mouseleave on the host — which is precisely the "hoverable" requirement.
    expect(root().contains(bubble())).toBeTrue();
    expect(isOpen()).toBeTrue();
  }));

  it('suppresses the bubble when disabled, but keeps the wiring', fakeAsync(() => {
    host.disabled.set(true);
    fixture.detectChanges();

    dispatch(root(), 'mouseenter');
    tick(300);
    dispatch(trigger(), 'focusin');
    fixture.detectChanges();

    expect(isOpen()).toBeFalse();
    expect(trigger().getAttribute('aria-describedby')).toBe(bubble().id);
  }));

  it('reports where it actually went', () => {
    host.placement.set('bottom');
    fixture.detectChanges();
    dispatch(trigger(), 'focusin');

    // In a viewport with room below, bottom stays bottom.
    expect(bubble().getAttribute('data-placement')).toBe('bottom');
  });
});
