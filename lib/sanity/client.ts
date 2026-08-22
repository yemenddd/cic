import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/env';

// Public, read-only client — used by server components to render pages.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

// Server-only client with write access — registration API + migration script.
// Never import this from a client component or anything bundled to the browser.
export function getWriteClient() {
  const token = process.env.SANITY_API_TOKEN;
  if (!token) throw new Error('Missing environment variable: SANITY_API_TOKEN');
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
}
