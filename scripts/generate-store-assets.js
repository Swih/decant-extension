/**
 * Generate Chrome Web Store assets:
 * - Store icon 128x128 (PNG 24-bit, no alpha)
 * - Small promo tile 440x280 (PNG 24-bit, no alpha)
 * - Marquee promo 1400x560 (PNG 24-bit, no alpha)
 * - Screenshot mockups 1280x800 (PNG 24-bit, no alpha)
 *
 * Run: node scripts/generate-store-assets.js
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'store/assets');
mkdirSync(OUT, { recursive: true });

const logoSvg = readFileSync(resolve(ROOT, 'assets/logo.svg'));

// ── 1. Store Icon 128x128 (no alpha — flatten to background) ──
async function storeIcon() {
  await sharp(logoSvg)
    .resize(128, 128, { fit: 'contain', background: { r: 15, g: 15, b: 20, alpha: 1 } })
    .flatten({ background: { r: 15, g: 15, b: 20 } })
    .png({ quality: 100 })
    .toFile(resolve(OUT, 'store-icon-128.png'));
  console.log('  store-icon-128.png (128x128)');
}

// ── 2. Small Promo Tile 440x280 ──
async function smallPromo() {
  const w = 440, h = 280;

  // Create gradient background
  const bg = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F0F14" />
          <stop offset="100%" stop-color="#1A1A2E" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)" />
      <text x="${w / 2}" y="90" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="#E8E8ED">Decant</text>
      <text x="${w / 2}" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#8B8B9E">Extract pure, AI-ready content</text>
      <text x="${w / 2}" y="152" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#8B8B9E">from any web page</text>

      <rect x="90" y="185" width="80" height="28" rx="6" fill="rgba(139,92,246,0.2)" stroke="#8B5CF6" stroke-width="1.5"/>
      <text x="130" y="204" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#A78BFA">Markdown</text>

      <rect x="180" y="185" width="80" height="28" rx="6" fill="rgba(99,102,241,0.2)" stroke="#6366F1" stroke-width="1.5"/>
      <text x="220" y="204" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#818CF8">JSON</text>

      <rect x="270" y="185" width="80" height="28" rx="6" fill="rgba(6,182,212,0.2)" stroke="#06B6D4" stroke-width="1.5"/>
      <text x="310" y="204" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#22D3EE">MCP</text>

      <text x="${w / 2}" y="248" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#5C5C6F">100% local — No tracking — Open source</text>
    </svg>
  `);

  await sharp(bg)
    .flatten({ background: { r: 15, g: 15, b: 20 } })
    .png()
    .toFile(resolve(OUT, 'small-promo-440x280.png'));
  console.log('  small-promo-440x280.png (440x280)');
}

// ── 3. Marquee Promo 1400x560 ──
async function marqueePromo() {
  const w = 1400, h = 560;

  const bg = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F0F14" />
          <stop offset="50%" stop-color="#1A1A2E" />
          <stop offset="100%" stop-color="#0F0F14" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8B5CF6" />
          <stop offset="100%" stop-color="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#mbg)" />

      <!-- Decorative circles -->
      <circle cx="200" cy="280" r="300" fill="rgba(139,92,246,0.03)" />
      <circle cx="1200" cy="280" r="300" fill="rgba(6,182,212,0.03)" />

      <!-- Title -->
      <text x="${w / 2}" y="180" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" fill="#E8E8ED">Decant</text>

      <!-- Gradient line -->
      <rect x="560" y="200" width="280" height="3" rx="1.5" fill="url(#accent)" opacity="0.6" />

      <!-- Subtitle -->
      <text x="${w / 2}" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="#8B8B9E">Decant the web. Extract pure, AI-ready content.</text>

      <!-- Format pills -->
      <rect x="410" y="310" width="140" height="44" rx="10" fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" stroke-width="2"/>
      <text x="480" y="338" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#A78BFA">Markdown</text>

      <rect x="570" y="310" width="120" height="44" rx="10" fill="rgba(99,102,241,0.15)" stroke="#6366F1" stroke-width="2"/>
      <text x="630" y="338" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#818CF8">JSON</text>

      <rect x="710" y="310" width="120" height="44" rx="10" fill="rgba(6,182,212,0.15)" stroke="#06B6D4" stroke-width="2"/>
      <text x="770" y="338" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#22D3EE">MCP</text>

      <rect x="850" y="310" width="140" height="44" rx="10" fill="rgba(16,185,129,0.15)" stroke="#10B981" stroke-width="2"/>
      <text x="920" y="338" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#34D399">AI-Ready</text>

      <!-- Bottom tagline -->
      <text x="${w / 2}" y="430" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#5C5C6F">One click. 100% local. No tracking. Open source.</text>

      <!-- Keyboard shortcut hint -->
      <rect x="540" y="460" width="320" height="36" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="${w / 2}" y="484" text-anchor="middle" font-family="monospace" font-size="14" fill="#8B8B9E">Ctrl+Shift+E  →  Extract instantly</text>
    </svg>
  `);

  await sharp(bg)
    .flatten({ background: { r: 15, g: 15, b: 20 } })
    .png()
    .toFile(resolve(OUT, 'marquee-1400x560.png'));
  console.log('  marquee-1400x560.png (1400x560)');
}

// ── 4. Screenshot mockups 1280x800 ──
async function screenshot1() {
  const w = 1280, h = 800;

  const svg = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F0F14" />
          <stop offset="100%" stop-color="#1A1A2E" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#sbg)" />

      <!-- Browser mockup bar -->
      <rect x="80" y="40" width="1120" height="40" rx="10" ry="10" fill="#1E1E2A" />
      <circle cx="110" cy="60" r="6" fill="#FF5F56" />
      <circle cx="130" cy="60" r="6" fill="#FFBD2E" />
      <circle cx="150" cy="60" r="6" fill="#27C93F" />
      <rect x="200" y="48" width="600" height="24" rx="4" fill="#14141E" />
      <text x="500" y="65" text-anchor="middle" font-family="monospace" font-size="12" fill="#5C5C6F">example.com/article/how-to-use-ai-tools</text>

      <!-- Page content (faded) -->
      <rect x="80" y="80" width="740" height="680" fill="#14141E" />
      <rect x="120" y="120" width="400" height="20" rx="3" fill="rgba(255,255,255,0.08)" />
      <rect x="120" y="155" width="660" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="175" width="620" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="195" width="640" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="225" width="300" height="16" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="120" y="255" width="650" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="275" width="600" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="295" width="630" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="315" width="580" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="345" width="350" height="16" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="120" y="375" width="660" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="395" width="620" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="415" width="640" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="445" width="500" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="475" width="280" height="16" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="120" y="505" width="650" height="12" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="120" y="525" width="600" height="12" rx="2" fill="rgba(255,255,255,0.04)" />

      <!-- Popup window -->
      <rect x="820" y="80" width="380" height="580" rx="16" fill="#0F0F14" stroke="rgba(255,255,255,0.08)" stroke-width="2" />

      <!-- Popup header -->
      <rect x="820" y="80" width="380" height="64" rx="16" fill="#14141E" />
      <rect x="820" y="128" width="380" height="16" fill="#14141E" />
      <text x="860" y="118" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#E8E8ED">Decant</text>

      <!-- Theme toggle + gear -->
      <circle cx="1140" cy="112" r="12" fill="rgba(255,255,255,0.05)" />
      <text x="1140" y="117" text-anchor="middle" font-family="system-ui" font-size="14" fill="#8B8B9E">☾</text>
      <circle cx="1170" cy="112" r="12" fill="rgba(255,255,255,0.05)" />
      <text x="1170" y="117" text-anchor="middle" font-family="system-ui" font-size="12" fill="#8B8B9E">⚙</text>

      <!-- Page info -->
      <text x="860" y="170" font-family="system-ui, sans-serif" font-size="11" fill="#5C5C6F">Current page</text>
      <text x="860" y="192" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#E8E8ED">How to Use AI Tools Effectively</text>
      <text x="860" y="212" font-family="system-ui, sans-serif" font-size="11" fill="#5C5C6F">2,450 words · 8 images</text>

      <!-- Format pills -->
      <rect x="855" y="230" width="90" height="30" rx="8" fill="#8B5CF6" />
      <text x="900" y="250" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="white">Markdown</text>
      <rect x="955" y="230" width="70" height="30" rx="8" fill="rgba(255,255,255,0.05)" />
      <text x="990" y="250" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">JSON</text>
      <rect x="1035" y="230" width="60" height="30" rx="8" fill="rgba(255,255,255,0.05)" />
      <text x="1065" y="250" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">MCP</text>

      <!-- Options toggles -->
      <text x="860" y="290" font-family="system-ui, sans-serif" font-size="11" fill="#8B8B9E">Include images</text>
      <rect x="1130" y="278" width="36" height="18" rx="9" fill="#8B5CF6" />
      <circle cx="1152" cy="287" r="6" fill="white" />

      <text x="860" y="316" font-family="system-ui, sans-serif" font-size="11" fill="#8B8B9E">Detect tables</text>
      <rect x="1130" y="304" width="36" height="18" rx="9" fill="#8B5CF6" />
      <circle cx="1152" cy="313" r="6" fill="white" />

      <text x="860" y="342" font-family="system-ui, sans-serif" font-size="11" fill="#8B8B9E">Extract emails/dates</text>
      <rect x="1130" y="330" width="36" height="18" rx="9" fill="rgba(255,255,255,0.1)" />
      <circle cx="1139" cy="339" r="6" fill="#5C5C6F" />

      <!-- Extract button -->
      <rect x="855" y="365" width="325" height="40" rx="10" fill="#8B5CF6" />
      <text x="1017" y="391" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="white">Extract Content</text>

      <!-- Preview area -->
      <rect x="855" y="420" width="325" height="180" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <text x="870" y="445" font-family="monospace" font-size="11" fill="#8B5CF6"># How to Use AI Tools</text>
      <text x="870" y="465" font-family="monospace" font-size="11" fill="#A0A0B8">Artificial intelligence tools have</text>
      <text x="870" y="480" font-family="monospace" font-size="11" fill="#A0A0B8">revolutionized the way we work...</text>
      <text x="870" y="500" font-family="monospace" font-size="11" fill="#8B5CF6">## Getting Started</text>
      <text x="870" y="520" font-family="monospace" font-size="11" fill="#A0A0B8">The first step is to identify</text>
      <text x="870" y="535" font-family="monospace" font-size="11" fill="#A0A0B8">your specific needs and goals...</text>
      <text x="870" y="555" font-family="monospace" font-size="11" fill="#8B5CF6">## Best Practices</text>
      <text x="870" y="575" font-family="monospace" font-size="11" fill="#A0A0B8">1. Start with clear prompts</text>
      <text x="870" y="590" font-family="monospace" font-size="11" fill="#A0A0B8">2. Iterate on your results</text>

      <!-- Action buttons -->
      <rect x="855" y="615" width="158" height="34" rx="8" fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" stroke-width="1" />
      <text x="934" y="637" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#A78BFA">Copy</text>
      <rect x="1022" y="615" width="158" height="34" rx="8" fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" stroke-width="1" />
      <text x="1101" y="637" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#A78BFA">Save</text>

      <!-- Call-out annotation -->
      <rect x="160" y="680" width="480" height="60" rx="12" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="1.5" />
      <text x="400" y="707" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="#E8E8ED">Extract any page to clean Markdown in one click</text>
      <text x="400" y="727" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Ctrl+Shift+E for instant extraction</text>
    </svg>
  `);

  await sharp(svg)
    .flatten({ background: { r: 15, g: 15, b: 20 } })
    .png()
    .toFile(resolve(OUT, 'screenshot-1-markdown.png'));
  console.log('  screenshot-1-markdown.png (1280x800)');
}

async function screenshot2() {
  const w = 1280, h = 800;

  const svg = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sbg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F0F14" />
          <stop offset="100%" stop-color="#1A1A2E" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#sbg2)" />

      <!-- Title -->
      <text x="${w / 2}" y="80" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="700" fill="#E8E8ED">Three Formats. One Click.</text>

      <!-- Subtitle -->
      <text x="${w / 2}" y="115" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" fill="#5C5C6F">Choose the perfect format for your workflow</text>

      <!-- Markdown card -->
      <rect x="80" y="160" width="360" height="520" rx="16" fill="#14141E" stroke="rgba(139,92,246,0.3)" stroke-width="2" />
      <rect x="80" y="160" width="360" height="56" rx="16" fill="rgba(139,92,246,0.1)" />
      <rect x="80" y="200" width="360" height="16" fill="rgba(139,92,246,0.1)" />
      <text x="260" y="196" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#A78BFA">Markdown</text>
      <text x="260" y="245" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Clean, readable text for notes</text>

      <rect x="110" y="270" width="300" height="370" rx="8" fill="rgba(0,0,0,0.3)" />
      <text x="125" y="295" font-family="monospace" font-size="12" fill="#A78BFA"># How to Use AI Tools</text>
      <text x="125" y="315" font-family="monospace" font-size="11" fill="#8B8B9E"></text>
      <text x="125" y="335" font-family="monospace" font-size="11" fill="#C0C0D0">Artificial intelligence has</text>
      <text x="125" y="352" font-family="monospace" font-size="11" fill="#C0C0D0">revolutionized how we work.</text>
      <text x="125" y="376" font-family="monospace" font-size="12" fill="#A78BFA">## Getting Started</text>
      <text x="125" y="400" font-family="monospace" font-size="11" fill="#C0C0D0">- Identify your needs</text>
      <text x="125" y="417" font-family="monospace" font-size="11" fill="#C0C0D0">- Choose the right tool</text>
      <text x="125" y="434" font-family="monospace" font-size="11" fill="#C0C0D0">- Start with simple tasks</text>
      <text x="125" y="458" font-family="monospace" font-size="12" fill="#A78BFA">## Best Practices</text>
      <text x="125" y="482" font-family="monospace" font-size="11" fill="#C0C0D0">1. Write clear prompts</text>
      <text x="125" y="499" font-family="monospace" font-size="11" fill="#C0C0D0">2. Iterate on results</text>
      <text x="125" y="516" font-family="monospace" font-size="11" fill="#C0C0D0">3. Validate the output</text>
      <text x="125" y="540" font-family="monospace" font-size="11" fill="#6366F1">[Read more](https://...)</text>

      <!-- JSON card -->
      <rect x="460" y="160" width="360" height="520" rx="16" fill="#14141E" stroke="rgba(99,102,241,0.3)" stroke-width="2" />
      <rect x="460" y="160" width="360" height="56" rx="16" fill="rgba(99,102,241,0.1)" />
      <rect x="460" y="200" width="360" height="16" fill="rgba(99,102,241,0.1)" />
      <text x="640" y="196" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#818CF8">JSON</text>
      <text x="640" y="245" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Structured data for automation</text>

      <rect x="490" y="270" width="300" height="370" rx="8" fill="rgba(0,0,0,0.3)" />
      <text x="505" y="295" font-family="monospace" font-size="11" fill="#5C5C6F">{</text>
      <text x="505" y="315" font-family="monospace" font-size="11" fill="#818CF8">  "title"</text><text x="577" y="315" font-family="monospace" font-size="11" fill="#5C5C6F">:</text><text x="590" y="315" font-family="monospace" font-size="11" fill="#34D399"> "How to Use AI"</text><text x="749" y="315" font-family="monospace" font-size="11" fill="#5C5C6F">,</text>
      <text x="505" y="335" font-family="monospace" font-size="11" fill="#818CF8">  "url"</text><text x="558" y="335" font-family="monospace" font-size="11" fill="#5C5C6F">:</text><text x="571" y="335" font-family="monospace" font-size="11" fill="#34D399"> "https://..."</text><text x="670" y="335" font-family="monospace" font-size="11" fill="#5C5C6F">,</text>
      <text x="505" y="355" font-family="monospace" font-size="11" fill="#818CF8">  "wordCount"</text><text x="600" y="355" font-family="monospace" font-size="11" fill="#5C5C6F">:</text><text x="613" y="355" font-family="monospace" font-size="11" fill="#F59E0B"> 2450</text><text x="653" y="355" font-family="monospace" font-size="11" fill="#5C5C6F">,</text>
      <text x="505" y="375" font-family="monospace" font-size="11" fill="#818CF8">  "metadata"</text><text x="591" y="375" font-family="monospace" font-size="11" fill="#5C5C6F">: {</text>
      <text x="505" y="395" font-family="monospace" font-size="11" fill="#818CF8">    "author"</text><text x="585" y="395" font-family="monospace" font-size="11" fill="#5C5C6F">:</text><text x="598" y="395" font-family="monospace" font-size="11" fill="#34D399"> "J. Smith"</text><text x="690" y="395" font-family="monospace" font-size="11" fill="#5C5C6F">,</text>
      <text x="505" y="415" font-family="monospace" font-size="11" fill="#818CF8">    "date"</text><text x="566" y="415" font-family="monospace" font-size="11" fill="#5C5C6F">:</text><text x="579" y="415" font-family="monospace" font-size="11" fill="#34D399"> "2026-02"</text>
      <text x="505" y="435" font-family="monospace" font-size="11" fill="#5C5C6F">  },</text>
      <text x="505" y="455" font-family="monospace" font-size="11" fill="#818CF8">  "content"</text><text x="586" y="455" font-family="monospace" font-size="11" fill="#5C5C6F">:</text><text x="599" y="455" font-family="monospace" font-size="11" fill="#34D399"> "AI tools..."</text>
      <text x="505" y="475" font-family="monospace" font-size="11" fill="#5C5C6F">}</text>

      <!-- MCP card -->
      <rect x="840" y="160" width="360" height="520" rx="16" fill="#14141E" stroke="rgba(6,182,212,0.3)" stroke-width="2" />
      <rect x="840" y="160" width="360" height="56" rx="16" fill="rgba(6,182,212,0.1)" />
      <rect x="840" y="200" width="360" height="16" fill="rgba(6,182,212,0.1)" />
      <text x="1020" y="196" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#22D3EE">MCP</text>
      <text x="1020" y="245" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Optimized for AI / LLM input</text>

      <rect x="870" y="270" width="300" height="370" rx="8" fill="rgba(0,0,0,0.3)" />
      <text x="885" y="295" font-family="monospace" font-size="11" fill="#22D3EE">--- RESOURCE ---</text>
      <text x="885" y="315" font-family="monospace" font-size="11" fill="#8B8B9E">URI: decant://example.com</text>
      <text x="885" y="335" font-family="monospace" font-size="11" fill="#8B8B9E">Type: article</text>
      <text x="885" y="355" font-family="monospace" font-size="11" fill="#8B8B9E">Words: 2450</text>
      <text x="885" y="380" font-family="monospace" font-size="11" fill="#22D3EE">--- CONTEXT ---</text>
      <text x="885" y="400" font-family="monospace" font-size="11" fill="#8B8B9E">Language: en</text>
      <text x="885" y="420" font-family="monospace" font-size="11" fill="#8B8B9E">Tables: 2</text>
      <text x="885" y="440" font-family="monospace" font-size="11" fill="#8B8B9E">Links: 15</text>
      <text x="885" y="465" font-family="monospace" font-size="11" fill="#22D3EE">--- CONTENT ---</text>
      <text x="885" y="485" font-family="monospace" font-size="11" fill="#C0C0D0"># How to Use AI Tools</text>
      <text x="885" y="505" font-family="monospace" font-size="11" fill="#C0C0D0">Artificial intelligence</text>
      <text x="885" y="522" font-family="monospace" font-size="11" fill="#C0C0D0">has revolutionized the</text>
      <text x="885" y="539" font-family="monospace" font-size="11" fill="#C0C0D0">way we work with data...</text>

      <!-- Bottom tagline -->
      <text x="${w / 2}" y="740" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#5C5C6F">Right format for the right job — switch instantly</text>
      <text x="${w / 2}" y="770" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#3D3D4F">Decant — by Zoplop Studio</text>
    </svg>
  `);

  await sharp(svg)
    .flatten({ background: { r: 15, g: 15, b: 20 } })
    .png()
    .toFile(resolve(OUT, 'screenshot-2-formats.png'));
  console.log('  screenshot-2-formats.png (1280x800)');
}

async function screenshot3() {
  const w = 1280, h = 800;

  const svg = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sbg3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F0F14" />
          <stop offset="100%" stop-color="#1A1A2E" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#sbg3)" />

      <!-- Title -->
      <text x="${w / 2}" y="80" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="700" fill="#E8E8ED">Privacy First. Always Local.</text>
      <text x="${w / 2}" y="115" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" fill="#5C5C6F">Your data never leaves your device</text>

      <!-- Feature cards grid -->
      <!-- Card 1: No Server -->
      <rect x="100" y="170" width="340" height="170" rx="16" fill="#14141E" stroke="rgba(139,92,246,0.15)" stroke-width="1.5" />
      <text x="140" y="215" font-family="system-ui" font-size="32" fill="#8B5CF6">🔒</text>
      <text x="185" y="215" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#E8E8ED">100% Local Processing</text>
      <text x="140" y="245" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">All extraction happens in your browser.</text>
      <text x="140" y="265" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Zero data sent to external servers.</text>
      <text x="140" y="285" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Zero network requests made.</text>

      <!-- Card 2: No Tracking -->
      <rect x="470" y="170" width="340" height="170" rx="16" fill="#14141E" stroke="rgba(99,102,241,0.15)" stroke-width="1.5" />
      <text x="510" y="215" font-family="system-ui" font-size="32" fill="#6366F1">👁</text>
      <text x="555" y="215" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#E8E8ED">No Tracking</text>
      <text x="510" y="245" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">No Google Analytics. No Mixpanel.</text>
      <text x="510" y="265" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">No telemetry of any kind.</text>
      <text x="510" y="285" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">We don't even know you exist.</text>

      <!-- Card 3: No Account -->
      <rect x="840" y="170" width="340" height="170" rx="16" fill="#14141E" stroke="rgba(6,182,212,0.15)" stroke-width="1.5" />
      <text x="880" y="215" font-family="system-ui" font-size="32" fill="#06B6D4">👤</text>
      <text x="925" y="215" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#E8E8ED">No Account Needed</text>
      <text x="880" y="245" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Install and use immediately.</text>
      <text x="880" y="265" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">No sign-up, no email, no login.</text>
      <text x="880" y="285" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Just pure functionality.</text>

      <!-- Card 4: GDPR -->
      <rect x="100" y="375" width="340" height="170" rx="16" fill="#14141E" stroke="rgba(16,185,129,0.15)" stroke-width="1.5" />
      <text x="140" y="420" font-family="system-ui" font-size="32" fill="#10B981">📋</text>
      <text x="185" y="420" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#E8E8ED">GDPR Compliant</text>
      <text x="140" y="450" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Export all your data as JSON.</text>
      <text x="140" y="470" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Delete everything with one click.</text>
      <text x="140" y="490" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Full transparency. Full control.</text>

      <!-- Card 5: Open Source -->
      <rect x="470" y="375" width="340" height="170" rx="16" fill="#14141E" stroke="rgba(245,158,11,0.15)" stroke-width="1.5" />
      <text x="510" y="420" font-family="system-ui" font-size="32" fill="#F59E0B">⭐</text>
      <text x="555" y="420" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#E8E8ED">Open Source (MIT)</text>
      <text x="510" y="450" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Every line of code is auditable.</text>
      <text x="510" y="470" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Community-driven development.</text>
      <text x="510" y="490" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">decant-ext.vercel.app</text>

      <!-- Card 6: Keyboard -->
      <rect x="840" y="375" width="340" height="170" rx="16" fill="#14141E" stroke="rgba(236,72,153,0.15)" stroke-width="1.5" />
      <text x="880" y="420" font-family="system-ui" font-size="32" fill="#EC4899">⌨</text>
      <text x="925" y="420" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#E8E8ED">Keyboard-First</text>
      <text x="880" y="450" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Ctrl+Shift+E  Extract page</text>
      <text x="880" y="470" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Ctrl+Shift+C  Copy to clipboard</text>
      <text x="880" y="490" font-family="system-ui, sans-serif" font-size="12" fill="#8B8B9E">Ctrl+Shift+S  Save to file</text>

      <!-- Bottom -->
      <rect x="340" y="610" width="600" height="100" rx="16" fill="rgba(139,92,246,0.06)" stroke="rgba(139,92,246,0.15)" stroke-width="1.5" />
      <text x="${w / 2}" y="650" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#8B8B9E">Permissions are minimal and fully documented</text>
      <text x="${w / 2}" y="675" text-anchor="middle" font-family="monospace" font-size="12" fill="#5C5C6F">activeTab · storage · clipboardWrite · sidePanel · contextMenus</text>
      <text x="${w / 2}" y="695" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#3D3D4F">Each permission explained in our privacy policy</text>

      <text x="${w / 2}" y="770" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#3D3D4F">Decant — by Zoplop Studio</text>
    </svg>
  `);

  await sharp(svg)
    .flatten({ background: { r: 15, g: 15, b: 20 } })
    .png()
    .toFile(resolve(OUT, 'screenshot-3-privacy.png'));
  console.log('  screenshot-3-privacy.png (1280x800)');
}

// Run all
console.log('Generating store assets...\n');
await storeIcon();
await smallPromo();
await marqueePromo();
await screenshot1();
await screenshot2();
await screenshot3();
console.log('\nAll assets generated in store/assets/');
