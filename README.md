# leftanti.dev

A static site — cyber security notes, KQL, and detection engineering — built
with [Astro](https://astro.build) and published to GitHub Pages at
**[leftanti.dev](https://leftanti.dev)**.

The site's signature element renders every entry as a miniature KQL query: the
section name where a Sentinel table name would go, the title piped off it,
metadata as a commented-out pipe stage below.

```
DetectionEngineering
| Detecting OAuth device code phishing
//| 2026-08-04  [query] [SigninLogs] [T1528]
```

## Stack

- [Astro](https://astro.build) with content collections, deployed statically
- Zod schemas validate every entry's frontmatter at build time
- [Shiki](https://shiki.style) for syntax highlighting, including Kusto (KQL)
- A scheduled GitHub Action aggregates and filters security news into a threat
  intel digest, with a second pass that fetches and counts real indicators in
  each linked article
- Deployed via GitHub Actions to GitHub Pages

## Privacy and scope

No trackers, no analytics, no CDNs, no third-party fonts. A built page makes
requests to its own origin and nowhere else. Almost nothing ships client-side
JavaScript — a copy-to-clipboard button on code blocks is the only exception.

Everything published is built from scratch on the site owner's own time and
infrastructure. Nothing derives from any employer's or client's environment —
examples throughout are generic and invented.

## Development

See [`docs/maintaining.md`](docs/maintaining.md) for local setup, the content
model, and how the deploy and threat-intel workflows fit together.
