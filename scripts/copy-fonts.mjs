/**
 * copy-fonts.mjs — pull the self-hosted font files into public/fonts/.
 *
 * The site makes no third-party requests, so fonts are committed to the repo
 * rather than fetched at runtime. The @fontsource-variable packages are dev
 * dependencies purely as a verifiable source for the .woff2 files.
 *
 *   npm run fonts
 *
 * Run this once after `npm install`, and again if you bump the font packages.
 * The output filenames are fixed so src/styles/fonts.css never has to change.
 */

import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/fonts');

const FONTS = [
  {
    from: 'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
    to: 'jetbrains-mono.woff2',
  },
  {
    from: 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
    to: 'inter.woff2',
  },
];

await mkdir(OUT_DIR, { recursive: true });

let failed = false;

for (const font of FONTS) {
  const src = resolve(ROOT, font.from);
  const dest = resolve(OUT_DIR, font.to);
  try {
    await copyFile(src, dest);
    const { size } = await stat(dest);
    console.log(`  ok   public/fonts/${font.to}  (${Math.round(size / 1024)} KB)`);
  } catch (error) {
    failed = true;
    console.error(`  FAIL ${font.to} — could not read ${font.from}`);
    console.error(`       ${error.message}`);
  }
}

if (failed) {
  console.error('\nSome fonts were not copied. Run `npm install` first.');
  process.exit(1);
}

console.log('\nFonts are in public/fonts/. Commit them.');
