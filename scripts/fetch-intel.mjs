/**
 * fetch-intel.mjs — build the threat intel digest.
 *
 *   npm run intel
 *
 * Fetches the feeds below, filters them, and writes the surviving items to
 * src/data/intel.json. A GitHub Actions workflow runs this every six hours and
 * commits the file if it changed; that commit triggers the normal Pages deploy.
 *
 * The page built from this links out and never reproduces an article. Only a
 * headline, a source, a timestamp, and a short trimmed snippet are stored.
 *
 * ============================================================================
 * EVERYTHING TUNABLE IS IN THE `CONFIG` BLOCK BELOW.
 * Nothing under it needs editing to add a feed, change a keyword, or move a
 * threshold. If you find yourself editing the logic to tune the output, the
 * config is missing a knob — add the knob.
 * ============================================================================
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { INTEL_KINDS } from '../src/config/intel-kinds.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = resolve(ROOT, 'src/data/intel.json');

// ===========================================================================
// CONFIG
// ===========================================================================

const CONFIG = {
  /**
   * Feeds to poll. `name` is what the page shows as the source, so keep it
   * short. Any RSS 2.0 or Atom feed works. A feed that is dead, slow, or
   * malformed is logged and skipped — it never fails the run.
   *
   * Weighted towards vendors who publish intrusion write-ups with indicators
   * and technique detail, rather than vulnerability catalogues. The two news
   * feeds are here for speed: they break a story hours before anyone publishes
   * the analysis of it.
   *
   * Deliberately NOT here: the MSRC Security Update Guide
   * (api.msrc.microsoft.com/update-guide/rss). It is every CVE Microsoft
   * catalogues, including Linux kernel ones for Azure, several thousand of
   * them, with summaries reading "Information published." It is a vulnerability
   * management source, and it drowned this digest when it was included. A
   * Microsoft CVE that is actually being exploited reaches the page through the
   * news feeds and CISA instead, with the exploitation context attached.
   *
   * Verified dead at time of writing, so do not bother re-adding without
   * checking: Mandiant/Google TI, Sekoia, Volexity, Trend Micro. The MSRC blog
   * (msrc.microsoft.com/blog/feed) answers 200 with the SPA's HTML, never XML.
   *
   * Also good, left off only to keep the volume sane: ESET research
   * (feeds.feedburner.com/eset/blog) and Rapid7 (blog.rapid7.com/rss/).
   */
  feeds: [
    // Intrusion write-ups: indicators, timelines, technique detail.
    //
    // These carry a much longer `maxAge` than the news feeds. They publish
    // monthly or less — The DFIR Report's newest post was 41 days old when this
    // was written — so the default news window discards the entire feed and the
    // best source on the list contributes nothing. A three-month-old intrusion
    // write-up with a full indicator list has not stopped being useful.
    // `iocSource` marks a publisher whose write-ups reliably carry indicators —
    // hashes, domains, IPs, C2 infrastructure — at the bottom of the post.
    //
    // This is a property of the publisher, not of the words in the feed. A
    // DFIR Report post always ends in an indicator table whether or not the
    // 220-character RSS snippet happens to say "IOC", so guessing from text
    // alone misses most of them. Marking the source is far more reliable.
    { name: 'The DFIR Report', url: 'https://thedfirreport.com/feed/', maxAge: 270, iocSource: true },
    { name: 'Red Canary', url: 'https://redcanary.com/feed/', maxAge: 120, iocSource: true },
    { name: 'Microsoft Security', url: 'https://www.microsoft.com/en-us/security/blog/feed/', maxAge: 120, iocSource: true },
    { name: 'Cisco Talos', url: 'https://blog.talosintelligence.com/rss/', maxAge: 90, iocSource: true },
    { name: 'Unit 42', url: 'https://unit42.paloaltonetworks.com/feed/', maxAge: 90, iocSource: true },
    { name: 'Securelist', url: 'https://securelist.com/feed/', maxAge: 90, iocSource: true },
    { name: 'Huntress', url: 'https://www.huntress.com/blog/rss.xml', maxAge: 90, iocSource: true },
    { name: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed_full.xml', maxAge: 45, iocSource: true },

    // Breaking coverage. Left on the default window: these publish daily, and
    // a wide window here would let old news outrank today's on score.
    { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' },
    { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },

    // Kept for one reason: KEV additions are the authoritative "this CVE is
    // being used against real companies" signal. The rest of what this feed
    // publishes is ICS and vulnerability advisories, which the gate below
    // drops for having no exploitation signal in them.
    { name: 'CISA', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml' },
  ],

  /**
   * THE GATE. An item must match at least `minSignals` of these to appear at
   * all, however well it scores afterwards.
   *
   * This is what keeps the page about active threats rather than about
   * vulnerabilities. A bulk advisory titled "CVE-2026-64584 Windows Kernel
   * Elevation of Privilege Vulnerability" matches nothing here and is dropped.
   * The same CVE written up as "actively exploited in ransomware attacks"
   * matches three signals and stays.
   *
   * Raise `minSignals` to 2 to demand corroboration — stricter, and it will
   * drop some genuine single-angle stories. Adding a term here widens what the
   * page is *about*; adding one to `weights` only changes what it prefers.
   */
  minSignals: 1,

  signals: [
    // Exploitation actually happening, as opposed to being possible.
    'actively exploited',
    'being exploited',
    'exploited in',
    'exploitation attempts',
    'under active attack',
    'in the wild',
    'known exploited',
    'zero-day',
    '0-day',

    // Who is doing it.
    'campaign',
    'threat actor',
    'threat group',
    'APT',
    'nation-state',
    'state-sponsored',
    'affiliate',

    // What happened.
    'intrusion',
    'compromise',
    'compromised',
    'breach',
    'breached',
    'incident response',
    'data theft',
    'extortion',
    'ransomware',

    // What was used.
    'malware',
    'backdoor',
    'implant',
    'remote access trojan',
    'infostealer',
    'stealer',
    'loader',
    'dropper',
    'web shell',
    'webshell',
    'wiper',
    'botnet',
    'supply chain',

    // How they got in and moved.
    'phishing',
    'spearphishing',
    'vishing',
    'smishing',
    'social engineering',
    'ClickFix',
    'fake captcha',
    'adversary-in-the-middle',
    'AiTM',
    'MFA bypass',
    'MFA fatigue',
    'credential theft',
    'token theft',
    'session hijacking',
    'initial access',
    'lateral movement',
    'privilege escalation',
    'persistence',
    'exfiltration',
    'command and control',
    'living off the land',
    'watering hole',

    // The things you can actually action.
    'IOC',
    'IOCs',
    'indicators of compromise',
    'TTP',
    'TTPs',
    'ATT&CK',
    'detection opportunit',
    'threat hunting',
  ],

  /**
   * RANKING. Applied after the gate, and it decides which items survive the
   * per-feed cap when a feed offers more than it is allowed to contribute.
   *
   * Title matches count `titleWeight` times, because a term in a headline says
   * far more about an article than the same term buried in a summary.
   *
   * Nothing here can admit an item on its own — that is the gate's job. These
   * only express what matters most when there is more news than room.
   */
  titleWeight: 2,

  /**
   * Floor on the ranking score, applied after the gate.
   *
   * The gate decides what kind of story this is; this decides whether it has
   * anything at all to do with this site. An item scoring zero matched not one
   * ranking term — no product, no technique, no actor.
   *
   * It exists because of items like the ICS advisory "ABB Ability Zenon",
   * which cleared the gate on the word "compromise" in the phrase "or
   * compromise data" — the ordinary verb, not a security event. It scored
   * zero, and at a floor of 1 it is gone. Raise this to tighten relevance;
   * set it to 0 to let the gate decide alone.
   */
  minScore: 1,

  weights: {
    // Directly actionable.
    'indicators of compromise': 5,
    IOC: 5,
    IOCs: 5,
    'known exploited': 5,
    'actively exploited': 5,
    'detection opportunit': 4,
    'ATT&CK': 4,
    TTP: 4,
    TTPs: 4,

    // The stack this site is about.
    Sentinel: 4,
    Defender: 4,
    Entra: 4,
    KQL: 4,
    'Microsoft 365': 3,
    Azure: 2,
    Windows: 1,
    identity: 2,

    // Shape of the story.
    campaign: 4,
    'threat actor': 4,
    intrusion: 3,
    ransomware: 3,
    'supply chain': 3,
    ClickFix: 4,
    AiTM: 3,
    'in the wild': 3,
    'zero-day': 3,
    backdoor: 2,
    stealer: 2,
    phishing: 2,
    'threat hunting': 3,
    APT: 3,
  },

  /**
   * CLASSIFICATION lives in src/config/intel-kinds.mjs, because the pages need
   * the same definitions to render labels, hues, and the /intel/<key> views,
   * and they cannot import this file — it runs on import. Tune the categories
   * there; everything else about the digest is tuned here.
   */
  kinds: INTEL_KINDS,

  /**
   * Blocklist. One match anywhere in the title or summary drops the item
   * outright, whatever it scored and whatever it signalled. A veto, not a
   * negative weight.
   */
  block: [
    'webinar',
    'sponsored',
    'deal',
    'deals',
    'podcast',
    'giveaway',
    'discount',
    'coupon',
    'course bundle',
    'best vpn',
    'buying guide',
    'gift guide',
    'is hiring',
    'we are hiring',
  ],

  /** Items to keep overall, newest first. */
  maxItems: 50,

  /**
   * Most items any single feed may contribute, applied before the overall cap.
   *
   * Without this the largest feed wins on volume alone: the MSRC advisory feed
   * publishes thousands of CVEs and would otherwise fill the whole digest,
   * burying everything else. Raise it to let a prolific source through; lower
   * it for a more even spread across sources.
   */
  maxPerFeed: 12,

  /**
   * Default age limit, in days. A feed can override it with `maxAge`, which
   * the slower analysis sources above do.
   */
  maxAgeDays: 30,

  /**
   * Characters of summary to keep. The page links out; it never reprints.
   *
   * This length also bounds what the filter reads. See `assess`: matching runs
   * against the title and this snippet, not the full body.
   */
  snippetLength: 220,

  /** Per-feed network timeout. A slow feed must not hang the whole run. */
  timeoutMs: 15000,

  /** Sent so feed owners can see who is polling them. */
  userAgent: 'leftanti.dev-intel/1.0 (+https://leftanti.dev)',
};

// ===========================================================================
// Nothing below here needs editing to tune the output.
// ===========================================================================

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  // Feed titles frequently arrive as CDATA or with entities; let the parser
  // normalise both rather than unpicking them later.
  processEntities: true,
});

