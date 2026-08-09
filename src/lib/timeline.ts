/**
 * timeline.ts — the shape of a row in the site's signature component, and the
 * merge that feeds it.
 *
 * The home page, section listing pages, and tag pages all render the same
 * TimelineItem. Collections are mapped onto that shape here and nowhere else,
 * so adding a collection never means touching a template.
 */
import { getCollection, type CollectionKey } from 'astro:content';
import { TIMELINE_SECTIONS, entryHref } from '../config/sections';

export interface TimelineTag {
  /** Text shown inside the pill. */
  label: string;
  /** Where the pill links to. Omit for a tag with no filtered view. */
  href?: string;
}

export interface TimelineItem {
  /** Section key — must match an entry in src/config/sections.ts. */
  section: string;

  /** Entry title. Rendered as the link. */
  title: string;

  /** Where the title links to. */
  href: string;

  /** Publication date. Optional — an entry without one still renders. */
  date?: Date;

  /** Up to three tags. Optional and frequently absent. */
  tags?: TimelineTag[];
}

/** Newest first. Undated entries sort to the end, then alphabetically. */
export function byDateDesc(a: TimelineItem, b: TimelineItem): number {
  if (a.date && b.date) return b.date.getTime() - a.date.getTime();
  if (a.date) return -1;
  if (b.date) return 1;
  return a.title.localeCompare(b.title);
}

/** `2026-08-04` — the only date format the timeline uses. */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `SigninLogs` -> `signinlogs`, so a pill and its tag page always agree. */
export function tagSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Where a pill points. Tag pages themselves arrive in a later stage. */
export function tagHref(label: string): string {
  return `/tags/${tagSlug(label)}`;
}

/**
 * The fields the timeline reads. Every collection schema in content.config.ts
 * extends the same base, so the required fields are guaranteed present; the
 * rest vary by collection and are optional here for exactly that reason.
 */
interface EntryFrontmatter {
  title: string;
  date: Date;
  description: string;
  tags: string[];
  draft: boolean;
  dataTable?: string[];
  technique?: string[];
  severity?: string;
  cert?: string;
}

/** The timeline shows at most three pills, per the metadata line's design. */
const MAX_PILLS = 3;

/**
 * Pills come from the *typed* metadata fields, not the free-form `tags` array.
 * Those are the values worth browsing by — a data table, an ATT&CK technique, a
 * severity, a certification — and each one links to its filtered view. The
 * free-form tags feed tag pages without crowding the metadata line.
 *
 * Order is fixed so the column reads consistently down the page. Fields that
 * are absent contribute nothing; nothing renders empty.
 */
function pillsFor(data: EntryFrontmatter): TimelineTag[] {
  const labels = [
    ...(data.dataTable ?? []),
    ...(data.technique ?? []),
    ...(data.severity ? [data.severity] : []),
    ...(data.cert ? [data.cert] : []),
  ];

  return labels.slice(0, MAX_PILLS).map((label) => ({ label, href: tagHref(label) }));
}

/**
 * Drafts are visible while writing and excluded from the deployed site, which
 * is what `draft: true` is for. They are marked in dev so a draft is never
 * mistaken for something that will actually publish.
 */
const SHOW_DRAFTS = !import.meta.env.PROD;

/**
 * Every dated entry across every timeline collection, newest first.
 *
 * Driven entirely by TIMELINE_SECTIONS, so a new collection joins the home page
 * the moment it is added to sections.ts and content.config.ts.
 */
export async function getTimelineItems(): Promise<TimelineItem[]> {
  const perSection = await Promise.all(
    TIMELINE_SECTIONS.map(async (section) => {
      // sections.ts types `key` as a plain string because it also describes
      // Intel, which is fetched data rather than a collection. Every section
      // reaching this point is a real collection.
      //
      // If a key here has no matching collection, Astro logs a build warning
      // and yields nothing — it does not throw. So a section that silently
      // contributes no entries means either an empty folder or a key that does
      // not match content.config.ts. Check the build output for the warning.
      const entries = await getCollection(section.key as CollectionKey);

      return entries
        .filter((entry) => SHOW_DRAFTS || !(entry.data as EntryFrontmatter).draft)
        .map((entry) => {
          const data = entry.data as EntryFrontmatter;
          const pills = pillsFor(data);

          return {
            section: section.key,
            title: data.title,
            href: entryHref(section, entry.id),
            date: data.date,
            // The draft marker is dev-only and does not count against the
            // three-pill limit, so it never hides real metadata.
            tags: data.draft ? [{ label: 'draft' }, ...pills] : pills,
          } satisfies TimelineItem;
        });
    })
  );

  return perSection.flat().sort(byDateDesc);
}
