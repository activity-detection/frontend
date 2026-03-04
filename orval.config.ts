import { defineConfig } from 'orval';

export default defineConfig({
  activityDetectorApi: {
    input: {
      target: 'http://localhost:8080/v3/api-docs',
    },
    output: {
      mode: 'tags-split',
      target: './src/lib/endpoints',
      schemas: './src/models',
      client: 'fetch',
      httpClient: 'fetch',
      mock: false,
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: './src/lib/client.ts',
          name: 'client',
        },
      },
    },
  },
});
