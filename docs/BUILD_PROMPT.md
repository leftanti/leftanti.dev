# Claude Code build prompt — leftanti.dev

Run Claude Code in an empty directory and paste everything below the line.

---

Build a static website for my cyber security blog and resource site, deployed to GitHub Pages at the custom domain **leftanti.dev**.

**Work in stages. Do not build the whole site at once.** Stage 1 is the theme and home page only, and you stop there for my approval. Details in "Build order" at the bottom.

## Identity and privacy

I publish under the handle **leftanti** (after the KQL join type). My real name must appear nowhere — not in content, config, metadata, or commits. Set the repo's git author locally to `leftanti <leftanti@users.noreply.github.com>` before the first commit.

## Stack

- **Astro**, latest stable. Content collections for all authored content. No client-side JS except where a specific feature needs it (copy buttons, theme toggle if built).
- Deploy via **GitHub Actions** using the official `withastro/action`.
- `site` config and `CNAME` set for the apex domain `leftanti.dev`.
- Self-host all fonts as files in the repo. **No Google Fonts, no CDNs, no analytics, no third-party requests of any kind.**

## Theme — build this exactly

Dark, near-black, monospace-forward. Colour is functional, not decorative: the chrome is neutral, and **each content section owns one muted hue** used for its name, its pipe glyph, and its nav link. Nothing else on the page is coloured.

**Every colour, size, and spacing value goes in a single `src/styles/theme.css` as CSS custom properties.** No hardcoded hex values anywhere else in the codebase. I will be tuning this file by hand.

Starting palette:

```
--bg:            #0f100f
--bg-raised:     #141615
--border:        #262927
--border-faint:  #1f2220
--text:          #eceeed
--text-dim:      #8a918e
--text-fainter:  #6b726f
--text-comment:  #565c59
--comment-mark:  #3f4441
--pipe-comment:  #4a504d

--section-kql:         #6fae94
--section-hunting:     #c08a5e
--section-rules:       #b07f9c
--section-cheatsheets: #7ea3c4
--section-intel:       #a09a8c
--section-posts:       #8a918e
```

Type: monospace (JetBrains Mono or similar) for section names, nav, metadata, code, and the site mark. Sans-serif for entry titles and long-form body copy. Body text max width ~70ch, generous line height. Nothing below 10px.

No gradients, no glow, no matrix rain, no glitch effects, no animation beyond a single blinking block cursor if used.

## The timeline pattern — the core visual idea

The site's signature element. Each entry renders as a miniature KQL query: **the section name sits where a Sentinel table name would go**, the title is piped off it, and the metadata is a commented-out pipe stage below.

```
KqlLibrary
| Detecting OAuth device code phishing
//| 2026-08-04  [SigninLogs] [T1528]
```

Rules for this component:

- Section name in that section's colour, PascalCase, styled like a table name (`KqlLibrary`, `ThreatHunting`, `AnalyticsRules`, `CheatSheets`, `IntelDigest`, `Notes`).
- The `|` before the title takes the section colour. The title is the link, in `--text`, sans-serif.
- The metadata line is prefixed `//|` — `//` in `--comment-mark`, `|` in `--pipe-comment`.
- **Alignment: the `|` line and the `//|` line must start at the same left edge**, with `//` occupying the first two character cells so the comment line's pipe sits two glyphs right. This mirrors how commenting a line works in an editor. Both pipe glyphs must be the same font-size or the alignment breaks.
- Metadata content: date in `--text-comment` as plain mono text, followed by 0–3 tags rendered as hairline-outlined pills (`0.5px solid`, 3px radius, `--text-fainter` text, no background fill).
- **All metadata fields are optional.** Render only what the entry's frontmatter provides — a cheat sheet has no data table or ATT&CK technique. Never render empty pills or placeholder values.
- Tags should be links to a filtered view where that makes sense (e.g. clicking `SigninLogs` lists everything referencing that table).

## Section colours must be configured once

Create `src/config/sections.ts` (or `.js`) exporting one object per collection: key, display name (the PascalCase table name), nav label, colour variable, and route. **Every component reads from this file.** Adding a sixth section later must mean adding one entry here plus a folder — never hunting hex values through templates.

## Site structure

**There is no blog section.** The home page is the unified timeline.

