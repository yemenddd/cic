import { prisma } from './client';

export interface LocaleString {
  ar: string;
  en?: string;
  tr?: string;
}

export interface Speaker {
  id: string;
  name: LocaleString;
  role: LocaleString;
  organization?: LocaleString;
  topic?: LocaleString;
  bio?: LocaleString;
  photoUrl?: string | null;
}

export interface ProgramSession {
  id: string;
  day: 'dayOne' | 'dayTwo';
  time: string;
  title: LocaleString;
  description?: LocaleString;
  speakerName?: LocaleString;
  speakerRole?: LocaleString;
  speakerPhotoUrl?: string | null;
  track?: LocaleString;
  color?: string | null;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: LocaleString;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  url?: string | null;
}

export interface HistoryEdition {
  id: string;
  year: string;
  title: LocaleString;
  description?: LocaleString;
  attendees?: string | null;
  speakersCount?: string | null;
}

export interface AchievementEdition {
  id: string;
  slug: string;
  number: number;
  year: string;
  title?: LocaleString;
}

export interface AchievementStudent {
  id: string;
  studentId: string;
  name: string;
  members: string[];
  projectTitle?: LocaleString;
  role: 'innovator' | 'participant';
  photoUrls: string[];
  videoId?: string | null;
  color?: string | null;
}

export interface Video {
  id: string;
  section: 'film' | 'tv';
  editionLabel?: LocaleString;
  title: LocaleString;
  videoId: string;
}

// Every helper below never throws — it returns `[]` if the database isn't
// reachable, so pages fall back to their local hardcoded content instead of
// crashing.
async function safe<T>(fn: () => Promise<T[]>, label: string): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    console.error(`DB query failed for "${label}":`, err);
    return [];
  }
}

function locale(ar: string, en: string | null, tr: string | null): LocaleString {
  return { ar, en: en ?? undefined, tr: tr ?? undefined };
}
function optionalLocale(ar: string | null, en: string | null, tr: string | null): LocaleString | undefined {
  if (!ar) return undefined;
  return locale(ar, en, tr);
}

export function getSpeakers(): Promise<Speaker[]> {
  return safe(async () => {
    const rows = await prisma.speaker.findMany({ orderBy: { order: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      name: locale(r.nameAr, r.nameEn, r.nameTr),
      role: locale(r.roleAr, r.roleEn, r.roleTr),
      organization: optionalLocale(r.organizationAr, r.organizationEn, r.organizationTr),
      topic: optionalLocale(r.topicAr, r.topicEn, r.topicTr),
      bio: optionalLocale(r.bioAr, r.bioEn, r.bioTr),
      photoUrl: r.photoUrl,
    }));
  }, 'speaker');
}

export function getProgramSessions(): Promise<ProgramSession[]> {
  return safe(async () => {
    const rows = await prisma.programSession.findMany({ orderBy: [{ day: 'asc' }, { order: 'asc' }] });
    return rows.map((r) => ({
      id: r.id,
      day: r.day as 'dayOne' | 'dayTwo',
      time: r.time,
      title: locale(r.titleAr, r.titleEn, r.titleTr),
      description: optionalLocale(r.descriptionAr, r.descriptionEn, r.descriptionTr),
      speakerName: optionalLocale(r.speakerNameAr, r.speakerNameEn, r.speakerNameTr),
      speakerRole: optionalLocale(r.speakerRoleAr, r.speakerRoleEn, r.speakerRoleTr),
      speakerPhotoUrl: r.speakerPhotoUrl,
      track: optionalLocale(r.trackAr, r.trackEn, r.trackTr),
      color: r.color,
    }));
  }, 'programSession');
}

export function getGalleryImages(): Promise<GalleryImage[]> {
  return safe(async () => {
    const rows = await prisma.galleryImage.findMany({ orderBy: { order: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl,
      caption: optionalLocale(r.captionAr, r.captionEn, r.captionTr),
    }));
  }, 'galleryImage');
}

export function getPartners(): Promise<Partner[]> {
  return safe(async () => {
    const rows = await prisma.partner.findMany({ orderBy: { order: 'asc' } });
    return rows.map((r) => ({ id: r.id, name: r.name, logoUrl: r.logoUrl, url: r.url }));
  }, 'partner');
}

export function getHistoryEditions(): Promise<HistoryEdition[]> {
  return safe(async () => {
    const rows = await prisma.historyEdition.findMany({ orderBy: { order: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      year: r.year,
      title: locale(r.titleAr, r.titleEn, r.titleTr),
      description: optionalLocale(r.descriptionAr, r.descriptionEn, r.descriptionTr),
      attendees: r.attendees,
      speakersCount: r.speakersCount,
    }));
  }, 'historyEdition');
}

export function getAchievementEditions(): Promise<AchievementEdition[]> {
  return safe(async () => {
    const rows = await prisma.achievementEdition.findMany({ orderBy: { order: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      number: r.number,
      year: r.year,
      title: optionalLocale(r.titleAr, r.titleEn, r.titleTr),
    }));
  }, 'achievementEdition');
}

export function getAchievementStudents(editionSlug: string): Promise<AchievementStudent[]> {
  return safe(async () => {
    const rows = await prisma.achievementStudent.findMany({
      where: { edition: { slug: editionSlug } },
      orderBy: { order: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      name: r.name,
      members: r.members,
      projectTitle: optionalLocale(r.projectTitleAr, r.projectTitleEn, r.projectTitleTr),
      role: r.role as 'innovator' | 'participant',
      photoUrls: r.photoUrls,
      videoId: r.videoId,
      color: r.color,
    }));
  }, 'achievementStudent');
}

export function getVideos(section: 'film' | 'tv'): Promise<Video[]> {
  return safe(async () => {
    const rows = await prisma.video.findMany({ where: { section }, orderBy: { order: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      section: r.section as 'film' | 'tv',
      editionLabel: optionalLocale(r.editionLabelAr, r.editionLabelEn, r.editionLabelTr),
      title: locale(r.titleAr, r.titleEn, r.titleTr),
      videoId: r.videoId,
    }));
  }, 'video');
}
