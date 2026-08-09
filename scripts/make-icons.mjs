/**
 * make-icons.mjs — render the raster icons the site cannot express as SVG.
 *
 *   npm run icons
 *
 * Two outputs, both committed to the repo like the fonts are:
 *
 *   public/apple-touch-icon.png   180x180, because iOS ignores SVG here
 *   public/og.png                 1200x630, because no social platform
 *                                 renders an SVG preview card
 *
 * Both are drawn from the same left anti join as public/favicon.svg and
 * src/components/LogoMark.astro. This is the third and last place the mark is
 * defined, and it exists only because sharp needs a source it can rasterise at
 * a different aspect ratio.
 *
 * COLOUR
 * Hardcoded, and unavoidably so — this runs in Node, with no CSS to read. The
 * values mirror src/styles/theme.css:
 *
 *   #0f100f  bg
 *   #6fae94  brand
 *   #3f4441  comment-mark
 *   #eceeed  text
 *   #6b726f  text-fainter
 *
 * Retune those in theme.css and you must re-run this script. Nothing warns you.
 * (Names are written without their leading dashes on purpose: a double hyphen
 * is illegal inside an XML comment and would break the SVG strings below.)
 *
 * TYPEFACE
 * The wordmark renders in whatever monospace the generating machine has, not in
 * JetBrains Mono. sharp rasterises through librsvg, which reads system fonts and
 * cannot load the repo's .woff2. The output is committed, so this is stable
 * rather than varying per build — but it will not be pixel-identical to the site
 * header. To match exactly, install JetBrains Mono on the machine before running
 * this, or convert the wordmark to paths.
 */

import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public');

const BG = '#0f100f';
const BRAND = '#6fae94';
const OUTLINE = '#3f4441';
const TEXT = '#eceeed';
const FAINT = '#6b726f';

/**
 * The mark, as an SVG fragment at a given scale and origin.
 *
 * Geometry matches favicon.svg: circles of r=7.5 with centres 10 apart, and a
 * cut radius of r plus half the stroke so the filled crescent stops exactly at
 * the outer edge of the outline.
 */
function mark({ x, y, scale, id }) {
  const cx1 = 10.75;
  const cx2 = 20.75;
  const cy = 16;
  const r = 7.5;
  const cut = r + 0.75;

  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <clipPath id="${id}" clipPathUnits="userSpaceOnUse">
        <path clip-rule="evenodd"
              d="M0 0 H32 V32 H0 Z M${cx2 + cut} ${cy} A${cut} ${cut} 0 0 1 ${cx2 - cut} ${cy} A${cut} ${cut} 0 0 1 ${cx2 + cut} ${cy} Z" />
      </clipPath>
      <circle cx="${cx1}" cy="${cy}" r="${r}" fill="${BRAND}" clip-path="url(#${id})" />
      <circle cx="${cx2}" cy="${cy}" r="${r}" fill="none" stroke="${OUTLINE}" stroke-width="1.5" />
    </g>`.replace(/\s+/g, ' ');
}

/** 180x180, rounded by iOS itself, so the artwork is a plain square. */
const appleTouchIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="${BG}" />
  ${mark({ x: 26, y: 26, scale: 4, id: 'a' })}
</svg>`;

/**
 * 1200x630, the aspect ratio every social card crops to. The mark sits left of
 * the wordmark, the same arrangement as the site header, so a shared link looks
 * like the page it came from.
 */
const ogImage = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}" />
  ${mark({ x: 96, y: 200, scale: 5, id: 'b' })}
  <text x="300" y="292" font-family="monospace" font-size="64">
    <tspan fill="${FAINT}">~/</tspan><tspan fill="${TEXT}">leftanti</tspan>
  </text>
  <text x="98" y="412" font-family="monospace" font-size="30" fill="${FAINT}">
    // detection engineering, KQL, and threat hunting
  </text>
</svg>`;

await mkdir(OUT, { recursive: true });

const targets = [
  { name: 'apple-touch-icon.png', svg: appleTouchIcon },
  { name: 'og.png', svg: ogImage },
];

for (const { name, svg } of targets) {
  const dest = resolve(OUT, name);
  const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(dest, buffer);
  const { width, height } = await sharp(buffer).metadata();
  console.log(`  ok   public/${name}  ${width}x${height}  (${Math.round(buffer.length / 1024)} KB)`);
}

console.log('\nIcons are in public/. Commit them.');
