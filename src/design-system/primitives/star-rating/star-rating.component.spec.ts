import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { StarRatingComponent, halfStarFill, type StarRatingValue } from './star-rating.component';

@Component({
  standalone: true,
  imports: [StarRatingComponent],
  template: `
    <ds-star-rating
      [label]="label()"
      [ariaLabel]="ariaLabel()"
      [(value)]="value"
      [max]="max()"
      [readOnly]="readOnly()"
      [clearable]="clearable()"
      [showValue]="showValue()"
      [starLabels]="starLabels()"
      [valueText]="valueText()"
      [size]="size()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [disabled]="disabled()"
      [tone]="tone()"
      (changed)="changes.push($event)"
    />
  `,
})
class HostComponent {
  value: StarRatingValue = 3;
  readonly label = signal('Your rating');
  readonly ariaLabel = signal('');
  readonly max = signal(5);
  readonly readOnly = signal(false);
  readonly clearable = signal(false);
  readonly showValue = signal(false);
  readonly starLabels = signal<readonly string[] | null>(null);
  readonly valueText = signal('');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly hint = signal('');
  readonly error = signal('');
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly tone = signal<'primary' | 'warning'>('primary');
  changes: StarRatingValue[] = [];
}

describe('halfStarFill', () => {
  it('snaps a fraction to the nearest half, between empty and full', () => {
    expect(halfStarFill(0)).toBe(0);
    expect(halfStarFill(0.2)).toBe(0);
    expect(halfStarFill(0.3)).toBe(0.5);
    expect(halfStarFill(0.5)).toBe(0.5);
    expect(halfStarFill(0.74)).toBe(0.5);
    expect(halfStarFill(0.75)).toBe(1);
    expect(halfStarFill(1.5)).toBe(1);
    expect(halfStarFill(-2)).toBe(0);
  });
});

