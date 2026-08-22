import type { Metadata } from 'next';

// Root layout only sets openGraph/twitter for the homepage — every other page
// needs its own so shared links preview the right title instead of the default.
export function pageMetadata({ title, description }: { title: string; description: string }): Metadata {
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}
