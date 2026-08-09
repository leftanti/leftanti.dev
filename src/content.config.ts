/**
 * content.config.ts — the schema for every piece of authored content.
 *
 * Bad frontmatter fails the build with a named field and a readable reason,
 * rather than rendering a blank pill or a page with no date. That is the whole
 * point of this file: you find out at `npm run build`, not in production.
 *
 * ADDING A COLLECTION
 *   1. Add a `--section-<key>` colour to src/styles/theme.css
 *   2. Add an entry to SECTIONS in src/config/sections.ts
 *   3. Add a collection below, and register it in `collections`
 *   4. Create src/content/<key>/
 *   5. Copy an existing listing/detail page pair
 * Any collection whose schema has a date joins the home timeline for free.
 *
 * Astro resolves this file at src/content.config.ts. The older
 * src/content/config.ts location is deprecated — do not move it back.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Imported from zod directly rather than re-exported from astro:content, which
// forwards the deprecated `zod/v4` subpath and makes every schema line below
// report a deprecation hint. Same zod instance either way.
import { z } from 'zod';

/**
 * Fields every collection shares. `date` drives timeline order, so anything
 * extending this joins the home timeline automatically.
 *
 * Strict on purpose. A non-strict schema silently discards keys it does not
 * recognise, so `dataTables:` for `dataTable:` would drop the value and render
 * an entry with a missing pill and no complaint. Strict turns that typo into a
 * build failure naming the offending key.
 */
const base = z.strictObject({
  title: z.string().min(1, 'title cannot be empty'),

  /** `2026-08-04` in frontmatter. Unquoted is fine; YAML parses it as a date. */
  date: z.coerce.date(),

  /** One or two sentences. Used on listing pages and as the meta description. */
  description: z.string().min(1, 'description cannot be empty'),

  /** Free-form keywords. These feed tag pages; they are not timeline pills. */
  tags: z.array(z.string()).default([]),

  /** `draft: true` keeps an entry out of production builds. */
  draft: z.boolean().default(false),
});

/**
 * Accepts either a single value or a list, and always yields a list, so
 * `dataTable: SigninLogs` and `dataTable: [SigninLogs, AuditLogs]` both work
 * and every consumer can just map over the result.
 */
const oneOrMany = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]));

/**
 * MITRE ATT&CK technique IDs, validated so a typo is a build error rather than
 * a pill linking to a tag page that will never have a second member.
 */
const TECHNIQUE_ID = /^T\d{4}(\.\d{3})?$/;

const technique = oneOrMany.refine(
  (ids) => ids.every((id) => TECHNIQUE_ID.test(id)),
  { message: 'technique must be an ATT&CK ID like T1078 or T1078.004' }
);

/** Constrained so severities stay comparable across the whole rules library. */
const severity = z.enum(['informational', 'low', 'medium', 'high', 'critical']);

const kql = defineCollection({
  loader: glob({ base: './src/content/kql', pattern: '**/*.md' }),
  schema: base.extend({
    dataTable: oneOrMany.optional(),
    technique: technique.optional(),
  }),
});

const hunting = defineCollection({
  loader: glob({ base: './src/content/hunting', pattern: '**/*.md' }),
  schema: base.extend({
    dataTable: oneOrMany.optional(),
    technique: technique.optional(),
  }),
});

const rules = defineCollection({
  loader: glob({ base: './src/content/rules', pattern: '**/*.md' }),
  schema: base.extend({
    dataTable: oneOrMany.optional(),
    technique: technique.optional(),
    severity: severity.optional(),
  }),
});

const cheatsheets = defineCollection({
  loader: glob({ base: './src/content/cheatsheets', pattern: '**/*.md' }),
  schema: base.extend({
    /** The certification this sheet studies for, e.g. `BTL2`. */
    cert: z.string().min(1).optional(),
  }),
});

const notes = defineCollection({
  // Nothing beyond the base fields. A note is just a write-up with a date.
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: base,
});

/** Keys here must match the `key` of the matching entry in sections.ts. */
export const collections = { kql, hunting, rules, cheatsheets, notes };
