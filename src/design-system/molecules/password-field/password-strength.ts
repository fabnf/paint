import type { Tone } from '../../primitives/tone.types';

/** 0 — empty, 1 — weak, 2 — fair, 3 — good, 4 — strong. */
export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: PasswordScore;
  /** The word shown under the meter, and spoken as the meter's `aria-valuetext`. */
  label: string;
  tone: Tone;
}

const LABELS: Record<PasswordScore, { label: string; tone: Tone }> = {
  0: { label: 'Empty', tone: 'neutral' },
  1: { label: 'Weak', tone: 'danger' },
  2: { label: 'Fair', tone: 'warning' },
  3: { label: 'Good', tone: 'info' },
  4: { label: 'Strong', tone: 'success' },
};

/**
 * A deliberately naive password scorer: length first, variety second.
 *
 * It is a *hint to the user*, not a security control. It cannot know that
 * `Pa$$w0rd!` is the first guess of every cracker in existence, and nothing that
 * runs in a browser can. Real strength is enforced on the server, against a
 * breach corpus — this only stops someone shipping `1234` because nothing
 * objected.
 *
 * Length dominates on purpose: a long passphrase of lowercase words beats a
 * short line-noise password, and a meter that says otherwise teaches the wrong
 * lesson.
 */
export function passwordStrength(value: string): PasswordStrength {
  if (!value) {
    return { score: 0, ...LABELS[0] };
  }

  const classes =
    (/[a-z]/.test(value) ? 1 : 0) +
    (/[A-Z]/.test(value) ? 1 : 0) +
    (/\d/.test(value) ? 1 : 0) +
    (/[^\w]/.test(value) ? 1 : 0);

  let score = 1;
  if (value.length >= 8 && classes >= 2) {
    score = 2;
  }
  if (value.length >= 12 && classes >= 2) {
    score = 3;
  }
  // A 16-character passphrase is strong whatever it is made of.
  if (value.length >= 16 || (value.length >= 12 && classes >= 3)) {
    score = 4;
  }

  const resolved = score as PasswordScore;
  return { score: resolved, ...LABELS[resolved] };
}
