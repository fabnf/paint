import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <ds-button
      [variant]="variant"
      [size]="size"
      [disabled]="disabled"
      [loading]="loading"
      [iconStart]="iconStart"
      [label]="label"
      [href]="href"
      [link]="link"
      [fullWidth]="fullWidth"
      (clicked)="clicks = clicks + 1"
    >
      Save
    </ds-button>
  `,
})
class HostComponent {
  variant: 'primary' | 'ghost' | 'danger' | 'link' = 'primary';
  size: 'sm' | 'md' | 'lg' = 'md';
  disabled = false;
  loading = false;
  iconStart: 'plus' | null = null;
  label = '';
  href: string | null = null;
  link: string | null = null;
  fullWidth = false;
  clicks = 0;
}

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T extends HTMLElement>(selector: string): T | null =>
    fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a native button with Bootstrap classes', () => {
    const button = query<HTMLButtonElement>('button');
    expect(button).toBeTruthy();
    expect(button!.classList).toContain('btn');
    expect(button!.classList).toContain('btn-primary');
    expect(button!.textContent).toContain('Save');
  });

  it('maps variants onto Bootstrap button classes', () => {
    host.variant = 'danger';
    fixture.detectChanges();
    expect(query('button')!.classList).toContain('btn-danger');

    host.variant = 'link';
    fixture.detectChanges();
    expect(query('button')!.classList).toContain('btn-link');
  });

  it('maps the ghost variant onto Paint’s Bootstrap extension', () => {
    host.variant = 'ghost';
    fixture.detectChanges();
    expect(query('button')!.classList).toContain('btn-ghost');
  });

  it('maps sizes onto Bootstrap size classes', () => {
    host.size = 'sm';
    fixture.detectChanges();
    expect(query('button')!.classList).toContain('btn-sm');

    host.size = 'lg';
    fixture.detectChanges();
    expect(query('button')!.classList).toContain('btn-lg');

    host.size = 'md';
    fixture.detectChanges();
    expect(query('button')!.classList).not.toContain('btn-sm');
    expect(query('button')!.classList).not.toContain('btn-lg');
  });

  it('emits clicked', () => {
    query<HTMLButtonElement>('button')!.click();
    expect(host.clicks).toBe(1);
  });

  it('does not emit when disabled', () => {
    host.disabled = true;
    fixture.detectChanges();

    query<HTMLButtonElement>('button')!.click();
    expect(host.clicks).toBe(0);
    expect(query<HTMLButtonElement>('button')!.disabled).toBeTrue();
  });

  it('shows a spinner, blocks clicks and marks itself busy while loading', () => {
    host.loading = true;
    host.iconStart = 'plus';
    fixture.detectChanges();

    expect(query('.spinner-border')).toBeTruthy();
    expect(query('ds-icon')).toBeNull();
    expect(query('button')!.getAttribute('aria-busy')).toBe('true');

    query<HTMLButtonElement>('button')!.click();
    expect(host.clicks).toBe(0);
  });

  it('renders icon + label by default', () => {
    host.iconStart = 'plus';
    fixture.detectChanges();

    expect(query('ds-icon')).toBeTruthy();
    expect(query('.ds-button__label')).toBeTruthy();
  });

  it('renders icon-only with an accessible name when a label is given', () => {
    host.iconStart = 'plus';
    host.label = 'New file';
    fixture.detectChanges();

    const button = query<HTMLButtonElement>('button')!;
    expect(button.getAttribute('aria-label')).toBe('New file');
    expect(button.classList).toContain('btn--icon-only');
    expect(query('.ds-button__label')).toBeNull();
  });

  it('renders an anchor when href is set', () => {
    host.href = 'https://getbootstrap.com';
    fixture.detectChanges();

    const anchor = query<HTMLAnchorElement>('a');
    expect(anchor).toBeTruthy();
    expect(anchor!.classList).toContain('btn');
    expect(anchor!.getAttribute('href')).toBe('https://getbootstrap.com');
    expect(query('button')).toBeNull();
  });

  it('renders a router-driven anchor when link is set', () => {
    host.link = '/foundations';
    fixture.detectChanges();

    const anchor = query<HTMLAnchorElement>('a');
    expect(anchor).toBeTruthy();
    expect(anchor!.getAttribute('href')).toBe('/foundations');
  });

  it('never puts a second tab stop on the host', () => {
    host.link = '/foundations';
    fixture.detectChanges();

    // An input named `routerLink` would make Angular apply RouterLink to the
    // host element too, which sets tabindex="0" on a roleless wrapper.
    const hostEl: HTMLElement = fixture.nativeElement.querySelector('ds-button');
    expect(hostEl.hasAttribute('tabindex')).toBeFalse();
    expect(hostEl.hasAttribute('routerlink')).toBeFalse();
  });

  it('marks disabled links as disabled instead of dropping them', () => {
    host.href = 'https://getbootstrap.com';
    host.disabled = true;
    fixture.detectChanges();

    const anchor = query<HTMLAnchorElement>('a')!;
    expect(anchor.classList).toContain('disabled');
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('href')).toBeNull();
  });

  it('stretches with fullWidth', () => {
    host.fullWidth = true;
    fixture.detectChanges();
    expect(query('button')!.classList).toContain('w-100');
  });
});
