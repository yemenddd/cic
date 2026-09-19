export type Lang = 'ar' | 'en' | 'tr';

export interface LocalizedText {
  ar: string;
  en: string;
  tr: string;
}

export interface Category {
  id: string;
  recommended: boolean;
  labels: LocalizedText;
  features: { ar: string[]; en: string[]; tr: string[] };
}

// Shared by the public registration form and the attendee dashboard, so a
// badge rendered later from stored data shows the same category label the
// attendee picked at signup.
export const CATEGORIES: Category[] = [
  {
    id: 'visitor',
    recommended: false,
    labels: { ar: 'زائر', en: 'Visitor', tr: 'Ziyaretçi' },
    features: {
      ar: ['حضور جميع الجلسات العامة', 'استكشاف المعرض التقني', 'التواصل مع الخبراء', 'شهادة مشاركة رسمية'],
      en: ['Access to all public sessions', 'Explore the innovation exhibition', 'Network with experts', 'Official participation certificate'],
      tr: ['Tüm genel oturumlara erişim', 'İnovasyon sergisini keşfedin', 'Uzmanlarla ağ kurma', 'Resmi katılım sertifikası'],
    },
  },
  {
    id: 'participant',
    recommended: true,
    labels: { ar: 'مشارك', en: 'Participant', tr: 'Katılımcı' },
    features: {
      ar: ['كل مميزات الزائر', 'المشاركة في ورشات العمل', 'عرض بحث أو مشروع', 'الأولوية في جلسات التواصل'],
      en: ['All Visitor benefits', 'Join workshops & competitions', 'Present a research or project', 'Priority networking sessions'],
      tr: ['Tüm Ziyaretçi hakları', 'Atölye ve yarışmalara katılım', 'Araştırma veya proje sunumu', 'Öncelikli ağ kurma oturumları'],
    },
  },
  {
    id: 'volunteer',
    recommended: false,
    labels: { ar: 'متطوع', en: 'Volunteer', tr: 'Gönüllü' },
    features: {
      ar: ['المساهمة في تنظيم المؤتمر', 'خبرة إدارية وتنظيمية عملية', 'شهادة تطوع معتمدة', 'اجتماعات مع الفريق التنظيمي'],
      en: ['Contribute to conference organization', 'Hands-on management experience', 'Certified volunteering certificate', 'Meetings with the organizing team'],
      tr: ['Konferans organizasyonuna katkı', 'Uygulamalı yönetim deneyimi', 'Onaylı gönüllülük sertifikası', 'Organizasyon ekibiyle toplantılar'],
    },
  },
];

export function categoryLabel(categoryId: string | null | undefined, lang: Lang): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.labels[lang] ?? '';
}

export function categoryFeatures(categoryId: string | null | undefined, lang: Lang): string[] {
  return CATEGORIES.find((c) => c.id === categoryId)?.features[lang] ?? [];
}

/**
 * What each category is actually entitled to inside the platform.
 *
 * This mirrors the benefits advertised in CATEGORIES above rather than
 * inventing a second, parallel rulebook: "عرض بحث أو مشروع" is listed only
 * under `participant`, so only participants can submit an innovation.
 *
 * Read this as data, never by comparing category strings at call sites — a
 * stray `category === 'participant'` somewhere is how these two lists drift
 * apart.
 */
export interface CategoryAbilities {
  submitInnovations: boolean;
}

const ABILITIES: Record<string, CategoryAbilities> = {
  visitor: { submitInnovations: false },
  participant: { submitInnovations: true },
  volunteer: { submitInnovations: false },
};

const NO_ABILITIES: CategoryAbilities = { submitInnovations: false };

export function abilitiesFor(categoryId: string | null | undefined): CategoryAbilities {
  return (categoryId && ABILITIES[categoryId]) || NO_ABILITIES;
}

export function canSubmitInnovations(categoryId: string | null | undefined): boolean {
  return abilitiesFor(categoryId).submitInnovations;
}

/**
 * How many projects one account may present.
 *
 * Here rather than inline in the action because it is a rule about what a
 * participant is entitled to, which is what this file is for.
 *
 * The number is deliberately generous — a team submitting a handful of
 * related projects is a real thing, an attendee submitting their fiftieth is
 * not. What matters is that a ceiling exists at all: the create action is a
 * public POST endpoint that uploads a cover image to Blob storage, so without
 * one it is an unmetered way to spend the conference's storage budget and
 * bury the review committee.
 */
export const MAX_SUBMISSIONS_PER_ATTENDEE = 10;
