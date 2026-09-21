/**
 * The site-wide values an organizer can change without a deployment.
 *
 * Everything here was a string in the source until now. Changing the contact
 * address or closing registration meant editing a file, opening a pull
 * request and waiting for a build — which is fine for a developer and not a
 * thing an organizer can do at nine in the evening on the day before.
 *
 * The defaults below are the exact values that were hardcoded, so an empty
 * table renders precisely the site that shipped. Nothing here can break by
 * being absent; it can only be overridden.
 */

export const SETTINGS_ID = 'singleton';

export interface SiteSettingsValues {
  contactEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  xUrl: string;
  registrationOpen: boolean;
  registrationClosedNote: string;
}

/** What the site said before any of this was editable. */
export const DEFAULT_SETTINGS: SiteSettingsValues = {
  contactEmail: 'hello@cictr.org',
  facebookUrl: 'https://www.facebook.com/yemenddd',
  instagramUrl: 'https://www.instagram.com/yemen.ddd',
  youtubeUrl: 'https://www.youtube.com/channel/UCwnyiuNKFCSQpvk50-m1sWg',
  xUrl: 'https://x.com/yemenddd',
  registrationOpen: true,
  registrationClosedNote:
    'التسجيل مغلق حالياً. تابع حساباتنا ليصلك إعلان فتح التسجيل في النسخة القادمة.',
};

/**
 * A link an organizer typed, or nothing.
 *
 * Only http(s) survives. The footer renders these straight into `href`, so a
 * `javascript:` URL pasted into an admin form would be script running on every
 * page of the public site — the one field on this page that is a security
 * boundary rather than a preference.
 */
export function cleanUrl(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    // Not a URL at all — a bare domain, or something pasted by accident.
    return '';
  }
}

/**
 * An address, or nothing. Deliberately permissive about the local part and
 * strict about the shape: this becomes a `mailto:` and an invitation to write
 * to the conference, so a value with a space or no domain is worse than none.
 */
export function cleanEmail(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(value) ? value.toLowerCase() : '';
}

/**
 * Fold a stored row into a complete set of values.
 *
 * Every field falls back independently: a row that sets only the contact
 * address keeps the shipped social links rather than blanking them, which is
 * what a partially filled form would otherwise do on first save.
 */
export function resolveSettings(
  row: Partial<Record<keyof SiteSettingsValues, unknown>> | null | undefined,
): SiteSettingsValues {
  const str = (key: keyof SiteSettingsValues): string => {
    const value = row?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  };

  return {
    contactEmail: cleanEmail(str('contactEmail')) || DEFAULT_SETTINGS.contactEmail,
    facebookUrl: cleanUrl(str('facebookUrl')) || DEFAULT_SETTINGS.facebookUrl,
    instagramUrl: cleanUrl(str('instagramUrl')) || DEFAULT_SETTINGS.instagramUrl,
    youtubeUrl: cleanUrl(str('youtubeUrl')) || DEFAULT_SETTINGS.youtubeUrl,
    xUrl: cleanUrl(str('xUrl')) || DEFAULT_SETTINGS.xUrl,
    // Only an explicit `false` closes it. An absent row, or a column that has
    // not been written, must leave the form open — a site that silently
    // stopped accepting registrations because a table was empty would be the
    // worst possible failure here.
    registrationOpen: row?.registrationOpen === false ? false : true,
    registrationClosedNote: str('registrationClosedNote') || DEFAULT_SETTINGS.registrationClosedNote,
  };
}
