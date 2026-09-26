import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { getAchievementEditions } from '@/lib/db/queries';
import { ACHIEVEMENT_EDITIONS } from '@/lib/achievements-data';

const STATIC_ROUTES = ['', '/about', '/history', '/program', '/gallery', '/videos', '/achievements', '/register'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const editions = await getAchievementEditions();
  const slugs = editions.length > 0 ? editions.map(e => e.slug) : ACHIEVEMENT_EDITIONS.map(e => e.slug);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(path => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const editionEntries: MetadataRoute.Sitemap = slugs.map(slug => ({
    url: `${siteUrl}/achievements/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticEntries, ...editionEntries];
}