/** Strips tags and collapses whitespace. Feed summaries are full of markup. */
function toPlainText(value) {
  if (value == null) return '';
  const raw = typeof value === 'object' ? (value['#text'] ?? '') : String(value);
  return (
    raw
      .replace(/<[^>]*>/g, ' ')
      // Numeric character references, decimal and hex. Feeds are full of them —
      // curly quotes and dashes especially — and the XML parser leaves them
      // alone inside CDATA, so titles arrive reading "Toy Ghouls&#8217; new toy".
      .replace(/&#(\d+);/g, (_, n) => safeCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCodePoint(parseInt(h, 16)))
      .replace(/&nbsp;/gi, ' ')
      .replace(/&rsquo;|&lsquo;/gi, '’')
      .replace(/&ldquo;|&rdquo;/gi, '"')
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–')
      .replace(/&hellip;/gi, '…')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      // Last, so a decoded "&amp;lt;" does not become a tag.
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Guards against malformed references producing an exception or a control char. */
function safeCodePoint(code) {
  if (!Number.isInteger(code) || code < 32 || code > 0x10ffff) return ' ';
  try {
    return String.fromCodePoint(code);
  } catch {
    return ' ';
  }
}

function truncate(text, length) {
  if (text.length <= length) return text;
  // Cut on a word boundary so the snippet does not end mid-word.
  const cut = text.slice(0, length);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > length * 0.6 ? lastSpace : length).trimEnd()}…`;
}

/**
 * Whole-word, case-insensitive match. Terms ending in `-` (like `CVE-`) are
 * treated as prefixes instead, so they match the identifier that follows.
 */
function matches(term, haystack) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = term.endsWith('-')
    ? new RegExp(`\\b${escaped}\\d`, 'i')
    : new RegExp(`\\b${escaped}\\b`, 'i');
  return pattern.test(haystack);
}

/**
 * Which kind an item is. First match wins; the last kind is the fallback.
 * `iocSource` is a property of the publisher, so it is passed in rather than
 * read out of the text.
 */
function classify(title, summary, isIocSource) {
  const both = `${title} ${summary}`;

  for (const kind of CONFIG.kinds) {
    if (kind.fromIocSources && isIocSource) return kind.key;
    if (kind.match?.some((term) => matches(term, both))) return kind.key;
    if (!kind.match && !kind.fromIocSources) return kind.key;
  }

  return CONFIG.kinds[CONFIG.kinds.length - 1].key;
}

/**
 * Stable id, derived from the article URL so the same story keeps the same id
 * across runs. Astro's file loader requires one per entry.
 */
function idFor(url) {
  return createHash('sha1').update(canonicalUrl(url)).digest('hex').slice(0, 12);
}

/** Query strings and trailing slashes vary between feeds carrying one story. */
function canonicalUrl(url) {
  return url.split('?')[0].replace(/\/$/, '').toLowerCase();
}

/**
 * Decides whether an item belongs on the page, and how strongly.
 *
 * Three stages, in order: blocklist veto, signal gate, then ranking. An item
 * that clears the gate is on the page; the score only orders it against the
 * others and decides what survives the per-feed cap.
 *
 * IMPORTANT: `summary` here is the trimmed snippet, not the full body, and
 * that is deliberate. CISA's ICS advisories carry between nine and thirty
 * thousand characters of boilerplate, in which words like "persistence" and
 * "compromise" turn up incidentally — enough that twenty-six of thirty
 * advisories cleared the gate on text nobody would ever read. Filtering on the
 * title and the snippet means the page is judged on what it actually shows.
 */
function assess(title, summary) {
  const both = `${title} ${summary}`;

  for (const term of CONFIG.block) {
    if (matches(term, both)) return { blocked: term };
  }

  // The gate. Signals are collected from the title and summary alike — an
  // indicator list in the body is worth as much as one in the headline.
  const signals = CONFIG.signals.filter((term) => matches(term, both));
  if (signals.length < CONFIG.minSignals) return { gated: true, signals };

  let total = 0;
  for (const [term, weight] of Object.entries(CONFIG.weights)) {
    const inTitle = matches(term, title);
    const inSummary = matches(term, summary);
    if (!inTitle && !inSummary) continue;
    total += inTitle ? weight * CONFIG.titleWeight : weight;
  }

  return { total, signals };
}

/** RSS 2.0 and Atom have different shapes; normalise both to one item. */
function itemsFrom(parsed) {
  const rss = parsed?.rss?.channel?.item;
  if (rss) return (Array.isArray(rss) ? rss : [rss]).map(fromRss);

  const atom = parsed?.feed?.entry;
  if (atom) return (Array.isArray(atom) ? atom : [atom]).map(fromAtom);

  // RDF, still used by a few older feeds.
  const rdf = parsed?.['rdf:RDF']?.item;
  if (rdf) return (Array.isArray(rdf) ? rdf : [rdf]).map(fromRss);

  return [];
}

function fromRss(item) {
  return {
    title: toPlainText(item.title),
    link: toPlainText(item.link),
    published: item.pubDate ?? item['dc:date'] ?? null,
    summary: toPlainText(item.description ?? item['content:encoded'] ?? ''),
  };
}

function fromAtom(entry) {
  // Atom links are attribute-bearing and there may be several; the alternate
  // link is the article, anything else is a comment feed or a self-reference.
  const link = Array.isArray(entry.link)
    ? (entry.link.find((l) => l['@_rel'] === 'alternate') ?? entry.link[0])
    : entry.link;

  return {
    title: toPlainText(entry.title),
    link: typeof link === 'object' ? (link?.['@_href'] ?? '') : toPlainText(link),
    published: entry.published ?? entry.updated ?? null,
    summary: toPlainText(entry.summary ?? entry.content ?? ''),
  };
}

async function fetchFeed(feed) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'user-agent': CONFIG.userAgent, accept: 'application/rss+xml, application/xml, text/xml, */*' },
      redirect: 'follow',
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const items = itemsFrom(parser.parse(xml));
    if (items.length === 0) throw new Error('no items found — feed shape not recognised');

    return items;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const collected = [];
  const report = [];
  let reachable = 0;

  // Sequential rather than parallel: five feeds is not worth the concurrency,
  // and one request at a time is politer to the people hosting them.
  for (const feed of CONFIG.feeds) {
    try {
      const items = await fetchFeed(feed);
      reachable++;

      const fromThisFeed = [];
      let blocked = 0;

      // Per-feed window, falling back to the global default.
      const cutoff = Date.now() - (feed.maxAge ?? CONFIG.maxAgeDays) * 24 * 60 * 60 * 1000;

      for (const item of items) {
        if (!item.title || !item.link) continue;

        const summary = truncate(item.summary, CONFIG.snippetLength);
        const result = assess(item.title, summary);

        if (result.blocked) {
          blocked++;
          continue;
        }
        if (result.gated) continue;
        if (result.total < CONFIG.minScore) continue;

        const published = item.published ? new Date(item.published) : null;
        const valid = published && !Number.isNaN(published.getTime());
        if (valid && published.getTime() < cutoff) continue;

        fromThisFeed.push({
          id: idFor(item.link),
          title: item.title,
          url: item.link,
          source: feed.name,
          published: valid ? published.toISOString() : new Date().toISOString(),
          summary,
          kind: classify(item.title, summary, Boolean(feed.iocSource)),
          score: result.total,
          // Shown as pills on the page: why this item is here, in its own
          // words. Capped at three so the metadata line stays readable.
          matched: result.signals.slice(0, 3),
        });
      }

      // Ranked before capping, so a feed that offers more than its allowance
      // contributes its most relevant items rather than merely its most recent.
      // The final list is re-sorted by date below — a digest reads
      // chronologically even though it was selected by relevance.
      fromThisFeed.sort((a, b) => b.score - a.score || new Date(b.published) - new Date(a.published));
      const kept = fromThisFeed.slice(0, CONFIG.maxPerFeed);
      collected.push(...kept);

      const capped = fromThisFeed.length > kept.length ? ` (capped from ${fromThisFeed.length})` : '';
      report.push(
        `  ok   ${feed.name.padEnd(22)} ${String(items.length).padStart(4)} items, ${kept.length} kept${capped}, ${blocked} blocked`
      );
    } catch (error) {
      // A dead or malformed feed must never fail the run. Log and continue.
      report.push(`  SKIP ${feed.name.padEnd(22)} ${error.message}`);
    }
  }

  console.log(report.join('\n'));

  if (reachable === 0) {
    // Every feed failing means a network or DNS problem, not a quiet news day.
    // Writing an empty file here would silently wipe the page.
    console.error('\nNo feed was reachable. Leaving the existing file untouched.');
    process.exit(1);
  }

  // De-duplicate: the same story is often syndicated to more than one feed.
  // Highest-scoring first, so the copy that is kept is the better-written one.
  const seen = new Set();
  const deduped = collected
    .sort((a, b) => b.score - a.score || new Date(b.published) - new Date(a.published))
    .filter((item) => {
      const key = canonicalUrl(item.url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Select by relevance, then display by date.
  //
  // Cutting by date instead would delete the deep write-ups every time: they
  // are the oldest things here by a wide margin, so a date-ordered cap removed
  // every DFIR Report and Red Canary item while keeping middling news. The
  // whole reason those feeds are on the list is that their write-ups are worth
  // more than the day's headlines.
  const items = deduped
    .slice(0, CONFIG.maxItems)
    .sort((a, b) => new Date(b.published) - new Date(a.published));

  // `generated` deliberately excluded from the file: it would change on every
  // run and produce a commit even when no story changed.
  const next = JSON.stringify(items, null, 2) + '\n';

  const previous = await readFile(OUT_FILE, 'utf8').catch(() => null);
  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, next);

  console.log(`\n${items.length} items written to src/data/intel.json`);
  console.log(previous === next ? 'No change.' : 'File changed.');
}

await main();
