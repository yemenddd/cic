import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The partner logos, read from the folder rather than listed in code.
 *
 * They used to be a hand-written array of `/images/sponsors/1.png` … `10.png`,
 * which meant an eleventh file sat on disk and never appeared on the page
 * until somebody edited a component. Dropping a file into the folder is now
 * the whole of the job, and removing one is too.
 *
 * Server-only: it reads the filesystem, so it is called from app/page.tsx and
 * the result is passed down to the client component that draws them.
 */

const DIR = 'public/images/sponsors';
const IMAGE = /\.(png|jpe?g|webp|svg|avif)$/i;

export interface SponsorLogo {
  src: string;
  alt: string;
}

export function sponsorLogos(): SponsorLogo[] {
  let files: string[];
  try {
    files = readdirSync(join(process.cwd(), DIR));
  } catch {
    // A missing folder is an empty wall of logos, not a broken homepage.
    return [];
  }

  return files
    .filter((f) => IMAGE.test(f) && !f.startsWith('.'))
    // Numerically, so 10 and 11 follow 9 instead of sorting between 1 and 2.
    .sort((a, b) => {
      const na = Number.parseInt(a, 10);
      const nb = Number.parseInt(b, 10);
      if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b);
      return na - nb;
    })
    .map((f) => ({
      src: `/${DIR.replace(/^public\//, '')}/${f}`,
      // The files are numbered, not named, so there is nothing truer to say
      // than which partner in the row this is.
      alt: `شعار شريك ${Number.parseInt(f, 10) || ''}`.trim(),
    }));
}
