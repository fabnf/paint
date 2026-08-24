import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { DS_PRIMITIVES, type Tone } from '../../../design-system';
import { DOC_UI, type ApiRow } from '../../docs';

/**
 * Progress — documentation page.
 */
@Component({
  selector: 'app-progress-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DS_PRIMITIVES, DOC_UI],
  templateUrl: './progress.page.html',
  styleUrl: './primitives-page.scss',
})
export class ProgressPage implements OnDestroy {
  readonly uploaded = signal(24);
  readonly running = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  /** 18 GB of 20 — the number means nothing without the unit. */
  readonly usedGb = signal(18);
  readonly storageText = computed(() => `${this.usedGb()} of 20 GB used`);
  readonly storageTone = computed<Tone>(() => (this.usedGb() > 16 ? 'warning' : 'primary'));

  useLess(): void {
    this.usedGb.update((value) => Math.max(0, value - 2));
  }

  useMore(): void {
    this.usedGb.update((value) => Math.min(20, value + 2));
  }

  run(): void {
    if (this.running()) {
      return;
    }
    this.running.set(true);
    this.uploaded.set(0);

    this.timer = setInterval(() => {
      this.uploaded.update((value) => Math.min(100, value + 7));
      if (this.uploaded() >= 100) {
        this.stop();
      }
    }, 220);
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running.set(false);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  readonly basicSnippet = `<ds-progress label="Uploading" [value]="uploaded()" [showValue]="true" />`;

  readonly valueTextSnippet = `<!-- "90%" is not what the user wants to hear -->
<ds-progress
  label="Storage"
  [value]="18"
  [max]="20"
  valueText="18 of 20 GB used"
  [showValue]="true"
  tone="warning"
/>`;

  readonly indeterminateSnippet = `<!-- No aria-valuenow: "in progress, amount unknown" -->
<ds-progress label="Syncing" [indeterminate]="true" size="sm" />`;

  readonly inputs: readonly ApiRow[] = [
    { name: 'value', type: 'number', default: '0', description: 'How far along. Clamped between 0 and max.' },
    { name: 'max', type: 'number', default: '100', description: 'The end. 20 files, 20 GB, 100 percent.' },
    { name: 'indeterminate', type: 'boolean', default: 'false', description: 'The work is real; its end is not yet known. Drops aria-valuenow.' },
    { name: 'label', type: 'string', default: `''`, description: 'Visible label above the bar, and the bar’s accessible name.' },
    { name: 'ariaLabel', type: 'string', default: `''`, description: 'Accessible name when there is no visible label.' },
    { name: 'labelledBy', type: 'string', default: `''`, description: 'Id of a label elsewhere on the page.' },
    { name: 'hideLabel', type: 'boolean', default: 'false', description: 'Keep the name, lose the header row.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Show the percentage (or valueText) next to the label.' },
    { name: 'valueText', type: 'string', default: `''`, description: 'What the number means: “18 of 20 GB used” beats “90”. Becomes aria-valuetext.' },
    { name: 'tone', type: 'Tone', default: `'primary'`, description: 'The fill colour, from the shared tone properties.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Track height.' },
  ];
}
