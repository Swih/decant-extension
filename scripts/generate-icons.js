/**
 * Generate PNG icons from logo.svg at all required sizes.
 * Run: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SVG_PATH = resolve(ROOT, 'assets/logo.svg');
const ICONS_DIR = resolve(ROOT, 'assets/icons');

const SIZES = [16, 32, 48, 128];

const svgBuffer = readFileSync(SVG_PATH);

for (const size of SIZES) {
  const output = resolve(ICONS_DIR, `icon-${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(output);

  const stats = await sharp(output).metadata();
  console.log(`  icon-${size}.png  ${stats.width}x${stats.height}  ${stats.format}`);
}

console.log('\nDone! All icons generated in assets/icons/');
