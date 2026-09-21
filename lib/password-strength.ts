/**
 * How good a new password is, for the meter on the account page.
 *
 * Weighted towards length, because that is what actually costs an attacker
 * time. The familiar "one uppercase, one number, one symbol" rule mostly
 * produces `Password1!` — eleven characters, every box ticked, and near the
 * top of every cracking list there is. A long ordinary phrase beats it
 * comfortably, so the guidance here says so rather than demanding symbols.
 *
 * This is a guide for the person typing, never a gate: the only rule the
 * server enforces is the minimum length in lib/password-reset.ts, and this
 * agrees with it. A meter that refused to submit would be a second, invisible
 * policy.
 */

import { MIN_PASSWORD_LENGTH } from './password-rules';

export type StrengthLevel = 'tooShort' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrength {
  level: StrengthLevel;
  /** 0–1, for the meter's width. */
  ratio: number;
  label: string;
  /** The single most useful thing to do next, or null when there is nothing. */
  advice: string | null;
}

const LABELS: Record<StrengthLevel, string> = {
  tooShort: 'قصيرة جداً',
  weak: 'ضعيفة',
  fair: 'مقبولة',
  good: 'جيدة',
  strong: 'قوية',
};

const RATIOS: Record<StrengthLevel, number> = {
  tooShort: 0.12,
  weak: 0.3,
  fair: 0.55,
  good: 0.8,
  strong: 1,
};

/** Runs of one character, and plain ascending or descending runs. */
function hasTrivialRun(value: string): boolean {
  if (/(.)\1{2,}/.test(value)) return true;
  for (let i = 0; i + 2 < value.length; i++) {
    const a = value.charCodeAt(i);
    const b = value.charCodeAt(i + 1);
    const c = value.charCodeAt(i + 2);
    if (b - a === 1 && c - b === 1) return true;
    if (a - b === 1 && b - c === 1) return true;
  }
  return false;
}

/**
 * Passwords common enough that length stops protecting them. Deliberately
 * short: this is not a breach corpus and pretending otherwise would be worse
 * than saying nothing. Google's own check, which is what warned about the
 * password on this project, compares against the real lists.
 */
const NOTORIOUS = [
  'password', 'passw0rd', '123456', '12345678', '123456789', 'qwerty',
  'letmein', 'welcome', 'admin', 'iloveyou', 'monkey', 'dragon', 'abc123',
];

export function passwordStrength(raw: string, email?: string | null): PasswordStrength {
  const value = raw ?? '';

  if (value.length === 0) {
    return { level: 'tooShort', ratio: 0, label: '', advice: null };
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return {
      level: 'tooShort',
      ratio: RATIOS.tooShort,
      label: LABELS.tooShort,
      advice: `الحد الأدنى ${MIN_PASSWORD_LENGTH} أحرف — بقي ${MIN_PASSWORD_LENGTH - value.length}.`,
    };
  }

  const lower = value.toLowerCase();

  // Anything built around a notorious password is weak at any length.
  if (NOTORIOUS.some((p) => lower.includes(p))) {
    return {
      level: 'weak',
      ratio: RATIOS.weak,
      label: LABELS.weak,
      advice: 'هذه من أكثر كلمات المرور شيوعاً — تُجرَّب أولاً في أي هجوم.',
    };
  }

  // The local part of the address is the first guess anybody makes.
  const local = (email ?? '').split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) {
    return {
      level: 'weak',
      ratio: RATIOS.weak,
      label: LABELS.weak,
      advice: 'تحتوي على بريدك — وهو أول ما يُجرَّب.',
    };
  }

  if (hasTrivialRun(value)) {
    return {
      level: 'weak',
      ratio: RATIOS.weak,
      label: LABELS.weak,
      advice: 'فيها حروف متكررة أو متتابعة، وهي أنماط تُخمَّن بسرعة.',
    };
  }

  const classes =
    Number(/[a-z]/.test(value)) +
    Number(/[A-Z]/.test(value)) +
    Number(/\d/.test(value)) +
    Number(/[^\w\s]/.test(value));

  // Length carries this, variety only adjusts it.
  if (value.length >= 16) {
    return { level: 'strong', ratio: RATIOS.strong, label: LABELS.strong, advice: null };
  }
  if (value.length >= 13) {
    return classes >= 2
      ? { level: 'strong', ratio: RATIOS.strong, label: LABELS.strong, advice: null }
      : {
          level: 'good',
          ratio: RATIOS.good,
          label: LABELS.good,
          advice: 'أضف رقماً أو حرفاً كبيراً، أو أطِلها قليلاً.',
        };
  }

  return classes >= 3
    ? {
        level: 'good',
        ratio: RATIOS.good,
        label: LABELS.good,
        advice: 'كل حرف إضافي يضاعف صعوبتها — الطول أهم من الرموز.',
      }
    : {
        level: 'fair',
        ratio: RATIOS.fair,
        label: LABELS.fair,
        advice: 'اجعلها أطول — عبارة من ثلاث كلمات أقوى من رمز أو رمزين.',
      };
}

export const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  tooShort: 'var(--text-tertiary)',
  weak: 'var(--destructive)',
  fair: 'var(--accent-blue)',
  good: 'var(--accent-violet)',
  strong: 'var(--accent-cyan)',
};
