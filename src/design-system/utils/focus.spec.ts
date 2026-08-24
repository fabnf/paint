import { firstEnabledIndex, focusableWithin, rovingIndex, trapTab } from './focus';
import { uniqueId } from './unique-id';

describe('rovingIndex', () => {
  const never = () => false;

  it('steps forward and wraps', () => {
    expect(rovingIndex(3, 0, 1, never)).toBe(1);
    expect(rovingIndex(3, 2, 1, never)).toBe(0);
  });

  it('steps backward and wraps', () => {
    expect(rovingIndex(3, 1, -1, never)).toBe(0);
    expect(rovingIndex(3, 0, -1, never)).toBe(2);
  });

  it('starts at the first item when nothing is active', () => {
    expect(rovingIndex(3, -1, 1, never)).toBe(0);
  });

  it('skips disabled items', () => {
    const disabled = (index: number) => index === 1;
    expect(rovingIndex(3, 0, 1, disabled)).toBe(2);
  });

  it('returns -1 when every item is disabled', () => {
    expect(rovingIndex(3, 0, 1, () => true)).toBe(-1);
  });

  it('returns -1 for an empty list', () => {
    expect(rovingIndex(0, -1, 1, never)).toBe(-1);
  });
});

describe('firstEnabledIndex', () => {
  it('finds the first enabled item', () => {
    expect(firstEnabledIndex(4, (index) => index < 2)).toBe(2);
  });

  it('scans backward for the last enabled item', () => {
    expect(firstEnabledIndex(4, (index) => index > 1, -1)).toBe(1);
  });

  it('returns -1 when nothing is enabled', () => {
    expect(firstEnabledIndex(3, () => true)).toBe(-1);
  });
});

describe('focusableWithin / trapTab', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.tabIndex = -1;
    container.innerHTML = `
      <button id="a">a</button>
      <input id="b" />
      <button id="c" disabled>c</button>
      <a id="d" href="#">d</a>
      <div id="e" tabindex="-1">e</div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('collects tabbable elements in DOM order, skipping disabled and tabindex=-1', () => {
    expect(focusableWithin(container).map((el) => el.id)).toEqual(['a', 'b', 'd']);
  });

  it('ignores keys other than Tab', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    expect(trapTab(container, event)).toBeFalse();
  });

  it('wraps forward from the last element', () => {
    document.getElementById('d')!.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });

    expect(trapTab(container, event)).toBeTrue();
    expect(event.defaultPrevented).toBeTrue();
    expect(document.activeElement!.id).toBe('a');
  });

  it('wraps backward from the first element', () => {
    document.getElementById('a')!.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });

    expect(trapTab(container, event)).toBeTrue();
    expect(document.activeElement!.id).toBe('d');
  });

  it('leaves Tab alone in the middle of the list', () => {
    document.getElementById('b')!.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });

    expect(trapTab(container, event)).toBeFalse();
    expect(event.defaultPrevented).toBeFalse();
  });

  it('holds focus on the container when nothing inside is focusable', () => {
    container.innerHTML = '<span>nothing</span>';
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });

    expect(trapTab(container, event)).toBeTrue();
    expect(document.activeElement).toBe(container);
  });
});

describe('uniqueId', () => {
  it('never repeats', () => {
    const ids = new Set([uniqueId('ds'), uniqueId('ds'), uniqueId('ds')]);
    expect(ids.size).toBe(3);
  });

  it('keeps the prefix', () => {
    expect(uniqueId('ds-dialog')).toMatch(/^ds-dialog-\d+$/);
  });
});
