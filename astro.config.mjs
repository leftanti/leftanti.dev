// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Apex domain. Drives canonical URLs, the sitemap, and the RSS feed.
  site: 'https://leftanti.dev',

  // GitHub Pages serves /about/ from /about/index.html; keep links consistent.
  trailingSlash: 'never',

  build: {
    format: 'directory',
  },

  // No client-side JS ships unless a component explicitly asks for it.
  prefetch: false,
});
