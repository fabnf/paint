import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SwitchComponent, type SwitchLabelPlacement } from './switch.component';

@Component({
  standalone: true,
  imports: [SwitchComponent],
  template: `
    <ds-switch
      [label]="label()"
      [(checked)]="checked"
      [size]="size()"
      [labelPlacement]="labelPlacement()"
      [hint]="hint()"
      [disabled]="disabled()"
      (changed)="changes.push($event)"
    />
  `,
})
class HostComponent {
  checked = false;
  readonly label = signal('Dark mode');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly labelPlacement = signal<SwitchLabelPlacement>('end');
  readonly hint = signal('');
  readonly disabled = signal(false);
  changes: boolean[] = [];
}

describe('SwitchComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const input = () => query<HTMLInputElement>('input')!;

  const press = (key: string) => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a native checkbox wearing role="switch", on Bootstrap’s form-switch', () => {
    expect(input().type).toBe('checkbox');
    expect(input().getAttribute('role')).toBe('switch');
    expect(query('.form-switch')).toBeTruthy();
    expect(input().classList).toContain('form-check-input');
  });

  it('keeps the platform’s keyboard: no tabindex, no invented role on a div', () => {
    expect(input().hasAttribute('tabindex')).toBeFalse();
  });

  it('labels the control with a real <label for>', () => {
    const label = query<HTMLLabelElement>('label')!;
    expect(label.textContent).toContain('Dark mode');
    expect(label.getAttribute('for')).toBe(input().id);
  });

  it('toggles on click, and reports the new state', () => {
    input().click();
    fixture.detectChanges();

    expect(host.checked).toBeTrue();
    expect(host.changes).toEqual([true]);
  });

  it('toggles on Enter, which a checkbox would ignore', () => {
    press('Enter');

    expect(host.checked).toBeTrue();
    expect(input().checked).toBeTrue();
    expect(host.changes).toEqual([true]);

    press('Enter');
    expect(host.checked).toBeFalse();
  });

  it('ignores Enter while disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    press('Enter');
    expect(host.checked).toBeFalse();
    expect(host.changes).toEqual([]);
  });

  it('reflects a model change back into the DOM', () => {
    host.checked = true;
    fixture.detectChanges();
    expect(input().checked).toBeTrue();
  });

  it('moves the label to the other side of the track on request', () => {
    expect(query('.ds-switch')!.classList).toContain('ds-switch--end');

    host.labelPlacement.set('start');
    fixture.detectChanges();
    expect(query('.ds-switch')!.classList).toContain('ds-switch--start');
  });

  it('maps the control scale onto the track size', () => {
    host.size.set('sm');
    fixture.detectChanges();
    expect(query('.ds-switch')!.classList).toContain('ds-switch--sm');
  });

  it('describes the control with its hint', () => {
    host.hint.set('Follows your system at night.');
    fixture.detectChanges();
    expect(input().getAttribute('aria-describedby')).toBe(query('.ds-field__hint')!.id);
  });

  it('disables the native control', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(input().disabled).toBeTrue();
    input().click();
    expect(host.changes).toEqual([]);
  });
});

describe('SwitchComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [SwitchComponent, ReactiveFormsModule],
    template: `<ds-switch label="Email digests" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl(false);
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('pushes user interaction into the control', () => {
    input().click();
    fixture.detectChanges();
    expect(host.control.value).toBeTrue();
  });

  it('marks itself touched on blur', () => {
    input().dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when the control is disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();
  });
});
