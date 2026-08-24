import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { SpinnerComponent, type SpinnerSize, type SpinnerTone } from './spinner.component';

@Component({
  standalone: true,
  imports: [SpinnerComponent],
  template: `<ds-spinner [size]="size()" [tone]="tone()" [label]="label()" [decorative]="decorative()" />`,
})
class HostComponent {
  readonly size = signal<SpinnerSize>('md');
  readonly tone = signal<SpinnerTone>('primary');
  readonly label = signal('Loading…');
  readonly decorative = signal(false);
}

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const spinner = () => query<HTMLElement>('.ds-spinner')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders Bootstrap’s spinner, sized from the token scale', () => {
    expect(spinner().classList).toContain('spinner-border');
    expect(spinner().style.width).toBe('1.5rem');
    expect(spinner().style.height).toBe('1.5rem');

    host.size.set('xs');
    fixture.detectChanges();
    expect(spinner().style.width).toBe('0.75rem');
  });

  it('announces itself politely, with a name', () => {
    expect(spinner().getAttribute('role')).toBe('status');
    expect(query('.visually-hidden')!.textContent!.trim()).toBe('Loading…');
    expect(spinner().hasAttribute('aria-hidden')).toBeFalse();
  });

  it('takes a name for what is actually loading', () => {
    host.label.set('Loading invoices…');
    fixture.detectChanges();
    expect(query('.visually-hidden')!.textContent!.trim()).toBe('Loading invoices…');
  });

  it('goes silent when decorative — the control around it is already speaking', () => {
    host.decorative.set(true);
    fixture.detectChanges();

    expect(spinner().getAttribute('aria-hidden')).toBe('true');
    expect(spinner().getAttribute('role')).toBeNull();
    expect(query('.visually-hidden')).toBeNull();
  });

  it('takes a tone, or inherits the colour around it', () => {
    expect(spinner().classList).toContain('ds-tone--primary');

    host.tone.set('inherit');
    fixture.detectChanges();
    expect(spinner().className).not.toContain('ds-tone--');
  });
});

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<ds-button [loading]="true">Saving</ds-button>`,
})
class ButtonHost {}

describe('SpinnerComponent inside a Button', () => {
  it('is decorative, because the button reports aria-busy itself', async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonHost],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const spinner = fixture.nativeElement.querySelector('.ds-spinner') as HTMLElement;

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});