import { prisma } from '@/lib/db/client';
import { resolveSettings, SETTINGS_ID, type SiteSettingsValues } from '@/lib/site-settings';

/**
 * Reading the settings row.
 *
 * Kept apart from lib/site-settings.ts so the pure half — the defaults and the
 * URL and address cleaning — can be imported by a client component and by the
 * checks without dragging the Prisma client into either. That separation is
 * not theoretical: the password meter on the account page failed the build
 * exactly this way, by reading one constant out of a module that also touched
 * node:crypto.
 */

/**
 * The settings, with every default filled in.
 *
 * Deliberately swallows a database failure and returns the shipped defaults.
 * This is read by the footer on every public page: an outage should take out
 * whatever needed the database, not replace the whole site with an error
 * because it could not look up a Facebook link. The one value where that
 * matters — whether registration is open — fails open, which is the same
 * behaviour the site had before this table existed.
 */
export async function getSiteSettings(): Promise<SiteSettingsValues> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
    return resolveSettings(row);
  } catch {
    return resolveSettings(null);
  }
}
