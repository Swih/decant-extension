/**
 * Core parser — orchestrates extraction pipeline.
 * Takes raw DOM/HTML and produces clean, structured content.
 */
import { Readability } from '@mozilla/readability';
import { toMarkdown } from './markdown.js';
import { toJSON } from './json-export.js';
import { toMCP } from './mcp-format.js';
import { extractSmartData } from './smart-extract.js';
import { extractTables } from './table-detect.js';

/**
 * Main extraction function.
 * @param {Object} options
 * @param {string} options.html - Raw page HTML
 * @param {string} options.url - Page URL
 * @param {string} options.title - Page title
 * @param {string} options.format - 'markdown' | 'json' | 'mcp'
 * @param {boolean} options.includeImages - Include image references
 * @param {boolean} options.detectTables - Extract tables separately
 * @param {boolean} options.smartExtract - Detect emails, dates, prices
 * @param {boolean} options.fullPage - Use full HTML (not Reader mode)
 * @returns {Object} Extraction result
 */
export function extract(options) {
  const {
    html,
    url,
    title: pageTitle,
    format = 'markdown',
    includeImages = true,
    detectTables = true,
    smartExtract = true,
    fullPage = false,
  } = options;

  // Parse the HTML into a DOM
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Set base URL for relative links
  const base = doc.createElement('base');
  base.href = url;
  doc.head.prepend(base);

  let article;
  let contentDoc;

  if (fullPage) {
    // Full page mode: clean the DOM but keep all content
    contentDoc = cleanDOM(doc);
    article = {
      title: pageTitle || doc.title,
      content: contentDoc.body.innerHTML,
      textContent: contentDoc.body.textContent,
      length: contentDoc.body.textContent.length,
      siteName: extractSiteName(doc, url),
      excerpt: extractExcerpt(doc),
    };
  } else {
    // Reader mode: use Readability to extract main content
    const reader = new Readability(doc, {
      charThreshold: 100,
      keepClasses: false,
    });
    article = reader.parse();

    if (!article) {
      // Fallback to full page if Readability fails
      contentDoc = cleanDOM(doc);
      article = {
        title: pageTitle || doc.title,
        content: contentDoc.body.innerHTML,
        textContent: contentDoc.body.textContent,
        length: contentDoc.body.textContent.length,
        siteName: extractSiteName(doc, url),
        excerpt: extractExcerpt(doc),
      };
    }
  }

  // Count stats
  const wordCount = countWords(article.textContent);
  const imageCount = includeImages ? countImages(article.content) : 0;

  // Extract tables if enabled
  const tables = detectTables ? extractTables(article.content) : [];

  // Smart extraction if enabled
  const smartData = smartExtract ? extractSmartData(article.textContent) : {};

  // Estimate token count (helps users know context window usage)
  const estimatedTokens = estimateTokens(article.textContent);

  // Build metadata
  const metadata = {
    title: article.title || pageTitle,
    url,
    domain: new URL(url).hostname,
    siteName: article.siteName || '',
    excerpt: article.excerpt || '',
    wordCount,
    imageCount,
    estimatedTokens,
    extractedAt: new Date().toISOString(),
    tables: tables.length,
    ...(Object.keys(smartData).length > 0 ? { smartData } : {}),
  };

  // Convert to requested format
  let output;
  switch (format) {
    case 'json':
      output = toJSON(article, metadata, tables);
      break;
    case 'mcp':
      output = toMCP(article, metadata, tables);
      break;
    case 'markdown':
    default:
      output = toMarkdown(article, metadata, { includeImages, tables });
      break;
  }

  return {
    output,
    metadata,
    format,
  };
}

function cleanDOM(doc) {
  const clone = doc.cloneNode(true);
  // Remove scripts, styles, and non-content elements
  // Comprehensive list based on competitive analysis of web extraction tools
  const removeSelectors = [
    // Core non-content
    'script',
    'style',
    'noscript',
    'iframe:not([src*="youtube"]):not([src*="vimeo"])',
    'svg',

    // Navigation & page chrome
    'nav',
    'footer:not(article footer)',
    'header:not(article header)',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '.breadcrumb',
    '.breadcrumbs',
    '.pagination',

    // Ads & tracking
    '.ad',
    '.ads',
    '.advertisement',
    '.sponsored',
    '[class*="ad-"]',
    '[class*="ads-"]',
    '[id*="ad-"]',
    '[id*="ads-"]',
    'ins.adsbygoogle',
    '[id*="google_ads"]',

    // Sidebars & widgets
    '.sidebar',
    'aside:not(article aside)',
    '.widget',
    '.widgets',

    // Cookie & consent banners
    '[class*="cookie"]',
    '[id*="cookie"]',
    '[class*="consent"]',
    '.cookie-banner',
    '.cookie-consent',
    '#cookie-banner',
    '#gdpr',
    '.gdpr',
    '[class*="gdpr"]',

    // Popups & overlays
    '[class*="popup"]',
    '[class*="modal"]',
    '[class*="overlay"]',

    // Social sharing
    '[class*="share"]',
    '[class*="social"]',
    '.share-buttons',
    '.social-share',

    // Comments
    '.comments',
    '#comments',
    '.disqus',
    '[id*="comment"]',

    // Related content & recommendations
    '[class*="related"]',
    '[class*="recommended"]',
    '.related-posts',

    // Hidden elements
    '[aria-hidden="true"]',

    // Print-only
    '.print-only',
    '.screen-reader-text',
  ];
  for (const sel of removeSelectors) {
    try {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    } catch {
      /* skip invalid selectors in some DOMs */
    }
  }
  return clone;
}

function extractSiteName(doc, url) {
  const ogSite = doc.querySelector('meta[property="og:site_name"]');
  if (ogSite) return ogSite.content;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function extractExcerpt(doc) {
  const ogDesc = doc.querySelector('meta[property="og:description"]');
  if (ogDesc) return ogDesc.content;
  const metaDesc = doc.querySelector('meta[name="description"]');
  if (metaDesc) return metaDesc.content;
  return '';
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countImages(html) {
  if (!html) return 0;
  const matches = html.match(/<img\b/gi);
  return matches ? matches.length : 0;
}

/**
 * Estimate token count for LLM context window awareness.
 * Heuristic: average of character-based and word-based estimates.
 * English ~1 token per 4 chars, ~1.33 tokens per word.
 */
function estimateTokens(text) {
  if (!text) return 0;
  const byChars = Math.ceil(text.length / 4);
  const byWords = Math.ceil(text.trim().split(/\s+/).length * 1.33);
  return Math.round((byChars + byWords) / 2);
}
