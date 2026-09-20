/**
 * Countries, with their international dialling codes.
 *
 * The registration form used to take the country as free text and the phone as
 * a bare string, which produced "اليمن", "Yemen", "yemen ", and phone numbers
 * that may or may not carry a code. That is unusable for the organisers: the
 * insights page counts countries, and nobody can call a number whose country
 * is a guess.
 *
 * `ar` is what gets stored. The form is trilingual, but the panel, the CSV
 * export and the country breakdown are all Arabic, so storing whatever language
 * the visitor happened to browse in would split one country across several
 * rows in every count.
 */

export interface Country {
  /** ISO 3166-1 alpha-2, used as the option value and for the flag. */
  code: string;
  ar: string;
  en: string;
  tr: string;
  /** International dialling code, with its plus. */
  dial: string;
}

/** The conference is held here, so it is the sensible default. */
export const DEFAULT_COUNTRY = 'TR';

export const COUNTRIES: Country[] = [
  { code: 'TR', ar: 'تركيا', en: 'Türkiye', tr: 'Türkiye', dial: '+90' },
  { code: 'YE', ar: 'اليمن', en: 'Yemen', tr: 'Yemen', dial: '+967' },
  { code: 'SA', ar: 'السعودية', en: 'Saudi Arabia', tr: 'Suudi Arabistan', dial: '+966' },
  { code: 'AE', ar: 'الإمارات', en: 'United Arab Emirates', tr: 'Birleşik Arap Emirlikleri', dial: '+971' },
  { code: 'QA', ar: 'قطر', en: 'Qatar', tr: 'Katar', dial: '+974' },
  { code: 'KW', ar: 'الكويت', en: 'Kuwait', tr: 'Kuveyt', dial: '+965' },
  { code: 'BH', ar: 'البحرين', en: 'Bahrain', tr: 'Bahreyn', dial: '+973' },
  { code: 'OM', ar: 'عُمان', en: 'Oman', tr: 'Umman', dial: '+968' },
  { code: 'EG', ar: 'مصر', en: 'Egypt', tr: 'Mısır', dial: '+20' },
  { code: 'JO', ar: 'الأردن', en: 'Jordan', tr: 'Ürdün', dial: '+962' },
  { code: 'PS', ar: 'فلسطين', en: 'Palestine', tr: 'Filistin', dial: '+970' },
  { code: 'LB', ar: 'لبنان', en: 'Lebanon', tr: 'Lübnan', dial: '+961' },
  { code: 'SY', ar: 'سوريا', en: 'Syria', tr: 'Suriye', dial: '+963' },
  { code: 'IQ', ar: 'العراق', en: 'Iraq', tr: 'Irak', dial: '+964' },
  { code: 'SD', ar: 'السودان', en: 'Sudan', tr: 'Sudan', dial: '+249' },
  { code: 'LY', ar: 'ليبيا', en: 'Libya', tr: 'Libya', dial: '+218' },
  { code: 'TN', ar: 'تونس', en: 'Tunisia', tr: 'Tunus', dial: '+216' },
  { code: 'DZ', ar: 'الجزائر', en: 'Algeria', tr: 'Cezayir', dial: '+213' },
  { code: 'MA', ar: 'المغرب', en: 'Morocco', tr: 'Fas', dial: '+212' },
  { code: 'MR', ar: 'موريتانيا', en: 'Mauritania', tr: 'Moritanya', dial: '+222' },
  { code: 'SO', ar: 'الصومال', en: 'Somalia', tr: 'Somali', dial: '+252' },
  { code: 'DJ', ar: 'جيبوتي', en: 'Djibouti', tr: 'Cibuti', dial: '+253' },
  { code: 'KM', ar: 'جزر القمر', en: 'Comoros', tr: 'Komorlar', dial: '+269' },
  { code: 'MY', ar: 'ماليزيا', en: 'Malaysia', tr: 'Malezya', dial: '+60' },
  { code: 'ID', ar: 'إندونيسيا', en: 'Indonesia', tr: 'Endonezya', dial: '+62' },
  { code: 'PK', ar: 'باكستان', en: 'Pakistan', tr: 'Pakistan', dial: '+92' },
  { code: 'IN', ar: 'الهند', en: 'India', tr: 'Hindistan', dial: '+91' },
  { code: 'BD', ar: 'بنغلاديش', en: 'Bangladesh', tr: 'Bangladeş', dial: '+880' },
  { code: 'IR', ar: 'إيران', en: 'Iran', tr: 'İran', dial: '+98' },
  { code: 'AZ', ar: 'أذربيجان', en: 'Azerbaijan', tr: 'Azerbaycan', dial: '+994' },
  { code: 'KZ', ar: 'كازاخستان', en: 'Kazakhstan', tr: 'Kazakistan', dial: '+7' },
  { code: 'UZ', ar: 'أوزبكستان', en: 'Uzbekistan', tr: 'Özbekistan', dial: '+998' },
  { code: 'NG', ar: 'نيجيريا', en: 'Nigeria', tr: 'Nijerya', dial: '+234' },
  { code: 'KE', ar: 'كينيا', en: 'Kenya', tr: 'Kenya', dial: '+254' },
  { code: 'ET', ar: 'إثيوبيا', en: 'Ethiopia', tr: 'Etiyopya', dial: '+251' },
  { code: 'ZA', ar: 'جنوب أفريقيا', en: 'South Africa', tr: 'Güney Afrika', dial: '+27' },
  { code: 'GB', ar: 'المملكة المتحدة', en: 'United Kingdom', tr: 'Birleşik Krallık', dial: '+44' },
  { code: 'DE', ar: 'ألمانيا', en: 'Germany', tr: 'Almanya', dial: '+49' },
  { code: 'FR', ar: 'فرنسا', en: 'France', tr: 'Fransa', dial: '+33' },
  { code: 'NL', ar: 'هولندا', en: 'Netherlands', tr: 'Hollanda', dial: '+31' },
  { code: 'SE', ar: 'السويد', en: 'Sweden', tr: 'İsveç', dial: '+46' },
  { code: 'IT', ar: 'إيطاليا', en: 'Italy', tr: 'İtalya', dial: '+39' },
  { code: 'ES', ar: 'إسبانيا', en: 'Spain', tr: 'İspanya', dial: '+34' },
  { code: 'US', ar: 'الولايات المتحدة', en: 'United States', tr: 'Amerika Birleşik Devletleri', dial: '+1' },
  { code: 'CA', ar: 'كندا', en: 'Canada', tr: 'Kanada', dial: '+1' },
  { code: 'AU', ar: 'أستراليا', en: 'Australia', tr: 'Avustralya', dial: '+61' },
  { code: 'CN', ar: 'الصين', en: 'China', tr: 'Çin', dial: '+86' },
  { code: 'JP', ar: 'اليابان', en: 'Japan', tr: 'Japonya', dial: '+81' },
  { code: 'KR', ar: 'كوريا الجنوبية', en: 'South Korea', tr: 'Güney Kore', dial: '+82' },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function countryByCode(code: string): Country | undefined {
  return BY_CODE.get(code);
}

/**
 * The flag, derived from the ISO code rather than stored.
 *
 * Regional indicator symbols are the two letters offset into U+1F1E6..
 * Deriving it means one fewer column to keep in step with the code, and no
 * chance of a country carrying the wrong flag.
 */
export function flagOf(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
  );
}

/**
 * The options as shown, sorted by the displayed name — except the host country,
 * which stays at the top because it is both the default and the most likely
 * answer.
 */
export function countryOptions(lang: 'ar' | 'en' | 'tr'): Country[] {
  const rest = COUNTRIES.filter((c) => c.code !== DEFAULT_COUNTRY).sort((a, b) =>
    a[lang].localeCompare(b[lang], lang),
  );
  const host = countryByCode(DEFAULT_COUNTRY);
  return host ? [host, ...rest] : rest;
}
