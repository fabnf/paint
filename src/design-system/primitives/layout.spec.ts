import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BoxComponent } from './box';
import { FlexComponent } from './flex';
import { GridComponent, GridItemComponent } from './grid';
import { StackComponent } from './stack';

/** Renders a template and returns the first element's class list. */
async function classesOf(template: string, selector: string): Promise<DOMTokenList> {
  @Component({
    standalone: true,
    imports: [BoxComponent, FlexComponent, StackComponent, GridComponent, GridItemComponent],
    template,
  })
  class HostComponent {}

  await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return (fixture.nativeElement.querySelector(selector) as HTMLElement).classList;
}

describe('layout primitives', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('BoxComponent', () => {
    it('compiles spacing tokens into Bootstrap utilities', async () => {
      const classes = await classesOf(
        `<ds-box [padding]="6" [paddingX]="4" [marginTop]="2" [paddingStart]="1.5" />`,
        'ds-box',
      );
      expect(classes).toContain('p-6');
      expect(classes).toContain('px-4');
      expect(classes).toContain('mt-2');
      expect(classes).toContain('ps-1_5');
    });

    it('compiles responsive spacing into breakpoint utilities', async () => {
      const classes = await classesOf(`<ds-box [padding]="{ base: 4, md: 10 }" />`, 'ds-box');
      expect(classes).toContain('p-4');
      expect(classes).toContain('p-md-10');
    });

    it('maps surface, radius, elevation and border tokens', async () => {
      const classes = await classesOf(
        `<ds-box background="surface" radius="lg" elevation="sm" [border]="true" [borderStrong]="true" />`,
        'ds-box',
      );
      expect(classes).toContain('bg-surface');
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('shadow-sm');
      expect(classes).toContain('border');
      expect(classes).toContain('border-strong');
    });

    it('supports a single border side', async () => {
      const classes = await classesOf(`<ds-box border="top" />`, 'ds-box');
      expect(classes).toContain('border-top');
      expect(classes).not.toContain('border');
    });

    it('emits no utility classes by default', async () => {
      const classes = await classesOf(`<ds-box />`, 'ds-box');
      expect(classes.length).toBe(0);
    });

    it('keeps consumer classes alongside generated ones', async () => {
      const classes = await classesOf(`<ds-box class="custom" [padding]="2" />`, 'ds-box');
      expect(classes).toContain('custom');
      expect(classes).toContain('p-2');
    });

    it('maps responsive display', async () => {
      const classes = await classesOf(
        `<ds-box [display]="{ base: 'none', md: 'flex' }" />`,
        'ds-box',
      );
      expect(classes).toContain('d-none');
      expect(classes).toContain('d-md-flex');
    });
  });

  describe('FlexComponent', () => {
    it('is a flex row by default', async () => {
      const classes = await classesOf(`<ds-flex />`, 'ds-flex');
      expect(classes).toContain('d-flex');
      expect(classes).toContain('flex-row');
    });

    it('maps both axes and the gap', async () => {
      const classes = await classesOf(
        `<ds-flex justify="between" align="center" [gap]="4" [wrap]="'wrap'" />`,
        'ds-flex',
      );
      expect(classes).toContain('justify-content-between');
      expect(classes).toContain('align-items-center');
      expect(classes).toContain('gap-4');
      expect(classes).toContain('flex-wrap');
    });

    it('supports responsive direction', async () => {
      const classes = await classesOf(
        `<ds-flex [direction]="{ base: 'column', md: 'row' }" />`,
        'ds-flex',
      );
      expect(classes).toContain('flex-column');
      expect(classes).toContain('flex-md-row');
    });

    it('renders inline-flex on request', async () => {
      const classes = await classesOf(`<ds-flex [inline]="true" />`, 'ds-flex');
      expect(classes).toContain('d-inline-flex');
      expect(classes).not.toContain('d-flex');
    });

    it('strips the legacy align attribute from the DOM', async () => {
      @Component({ standalone: true, imports: [FlexComponent], template: `<ds-flex align="center" />` })
      class HostComponent {}

      await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement.querySelector('ds-flex');
      expect(el.hasAttribute('align')).toBeFalse();
      expect(el.classList).toContain('align-items-center');
    });
  });

  describe('StackComponent', () => {
    it('uses Bootstrap’s vstack with a default gap', async () => {
      const classes = await classesOf(`<ds-stack />`, 'ds-stack');
      expect(classes).toContain('vstack');
      expect(classes).toContain('gap-4');
    });

    it('uses hstack when horizontal', async () => {
      const classes = await classesOf(`<ds-stack orientation="horizontal" [gap]="2" />`, 'ds-stack');
      expect(classes).toContain('hstack');
      expect(classes).toContain('gap-2');
      expect(classes).not.toContain('vstack');
    });

    it('marks dividers and exposes the gap as the divider offset', async () => {
      @Component({
        standalone: true,
        imports: [StackComponent],
        template: `<ds-stack [gap]="6" [divided]="true" />`,
      })
      class HostComponent {}

      await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement.querySelector('ds-stack');
      expect(el.classList).toContain('ds-stack--divided');
      expect(el.style.getPropertyValue('--ds-stack-divider-offset')).toBe('var(--ds-space-6)');
    });

    it('supports responsive gaps', async () => {
      const classes = await classesOf(`<ds-stack [gap]="{ base: 2, lg: 8 }" />`, 'ds-stack');
      expect(classes).toContain('gap-2');
      expect(classes).toContain('gap-lg-8');
    });
  });

  describe('GridComponent', () => {
    it('renders a Bootstrap row with a gutter', async () => {
      const classes = await classesOf(`<ds-grid />`, 'ds-grid');
      expect(classes).toContain('row');
      expect(classes).toContain('g-4');
    });

    it('maps responsive equal tracks', async () => {
      const classes = await classesOf(`<ds-grid [cols]="{ base: 1, lg: 4 }" />`, 'ds-grid');
      expect(classes).toContain('row-cols-1');
      expect(classes).toContain('row-cols-lg-4');
    });

    it('lets axis gutters replace the shared gap', async () => {
      const classes = await classesOf(`<ds-grid [columnGap]="6" [rowGap]="10" />`, 'ds-grid');
      expect(classes).toContain('gx-6');
      expect(classes).toContain('gy-10');
      expect(classes).not.toContain('g-4');
    });
  });

  describe('GridItemComponent', () => {
    it('takes an equal share by default', async () => {
      const classes = await classesOf(`<ds-grid><ds-grid-item /></ds-grid>`, 'ds-grid-item');
      expect(classes).toContain('col');
    });

    it('maps responsive spans, offsets and order', async () => {
      const classes = await classesOf(
        `<ds-grid><ds-grid-item [span]="{ base: 12, md: 8 }" [offset]="2" [order]="'last'" /></ds-grid>`,
        'ds-grid-item',
      );
      expect(classes).toContain('col-12');
      expect(classes).toContain('col-md-8');
      expect(classes).toContain('offset-2');
      expect(classes).toContain('order-last');
    });
  });
});
