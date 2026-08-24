import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

@Component({
  standalone: true,
  imports: [CheckboxComponent],
  template: `
    <ds-checkbox
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [(checked)]="checked"
      [(indeterminate)]="indeterminate"
      [size]="size()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="disabled()"
      (changed)="changes.push($event)"
    />
  `,
})
class HostComponent {
  checked = false;
  indeterminate = false;
  readonly label = signal('Remember me');
  readonly ariaLabel = signal('');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly hint = signal('');
  readonly error = signal('');
  readonly required = signal(false);
  readonly disabled = signal(false);
  changes: boolean[] = [];
}

describe('CheckboxComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const input = () => query<HTMLInputElement>('input')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a native checkbox on Bootstrap’s form-check substrate', () => {
    expect(input().type).toBe('checkbox');
    expect(input().classList).toContain('form-check-input');
    expect(query('.form-check')).toBeTruthy();
  });

  it('is a native control, so the keyboard and forced colours come for free', () => {
    // No role="checkbox" on a div: Space, Tab and High Contrast are the platform's.
    expect(input().getAttribute('role')).toBeNull();
    expect(input().hasAttribute('tabindex')).toBeFalse();
  });

  it('labels the control with a real <label for>', () => {
    const label = query<HTMLLabelElement>('label')!;
    expect(label.textContent).toContain('Remember me');
    expect(label.getAttribute('for')).toBe(input().id);
    expect(input().getAttribute('aria-label')).toBeNull();
  });

  it('falls back to aria-label only when there is no visible label', () => {
    host.label.set('');
    host.ariaLabel.set('Remember me');
    fixture.detectChanges();
    expect(input().getAttribute('aria-label')).toBe('Remember me');
  });

  it('toggles the model when the user clicks the label', () => {
    query<HTMLLabelElement>('label')!.click();
    fixture.detectChanges();

    expect(host.checked).toBeTrue();
    expect(input().checked).toBeTrue();
    expect(host.changes).toEqual([true]);

    query<HTMLLabelElement>('label')!.click();
    fixture.detectChanges();
    expect(host.checked).toBeFalse();
  });

  it('reflects a model change back into the DOM', () => {
    host.checked = true;
    fixture.detectChanges();
    expect(input().checked).toBeTrue();
  });

  it('exposes indeterminate natively, so it is announced as mixed', () => {
    host.indeterminate = true;
    fixture.detectChanges();

    expect(input().indeterminate).toBeTrue();
    expect(input().getAttribute('aria-checked')).toBeNull();
  });

  it('resolves a mixed checkbox to checked when clicked', () => {
    host.indeterminate = true;
    fixture.detectChanges();

    input().click();
    fixture.detectChanges();

    expect(host.indeterminate).toBeFalse();
    expect(host.checked).toBeTrue();
    expect(input().indeterminate).toBeFalse();
  });

  it('maps the control scale onto the indicator size', () => {
    host.size.set('lg');
    fixture.detectChanges();
    expect(query('.ds-check')!.classList).toContain('ds-check--lg');
  });

  it('describes the control with hint and error, and marks it invalid', () => {
    host.hint.set('We will keep you signed in.');
    host.error.set('You must accept.');
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe(
      `${query('.ds-field__hint')!.id} ${query('.ds-field__error')!.id}`,
    );
  });

  it('disables the native control, and never emits while disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(input().disabled).toBeTrue();
    input().click();
    expect(host.changes).toEqual([]);
  });

  it('marks required on the control, and the asterisk as decoration', () => {
    host.required.set(true);
    fixture.detectChanges();

    expect(input().required).toBeTrue();
    expect(query('.ds-field__required')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('CheckboxComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [CheckboxComponent, ReactiveFormsModule],
    template: `<ds-checkbox label="Ship it" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl(true);
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

  it('renders the control’s value', () => {
    expect(input().checked).toBeTrue();
  });

  it('pushes user interaction into the control', () => {
    input().click();
    fixture.detectChanges();
    expect(host.control.value).toBeFalse();
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
