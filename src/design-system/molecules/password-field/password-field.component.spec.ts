import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { FormFieldComponent } from '../form-field';
import { PasswordFieldComponent, type PasswordPurpose } from './password-field.component';
import { passwordStrength } from './password-strength';

describe('passwordStrength', () => {
  it('scores nothing as nothing', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('').label).toBe('Empty');
  });

  it('rates short passwords weak, whatever they contain', () => {
    expect(passwordStrength('aB3!').score).toBe(1);
  });

  it('rewards length over line noise', () => {
    // A long passphrase of plain words beats a short jumble.
    expect(passwordStrength('correct horse battery staple').score).toBe(4);
    expect(passwordStrength('aB3!xQ7#').score).toBe(2);
  });

  it('climbs through fair and good', () => {
    expect(passwordStrength('paintpaint1').score).toBe(2);
    expect(passwordStrength('paintpaint12').score).toBe(3);
    expect(passwordStrength('paintPaint12').score).toBe(4);
  });

  it('carries a tone and a word with every score', () => {
    expect(passwordStrength('aB3!').tone).toBe('danger');
    expect(passwordStrength('correct horse battery staple').tone).toBe('success');
    expect(passwordStrength('correct horse battery staple').label).toBe('Strong');
  });
});

@Component({
  standalone: true,
  imports: [PasswordFieldComponent],
  template: `
    <ds-password-field
      label="Password"
      [(value)]="value"
      [purpose]="purpose()"
      [toggle]="toggle()"
      [showStrength]="showStrength()"
      [disabled]="disabled()"
      (visibilityChange)="visibilities.push($event)"
    />
  `,
})
class HostComponent {
  value = '';
  readonly purpose = signal<PasswordPurpose>('current');
  readonly toggle = signal(true);
  readonly showStrength = signal(false);
  readonly disabled = signal(false);
  visibilities: boolean[] = [];
}

describe('PasswordFieldComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const input = () => query<HTMLInputElement>('input')!;
  const toggle = () => query<HTMLButtonElement>('.ds-password__toggle button')!;

  const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a masked input with a label', () => {
    expect(input().type).toBe('password');
    expect(query<HTMLLabelElement>('label')!.getAttribute('for')).toBe(input().id);
  });

  it('tells the password manager which password this is', () => {
    expect(input().getAttribute('autocomplete')).toBe('current-password');

    host.purpose.set('new');
    fixture.detectChanges();
    expect(input().getAttribute('autocomplete')).toBe('new-password');
  });

  it('reveals by swapping the type, which is the only thing that works', () => {
    toggle().click();
    fixture.detectChanges();

    expect(input().type).toBe('text');
    expect(host.visibilities).toEqual([true]);

    toggle().click();
    fixture.detectChanges();
    expect(input().type).toBe('password');
  });

  it('is a real toggle button: pressed, named, and pointing at the input', () => {
    expect(toggle().tagName).toBe('BUTTON');
    expect(toggle().type).toBe('button');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
    expect(toggle().getAttribute('aria-controls')).toBe(input().id);
    expect(toggle().getAttribute('aria-label')).toBe('Show password');

    toggle().click();
    fixture.detectChanges();

    expect(toggle().getAttribute('aria-pressed')).toBe('true');
    expect(toggle().getAttribute('aria-label')).toBe('Hide password');
  });

  it('keeps the toggle inside the field', () => {
    expect(toggle().closest('.ds-input__wrap')).toBeTruthy();
  });

  it('never moves focus when the mask flips', () => {
    input().focus();
    input().setSelectionRange(0, 0);

    toggle().click();
    fixture.detectChanges();

    // The component focuses nothing: a real click leaves focus on the button, a
    // programmatic one leaves it where it was. Either way the caret is not moved
    // and the field is not re-focused behind the user's back.
    expect(document.activeElement).toBe(input());
  });

  it('can be asked to have no toggle at all', () => {
    host.toggle.set(false);
    fixture.detectChanges();
    expect(query('.ds-password__toggle')).toBeNull();
  });

  it('disables the toggle with the field', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(input().disabled).toBeTrue();
    expect(toggle().disabled).toBeTrue();
  });

  it('never spellchecks a password', () => {
    expect(input().getAttribute('spellcheck')).toBe('false');
  });

  it('meters strength as a progressbar, not a live region', () => {
    host.showStrength.set(true);
    fixture.detectChanges();

    const meter = query('[role="progressbar"]')!;
    expect(meter.getAttribute('aria-valuenow')).toBe('0');
    expect(meter.getAttribute('aria-label')).toBe('Password strength');
    // A live region would narrate "Weak. Fair. Good." on every keystroke.
    expect(meter.getAttribute('aria-live')).toBeNull();

    type('correct horse battery staple');
    expect(meter.getAttribute('aria-valuenow')).toBe('4');
    expect(meter.getAttribute('aria-valuetext')).toBe('Strong');
    expect(query('.ds-password__strength-text')!.textContent!.trim()).toBe('Strong');
    expect(query('.ds-password__strength-text')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('writes through to the model on every keystroke', () => {
    type('hunter2');
    expect(host.value).toBe('hunter2');
  });
});

describe('PasswordFieldComponent inside a FormField', () => {
  @Component({
    standalone: true,
    imports: [PasswordFieldComponent, FormFieldComponent],
    template: `
      <ds-form-field label="Password" hint="At least 12 characters." [required]="true">
        <ds-password-field purpose="new" />
      </ds-form-field>
    `,
  })
  class FieldHost {}

  let fixture: ComponentFixture<FieldHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldHost],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
  });

  it('adopts the field, through the input it wraps', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const hint = fixture.nativeElement.querySelector('.ds-field__hint') as HTMLElement;

    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(input.required).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('label').length).toBe(1);
  });

  it('points the toggle at the field’s id, not at one of its own', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector(
      '.ds-password__toggle button',
    ) as HTMLButtonElement;

    expect(toggle.getAttribute('aria-controls')).toBe(input.id);
  });
});

describe('PasswordFieldComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [PasswordFieldComponent, ReactiveFormsModule],
    template: `<ds-password-field label="Password" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl('hunter2');
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the control’s value', () => {
    expect(input().value).toBe('hunter2');
  });

  it('pushes typing into the control, and blur marks it touched', () => {
    input().value = 'correct horse';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.control.value).toBe('correct horse');

    input().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();
  });
});
