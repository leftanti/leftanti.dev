# The palette

How colour works on leftanti.dev, and how to add more of it without breaking the
scheme. Written so you can add a section or a resource category later without
re-deriving any of this.

Every value lives in [`src/styles/theme.css`](../src/styles/theme.css). Nothing
here is a second source of truth — this file explains, it does not define.

## The one rule

**A hue means one subject, everywhere on the site.**

Green is DetectionEngineering. It is green in the nav, green as a table name in
the timeline, green on the `/detections` heading, green on the header mark while
you are anywhere under `/detections`, and green on the KQL references category
on `/resources`. If you ever see green meaning two different things, something
is wrong.

That is also why colour is never decorative here. A coloured thing is saying
"this belongs to that subject". If it is not saying that, it stays neutral.

## Where a hue is allowed to appear

Exactly four places, and nowhere else:

1. The section name — the table-name line in the timeline, and the listing heading
2. The `|` pipe glyph on that entry's title line
3. The section's nav link
4. The header mark, on pages that section owns

Resource categories use the first two only.

Everything else is neutral chrome: body copy, entry titles, dates, tag pills,
borders, the `//` and the commented `|`, code blocks, the disclosure markers on
`/resources`. Adding colour to any of those breaks the scheme, because it makes
colour mean "look here" instead of "this is the subject".

## The palette in use

Measured against `--bg` (`#0f100f`). AA-normal is the 4.5:1 threshold, which is
the one that matters — these hues carry small mono text.

| Variable | Hex | Hue | Sat | Light | Contrast | Subject |
| --- | --- | --- | --- | --- | --- | --- |
| `--section-research` | `#c08a5e` | 27° | 44% | 56% | 6.39 | ThreatResearch, amber |
| `--section-intel` | `#a09a8c` | 42° | 10% | 59% | 6.81 | IntelDigest, sand |
| `--section-posts` | `#8a918e` | 154° | 3% | 55% | 5.92 | Notes, grey |
| `--section-detections` | `#6fae94` | 155° | 28% | 56% | 7.41 | DetectionEngineering, green |
| `--section-cheatsheets` | `#7ea3c4` | 208° | 37% | 63% | 7.19 | CheatSheets, blue |

`--brand` (`#6fae94`) is deliberately the same green as `--section-detections`.
It is the site representing itself rather than a section — the header mark
where no section owns the page, the favicon, and OG images. The two are kept as
separate values so retuning the DetectionEngineering hue does not silently
change the brand.

**`DetectionEngineering` is KQL queries and analytics rules merged.** Both are
the same artefact — a query, an explanation, tuning notes — differing only in
whether one is scheduled to alert. A `kind: query | rule` field on each entry
says which, rendered as the first pill on the row, so the merge did not cost
the ability to tell them apart.

**`ThreatResearch` covers threat hunts, hunting malicious infrastructure to
report externally, and malware analysis** — one section for hands-on
investigative work, as opposed to the query/rule authoring in
DetectionEngineering.

## Intel kinds

The digest on `/intel` colours a row by **what the item is**, not who published
it. There are twenty feeds and only a handful of hues, so per-source colour does
not fit — and it would make a hue mean both a section and a vendor, which is the
one thing the rule above forbids. What an item is tells you more at a glance
anyway.

| Variable | Hex | Hue | Sat | Light | Contrast | Means |
| --- | --- | --- | --- | --- | --- | --- |
| `--intel-ioc` | `#5fa4a6` | 182° | 29% | 51% | 6.67 | Carries indicators. Block-list material |
| `--intel-exploited` | `#bd7a84` | 351° | 34% | 61% | 5.70 | Confirmed exploitation in the wild |
| `--intel-campaign` | `#9a8ac2` | 257° | 31% | 65% | 6.16 | Named actors and tracked campaigns |
| `--intel-technique` | `#9aa87a` | 78° | 21% | 57% | 7.50 | New or shifting tradecraft |

A fifth kind, `other`, wears `--section-intel` — the section's own hue, for
items that cleared the filter without fitting a category.

The categories themselves live in
[`src/config/intel-kinds.mjs`](../src/config/intel-kinds.mjs), read by both the
fetch script and the pages so the two cannot drift.

## One reserved hue

`--reserved-mauve` (`#b07f9c`, 324°) sits in `theme.css`, referenced by nothing.
It was `--section-rules` — freed when the old KQL and Rules sections merged into
`DetectionEngineering` — and it is kept defined and documented rather than
deleted, specifically so it is available without having to derive a new one.

Deriving from scratch is materially harder now than it was when this site
launched: the four intel kinds have since claimed what used to be spare hues, so
the wheel is crowded and the tightest pair among the nine in current use is
already 26° apart. A hue already proven to pass every constraint is worth
banking rather than discarding.

