/**
 * intel-kinds.mjs — what a digest item can be, and what it looks like.
 *
 * Read by two things that cannot share much else:
 *   scripts/fetch-intel.mjs   classifies each item as it is fetched
 *   src/pages/intel/*.astro   renders the labels, hues, and filtered views
 *
 * It lives here rather than inside the fetch script's CONFIG block because the
 * pages cannot import that script — it runs its own `main()` on import. One
 * definition, two consumers, no drift.
 *
 * `.mjs` rather than `.ts` because the fetch script is plain Node and imports
 * it directly, the same reasoning as src/config/code-theme.mjs.
 *
 * ORDER IS PRIORITY ORDER. The first kind an item matches wins, so `ioc` sits
 * first on purpose: when a post is both an actively exploited CVE and an
 * indicator-bearing write-up, the indicators are the part you can act on today.
 *
 * The last entry is the fallback and must have no `match` and no
 * `fromIocSources` — every item has to land somewhere.
 */

/**
 * @typedef {object} IntelKind
 * @property {string} key         URL segment: /intel/<key>
 * @property {string} label       Shown as the table name on a row
 * @property {string} colorVar    CSS custom property holding its hue
 * @property {string} blurb       One line, used on the filtered view
 * @property {boolean} [fromIocSources] Everything from an `iocSource` feed counts
 * @property {string[]} [match]   Terms that classify an item as this kind
 */

/** @type {IntelKind[]} */
export const INTEL_KINDS = [
  {
    key: 'ioc',
    label: 'Indicators',
    colorVar: '--intel-ioc',
    blurb:
      'Reports whose articles were checked and found to contain indicators. Counts are measured, not guessed: open a report, read it, take the addresses. Verify every one before it goes anywhere near a block list — a count is evidence a report is worth your time, not that an address is hostile.',
    // Publisher-level, not text-level: a DFIR Report post always ends in an
    // indicator table whether or not its RSS snippet says so.
    fromIocSources: true,
    match: ['indicators of compromise', 'IOC', 'IOCs', 'indicators'],
  },
  {
    key: 'exploited',
    label: 'Exploited',
    colorVar: '--intel-exploited',
    blurb: 'Confirmed exploitation in the wild, including CISA KEV additions.',
    match: [
      'actively exploited',
      'being exploited',
      'exploited in',
      'known exploited',
      'exploitation attempts',
      'under active attack',
      'in the wild',
      'zero-day',
      '0-day',
    ],
  },
  {
    key: 'campaign',
    label: 'Campaign',
    colorVar: '--intel-campaign',
    blurb: 'Named actors and tracked campaigns.',
    match: [
      'campaign',
      'threat actor',
      'threat group',
      'APT',
      'nation-state',
      'state-sponsored',
      'affiliate',
    ],
  },
  {
    key: 'technique',
    label: 'Technique',
    colorVar: '--intel-technique',
    blurb:
      'New or shifting tradecraft — the ClickFix moment, before it has a name everyone already knows.',
    match: [
      'ClickFix',
      'fake captcha',
      'adversary-in-the-middle',
      'AiTM',
      'MFA bypass',
      'MFA fatigue',
      'living off the land',
      'watering hole',
      'supply chain',
      'social engineering',
      'initial access',
      'lateral movement',
      'token theft',
    ],
  },
  {
    key: 'other',
    label: 'Other',
    colorVar: '--section-intel',
    blurb: 'Everything else that cleared the gate.',
  },
];

/** Lookup by key. Returns the fallback kind rather than undefined. */
export function intelKind(key) {
  return INTEL_KINDS.find((k) => k.key === key) ?? INTEL_KINDS[INTEL_KINDS.length - 1];
}