1. **Home** — site mark `~/leftanti` and nav across the top, a 1–2 sentence intro (no personal details), then a reverse-chronological timeline of **every entry across all collections** using the pattern above. Paginate past ~20 entries.
2. **KQL Library** (`/kql`) — browsable, filterable by tag. Each query gets its own page: description, the full query in a code block with a copy button, notes on data sources and tuning.
3. **Threat Hunting** (`/hunting`) — hunting methodology and findings write-ups.
4. **Analytics Rules** (`/rules`) — detection write-ups: logic explanation, KQL, tuning notes, false positive guidance.
5. **Cheat Sheets** (`/cheatsheets`) — exam study references, grouped by certification. **Different layout to posts**: dense, scannable, table-friendly, minimal prose, no reading time, no TOC.
6. **Resources** (`/resources`) — curated external links grouped by category, from a single YAML/JSON data file. Seed categories: Threat Intel, KQL References, Detection Engineering, DFIR, Training/Certs, Tools.
7. **Threat Intel** (`/intel`) — see below.
8. **About** (`/about`) — handle-based bio, contact via one email alias or GitHub link only. Include: *"All content is my own, published in a personal capacity. Everything here is built from scratch on my own time and infrastructure — nothing derives from any employer's or client's environment."*

Also a `notes/` collection for general write-ups that don't fit elsewhere. No landing page; it surfaces only in the timeline.

## Threat intel aggregator

A **scheduled GitHub Actions workflow** (cron, every 6 hours) runs a Node script that fetches RSS/Atom feeds, filters them, and writes the latest ~50 items to a JSON file in the repo. If the file changed, commit it as `github-actions[bot]` — that commit triggers the normal Pages deploy.

- **All configuration in one file** at the top of the script: the feed list, and the filter rules.
- Filtering: a keyword allowlist matched against title and summary (seed with `Sentinel`, `Entra`, `KQL`, `Defender`, `CVE-`, `ransomware`, `detection`), a blocklist to drop noise (`webinar`, `sponsored`, `deal`, `podcast`), and a minimum-hit threshold so items need at least one allowlist match to appear. Structure it so I can tune thresholds without touching logic.
- Seed feeds: BleepingComputer, The Hacker News, MSRC blog, CISA advisories, Microsoft Security Blog.
- **Resilient**: one dead or malformed feed must not fail the run. Log and continue.
- The page renders headline, source, timestamp, and short snippet **linking out to the original — never full article content**.
- README must note that GitHub disables scheduled workflows after ~60 days of repo inactivity, and any push re-enables them.

## Content authoring

I must be able to add content by dropping a markdown file in a folder and pushing. No template edits.

- Define zod schemas for every collection so bad frontmatter fails the build with a clear error.
- Frontmatter should cover: title, date, description, tags, `draft`, and optional `dataTable`, `technique`, `severity`, `cert` — whichever apply to that collection.
- `draft: true` excludes an entry from production builds.
- Create **one realistic example entry per collection** so I can copy the frontmatter format. Use generic examples: a failed-sign-on burst query against `SigninLogs` for KQL, an impossible-travel write-up with watchlist suppression for rules, a BTL2 network forensics sheet for cheatsheets.

## Extensibility — I will add collections myself

Listing and detail pages must be **thin wrappers around shared layout components**, not one-off pages. Adding a collection must be: add to `sections.ts`, add the zod schema, create the folder, copy a listing/detail page pair. Document those exact steps with file paths in the README under "Adding a new collection". Any collection with a date in its schema joins the home timeline automatically.

## Code blocks

- Shiki highlighting. KQL has no first-class grammar — register a custom TextMate grammar if straightforward, otherwise fall back to `sql` and note it in the README.
- Copy-to-clipboard button on every block.
- Long queries scroll horizontally rather than wrapping.
- Code block palette stays cool and neutral so it doesn't fight the section colours.

## Other

- RSS feed aggregating all authored collections (same merge as the timeline). Exclude external intel items.
- Sitemap, OpenGraph and meta tags. Site name "leftanti", no personal info.
- Tag pages.
- 404 page — have fun with it (a KQL query returning no rows works).
- Accessible: proper heading hierarchy, visible focus states, adequate contrast throughout the dark theme.
- `README.md` written for me: local dev, adding each content type, adding a collection, how deploys work, how to tune the intel filters. Assume I'm comfortable with git and PowerShell but not a frontend developer.

## Build order — follow this strictly

**Stage 1.** Scaffold Astro, write `theme.css` and `sections.ts`, build the home page with the timeline component and 4–5 hardcoded placeholder entries covering different sections. Get `npm run dev` working. **Then stop and tell me to look at it.** Do not proceed until I approve the theme.

**Stage 2.** After approval: content collections, schemas, example entries, wire the timeline to real content.

**Stage 3.** Section landing pages and detail templates.

**Stage 4.** Resources page, intel workflow and script, RSS, sitemap, 404, tag pages.

**Stage 5.** GitHub Actions deploy workflow, README, and a checklist of what I need to do manually — create the repo, enable Pages, and the exact A/AAAA/CNAME records for an apex domain on GitHub Pages.

Run `npm run build` as you go and fix errors before moving on.
