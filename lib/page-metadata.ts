import type { Metadata } from 'next';

/**
 * The share card for a page that is not the homepage.
 *
 * Next merges a child's `metadata` into the root's one key at a time, and
 * `openGraph` is replaced wholesale rather than merged — so a page that set
 * only a title and description threw away the root's image with it. Every page
 * using this helper previewed as a blank white card in WhatsApp, Telegram and
 * X: /register, /about, /history, /gallery, /videos, /achievements.
 * The same wholesale replacement dropped `twitter.card`, which fell back from
 * a large image to a small one.
 *
 * So both are restated here. A page that ships its own image — /survey has one
 * — passes `image: null` and the file beside its page.tsx applies instead.
 */

/** Matches app/opengraph-image.alt.txt, which describes the same picture. */
const DEFAULT_IMAGE_ALT = 'CIC - Creativity & Innovation Conference';

export function pageMetadata({
  title,
  description,
  image = '/opengraph-image.png',
}: {
  title: string;
  description: string;
  /** `null` for a route with its own opengraph-image file beside it. */
  image?: string | null;
}): Metadata {
  const images = image ? [{ url: image, width: 1200, height: 630, alt: DEFAULT_IMAGE_ALT }] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, ...(images ? { images } : {}) },
    twitter: {
      // Restated because replacing `twitter` drops what the root layout set.
      card: 'summary_large_image',
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}