**To claim it:** rename `--reserved-mauve` to `--section-<key>` in
`theme.css`, move it up into the section-colour block, and follow
[Adding a section](#adding-a-section) below. If nothing needs it, leave it —
it costs nothing sitting idle.

## Adding a section

Worked end to end, adding a `Malware` section on `/malware`, claiming the
reserved mauve. Nothing below is a template edit — every file is config, data,
or a five-line wrapper.

**1. Claim the reserved hue** in [`theme.css`](../src/styles/theme.css). Rename
it and move it into the section-colour block:

```css
--section-malware: #b07f9c;   /* was --reserved-mauve */
```

If the reserve has already been spent by the time you read this, see
[Inventing a new hue](#inventing-a-new-hue) instead.

**2. Add the section** to `SECTIONS` in
[`sections.ts`](../src/config/sections.ts). Order in this array is the nav order:

```ts
{
  key: 'malware',
  name: 'MalwareNotes',        // PascalCase — sits where a table name goes
  navLabel: 'malware',
  colorVar: '--section-malware',
  route: '/malware',           // null for no landing page, like Notes
  inTimeline: true,
  inNav: true,
  blurb: 'Sample analysis and unpacking notes.',
},
```

**3. Add the collection** in
[`content.config.ts`](../src/content.config.ts). Extend `base` so it inherits
title, date, description, tags, and draft — that is what puts it on the timeline:

```ts
const malware = defineCollection({
  loader: glob({ base: './src/content/malware', pattern: '**/*.md' }),
  schema: base.extend({
    dataTable: oneOrMany.optional(),
    technique: technique.optional(),
  }),
});
```

Then add it to the export at the bottom of that file:

```ts
export const collections = { detections, research, cheatsheets, notes, malware, resources, intel };
```

**4. Create the folder** and a first entry:

```bash
mkdir src/content/malware
```

**5. Copy the two page wrappers.** Take `src/pages/research/index.astro` and
`src/pages/research/[...id].astro` into `src/pages/malware/`, then change every
`'research'` in both files to `'malware'` — four in total: one in `index.astro`,
three in `[...id].astro`. That is the whole edit; nothing else in either file is
section-specific.

```bash
rg "'research'" src/pages/malware
```

**6. Check it.** `npm run build` — the section appears in the nav, its entries
join the home timeline automatically, and its tags generate pages on their own.

If you want the section to have no landing page, set `route: null` and skip the
`index.astro` in step 5. Its entries then surface only in the timeline, the way
`Notes` does.

If you want a hover dropdown under the nav item, like `DetectionEngineering`
has, add a `navLinks` array to the section — see `SiteHeader.astro` for how it
renders, and `SectionLayout`'s `browseLink` prop for a curated index page like
`/detections/browse` to link the dropdown at.

## Adding a resource category

Add an object to [`src/data/resources.json`](../src/data/resources.json). No code
changes at all.

A category is flat, or split into subcategories — never both, never neither.
Flat suits a short list:

```json
{
  "id": "cloud-security",
  "order": 7,
  "title": "CloudSecurity",
  "colorVar": "--section-research",
  "blurb": "One line on what is in here.",
  "links": [{ "title": "…", "url": "https://…", "note": "…" }]
}
```

Subcategories suit one that has grown enough to want a second click before the
list — the disclosure nests one level, entirely in HTML, no JavaScript either
level:

```json
{
  "id": "tools",
  "order": 6,
  "title": "Tools",
  "colorVar": "--section-posts",
  "blurb": "Things to paste an artefact into at two in the morning.",
  "subcategories": [
    {
      "title": "OSINT",
      "links": [{ "title": "…", "url": "https://…", "note": "…" }]
    },
    {
      "title": "Malware analysis",
      "blurb": "Optional — most subcategories don't need one.",
      "links": [{ "title": "…", "url": "https://…", "note": "…" }]
    }
  ]
}
```

**Point `colorVar` at an existing section hue** — whichever section the category
relates to. Categories borrow; they do not own. Subcategories inherit their
parent's hue automatically; they never set one of their own. A category that
genuinely matches no section is a hint that the section is missing, not that
the palette needs a seventh colour.

`order` exists because the loader returns entries sorted by id, not in file
order. Without it the page would be alphabetical whatever the JSON looks like.
The schema is strict, so a typo in any key fails the build rather than rendering
a category with no colour — and it enforces the either/or: a category with both
`links` and `subcategories`, or neither, fails the build naming the category.

## Inventing a new hue

Only once the reserved mauve is also spent. Four constraints, all of which the
existing nine satisfy:

- **Lightness 51–65%.** Lighter looks like a link; darker fails contrast on `--bg`.
- **Saturation 21–44%.** Above that it reads as a warning colour, which means something else here.
- **At least 4.5:1 against `#0f100f`.** These carry 13–14px mono text.
- **At least 25° from every other hue.** Below that two subjects stop being
  distinguishable, which is worst on `/resources` where categories sit adjacent.
  The tightest pair currently is 26°, teal against cheatsheet blue.

Near-greys are exempt from the separation rule: `--section-posts` (3%) and
`--section-intel` (10%) read as neutral, so their hue angle does not really
register.

Check a candidate before committing to it — the numbers in the tables above were
produced this way rather than by eye:

```bash
node -e "const h='#5fa4a6',b='#0f100f',p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),l=s=>{const[r,g,x]=p(s).map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4});return 0.2126*r+0.7152*g+0.0722*x},[a,c]=[l(h),l(b)].sort((m,n)=>n-m);console.log(((a+0.05)/(c+0.05)).toFixed(2))"
```

## Things that are not colour decisions

Worth knowing so they do not get retuned by accident:

- **Code blocks** read from `--code-*`. Those are deliberately cool and
  near-monochrome so highlighting never competes with a section hue. They are the
  real Shiki theme — [`src/config/code-theme.mjs`](../src/config/code-theme.mjs)
  maps token scopes to those variables and nothing else, which is why built pages
  contain no colour values at all.
- **`public/favicon.svg`** is the one file that hardcodes colour, because an icon
  cannot read CSS custom properties. It copies `--bg`, `--brand`, and
  `--comment-mark`. Retune those and you must retune the favicon by hand; nothing
  will warn you.
- **No gradients, no glow, no animation** beyond the single blinking cursor. A
  hue is a flat fill on text, always.
