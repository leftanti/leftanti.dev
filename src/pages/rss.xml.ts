/**
 * /rss.xml — the feed, for people who would rather not check a website.
 *
 * Authored content only. The intel digest is other people's headlines, and
 * republishing them under this site's name would be passing off somebody
 * else's work; `getFeedItems` is driven by the same section config as the
 * timeline, and IntelDigest is marked `inTimeline: false`, so they are
 * excluded without this file needing to know about them.
 *
 * Descriptions only, never full content. Entries here are long and full of
 * KQL, and code blocks render badly to unusably in most feed readers — a
 * summary and a link is the honest version.
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { SITE } from '../config/site';
import { getFeedItems } from '../lib/timeline';

export async function GET(context: APIContext) {
  const items = await getFeedItems();

  return rss({
    title: SITE.name,
    description: SITE.tagline,

    // Set from `site` in astro.config.mjs. Every link in the feed is made
    // absolute against it, which is why relative hrefs are fine above.
    site: context.site!,

    items: items.map((item) => ({
      title: item.title,
      description: item.description,
      link: item.link,
      pubDate: item.pubDate,
      categories: item.categories,
    })),

    customData: '<language>en-gb</language>',
  });
}
