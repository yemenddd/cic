/**
 * The six committees that run the conference.
 *
 * A volunteer belongs to one of them, and a shift belongs to one of them; the
 * pair is what decides who may take what. They are a fixed list rather than
 * free text because both sides have to match exactly — "الإعلام" typed three
 * different ways by three organizers is three committees as far as the rota is
 * concerned, and the volunteers in two of them would see an empty schedule.
 *
 * The id is stored, never the label: a wording change must not orphan every
 * row that used the old spelling.
 */

export interface Committee {
  id: string;
  labelAr: string;
  /** For the English half of a bilingual certificate. */
  labelEn: string;
  /** What this committee actually does, so a volunteer can choose knowingly. */
  descriptionAr: string;
}

export const COMMITTEES: Committee[] = [
  {
    id: 'systems',
    labelEn: 'Systems & Services',
    labelAr: 'النظام والخدمات',
    descriptionAr: 'تنظيم القاعات والمداخل وخدمة الحضور طوال أيام المؤتمر.',
  },
  {
    id: 'relations',
    labelEn: 'Relations & Protocol',
    labelAr: 'العلاقات والبروتوكول',
    descriptionAr: 'استقبال الضيوف والمتحدثين ومرافقتهم وترتيب اللقاءات الرسمية.',
  },
  {
    id: 'media',
    labelEn: 'Media',
    labelAr: 'الإعلام',
    descriptionAr: 'التغطية والتصوير والنشر ومتابعة حسابات المؤتمر.',
  },
  {
    id: 'programs',
    labelEn: 'Programs',
    labelAr: 'البرامج',
    descriptionAr: 'إدارة الجلسات والورش ومتابعة البرنامج في وقته.',
  },
  {
    id: 'finance',
    labelEn: 'Finance & Accounts',
    labelAr: 'المالية والحسابات',
    descriptionAr: 'ضبط المصروفات والعُهد والتوثيق المالي.',
  },
  {
    id: 'logistics',
    labelEn: 'Logistics',
    labelAr: 'اللوجستيك',
    descriptionAr: 'التجهيزات والنقل والمستلزمات وتوزيعها على المواقع.',
  },
];

const BY_ID = new Map(COMMITTEES.map((c) => [c.id, c]));

/** The Arabic name, or '' for an unknown or missing id. */
export function committeeLabel(id: string | null | undefined): string {
  return (id && BY_ID.get(id)?.labelAr) || '';
}

/** The English name, for the facing column of the certificate. */
export function committeeLabelEn(id: string | null | undefined): string {
  return (id && BY_ID.get(id)?.labelEn) || '';
}

export function isCommittee(id: string | null | undefined): boolean {
  return Boolean(id && BY_ID.has(id));
}

/**
 * The id for whatever was submitted, or null when it is not one of the six.
 *
 * Accepts the Arabic label as well as the id, so a value that arrives from a
 * form built before the ids existed still resolves rather than being refused.
 */
export function canonicalCommittee(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  if (BY_ID.has(value)) return value;
  return COMMITTEES.find((c) => c.labelAr === value)?.id ?? null;
}
