import { client } from './client';
import { isSanityConfigured } from '@/sanity/env';

// Falls back to `[]` when Sanity isn't configured yet, or the request fails —
// callers render their existing hardcoded fallback content in that case
// instead of crashing the page.
async function safeFetch<T>(query: string, params: Record<string, unknown>, tag: string): Promise<T[]> {
  if (!isSanityConfigured) return [];
  try {
    return await client.fetch<T[]>(query, params, { next: { tags: [tag] } });
  } catch (err) {
    console.error(`Sanity fetch failed for "${tag}":`, err);
    return [];
  }
}

export interface LocaleString {
  ar: string;
  en?: string;
  tr?: string;
}

export interface SanityImageRef {
  asset: { _ref: string; _type: 'reference' };
  hotspot?: unknown;
}

export interface Speaker {
  _id: string;
  name: LocaleString;
  role: LocaleString;
  organization?: LocaleString;
  topic?: LocaleString;
  bio?: LocaleString;
  photo?: SanityImageRef;
}

export interface ProgramSession {
  _id: string;
  day: 'dayOne' | 'dayTwo';
  time: string;
  title: LocaleString;
  speakerName?: LocaleString;
  speakerRole?: LocaleString;
  speakerPhoto?: SanityImageRef;
  track?: LocaleString;
  color?: string;
}

export interface GalleryImage {
  _id: string;
  image: SanityImageRef;
  caption?: LocaleString;
}

export interface Partner {
  _id: string;
  name: string;
  logo: SanityImageRef;
  url?: string;
}

export interface HistoryEdition {
  _id: string;
  year: string;
  title: LocaleString;
  description?: LocaleString;
  attendees?: string;
  speakersCount?: string;
}

export interface AchievementEdition {
  _id: string;
  slug: string;
  number: number;
  year: string;
  title?: LocaleString;
}

export interface AchievementStudent {
  _id: string;
  studentId: string;
  name: string;
  members?: string[];
  projectTitle?: LocaleString;
  role: 'innovator' | 'participant';
  photos?: SanityImageRef[];
  videoId?: string;
  color?: string;
}

export interface Video {
  _id: string;
  section: 'film' | 'tv';
  editionLabel?: LocaleString;
  title: LocaleString;
  videoId: string;
}

const ORDER = 'order asc';

export function getSpeakers(): Promise<Speaker[]> {
  return safeFetch(`*[_type == "speaker"] | order(${ORDER})`, {}, 'speaker');
}

export function getProgramSessions(): Promise<ProgramSession[]> {
  return safeFetch(`*[_type == "programSession"] | order(${ORDER})`, {}, 'programSession');
}

export function getGalleryImages(): Promise<GalleryImage[]> {
  return safeFetch(`*[_type == "galleryImage"] | order(${ORDER})`, {}, 'galleryImage');
}

export function getPartners(): Promise<Partner[]> {
  return safeFetch(`*[_type == "partner"] | order(${ORDER})`, {}, 'partner');
}

export function getHistoryEditions(): Promise<HistoryEdition[]> {
  return safeFetch(`*[_type == "historyEdition"] | order(${ORDER})`, {}, 'historyEdition');
}

export function getAchievementEditions(): Promise<AchievementEdition[]> {
  return safeFetch(
    `*[_type == "achievementEdition"] | order(${ORDER}) { _id, "slug": slug.current, number, year, title }`,
    {},
    'achievementEdition',
  );
}

export function getAchievementStudents(editionSlug: string): Promise<AchievementStudent[]> {
  return safeFetch(
    `*[_type == "achievementStudent" && edition->slug.current == $editionSlug] | order(${ORDER})`,
    { editionSlug },
    'achievementStudent',
  );
}

export function getVideos(section: 'film' | 'tv'): Promise<Video[]> {
  return safeFetch(`*[_type == "video" && section == $section] | order(${ORDER})`, { section }, 'video');
}
