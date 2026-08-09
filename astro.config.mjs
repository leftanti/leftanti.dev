// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import codeTheme from './src/config/code-theme.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [
    // Writes /sitemap-index.xml at build time from the generated routes, using
    // the `site` value below. Mostly earns its place for the tag pages, which
    // are reachable only through pills and would otherwise be crawled last.
    sitemap(),
  ],

  markdown: {
    shikiConfig: {
      // Every colour in this theme is a var(--code-*) reference, so highlighted
      // markup carries no colour values and the palette stays in theme.css.
      theme: codeTheme,

      // Long queries scroll horizontally rather than wrapping — a wrapped KQL
      // pipeline is unreadable, and worse, it is unsafe to copy by eye.
      wrap: false,

      transformers: [
        {
          name: 'leftanti-code-shell',
          pre(node) {
            // Shiki cannot carry a non-hex colour straight through. It swaps
            // each one for a synthetic hex placeholder (#00000001, #00000002…)
            // and maps it back when rendering — and the block background does
            // not survive that round trip, so a raw placeholder leaks into the
            // markup as an inline background-color.
            //
            // Token colours are unaffected and still resolve to var(--code-*).
            // Only the wrapper's own two colours need setting here, and setting
            // them explicitly is immune to how Shiki handles that internally.
            //
            // This overwrites rather than appends, so it must stay last:
            // Astro's own transformer runs first and adds the overflow rule,
            // which is restated here because this replaces the whole value.
            node.properties.style =
              'background-color:var(--code-bg);color:var(--code-text);overflow-x:auto;';
          },
        },
      ],
    },
  },

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
