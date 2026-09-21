/**
 * Whether this attendee's certificate would come out right.
 *
 * The page has always told people to check the values that get printed and
 * then shown them a list of those values, which is not the same thing: a list
 * of four rows looks identical whether one of them is empty or none are. This
 * says which ones are wrong and what happens if they stay that way.
 *
 * The severities are a real distinction, not decoration. A missing name means
 * the document is worthless — it is a certificate awarded to nobody. A missing
 * track means a line is absent from an otherwise valid certificate. A code
 * that has not been issued yet is not the attendee's fault at all and there is
 * nothing for them to do about it, so it is stated rather than asked.
 */

export type CertificateIssueLevel = 'blocking' | 'degraded' | 'pending';

export interface CertificateIssue {
  key: string;
  level: CertificateIssueLevel;
  title: string;
  /** What happens on the printed document if this is left alone. */
  consequence: string;
  /** Where to go and fix it, or null when the attendee cannot. */
  href: string | null;
}

export interface CertificateReadiness {
  issues: CertificateIssue[];
  /** Nothing at all is wrong. */
  ready: boolean;
  /** Something that would make the document worthless. */
  blocked: boolean;
}

function has(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function certificateReadiness(fields: {
  name?: string | null;
  track?: string | null;
  confirmationCode?: string | null;
}): CertificateReadiness {
  const issues: CertificateIssue[] = [];

  if (!has(fields.name)) {
    issues.push({
      key: 'name',
      level: 'blocking',
      title: 'اسمك غير مسجّل',
      consequence: 'الشهادة تصدر بلا اسم — وهي بذلك لا تثبت شيئاً لأحد.',
      href: '/dashboard/account',
    });
  }

  if (!has(fields.track)) {
    issues.push({
      key: 'track',
      level: 'degraded',
      title: 'لم تختر مساراً',
      consequence: 'تصدر الشهادة صحيحة لكن بلا سطر المسار.',
      href: '/dashboard/account',
    });
  }

  if (!has(fields.confirmationCode)) {
    issues.push({
      key: 'code',
      level: 'pending',
      title: 'رمز التحقق لم يصدر بعد',
      consequence: 'يصدر تلقائياً عند اعتماد تسجيلك، ولا يلزمك فعل شيء.',
      href: null,
    });
  }

  return {
    issues,
    ready: issues.length === 0,
    blocked: issues.some((i) => i.level === 'blocking'),
  };
}
