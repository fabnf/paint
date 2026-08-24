import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import {
  DividerComponent,
  type DividerOrientation,
  type DividerVariant,
} from './divider.component';
import type { SpaceValue } from '../primitives.types';

@Component({
  standalone: true,
  imports: [DividerComponent],
  template: `
    <ds-divider
      [orientation]="orientation()"
      [variant]="variant()"
      [label]="label()"
      [spacing]="spacing()"
      [decorative]="decorative()"
    />
  `,
})
class HostComponent {
  readonly orientation = signal<DividerOrientation>('horizontal');
  readonly variant = signal<DividerVariant>('solid');
  readonly label = signal('');
  readonly spacing = signal<SpaceValue>(4);
  readonly decorative = signal(false);
}

describe('DividerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const divider = () => fixture.nativeElement.querySelector('ds-divider') as HTMLElement;
  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a separator, and says which way it runs', () => {
    expect(divider().getAttribute('role')).toBe('separator');
    // aria-orientation defaults to horizontal; saying so adds nothing.
    expect(divider().hasAttribute('aria-orientation')).toBeFalse();

    host.orientation.set('vertical');
    fixture.detectChanges();
    expect(divider().getAttribute('aria-orientation')).toBe('vertical');
  });

  it('says nothing at all when it is decoration', () => {
    host.decorative.set(true);
    fixture.detectChanges();

    expect(divider().getAttribute('role')).toBe('none');
    expect(divider().getAttribute('aria-hidden')).toBe('true');
  });

  it('spaces itself on the axis it cuts across', () => {
    expect(divider().style.marginBlock).toBe('var(--ds-space-4)');
    expect(divider().style.marginInline).toBe('');

    host.orientation.set('vertical');
    host.spacing.set(2);
    fixture.detectChanges();
    expect(divider().style.marginInline).toBe('var(--ds-space-2)');
    expect(divider().style.marginBlock).toBe('');
  });

  it('takes the line style from a variant, as a custom property', () => {
    expect(divider().style.getPropertyValue('--ds-divider-style')).toBe('solid');

    host.variant.set('dashed');
    fixture.detectChanges();
    expect(divider().style.getPropertyValue('--ds-divider-style')).toBe('dashed');
  });

  it('names itself after its label, and hides the word it draws', () => {
    host.label.set('or');
    fixture.detectChanges();

    expect(divider().classList).toContain('ds-divider--labelled');
    expect(divider().getAttribute('aria-label')).toBe('or');
    // A separator's children are presentational: the visible text would be
    // dropped, so it is hidden and the name carries it instead.
    expect(query('.ds-divider__label')!.getAttribute('aria-hidden')).toBe('true');
    expect(query('.ds-divider__label')!.textContent!.trim()).toBe('or');
  });

  it('refuses to put a word inside a 1px vertical rule', () => {
    host.label.set('or');
    host.orientation.set('vertical');
    fixture.detectChanges();

    expect(query('.ds-divider__label')).toBeNull();
    expect(divider().getAttribute('aria-label')).toBeNull();
  });

  it('never names a decorative rule', () => {
    host.label.set('or');
    host.decorative.set(true);
    fixture.detectChanges();

    expect(divider().getAttribute('aria-label')).toBeNull();
    expect(divider().getAttribute('aria-hidden')).toBe('true');
  });
});
