import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FileDropzoneComponent } from './file-dropzone.component';
import type { FileRejection } from './file-upload.types';

@Component({
  standalone: true,
  imports: [FileDropzoneComponent],
  template: `
    <ds-file-dropzone
      [accept]="accept()"
      [multiple]="multiple()"
      [disabled]="disabled()"
      [maxSize]="maxSize()"
      [maxFiles]="maxFiles()"
      hint="Images or PDF, up to 10 MB."
      (filesAdded)="added.push($event)"
      (filesRejected)="rejected.push($event)"
    />
  `,
})
class HostComponent {
  readonly accept = signal('');
  readonly multiple = signal(true);
  readonly disabled = signal(false);
  readonly maxSize = signal<number | null>(null);
  readonly maxFiles = signal<number | null>(null);
  added: File[][] = [];
  rejected: FileRejection[][] = [];
}

const makeFile = (name: string, type = 'text/plain', size = 10): File =>
  new File([new Uint8Array(size)], name, { type });

const dragEvent = (type: string, files: File[] = []): DragEvent => {
  const transfer = new DataTransfer();
  for (const file of files) {
    transfer.items.add(file);
  }
  return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer });
};

describe('FileDropzoneComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const zone = (): HTMLElement => fixture.nativeElement.querySelector('.ds-dropzone');
  const input = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.ds-dropzone__input');
  const dispatch = (event: Event) => {
    zone().dispatchEvent(event);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a real file input with a name and a description', () => {
    expect(input().type).toBe('file');
    expect(input().multiple).toBeTrue();

    const labelId = input().getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelId)!.textContent).toContain('Drag and drop');

    const hintId = input().getAttribute('aria-describedby')!;
    expect(document.getElementById(hintId)!.textContent).toContain('up to 10 MB');
  });

  it('forwards accept and multiple to the native input', () => {
    host.accept.set('image/*,.pdf');
    host.multiple.set(false);
    fixture.detectChanges();

    expect(input().getAttribute('accept')).toBe('image/*,.pdf');
    expect(input().multiple).toBeFalse();
  });

  it('emits picked files and clears the control for a repeat pick', () => {
    const transfer = new DataTransfer();
    transfer.items.add(makeFile('a.txt'));
    input().files = transfer.files;

    input().dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.added.length).toBe(1);
    expect(host.added[0].map((f) => f.name)).toEqual(['a.txt']);
    expect(input().value).toBe('');
  });

  it('lights up while a drag hovers, through nested enters and leaves', () => {
    dispatch(dragEvent('dragenter'));
    dispatch(dragEvent('dragenter')); // a child fired its own
    expect(zone().classList).toContain('ds-dropzone--dragging');

    dispatch(dragEvent('dragleave'));
    expect(zone().classList).toContain('ds-dropzone--dragging');

    dispatch(dragEvent('dragleave'));
    expect(zone().classList).not.toContain('ds-dropzone--dragging');
  });

  it('accepts a drop and settles back down', () => {
    dispatch(dragEvent('dragenter'));
    dispatch(dragEvent('drop', [makeFile('a.txt'), makeFile('b.txt')]));

    expect(zone().classList).not.toContain('ds-dropzone--dragging');
    expect(host.added.length).toBe(1);
    expect(host.added[0].map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
    expect(host.rejected).toEqual([]);
  });

  it('prevents the browser from navigating to the file', () => {
    const over = dragEvent('dragover');
    dispatch(over);
    expect(over.defaultPrevented).toBeTrue();

    const drop = dragEvent('drop', [makeFile('a.txt')]);
    dispatch(drop);
    expect(drop.defaultPrevented).toBeTrue();
  });

  it('screens dropped files by accept — the picker never saw them', () => {
    host.accept.set('image/*');
    fixture.detectChanges();

    dispatch(dragEvent('drop', [makeFile('photo.png', 'image/png'), makeFile('notes.txt')]));

    expect(host.added[0].map((f) => f.name)).toEqual(['photo.png']);
    expect(host.rejected[0]).toEqual([jasmine.objectContaining({ reason: 'type' })]);
    expect(host.rejected[0][0].file.name).toBe('notes.txt');
  });

  it('screens by size', () => {
    host.maxSize.set(100);
    fixture.detectChanges();

    dispatch(dragEvent('drop', [makeFile('small.txt', 'text/plain', 50), makeFile('big.txt', 'text/plain', 200)]));

    expect(host.added[0].map((f) => f.name)).toEqual(['small.txt']);
    expect(host.rejected[0][0].reason).toBe('size');
  });

  it('caps the count, and single mode means one', () => {
    host.multiple.set(false);
    fixture.detectChanges();

    dispatch(dragEvent('drop', [makeFile('a.txt'), makeFile('b.txt'), makeFile('c.txt')]));

    expect(host.added[0].map((f) => f.name)).toEqual(['a.txt']);
    expect(host.rejected[0].map((r) => r.reason)).toEqual(['count', 'count']);
  });

  it('emits nothing it does not have: no empty arrays, ever', () => {
    dispatch(dragEvent('drop', [makeFile('a.txt')]));

    expect(host.added.length).toBe(1);
    expect(host.rejected.length).toBe(0);
  });

  it('goes quiet when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(input().disabled).toBeTrue();

    dispatch(dragEvent('dragenter'));
    expect(zone().classList).not.toContain('ds-dropzone--dragging');

    dispatch(dragEvent('drop', [makeFile('a.txt')]));
    expect(host.added).toEqual([]);
    expect(host.rejected).toEqual([]);
  });
});
