import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RatingSummaryComponent } from './rating-summary.component';

@Component({
  standalone: true,
  imports: [RatingSummaryComponent],
  template: `
    <ds-rating-summary
      [value]="value()"
      [max]="max()"
      [count]="count()"
      [precision]="precision()"
      [showScore]="showScore()"
      [valueText]="valueText()"
      [emptyText]="emptyText()"
      [reviewsHref]="reviewsHref()"
      [size]="size()"
      [tone]="tone()"
    />
  `,
})
class HostComponent {
  readonly value = signal<number | null>(4.3);
  readonly max = signal(5);
  readonly count = signal<number | null>(1204);
  readonly precision = signal(1);
  readonly showScore = signal(true);
  readonly valueText = signal('');
  readonly emptyText = signal('No reviews yet');
  readonly reviewsHref = signal<string | null>(null);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly tone = signal<'primary' | 'warning'>('primary');
}

describe('RatingSummaryComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);
  const spoken = () => query('.visually-hidden')!.textContent!.trim();
  const visual = () => query('.ds-rating-summary__visual')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('says the whole thing once, and hides the parts', () => {
    expect(spoken()).toBe('4.3 out of 5 stars, 1,204 reviews');
    expect(visual().getAttribute('aria-hidden')).toBe('true');
    // The parts are inside the hidden paint, not beside it.
    expect(visual().querySelector('ds-star-rating')).toBeTruthy();
    expect(visual().querySelector('.ds-rating-summary__score')!.textContent!.trim()).toBe('4.3');
    expect(visual().querySelector('.ds-rating-summary__count')!.textContent!.trim()).toBe('1,204 reviews');
    expect(fixture.nativeElement.querySelectorAll('.visually-hidden').length).toBe(1);
  });

  it('draws read-only stars with the average, half stars and all', () => {
    const fills = Array.from(fixture.nativeElement.querySelectorAll('.ds-star-rating__fill')) as HTMLElement[];
    expect(fills.map((fill) => fill.style.width)).toEqual(['100%', '100%', '100%', '100%', '50%']);
    expect(fixture.nativeElement.querySelector('input[type="radio"]')).toBeNull();
  });

  it('writes the score with the asked precision', () => {
    host.precision.set(2);
    fixture.detectChanges();
    expect(spoken()).toBe('4.30 out of 5 stars, 1,204 reviews');

    host.precision.set(0);
    host.value.set(4.6);
    fixture.detectChanges();
    expect(query('.ds-rating-summary__score')!.textContent!.trim()).toBe('5');
  });

  it('counts one review in the singular, and leaves the count out when there is none', () => {
    host.count.set(1);
    fixture.detectChanges();
    expect(spoken()).toBe('4.3 out of 5 stars, 1 review');

    host.count.set(null);
    fixture.detectChanges();
    expect(spoken()).toBe('4.3 out of 5 stars');
    expect(query('.ds-rating-summary__count')).toBeNull();
  });

  it('can keep the stars and lose the number', () => {
    host.showScore.set(false);
    fixture.detectChanges();
    expect(query('.ds-rating-summary__score')).toBeNull();
    expect(spoken()).toBe('4.3 out of 5 stars, 1,204 reviews');
  });

  it('says the words for nothing', () => {
    host.value.set(null);
    host.count.set(0);
    fixture.detectChanges();
    expect(spoken()).toBe('No reviews yet');
    expect(query('.ds-rating-summary__score')).toBeNull();
    expect(visual().textContent).toContain('No reviews yet');
    expect(visual().textContent).not.toContain('0 reviews');
  });

  it('lets the consumer say the sentence', () => {
    host.valueText.set('Rated Excellent by 1,204 guests');
    fixture.detectChanges();
    expect(spoken()).toBe('Rated Excellent by 1,204 guests');
  });

  describe('with a link to the reviews', () => {
    beforeEach(() => {
      host.reviewsHref.set('#reviews');
      fixture.detectChanges();
    });

    it('renders the count as a real link, outside the hidden paint', () => {
      const anchor = query<HTMLAnchorElement>('a')!;
      expect(anchor.getAttribute('href')).toBe('#reviews');
      expect(anchor.textContent).toContain('1,204 reviews');
      expect(anchor.closest('[aria-hidden="true"]')).toBeNull();
      expect(visual().querySelector('.ds-rating-summary__count')).toBeNull();
    });

    it('leaves the count out of the sentence, because the link says it', () => {
      expect(spoken()).toBe('4.3 out of 5 stars');
    });
  });

  it('takes the control scale and a tone', () => {
    host.size.set('lg');
    host.tone.set('warning');
    fixture.detectChanges();
    expect(query('.ds-rating-summary')!.classList).toContain('ds-rating-summary--lg');
    expect(query('.ds-star-rating__stars')!.classList).toContain('ds-tone--warning');
    expect(query('ds-star-rating .ds-field')!.classList).toContain('ds-field--lg');
  });
});