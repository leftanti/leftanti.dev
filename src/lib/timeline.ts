/**
 * timeline.ts — the shape of a single row in the site's signature component.
 *
 * The home page timeline, section listing pages, and tag pages all render the
 * same TimelineItem. In a later stage, content collections are mapped onto
 * this shape and merged here; for now it is just the contract.
 */

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
