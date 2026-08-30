# Maintaining leftanti.dev

Local development, the content model, how deploys work, and how to stand up
the GitHub Pages and DNS side from nothing.

- [Running it locally](#running-it-locally)
- [Adding content](#adding-content)
- [Adding a new collection](#adding-a-new-collection)
- [The threat intel digest](#the-threat-intel-digest)
- [How deploys work](#how-deploys-work)
- [Standing it up from scratch](#standing-it-up-from-scratch) — repo, Pages, DNS
- [Where everything lives](#where-everything-lives)

---

## Running it locally

Node 24 is what this is built and tested against.

```bash
npm install
npm run dev
```

That serves the site at <http://localhost:4321> and reloads as you save.

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve `dist/` as it will actually be published |
| `npm run check` | Type-check everything. Should be zero errors |
| `npm run intel` | Refresh the threat intel digest by hand |
| `npm run icons` | Regenerate the favicon PNG and OG card |
| `npm run fonts` | Re-copy the font files out of `node_modules` |

**Two Windows notes.** `node` is not always on the shell `PATH`; it lives in
`C:\Program Files\nodejs`. And if a build fails with a file-rename error, the
dev server is probably running and writing to `.astro/` at the same time — stop
it with `npx astro dev stop` and build again. A build that fails while
`npm run check` passes is nearly always this.

---

## Adding content

Drop a markdown file into the right folder under `src/content/` and push. No
template edits, ever.

| Folder | Appears at | For |
| --- | --- | --- |
| `src/content/detections/` | `/detections/<name>` | KQL queries and analytics rules |
| `src/content/research/` | `/research/<name>` | Hunts, malicious-infra research, malware analysis |
| `src/content/cheatsheets/` | `/cheatsheets/<name>` | Study references |
| `src/content/notes/` | `/notes/<name>` | Everything else |

The filename becomes the URL, so `failed-signon-burst.md` is served at
`/detections/failed-signon-burst`.

### Starting from a template

Each folder has an `_template.md` — copy it, rename the copy, fill it in, and
flip `draft: true` to `false` when ready. The templates are marked as drafts
themselves, so they never appear on the built site regardless.

### Frontmatter

Every file starts with a block between `---` lines. Five fields are shared:

```yaml
---
title: Failed sign-on bursts from a single address
date: 2026-08-04
description: One or two sentences. Used on listings and as the meta description.
tags: [entra, identity, password-spray]
draft: false
---
```

Then, depending on the folder:

| Field | Where | Notes |
| --- | --- | --- |
| `kind` | detections only | `query` or `rule`. Not optional there — every entry says which |
| `dataTable` | detections, research | One value or a list |
| `technique` | detections, research | ATT&CK IDs — `T1110` or `T1110.003` |
| `severity` | detections | One of informational, low, medium, high, critical. Rules typically set it; bare queries usually don't |
| `cert` | cheatsheets | e.g. `BTL2`. Also groups the listing page |

**All of them are optional except `kind`.** A cheat sheet has no data table; the
page renders only what you give it and never an empty placeholder. `kind` is the
one exception — it drives the query/rule split on `/detections`, so it has to be
explicit rather than inferred from whether `severity` is set.

`draft: true` keeps an entry out of the built site entirely. It still shows in
`npm run dev`, marked with a `draft` pill, so you can see work in progress
without publishing it.

### If you get the frontmatter wrong

The build fails and tells you which file and which field. The schemas are
strict, so a misspelled key is an error rather than a silently ignored value:

```
[InvalidContentEntryDataError] detections → my-entry data does not match collection schema.
  technique: technique must be an ATT&CK ID like T1078 or T1078.004
  ****: Unrecognized key: "dataTables"
```

That is deliberate. A typo that silently dropped a value would give you an
entry with a missing pill and no indication anything was wrong.

### Code blocks

Use ```` ```kql ```` — Kusto has real syntax highlighting, no fallback needed.
Every block gets a copy button, and long queries scroll sideways rather than
wrapping, because a wrapped pipeline is unsafe to copy by eye.

### Tags

Two different things, deliberately:

- **`tags`** in frontmatter are free-form keywords. They generate `/tags/<name>`
  pages but do not appear on the timeline.
- **The pills you see** on a timeline row come from the typed fields —
  `dataTable`, `technique`, `severity`, `cert` — capped at three so the line
  stays readable.

See [`tags.md`](tags.md) for a working vocabulary — not enforced, but keeps
similar entries converging on the same word instead of drifting.

Both feed the tag pages, so nothing is lost either way.

### Browsing detections by technique or table

`/detections` lists newest first, same as every section. `/detections/browse`
is a second view — every technique and every data table in use, with a count,
linking into the same tag pages. It exists because "which techniques do I
already have queries for" is a different question from "what did I write most
recently", and once there are hundreds of entries the second question stops
being answerable by scrolling.

It rebuilds itself from the content automatically; nothing to maintain when you
add an entry. Hovering (or tab-focusing) the `detections` nav link also opens a
small menu straight to `all` / `queries` / `rules` / `browse` — configured as
`navLinks` on that section in `sections.ts`, and worth copying if another
section ever grows enough to want the same treatment.

---

## Adding a new collection

Five steps. [`docs/palette.md`](palette.md) has this worked through end to end
with the actual code, including how to claim a colour.

1. Add a hue to `src/styles/theme.css` — one is currently reserved
   (`--reserved-mauve`, freed by the KQL/Rules merge) and free to claim; see
   the palette doc for how, and for what to do once that is also spent
2. Add an entry to `SECTIONS` in `src/config/sections.ts`
3. Add the collection and its schema to `src/content.config.ts`
4. Create `src/content/<key>/`
5. Copy `src/pages/research/index.astro` and `src/pages/research/[...id].astro`
   into `src/pages/<key>/` and change the four occurrences of `'research'`

Any collection whose schema has a date joins the home timeline, the RSS feed
and the tag pages automatically.

---

## The threat intel digest

`/intel` is filtered security headlines from twenty feeds, refreshed every six
hours. It links out and never reproduces an article.

**All tuning is in one block** at the top of
[`scripts/fetch-intel.mjs`](../scripts/fetch-intel.mjs). You should not need to
touch anything below it.

| Setting | What it controls |
| --- | --- |
| `feeds` | The sources. `maxAge` and `iocSource` are per feed |
| `signals` | **The gate.** An item must match one, or it does not appear |
| `minSignals` | Raise to 2 to demand corroboration. Stricter, and it will drop some genuine single-angle stories |
| `weights` | Ranking only. Cannot admit an item on its own |
| `minScore` | Floor on relevance, after the gate |
| `block` | One match anywhere drops the item outright |
| `maxPerFeed` | Stops a prolific feed filling the page |
| `articleScan` | Whether to fetch each article and count its indicators |

### How the categories work

Each item is classified, which drives its colour and the filtered views at
`/intel/ioc`, `/intel/exploited`, `/intel/campaign`, `/intel/technique`. The
categories live in
[`src/config/intel-kinds.mjs`](../src/config/intel-kinds.mjs), shared by the
script and the pages so the two cannot drift apart.

**`/intel/ioc` is the one to bookmark** for pulling addresses for block lists.
Every shortlisted article is fetched and its indicators counted for real —
hashes, defanged strings, and addresses with every reserved range excluded.
The counts on each row show which report is worth opening.

They are evidence that a report is worth reading. They are not a claim that any
address is hostile. **Verify before blocking anything.**

If it feels too loose, raise `articleScan.minEvidence` from 3 to 5: at 3, an
article qualifies on an "Indicators of Compromise" heading alone, even with no
artefacts under it.

### Scheduled workflows go to sleep

GitHub disables scheduled workflows on a repository with no activity for around
60 days. If the digest goes stale, that is almost always why. Any push
re-enables it. There is nothing to repair, and a run can always be triggered by
hand from the Actions tab.

---

## How deploys work

Two workflows, in `.github/workflows/`:

**`deploy.yml`** — builds and publishes to Pages. Runs on every push to `main`,
on demand, and when the intel refresh calls it.

**`intel.yml`** — every six hours, regenerates the digest, commits it *only if
it changed*, and then calls `deploy.yml`.

That last part is not decoration. A commit made with the built-in
`GITHUB_TOKEN` does not fire other workflows — GitHub blocks it so a workflow
that commits cannot trigger itself forever. Without the explicit call the
digest would refresh in the repository every six hours and never once reach the
published site.

So: push to `main` and it deploys. Nothing else to do.

---

## Standing it up from scratch

Only relevant when setting this up on a new domain or recovering a lost
configuration — the live site already has all of this in place.

### 1. Create the repository

Public, so GitHub Pages works without a paid plan. Then:

```bash
git remote add origin https://github.com/leftanti/leftanti.dev.git
git push -u origin main
```

Check the commit author first — it must not carry a real name:

```bash
git config user.name
```

That should print `leftanti`. If it does not, fix it before pushing:

```bash
git config user.name "leftanti"
git config user.email "leftanti@users.noreply.github.com"
```

### 2. Enable Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

Not "Deploy from a branch". The workflow publishes the artifact directly, and
the branch option will fight it.

### 3. Set the custom domain

**Settings → Pages → Custom domain** → `leftanti.dev` → Save.

`public/CNAME` already contains the domain, so it survives every deploy. Do not
delete it.

### 4. DNS records

At the registrar, for the apex domain. These four A records are GitHub's and
are the same for everyone:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

And the IPv6 equivalents, which are worth adding:

| Type | Name | Value |
| --- | --- | --- |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

Then one CNAME so `www` redirects to the apex:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `leftanti.github.io` |

#### If the domain is on Cloudflare

**Set every one of those records to "DNS only" — the grey cloud, not the orange
one.** This is the single thing most likely to go wrong.

With the proxy on, Cloudflare answers for the domain instead of GitHub. GitHub
then cannot validate the domain, so it never issues a certificate and *Enforce
HTTPS* stays greyed out forever. If Cloudflare's SSL/TLS mode is also left on
"Flexible", the site enters a redirect loop, because Cloudflare talks to GitHub
over HTTP while GitHub redirects everything to HTTPS.

DNS only avoids all of it. There is nothing worth having here: Pages already
serves from a CDN, and the site is static and tiny.

Cloudflare also supports CNAME flattening, so unusually a CNAME at the apex
will resolve — it returns A records behind the scenes. It works, and it tracks
GitHub's IPs automatically if they ever change. The explicit A and AAAA records
above are still what GitHub documents, and they are easier to reason about when
something breaks.

**Email on the same domain does not conflict.** MX and TXT records at `@` sit
alongside A records without any trouble. The only thing that cannot also sit at
`@` on a normal DNS host is a CNAME — and on Cloudflare, flattening even makes
that work.

### 5. Turn on HTTPS

Once DNS has propagated, **Settings → Pages → Enforce HTTPS**. The tick box is
greyed out until GitHub has issued the certificate, which usually takes minutes
but is allowed to take up to 24 hours.

### 6. Set contact details

`src/config/site.ts` has `github` and `email` fields. The About page omits its
contact section entirely rather than show a dead link, so both need setting
before it appears.

### Checklist

- [ ] Repository created, public
- [ ] `git config user.name` returns `leftanti`
- [ ] Pushed to `main`
- [ ] Pages source set to **GitHub Actions**
- [ ] Custom domain set to `leftanti.dev`
- [ ] Four A records added
- [ ] Four AAAA records added
- [ ] `www` CNAME added
- [ ] Enforce HTTPS ticked once available
- [ ] Contact details set in `src/config/site.ts`

---

## Where everything lives

```
src/
  config/
    sections.ts        Every section: name, colour, route. Single source of truth
    site.ts            Site name, contact details, page size
    intel-kinds.mjs    Intel categories, shared by the script and the pages
    code-theme.mjs     Syntax highlighting, entirely in CSS variables
  content/             Authored markdown. One folder per collection
  content.config.ts    Schemas. Bad frontmatter fails the build here
  data/
    resources.json     The /resources links
    intel.json         Generated. Do not hand-edit
  styles/
    theme.css          Every colour, size and spacing value on the site
    prose.css          Rendered markdown
  components/
    QueryLines.astro   The signature pattern. Handle with care
  layouts/             Page shells
  pages/               Thin wrappers. Nothing clever should live here
scripts/
  fetch-intel.mjs      The digest. All tuning at the top
  make-icons.mjs       Favicon PNG and OG card
docs/
  palette.md           What every colour means and how to add one
  maintaining.md        This file
```

Two rules worth knowing before changing anything:

**Every colour lives in `src/styles/theme.css`.** The only exception is
`public/favicon.svg`, which cannot read CSS. Change a colour there and it must
be changed in the favicon by hand — nothing will warn you.

**The timeline's alignment is load-bearing.** The `|` line and the `//|` line
share a left edge, with the comment pipe exactly two characters right. It holds
only while every glyph shares one font and one size. `QueryLines.astro` says so
at the top; believe it.

Both are set out in full in [`CLAUDE.md`](../CLAUDE.md), which is the standing
description of how this site is meant to be built.
