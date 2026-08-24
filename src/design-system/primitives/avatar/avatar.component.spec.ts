import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { AvatarComponent, initialsFrom, toneIndexFrom, type AvatarStatus } from './avatar.component';

@Component({
  standalone: true,
  imports: [AvatarComponent],
  template: `
    <ds-avatar
      [name]="name()"
      [src]="src()"
      [alt]="alt()"
      [size]="size()"
      [shape]="shape()"
      [status]="status()"
      [statusLabel]="statusLabel()"
      [decorative]="decorative()"
    />
  `,
})
class HostComponent {
  readonly name = signal('Ada Lovelace');
  readonly src = signal<string | null>(null);
  readonly alt = signal('');
  readonly size = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly shape = signal<'circle' | 'square'>('circle');
  readonly status = signal<AvatarStatus | null>(null);
  readonly statusLabel = signal('');
  readonly decorative = signal(false);
}

describe('initialsFrom', () => {
  it('takes the first letter of the first and last words', () => {
    expect(initialsFrom('Ada Lovelace')).toBe('AL');
    expect(initialsFrom('Grace Brewster Murray Hopper')).toBe('GH');
  });

  it('takes one letter from one word', () => {
    expect(initialsFrom('Paint')).toBe('P');
  });

  it('survives padding, empties and astral glyphs', () => {
    expect(initialsFrom('   ')).toBe('');
    expect(initialsFrom('  ada   lovelace ')).toBe('AL');
    // A surrogate pair is one letter, not two halves of one.
    expect(initialsFrom('🎨 Paint')).toBe('🎨P');
  });
});

describe('toneIndexFrom', () => {
  it('is stable for a name', () => {
    expect(toneIndexFrom('Ada Lovelace')).toBe(toneIndexFrom('Ada Lovelace'));
  });

  it('stays inside the palette', () => {
    for (const name of ['a', 'Ada', 'Grace Hopper', 'Katherine Johnson', '🎨']) {
      expect(toneIndexFrom(name)).toBeGreaterThanOrEqual(0);
      expect(toneIndexFrom(name)).toBeLessThan(6);
    }
  });
});

describe('AvatarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  const avatar = () => query<HTMLElement>('.ds-avatar')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('falls back to initials, named as an image', () => {
    expect(query('.ds-avatar__initials')!.textContent!.trim()).toBe('AL');
    expect(avatar().getAttribute('role')).toBe('img');
    expect(avatar().getAttribute('aria-label')).toBe('Ada Lovelace');
    // The glyphs are the picture, not the name.
    expect(query('.ds-avatar__initials')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('tints itself from the name, from the shared tone palette', () => {
    const first = avatar().className;
    host.name.set('Grace Hopper');
    fixture.detectChanges();

    expect(avatar().className).not.toBe(first);
    expect(avatar().className).toMatch(/ds-tone--(primary|accent|success|warning|danger|info)/);
  });

  it('stays neutral when there is no name to tint from', () => {
    host.name.set('');
    fixture.detectChanges();

    expect(avatar().classList).toContain('ds-tone--neutral');
    expect(query('ds-icon')).toBeTruthy();
  });

  it('says nothing when it has nothing to say', () => {
    host.name.set('');
    fixture.detectChanges();

    // A role="img" with an empty name announces itself as "image, blank".
    expect(avatar().getAttribute('role')).toBeNull();
    expect(avatar().getAttribute('aria-hidden')).toBe('true');
  });

  it('says nothing when it has nothing to say', () => {
    host.name.set('');
    fixture.detectChanges();

    // A role="img" with an empty name announces itself as "image, blank".
    expect(avatar().getAttribute('role')).toBeNull();
    expect(avatar().getAttribute('aria-hidden')).toBe('true');
  });

  it('renders an image with the name as its alt text', () => {
    host.src.set('/ada.jpg');
    fixture.detectChanges();

    const image = query<HTMLImageElement>('img')!;
    expect(image.getAttribute('alt')).toBe('Ada Lovelace');
    // The wrapper must not also be an img: one picture, one accessible name.
    expect(avatar().getAttribute('role')).toBeNull();
  });

  it('falls back to initials when the image fails', () => {
    host.src.set('/missing.jpg');
    fixture.detectChanges();

    query<HTMLImageElement>('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(query('img')).toBeNull();
    expect(query('.ds-avatar__initials')!.textContent!.trim()).toBe('AL');
  });

  it('prefers an explicit alt over the name', () => {
    host.alt.set('Portrait of Ada Lovelace, 1840');
    fixture.detectChanges();
    expect(avatar().getAttribute('aria-label')).toBe('Portrait of Ada Lovelace, 1840');
  });

  it('folds presence into the one accessible name', () => {
    host.status.set('online');
    fixture.detectChanges();

    expect(avatar().getAttribute('aria-label')).toBe('Ada Lovelace, Online');
    expect(query('.ds-avatar__status')!.getAttribute('aria-hidden')).toBe('true');

    host.statusLabel.set('In a meeting');
    fixture.detectChanges();
    expect(avatar().getAttribute('aria-label')).toBe('Ada Lovelace, In a meeting');
  });

  it('disappears from the accessibility tree when it is decoration', () => {
    host.decorative.set(true);
    fixture.detectChanges();

    expect(avatar().getAttribute('aria-hidden')).toBe('true');
    expect(avatar().getAttribute('role')).toBeNull();
    expect(avatar().getAttribute('aria-label')).toBeNull();
  });

  it('gives a decorative image an empty alt rather than no alt', () => {
    host.src.set('/ada.jpg');
    host.decorative.set(true);
    fixture.detectChanges();

    expect(query<HTMLImageElement>('img')!.getAttribute('alt')).toBe('');
  });

  it('maps size and shape onto classes', () => {
    host.size.set('xl');
    host.shape.set('square');
    fixture.detectChanges();

    expect(avatar().classList).toContain('ds-avatar--xl');
    expect(avatar().classList).toContain('ds-avatar--square');
  });
});
