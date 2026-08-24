import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TextComponent, type TextElement, type TextTone, type TextVariant } from './text.component';

@Component({
  standalone: true,
  imports: [TextComponent],
  template: `
    <ds-text
      [variant]="variant"
      [as]="element"
      [tone]="tone"
      [truncate]="truncate"
      [lineClamp]="lineClamp"
      [align]="align"
    >
      Tokens
    </ds-text>
  `,
})
class HostComponent {
  variant: TextVariant = 'body';
  element: TextElement | null = null;
  tone: TextTone = 'default';
  truncate = false;
  lineClamp: number | null = null;
  align: 'start' | 'center' | 'end' | { base?: 'start' | 'center' | 'end'; md?: 'start' | 'center' | 'end' } | null =
    null;
}

describe('TextComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const inner = (): HTMLElement => fixture.nativeElement.querySelector('ds-text').firstElementChild;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders body copy as a paragraph and projects its content', () => {
    expect(inner().tagName).toBe('P');
    expect(inner().textContent).toContain('Tokens');
  });

  it('picks a semantic element per variant', () => {
    const cases: ReadonlyArray<[TextVariant, string]> = [
      ['display', 'H1'],
      ['h1', 'H1'],
      ['h2', 'H2'],
      ['h3', 'H3'],
      ['h4', 'H4'],
      // A type style named "label" must not claim an unbound <label>.
      ['label', 'SPAN'],
      ['caption', 'SPAN'],
      ['code', 'CODE'],
    ];

    for (const [variant, tag] of cases) {
      host.variant = variant;
      fixture.detectChanges();
      expect(inner().tagName).toBe(tag);
      // Content must survive switching elements.
      expect(inner().textContent).toContain('Tokens');
    }
  });

  it('maps variants onto Bootstrap typography classes', () => {
    host.variant = 'h2';
    fixture.detectChanges();
    expect(inner().classList).toContain('h2');

    host.variant = 'display';
    fixture.detectChanges();
    expect(inner().classList).toContain('display-5');

    host.variant = 'bodyLg';
    fixture.detectChanges();
    expect(inner().classList).toContain('lead');

    host.variant = 'bodySm';
    fixture.detectChanges();
    expect(inner().classList).toContain('small');
  });

  it('renders a real label only when asked', () => {
    host.variant = 'label';
    host.element = 'label';
    fixture.detectChanges();

    expect(inner().tagName).toBe('LABEL');
  });

  it('decouples the visual level from the element', () => {
    host.variant = 'h1';
    host.element = 'p';
    fixture.detectChanges();

    expect(inner().tagName).toBe('P');
    expect(inner().classList).toContain('h1');
  });

  it('maps tones onto Bootstrap color utilities', () => {
    host.tone = 'muted';
    fixture.detectChanges();
    expect(inner().classList).toContain('text-body-secondary');

    host.tone = 'danger';
    fixture.detectChanges();
    expect(inner().classList).toContain('text-danger');
  });

  it('truncates on a single line', () => {
    host.truncate = true;
    fixture.detectChanges();
    expect(inner().classList).toContain('text-truncate');
  });

  it('prefers line clamping over truncation', () => {
    host.truncate = true;
    host.lineClamp = 3;
    fixture.detectChanges();

    expect(inner().classList).toContain('ds-text--clamp');
    expect(inner().classList).not.toContain('text-truncate');
  });

  it('supports responsive alignment', () => {
    host.align = { base: 'start', md: 'center' };
    fixture.detectChanges();

    expect(inner().classList).toContain('text-start');
    expect(inner().classList).toContain('text-md-center');
  });

  it('never leaves a legacy align attribute on the host', () => {
    host.align = 'center';
    fixture.detectChanges();

    const hostEl: HTMLElement = fixture.nativeElement.querySelector('ds-text');
    expect(hostEl.hasAttribute('align')).toBeFalse();
  });
});
