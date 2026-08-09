/**
 * site.ts — site-level constants that are not section config.
 *
 * Section config lives in sections.ts and only there. This file holds the
 * handful of values that describe the site itself: what it is called, and how
 * to reach its author. Nothing here may contain a real name.
 */

export const SITE = {
  /** Shown in the document title, OG tags, and the site mark. */
  name: 'leftanti',

  /** The handle, without decoration. */
  handle: 'leftanti',

  /** One-line description used as the fallback meta description. */
  tagline: 'Detection engineering, KQL, and threat hunting notes.',

  /**
   * The only contact routes on the site. Both are null until they exist.
   *
   * The About page renders a contact list only for values set here, and omits
   * the section entirely when both are null — a dead link or an empty contact
   * line is worse than no contact section at all.
   *
   * Set `email` to a handle-based alias on the domain, e.g. hello@leftanti.dev,
   * and `github` to the full profile URL. Never a real name in either.
   */
  github: 'https://github.com/leftanti' as string | null,
  email: 'hello@leftanti.dev' as string | null,

  /**
   * Entries per page on the home timeline. Page one stays at `/`; later pages
   * are `/2`, `/3`, and so on. Verified at a page size of 2: three pages, with
   * prev and next resolving correctly at both ends.
   */
  timelinePageSize: 20,
} as const;
