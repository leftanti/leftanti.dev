# leftanti.dev

Astro static site → GitHub Pages at apex domain **leftanti.dev**. A cyber security blog and resource library.

Task-level requirements live in [docs/BUILD_PROMPT.md](docs/BUILD_PROMPT.md). **This file holds only the rules that must hold on every future change.** When the two disagree, BUILD_PROMPT.md wins on *what to build*; this file wins on *how*.

## Identity and privacy

- The author publishes as **leftanti** (after the KQL join type). **The real name appears nowhere** — not in content, config, `package.json`, metadata, OG tags, or commit history.
- Commits use the repo-local anonymous identity. Verify with `git config user.name` before committing; it must return `leftanti`.

## Zero third-party requests

No CDNs, no Google Fonts, no analytics, no embeds, no external scripts or stylesheets. Fonts are self-hosted `.woff2` files committed to the repo. **A built page makes requests to its own origin only.** CI sets `ASTRO_TELEMETRY_DISABLED=1`.

## Single sources of truth

- **All colours live in `src/styles/theme.css`** as CSS custom properties. No hex values anywhere else. The one documented exception is `public/favicon.svg`, which cannot read CSS variables — retune it whenever `--bg` or the brand green changes.
- **Spacing and type use the scale defined in `theme.css`.** Incidental one-off layout values inline are fine; anything reused belongs in the scale.
- **`src/config/sections.ts` is the only place section config exists** — key, PascalCase display name, nav label, colour variable, route. Every component reads from it. Adding a section is one entry here plus a folder, never a hex value hunted through templates.

## Colour is functional, not decorative

Dark, near-black, monospace-forward. The chrome is neutral. **Each section owns exactly one muted hue**, used only for its section name, its pipe glyph, its nav link, and the header logo on its pages. Nothing else on the page is coloured.

**A hue means one subject, everywhere.** Resource categories on `/resources` are coloured, but they add no colours — each borrows the hue of the section it relates to, so the KQL references category is the same green as `KqlLibrary`. They wear it in exactly the two places a section does: the category name and its pipe glyphs. The mapping is data (`colorVar` in `src/data/resources.json`), never hardcoded in a template. Adding a seventh hue for a category would break the scheme; map it to an existing section instead.

**Four unclaimed hues** (`--spare-*`) sit in `theme.css` for sections that do not exist yet, referenced by nothing until claimed. [docs/palette.md](docs/palette.md) is the full reference: what every hue means, where colour is allowed to appear, the steps to add a section or a resource category, and the contrast and separation constraints a new hue must satisfy. **Read it before adding or retuning any colour.**

Banned everywhere: gradients, glow, glitch effects, matrix rain, and all animation — the single exception being one blinking block cursor.

Mono for section names, nav, metadata, code, and the site mark. Sans for entry titles and body copy. Body copy ~70ch max. Nothing below 10px.

## The logo

A left anti join rendered literally: two overlapping circles, the left one filled with the intersection masked out, the right one an unfilled outline in `--comment-mark`.

- **One shared SVG component.** Never redrawn inline anywhere.
- The filled shape uses `fill="currentColor"` so the header mark **inherits the current section's colour**, falling back to **`--brand`** on the home page and any page without a section. The mark is never neutral — it is the site's own identity, not chrome, which is why it is the one coloured thing on a page that has no section.
- **Canonical brand green is `--brand` (`#6fae94`)** — the header mark wherever no section owns the page, plus `favicon.svg`, the apple-touch-icon, and OG images. Anywhere the site represents itself rather than a section. This deliberately matches `--section-kql`; that overlap is intended, not a bug, and it is why the mark looks the same on the home page as on `/kql`.

## The timeline pattern

The site's signature element, and the thing most easily broken by a careless edit. Each entry is a miniature KQL query — the section name where a Sentinel table name would go, the title piped off it, metadata as a commented-out pipe stage:

```
KqlLibrary
| Detecting OAuth device code phishing
//| 2026-08-04  [SigninLogs] [T1528]
```

- **Alignment is load-bearing.** The `|` line and the `//|` line start at the same left edge, with `//` occupying the first two character cells so the comment line's pipe sits exactly two glyphs right. **Both pipe glyphs must be the same font-size** or the alignment breaks.
- Metadata pills are hairline-outlined (`0.5px solid`, 3px radius), **never filled**.
- **All metadata fields are optional.** Render only what the frontmatter provides. Never render an empty pill or a placeholder value.
- Decorative glyphs are `aria-hidden`.

## Authoring must never require template edits

Adding content is: drop a markdown file in a folder, push. Adding a *collection* is: add to `sections.ts` → add the zod schema → create the folder → copy a listing/detail page pair. Both stay true only if **listing and detail pages remain thin wrappers around shared layout components** — never one-off pages. Any collection with a date in its schema joins the home timeline automatically.

Every collection has a zod schema so bad frontmatter fails the build with a clear error. `draft: true` excludes an entry from production.

## Content boundaries

Everything published is built from scratch on the owner's own time and infrastructure. **Nothing derives from any employer's or client's environment** — no real tenant names, client data, internal rule IDs, or environment specifics, in examples or anywhere else. Use generic, invented examples.

## Client-side JS

Only where a feature genuinely needs it: code-block copy buttons, and a theme toggle if one is ever built. Nothing else ships JS.

Reach for native HTML before scripting. The collapsible categories on `/resources` are `<details>`/`<summary>`, so that page ships **zero** JavaScript and still expands, takes keyboard focus, and announces its own state. Copy buttons are the only genuine exception, and they are injected at runtime so no dead control renders when JS is off.

## Environment

- Windows 11, PowerShell 5.1 — `&&` and `||` are unavailable, prefer PowerShell syntax.
- Node 24.19.0 LTS, **Astro 7** (7.2.0 installed, 2026-08-09). Verified, not assumed — re-check with `npm ls astro` and correct this line if it moves.
- `node` is not always on the shell `PATH` here; it lives at `C:\Program Files\nodejs`.
- Fonts are copied to `public/fonts/` by `npm run fonts`. The committed `.woff2` files are self-hosted originals, not build artefacts — don't gitignore them.

## Before considering any change done

Run `npm run build` and fix errors. Check the change didn't hardcode a colour, bypass `sections.ts`, or break the pipe alignment.
