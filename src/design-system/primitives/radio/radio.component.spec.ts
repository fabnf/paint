import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RadioComponent, type RadioValue } from './radio.component';

@Component({
  standalone: true,
  imports: [RadioComponent],
  template: `
    <fieldset>
      <legend>Deploy target</legend>
      <ds-radio
        name="target"
        value="staging"
        label="Staging"
        [(groupValue)]="target"
        [disabled]="disabled()"
        (selected)="picks.push($event)"
      />
      <ds-radio
        name="target"
        value="prod"
        label="Production"
        hint="Visible to customers immediately."
        [(groupValue)]="target"
        (selected)="picks.push($event)"
      />
    </fieldset>
  `,
})
class HostComponent {
  target: RadioValue | null = 'staging';
  readonly disabled = signal(false);
  picks: RadioValue[] = [];
}

describe('RadioComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const inputs = () => Array.from(fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders native radios on Bootstrap’s form-check substrate', () => {
    expect(inputs().length).toBe(2);
    expect(inputs()[0].type).toBe('radio');
    expect(inputs()[0].classList).toContain('form-check-input');
  });

  it('groups by name, which is where the arrow-key pattern comes from', () => {
    // One tab stop per group, arrows move within it — all of it the browser's.
    expect(inputs().map((input) => input.name)).toEqual(['target', 'target']);
    expect(inputs().some((input) => input.hasAttribute('tabindex'))).toBeFalse();
    expect(inputs()[0].getAttribute('role')).toBeNull();
  });

  it('carries each radio’s own value for a native submission', () => {
    expect(inputs().map((input) => input.value)).toEqual(['staging', 'prod']);
  });

  it('checks the radio whose value matches the group value', () => {
    expect(inputs()[0].checked).toBeTrue();
    expect(inputs()[1].checked).toBeFalse();

    host.target = 'prod';
    fixture.detectChanges();

    expect(inputs()[0].checked).toBeFalse();
    expect(inputs()[1].checked).toBeTrue();
  });

  it('reports the selected value to every radio in the group', () => {
    inputs()[1].click();
    fixture.detectChanges();

    expect(host.target).toBe('prod');
    expect(host.picks).toEqual(['prod']);
    expect(inputs()[0].checked).toBeFalse();
  });

  it('never unselects itself', () => {
    inputs()[0].click();
    fixture.detectChanges();
    expect(host.target).toBe('staging');
    expect(inputs()[0].checked).toBeTrue();
  });

  it('labels each radio, and describes the one with a hint', () => {
    const labels = fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>;
    expect(labels[0].getAttribute('for')).toBe(inputs()[0].id);
    expect(labels[1].textContent).toContain('Production');

    const hint = fixture.nativeElement.querySelector('.ds-field__hint') as HTMLElement;
    expect(inputs()[1].getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('disables one radio without disabling the group', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(inputs()[0].disabled).toBeTrue();
    expect(inputs()[1].disabled).toBeFalse();
  });
});

describe('RadioComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [RadioComponent, ReactiveFormsModule],
    template: `
      <ds-radio name="plan" value="free" label="Free" [formControl]="control" />
      <ds-radio name="plan" value="pro" label="Pro" [formControl]="control" />
    `,
  })
  class FormHostComponent {
    readonly control = new FormControl<string | null>('free');
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const inputs = () =>
    Array.from(fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('checks the radio the control points at', () => {
    expect(inputs()[0].checked).toBeTrue();
  });

  it('writes the selected value into the control, and re-checks the group', () => {
    inputs()[1].click();
    fixture.detectChanges();

    expect(host.control.value).toBe('pro');
    expect(inputs()[0].checked).toBeFalse();
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when the control is disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(inputs().every((input) => input.disabled)).toBeTrue();
  });
});
