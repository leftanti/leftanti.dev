# leftanti.dev

A static site — cyber security notes, KQL, and detection engineering — built
with [Astro](https://astro.build) and published to GitHub Pages at
**leftanti.dev**.

No trackers, no analytics, no CDNs. A built page makes requests to its own
origin and nowhere else. Five of the thirty-nine pages ship any JavaScript at
all — the entry pages, purely for the copy button on code blocks.

- [Running it locally](#running-it-locally)
- [Adding content](#adding-content)
- [Adding a new collection](#adding-a-new-collection)
- [The threat intel digest](#the-threat-intel-digest)
- [How deploys work](#how-deploys-work)
- [First-time setup](#first-time-setup) — repo, Pages, DNS
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
| `src/content/kql/` | `/kql/<name>` | Reusable queries |
| `src/content/hunting/` | `/hunting/<name>` | Hunt write-ups |
| `src/content/rules/` | `/rules/<name>` | Detection write-ups |
| `src/content/cheatsheets/` | `/cheatsheets/<name>` | Study references |
| `src/content/notes/` | `/notes/<name>` | Everything else |

The filename becomes the URL, so `failed-signon-burst.md` is served at
`/kql/failed-signon-burst`.

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
| `dataTable` | kql, hunting, rules | One value or a list |
| `technique` | kql, hunting, rules | ATT&CK IDs — `T1110` or `T1110.003` |
| `severity` | rules | One of informational, low, medium, high, critical |
| `cert` | cheatsheets | e.g. `BTL2`. Also groups the listing page |

**All of them are optional.** A cheat sheet has no data table; the page renders
only what you give it and never an empty placeholder.

`draft: true` keeps an entry out of the built site entirely. It still shows in
`npm run dev`, marked with a `draft` pill, so you can see work in progress
without publishing it.

### If you get the frontmatter wrong

The build fails and tells you which file and which field. The schemas are
strict, so a misspelled key is an error rather than a silently ignored value:

```
[InvalidContentEntryDataError] kql → my-entry data does not match collection schema.
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

Both feed the tag pages, so nothing is lost either way.

---

## Adding a new collection

Five steps. [`docs/palette.md`](docs/palette.md) has this worked through end to
end with the actual code, including how to claim a colour.

1. Add a hue to `src/styles/theme.css` (see the palette doc — the reserve is
   used up, so this now needs deriving)
2. Add an entry to `SECTIONS` in `src/config/sections.ts`
3. Add the collection and its schema to `src/content.config.ts`
4. Create `src/content/<key>/`
5. Copy `src/pages/kql/index.astro` and `src/pages/kql/[...id].astro` into
   `src/pages/<key>/` and change the four occurrences of `'kql'`

Any collection whose schema has a date joins the home timeline, the RSS feed
and the tag pages automatically.

---

## The threat intel digest

`/intel` is filtered security headlines from twenty feeds, refreshed every six
hours. It links out and never reproduces an article.

**All tuning is in one block** at the top of
[`scripts/fetch-intel.mjs`](scripts/fetch-intel.mjs). You should not need to
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
categories live in [`src/config/intel-kinds.mjs`](src/config/intel-kinds.mjs),
shared by the script and the pages so the two cannot drift apart.

**`/intel/ioc` is the one to bookmark** if you are pulling addresses for block
lists. Every shortlisted article is fetched and its indicators counted for
real — hashes, defanged strings, and addresses with every reserved range
excluded. The counts on each row tell you which report is worth opening.

They are evidence that a report is worth your time. They are not a claim that
any address is hostile. **Verify before blocking anything.**

If it feels too loose, raise `articleScan.minEvidence` from 3 to 5: at 3, an
article qualifies on an "Indicators of Compromise" heading alone, even with no
artefacts under it.

### Scheduled workflows go to sleep

GitHub disables scheduled workflows on a repository with no activity for around
60 days. **If the digest goes stale, that is almost always why.** Any push
re-enables it. There is nothing to repair, and you can always trigger a run by
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

So: **push to `main` and it deploys.** Nothing else to do.

---

## First-time setup

Everything below is done once, by hand, and cannot be scripted from here.

### 1. Create the repository

Public, so GitHub Pages works without a paid plan. Then:

```bash
git remote add origin https://github.com/<your-username>/leftanti.dev.git
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

At your registrar, for the apex domain. These four A records are GitHub's and
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
| CNAME | `www` | `<your-username>.github.io` |

> Replace `<your-username>` with your actual GitHub username — it is the only
> value here that is specific to you.

### 5. Turn on HTTPS

Once DNS has propagated, **Settings → Pages → Enforce HTTPS**. The tick box is
greyed out until GitHub has issued the certificate, which usually takes minutes
but is allowed to take up to 24 hours.

### 6. Fill in your contact details

`src/config/site.ts` has `github` and `email` set to `null`, and the About page
omits its contact section entirely rather than show a dead link. Set either one
and it appears.

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
  content/             Your markdown. One folder per collection
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
```

Two rules worth knowing before you change anything:

**Every colour lives in `src/styles/theme.css`.** The only exception is
`public/favicon.svg`, which cannot read CSS. Change a colour there and you must
change it in the favicon by hand — nothing will warn you.

**The timeline's alignment is load-bearing.** The `|` line and the `//|` line
share a left edge, with the comment pipe exactly two characters right. It holds
only while every glyph shares one font and one size. `QueryLines.astro` says so
at the top; believe it.

Both are set out in full in [CLAUDE.md](CLAUDE.md), which is the standing
description of how this site is meant to be built.
