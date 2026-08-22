export const apiVersion = '2025-01-01';

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';

// False until the user runs `npx sanity@latest init` and sets the env vars
// (see .env.example). Content-fetching helpers check this so the site keeps
// rendering its existing content instead of crashing while that setup is pending.
export const isSanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

// `@sanity/client` requires a non-empty projectId just to construct — this
// placeholder lets the client be created safely when unconfigured. It's never
// actually queried: every call site checks `isSanityConfigured` first.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder';
