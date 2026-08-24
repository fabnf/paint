import { TestBed } from '@angular/core/testing';
import { TOAST_CONFIG, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({
      providers: [{ provide: TOAST_CONFIG, useValue: { duration: 1000, limit: 3 } }],
    });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('queues a toast with the configured defaults', () => {
    const id = service.show({ title: 'Saved' });

    expect(service.count()).toBe(1);
    expect(service.toasts()[0]).toEqual(
      jasmine.objectContaining({ id, title: 'Saved', variant: 'info', duration: 1000, dismissible: true }),
    );
  });

  it('keeps toasts oldest first', () => {
    service.show({ title: 'One' });
    service.show({ title: 'Two' });

    expect(service.toasts().map((toast) => toast.title)).toEqual(['One', 'Two']);
  });

  it('auto-dismisses once the duration elapses', () => {
    service.show({ title: 'Saved' });

    jasmine.clock().tick(999);
    expect(service.count()).toBe(1);

    jasmine.clock().tick(2);
    expect(service.count()).toBe(0);
  });

  it('keeps a toast with duration 0 until it is dismissed', () => {
    const id = service.show({ title: 'Rendering', duration: 0 });

    jasmine.clock().tick(60_000);
    expect(service.count()).toBe(1);

    service.dismiss(id);
    expect(service.count()).toBe(0);
  });

  it('drops the oldest toast past the limit', () => {
    service.show({ title: 'One' });
    service.show({ title: 'Two' });
    service.show({ title: 'Three' });
    service.show({ title: 'Four' });

    expect(service.count()).toBe(3);
    expect(service.toasts().map((toast) => toast.title)).toEqual(['Two', 'Three', 'Four']);
  });

  it('does not leave a timer behind for a dropped toast', () => {
    const first = service.show({ title: 'One' });
    service.show({ title: 'Two' });
    service.show({ title: 'Three' });
    service.show({ title: 'Four' });

    // The dropped toast's timer must not dismiss an unrelated toast later.
    jasmine.clock().tick(1001);
    expect(service.count()).toBe(0);
    expect(service.toasts().find((toast) => toast.id === first)).toBeUndefined();
  });

  it('pauses and resumes a countdown', () => {
    const id = service.show({ title: 'Saved' });

    jasmine.clock().tick(800);
    service.pause(id);
    jasmine.clock().tick(5000);
    expect(service.count()).toBe(1);

    service.resume(id);
    jasmine.clock().tick(1001);
    expect(service.count()).toBe(0);
  });

  it('clears everything', () => {
    service.show({ title: 'One' });
    service.show({ title: 'Two', duration: 0 });
    service.clear();

    expect(service.count()).toBe(0);
  });

  it('offers shorthands for the status variants', () => {
    // Three at a time: the configured limit is 3.
    service.success('Saved');
    service.info('FYI');
    service.warning('Careful');

    expect(service.toasts().map((toast) => toast.variant)).toEqual(['success', 'info', 'warning']);

    service.clear();
    service.danger('Failed', { description: 'Try again' });

    expect(service.toasts()[0]).toEqual(
      jasmine.objectContaining({ variant: 'danger', title: 'Failed', description: 'Try again' }),
    );
  });

  it('ignores a dismiss for an unknown id', () => {
    service.show({ title: 'Saved' });
    service.dismiss(9999);

    expect(service.count()).toBe(1);
  });
});
