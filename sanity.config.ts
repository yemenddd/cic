import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { apiVersion, dataset, projectId } from './sanity/env';
import { schemaTypes } from './sanity/schemaTypes';

export default defineConfig({
  name: 'default',
  title: 'CICT',
  basePath: '/studio',

  projectId,
  dataset,

  schema: {
    types: schemaTypes,
  },

  plugins: [
    structureTool(),
    // Only for local content debugging — not linked from the default nav.
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
