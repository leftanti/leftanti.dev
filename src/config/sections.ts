/**
 * sections.ts — the single source of truth for content sections.
 *
 * Every component on the site reads section metadata from here: the nav, the
 * timeline, listing pages, detail pages, the RSS feed. No template ever names
 * a colour, a route, or a display name directly.
 *
 * ADDING A SECTION
 *   1. Add a `--section-<key>` colour variable to src/styles/theme.css
 *   2. Add an entry to SECTIONS below
 *   3. Create src/content/<key>/ and add its zod schema
 *   4. Copy an existing listing/detail page pair
 * Nothing else needs to change.
 */

export interface Section {
  /** Collection folder name and lookup key. Must match src/content/<key>/. */
  key: string;

  /** PascalCase display name — sits where a Sentinel table name would go. */
  name: string;

  /** Lowercase label used in the top nav. */
  navLabel: string;

  /** Name of the CSS custom property in theme.css holding this section's hue. */
  colorVar: string;

  /** Listing page route, or null for collections that only surface in the timeline. */
  route: string | null;

  /** Whether entries from this section appear in the home timeline and RSS. */
  inTimeline: boolean;

  /** Whether the section gets a top-nav link. */
  inNav: boolean;

  /** One-line summary, used on listing pages and in meta descriptions. */
  blurb: string;
}

export const SECTIONS: Section[] = [
  {
    key: 'kql',
    name: 'KqlLibrary',
    navLabel: 'kql',
    colorVar: '--section-kql',
    route: '/kql',
    inTimeline: true,
    inNav: true,
    blurb: 'Reusable KQL for Microsoft Sentinel and Defender, with notes on data sources and tuning.',
  },
  {
    key: 'hunting',
    name: 'ThreatHunting',
    navLabel: 'hunting',
    colorVar: '--section-hunting',
    route: '/hunting',
    inTimeline: true,
    inNav: true,
    blurb: 'Hunting methodology and findings write-ups — hypothesis, query, result.',
  },
  {
    key: 'rules',
    name: 'AnalyticsRules',
    navLabel: 'rules',
    colorVar: '--section-rules',
    route: '/rules',
    inTimeline: true,
    inNav: true,
    blurb: 'Detection write-ups: the logic, the KQL, the tuning, and the false positives.',
  },
  {
    key: 'cheatsheets',
    name: 'CheatSheets',
    navLabel: 'cheatsheets',
    colorVar: '--section-cheatsheets',
    route: '/cheatsheets',
    inTimeline: true,
    inNav: true,
    blurb: 'Dense study references, grouped by certification.',
  },
  {
    key: 'intel',
    name: 'IntelDigest',
    navLabel: 'intel',
    colorVar: '--section-intel',
    route: '/intel',
    // External headlines, not authored content — kept out of the timeline and RSS.
    inTimeline: false,
    inNav: true,
    blurb: 'Filtered security headlines, refreshed every six hours. Links out, always.',
  },
  {
    key: 'notes',
    name: 'Notes',
    navLabel: 'notes',
    colorVar: '--section-posts',
    // No landing page by design — notes surface only in the timeline.
    route: null,
    inTimeline: true,
    inNav: false,
    blurb: 'Write-ups that do not fit anywhere else.',
  },
];

/**
 * Neutral nav links — pages that are not content sections and carry no hue.
 *
 * `tags` belongs here rather than being reachable only by clicking a pill:
 * without a nav link the tag index has no entry point at all, since every
 * route into it lands on a single tag page first.
 */
export const UTILITY_NAV: { label: string; route: string }[] = [
  { label: 'tags', route: '/tags' },
  { label: 'resources', route: '/resources' },
  { label: 'about', route: '/about' },
];

const BY_KEY = new Map(SECTIONS.map((s) => [s.key, s]));

/** Look up a section by key. Throws loudly at build time rather than rendering a blank. */
export function getSection(key: string): Section {
  const section = BY_KEY.get(key);
  if (!section) {
    throw new Error(
      `Unknown section "${key}". Add it to SECTIONS in src/config/sections.ts.`
    );
  }
  return section;
}

/** `var(--section-kql)` — the only way a component should reference a section hue. */
export function sectionColor(key: string): string {
  return `var(${getSection(key).colorVar})`;
}

/** Trailing slashes off, empty path normalised to `/`. */
export function normalisePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

/**
 * Where a section's entries live: its listing route, or `/<key>` for a
 * collection with no landing page (Notes). Entry URLs and the header's section
 * lookup both go through here so the two can never disagree.
 */
export function sectionBasePath(section: Section): string {
  return section.route ?? `/${section.key}`;
}

/** The canonical URL for one entry in a section. */
export function entryHref(section: Section, id: string): string {
  return `${sectionBasePath(section)}/${id}`;
}

/**
 * The section that owns a URL path, or null for pages that are chrome rather
 * than content — home, about, resources, tags, 404.
 *
 * Matches a section's listing route and also its collection base path, so a
 * collection with no landing page (Notes) still resolves on its detail pages.
 *
 * SiteHeader uses this to colour the logo, which is why no page ever has to
 * pass its section down as a prop — adding a section keeps working for free.
 */
export function sectionForPath(pathname: string): Section | null {
  const path = normalisePath(pathname);
  if (path === '/') return null;

  return (
    SECTIONS.find((section) => {
      const base = sectionBasePath(section);
      return path === base || path.startsWith(`${base}/`);
    }) ?? null
  );
}

/** Sections that contribute entries to the home timeline and the RSS feed. */
export const TIMELINE_SECTIONS = SECTIONS.filter((s) => s.inTimeline);

/** Sections that get a coloured link in the top nav, in declaration order. */
export const NAV_SECTIONS = SECTIONS.filter((s) => s.inNav);
