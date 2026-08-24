import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextareaComponent, type TextareaResize } from './textarea.component';

@Component({
  standalone: true,
  imports: [TextareaComponent],
  template: `
    <ds-textarea
      label="Notes"
      [(value)]="value"
      [rows]="rows()"
      [resize]="resize()"
      [maxLength]="maxLength()"
      [showCount]="showCount()"
      [hint]="hint()"
      [error]="error()"
      [disabled]="disabled()"
      (valueInput)="inputs.push($event)"
    />
  `,
})
class HostComponent {
  value = '';
  readonly rows = signal(3);
  readonly resize = signal<TextareaResize>('vertical');
  readonly maxLength = signal<number | null>(null);
  readonly showCount = signal(false);
  readonly hint = signal('');
  readonly error = signal('');
  readonly disabled = signal(false);
  inputs: string[] = [];
}

describe('TextareaComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const control = () => query<HTMLTextAreaElement>('textarea')!;

  const type = (text: string) => {
    control().value = text;
    control().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a native textarea on the form-control substrate', () => {
    expect(control().classList).toContain('form-control');
    expect(control().rows).toBe(3);
  });

  it('labels the control with a real <label for>', () => {
    expect(query<HTMLLabelElement>('label')!.getAttribute('for')).toBe(control().id);
  });

  it('writes through to the model on every keystroke', () => {
    type('Mixed a new violet.');
    expect(host.value).toBe('Mixed a new violet.');
    expect(host.inputs).toEqual(['Mixed a new violet.']);
  });

  it('reflects a model change back into the DOM', () => {
    host.value = 'Wet paint.';
    fixture.detectChanges();
    expect(control().value).toBe('Wet paint.');
  });

  it('enforces maxlength in the browser, and counts towards it', () => {
    host.maxLength.set(10);
    host.showCount.set(true);
    fixture.detectChanges();

    expect(control().getAttribute('maxlength')).toBe('10');

    type('paint');
    expect(query('.ds-textarea__count')!.textContent!.trim()).toBe('5/10');
    expect(query('.ds-textarea__count')!.classList).not.toContain('ds-textarea__count--full');
  });

  it('flags the counter at the limit', () => {
    host.maxLength.set(5);
    host.showCount.set(true);
    fixture.detectChanges();

    type('paint');
    expect(query('.ds-textarea__count')!.classList).toContain('ds-textarea__count--full');
  });

  it('keeps the counter out of the accessibility tree', () => {
    host.showCount.set(true);
    fixture.detectChanges();
    // A live character count would interrupt every keystroke.
    expect(query('.ds-textarea__count')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('maps resize modes onto classes, and stops the auto mode scrolling', () => {
    expect(control().classList).toContain('ds-textarea--vertical');

    host.resize.set('auto');
    fixture.detectChanges();
    expect(control().classList).toContain('ds-textarea--auto');
    // Auto-grow measures scrollHeight, so the element sets its own height.
    expect(control().style.height).toBeTruthy();
  });

  it('grows with its content when resize is auto', () => {
    host.resize.set('auto');
    fixture.detectChanges();
    const initial = control().style.height;

    type('one\ntwo\nthree\nfour\nfive\nsix\nseven\neight');
    expect(control().style.height).not.toBe(initial);
  });

  it('describes the control with hint and error, and marks it invalid', () => {
    host.hint.set('Markdown is supported.');
    host.error.set('Too short.');
    fixture.detectChanges();

    expect(control().getAttribute('aria-invalid')).toBe('true');
    expect(control().getAttribute('aria-describedby')).toBe(
      `${query('.ds-field__hint')!.id} ${query('.ds-field__error')!.id}`,
    );
  });

  it('disables the native control', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(control().disabled).toBeTrue();
  });
});

describe('TextareaComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [TextareaComponent, ReactiveFormsModule],
    template: `<ds-textarea label="Notes" resize="auto" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl('Hello');
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const textarea = () => fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the control’s value and re-measures a value it never saw typed', () => {
    expect(textarea().value).toBe('Hello');
    expect(textarea().style.height).toBeTruthy();
  });

  it('pushes user input into the control and marks it touched on blur', () => {
    textarea().value = 'Goodbye';
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.control.value).toBe('Goodbye');

    textarea().dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBeTrue();
  });

  it('follows the forms API when the control is disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(textarea().disabled).toBeTrue();
  });
});