describe('StarRatingComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const queryAll = <T extends HTMLElement>(selector: string): T[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));

  const radios = () => queryAll<HTMLInputElement>('input[type="radio"]');
  const stars = () => queryAll<HTMLElement>('.ds-star-rating__star');
  const fills = () =>
    queryAll<HTMLElement>('.ds-star-rating__fill').map((fill) => fill.style.width);

  /** A click on a star is a click on its radio: checked, then `change`, natively. */
  const clickStar = (index: number) => {
    radios()[index - 1].click();
    fixture.detectChanges();
  };

  const hover = (index: number) => {
    stars()[index - 1].dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
  };

  const unhover = () => {
    query('[role="radiogroup"]')!.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
  };

  const press = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    radios()[0].dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('editable', () => {
    it('is a native radio group, one radio per star', () => {
      const group = query('[role="radiogroup"]')!;
      expect(group).toBeTruthy();
      expect(radios().length).toBe(5);
      expect(radios().every((radio) => radio.name === radios()[0].name)).toBeTrue();
      expect(radios()[2].checked).toBeTrue();
      expect(radios().filter((radio) => radio.checked).length).toBe(1);
    });

    it('names the group by its label, not with a <label for>', () => {
      const group = query('[role="radiogroup"]')!;
      const label = query('.ds-field__label')!;
      expect(label.textContent).toContain('Your rating');
      expect(label.id).toBeTruthy();
      expect(group.getAttribute('aria-labelledby')).toBe(label.id);
      expect(label.getAttribute('for')).toBeNull();
    });

    it('falls back to aria-label only when there is no visible label', () => {
      host.label.set('');
      host.ariaLabel.set('Rate this');
      fixture.detectChanges();
      expect(query('.ds-field__label')).toBeNull();
      expect(query('[role="radiogroup"]')!.getAttribute('aria-label')).toBe('Rate this');
    });

    it('gives every star a clear name', () => {
      expect(radios().map((radio) => radio.getAttribute('aria-label'))).toEqual([
        '1 star',
        '2 stars',
        '3 stars',
        '4 stars',
        '5 stars',
      ]);
    });

    it('adds the words when there are words', () => {
      host.starLabels.set(['Terrible', 'Poor', 'OK', 'Good', 'Great']);
      fixture.detectChanges();
      expect(radios()[3].getAttribute('aria-label')).toBe('4 stars, Good');
    });

    it('makes each star the label of its radio', () => {
      const labels = stars() as HTMLLabelElement[];
      expect(labels.every((label) => label.tagName === 'LABEL')).toBeTrue();
      expect(labels[1].getAttribute('for')).toBe(radios()[1].id);
    });

    it('paints whole stars up to the value', () => {
      expect(fills()).toEqual(['100%', '100%', '100%', '0%', '0%']);
    });

    it('chooses on click and reports the change', () => {
      clickStar(5);
      expect(host.value).toBe(5);
      expect(host.changes).toEqual([5]);
      expect(radios()[4].checked).toBeTrue();
      expect(fills()).toEqual(['100%', '100%', '100%', '100%', '100%']);
    });

    it('does not clear on a second click unless asked', () => {
      clickStar(3);
      expect(host.value).toBe(3);
      expect(host.changes).toEqual([]);
    });

    it('clears on a second click when clearable', () => {
      host.clearable.set(true);
      fixture.detectChanges();

      clickStar(3);
      expect(host.value).toBeNull();
      expect(host.changes).toEqual([null]);
      expect(radios().some((radio) => radio.checked)).toBeFalse();
      expect(fills()).toEqual(['0%', '0%', '0%', '0%', '0%']);
    });

    it('clears from the keyboard when clearable, and only then', () => {
      expect(press('Backspace').defaultPrevented).toBeFalse();
      expect(host.value).toBe(3);

      host.clearable.set(true);
      fixture.detectChanges();
      expect(press('Delete').defaultPrevented).toBeTrue();
      expect(host.value).toBeNull();
      expect(host.changes).toEqual([null]);
    });

    it('previews on hover, paler, and forgets on leave', () => {
      hover(5);
      expect(fills()).toEqual(['100%', '100%', '100%', '100%', '100%']);
      expect(query('.ds-star-rating__stars')!.classList).toContain('ds-star-rating__stars--previewing');
      expect(host.value).toBe(3);

      unhover();
      expect(fills()).toEqual(['100%', '100%', '100%', '0%', '0%']);
      expect(query('.ds-star-rating__stars')!.classList).not.toContain('ds-star-rating__stars--previewing');
    });

    it('reflects a model change, rounding to a whole star', () => {
      host.value = 3.7;
      fixture.detectChanges();
      expect(radios()[3].checked).toBeTrue();

      host.value = null;
      fixture.detectChanges();
      expect(radios().some((radio) => radio.checked)).toBeFalse();
    });

    it('describes the group with its hint, and an error is invalid', () => {
      host.hint.set('Tap a star.');
      host.error.set('Please rate it.');
      fixture.detectChanges();

      const group = query('[role="radiogroup"]')!;
      expect(group.getAttribute('aria-describedby')).toBe(
        `${query('.ds-field__hint')!.id} ${query('.ds-field__error')!.id}`,
      );
      expect(group.getAttribute('aria-invalid')).toBe('true');
      expect(query('.ds-star-rating__stars')!.classList).toContain('ds-star-rating__stars--invalid');
    });

    it('marks required on the group and every radio', () => {
      host.required.set(true);
      fixture.detectChanges();
      expect(query('[role="radiogroup"]')!.getAttribute('aria-required')).toBe('true');
      expect(radios().every((radio) => radio.required)).toBeTrue();
      expect(query('.ds-field__required')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('disables the radios, not just their looks, and ignores the pointer', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(radios().every((radio) => radio.disabled)).toBeTrue();

      hover(5);
      expect(fills()).toEqual(['100%', '100%', '100%', '0%', '0%']);
    });

    it('shows the value, or the word for it, next to the stars', () => {
      host.showValue.set(true);
      fixture.detectChanges();
      expect(query('.ds-star-rating__value')!.textContent!.trim()).toBe('3');
      expect(query('.ds-star-rating__value')!.getAttribute('aria-hidden')).toBe('true');

      host.starLabels.set(['Terrible', 'Poor', 'OK', 'Good', 'Great']);
      fixture.detectChanges();
      expect(query('.ds-star-rating__value')!.textContent!.trim()).toBe('OK');

      hover(5);
      expect(query('.ds-star-rating__value')!.textContent!.trim()).toBe('Great');
    });

    it('takes any number of stars', () => {
      host.max.set(10);
      host.value = 7;
      fixture.detectChanges();
      expect(radios().length).toBe(10);
      expect(radios()[6].checked).toBeTrue();
    });
  });

  describe('read-only', () => {
    beforeEach(() => {
      host.readOnly.set(true);
      host.value = 3.5;
      fixture.detectChanges();
    });

    it('is one image, with nothing to focus', () => {
      expect(query('[role="radiogroup"]')).toBeNull();
      expect(radios().length).toBe(0);
      expect(query('[role="img"]')).toBeTruthy();
      expect(stars().every((star) => star.tagName === 'SPAN')).toBeTrue();
      expect(query('label[for]')).toBeNull();
    });

    it('is named by its label and its value', () => {
      const img = query('[role="img"]')!;
      const ids = img.getAttribute('aria-labelledby')!.split(' ');
      expect(ids.length).toBe(2);
      expect(document.getElementById(ids[0])!.textContent).toContain('Your rating');
      expect(document.getElementById(ids[1])!.textContent!.trim()).toBe('3.5 of 5 stars');
    });

    it('is named by the value alone when there is no label', () => {
      host.label.set('');
      fixture.detectChanges();
      const img = query('[role="img"]')!;
      expect(img.getAttribute('aria-labelledby')).toBeNull();
      expect(img.getAttribute('aria-label')).toBe('3.5 of 5 stars');
      expect(query('.visually-hidden')).toBeNull();
    });

    it('draws half stars, and rounds anything finer', () => {
      expect(fills()).toEqual(['100%', '100%', '100%', '50%', '0%']);

      host.value = 4.8;
      fixture.detectChanges();
      expect(fills()).toEqual(['100%', '100%', '100%', '100%', '100%']);

      host.value = 2.2;
      fixture.detectChanges();
      expect(fills()).toEqual(['100%', '100%', '0%', '0%', '0%']);
    });

    it('says the words for nothing', () => {
      host.label.set('');
      host.value = null;
      fixture.detectChanges();
      expect(query('[role="img"]')!.getAttribute('aria-label')).toBe('Not rated');
      expect(fills()).toEqual(['0%', '0%', '0%', '0%', '0%']);
    });

    it('lets the consumer say what the number means', () => {
      host.label.set('');
      host.valueText.set('Rated 3.5 by 1,204 people');
      fixture.detectChanges();
      expect(query('[role="img"]')!.getAttribute('aria-label')).toBe('Rated 3.5 by 1,204 people');
    });

    it('shows the number when asked', () => {
      host.showValue.set(true);
      fixture.detectChanges();
      expect(query('.ds-star-rating__value')!.textContent!.trim()).toBe('3.5');
    });
  });

  it('takes the control scale and a tone', () => {
    host.size.set('lg');
    host.tone.set('warning');
    fixture.detectChanges();
    expect(query('.ds-field')!.classList).toContain('ds-field--lg');
    expect(query('.ds-star-rating__stars')!.classList).toContain('ds-tone--warning');
  });
});

describe('StarRatingComponent + reactive forms', () => {
  @Component({
    standalone: true,
    imports: [StarRatingComponent, ReactiveFormsModule],
    template: `<ds-star-rating label="Service" [formControl]="control" />`,
  })
  class FormHostComponent {
    readonly control = new FormControl<number | null>(4, Validators.required);
  }

  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  const radios = () =>
    Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('writes the form value into the group', () => {
    expect(radios()[3].checked).toBeTrue();
  });

  it('reports a choice back to the form, and a reset empties it', () => {
    radios()[1].click();
    fixture.detectChanges();
    expect(host.control.value).toBe(2);

    host.control.reset();
    fixture.detectChanges();
    expect(radios().some((radio) => radio.checked)).toBeFalse();
    expect(host.control.invalid).toBeTrue();
  });

  it('is disabled by the form', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(radios().every((radio) => radio.disabled)).toBeTrue();
  });

  it('marks itself touched when a star loses focus', () => {
    expect(host.control.touched).toBeFalse();
    radios()[3].dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBeTrue();
  });
});
