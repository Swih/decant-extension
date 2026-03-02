import { describe, it, expect } from 'vitest';
import { extractStructuredData } from '../src/core/structured-data.js';

/** Helper: parse an HTML string into a Document. */
function parseHTML(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('Structured Data Extraction', () => {
  it('should return correct shape with an empty document', () => {
    const doc = parseHTML('<html><head></head><body></body></html>');
    const result = extractStructuredData(doc);

    expect(result).toHaveProperty('jsonLd');
    expect(result).toHaveProperty('openGraph');
    expect(result).toHaveProperty('twitterCard');
    expect(result).toHaveProperty('meta');
    expect(result.jsonLd).toEqual([]);
    expect(result.openGraph).toBeNull();
    expect(result.twitterCard).toBeNull();
    expect(result.meta).toBeNull();
  });

  // --- JSON-LD ---

  it('should extract a single JSON-LD Product schema', () => {
    const doc = parseHTML(`<html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Widget",
        "brand": "Acme"
      }</script>
    </head><body></body></html>`);

    const { jsonLd } = extractStructuredData(doc);
    expect(jsonLd).toHaveLength(1);
    expect(jsonLd[0]['@type']).toBe('Product');
    expect(jsonLd[0].name).toBe('Widget');
    expect(jsonLd[0].brand).toBe('Acme');
  });

  it('should extract all items from a @graph array', () => {
    const doc = parseHTML(`<html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "name": "Acme Corp" },
          { "@type": "WebSite", "name": "Acme Site" }
        ]
      }</script>
    </head><body></body></html>`);

    const { jsonLd } = extractStructuredData(doc);
    expect(jsonLd).toHaveLength(2);
    expect(jsonLd[0]['@type']).toBe('Organization');
    expect(jsonLd[1]['@type']).toBe('WebSite');
  });

  it('should skip malformed JSON-LD gracefully', () => {
    const doc = parseHTML(`<html><head>
      <script type="application/ld+json">{ this is not valid JSON }</script>
      <script type="application/ld+json">{"@type": "Article", "name": "Good"}</script>
    </head><body></body></html>`);

    const { jsonLd } = extractStructuredData(doc);
    expect(jsonLd).toHaveLength(1);
    expect(jsonLd[0]['@type']).toBe('Article');
  });

  it('should spread root-level JSON-LD arrays into results', () => {
    const doc = parseHTML(`<html><head>
      <script type="application/ld+json">[
        { "@type": "BreadcrumbList", "name": "Nav" },
        { "@type": "Product", "name": "Gadget" }
      ]</script>
    </head><body></body></html>`);

    const { jsonLd } = extractStructuredData(doc);
    expect(jsonLd).toHaveLength(2);
    expect(jsonLd[0]['@type']).toBe('BreadcrumbList');
    expect(jsonLd[1]['@type']).toBe('Product');
  });

  // --- Open Graph ---

  it('should extract Open Graph tags', () => {
    const doc = parseHTML(`<html><head>
      <meta property="og:title" content="My Page" />
      <meta property="og:description" content="A great page" />
      <meta property="og:image" content="https://example.com/img.png" />
    </head><body></body></html>`);

    const { openGraph } = extractStructuredData(doc);
    expect(openGraph).not.toBeNull();
    expect(openGraph.title).toBe('My Page');
    expect(openGraph.description).toBe('A great page');
    expect(openGraph.image).toBe('https://example.com/img.png');
  });

  it('should return null when no Open Graph tags exist', () => {
    const doc = parseHTML('<html><head></head><body></body></html>');
    const { openGraph } = extractStructuredData(doc);
    expect(openGraph).toBeNull();
  });

  // --- Twitter Card ---

  it('should extract Twitter Card tags', () => {
    const doc = parseHTML(`<html><head>
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Tweet Title" />
    </head><body></body></html>`);

    const { twitterCard } = extractStructuredData(doc);
    expect(twitterCard).not.toBeNull();
    expect(twitterCard.card).toBe('summary_large_image');
    expect(twitterCard.title).toBe('Tweet Title');
  });

  it('should return null when no Twitter Card tags exist', () => {
    const doc = parseHTML('<html><head></head><body></body></html>');
    const { twitterCard } = extractStructuredData(doc);
    expect(twitterCard).toBeNull();
  });

  // --- Meta Tags ---

  it('should extract meta description, author, and canonical link', () => {
    const doc = parseHTML(`<html><head>
      <meta name="description" content="Page description" />
      <meta name="author" content="Jane Doe" />
      <link rel="canonical" href="https://example.com/page" />
    </head><body></body></html>`);

    const { meta } = extractStructuredData(doc);
    expect(meta).not.toBeNull();
    expect(meta.description).toBe('Page description');
    expect(meta.author).toBe('Jane Doe');
    expect(meta.canonical).toBe('https://example.com/page');
  });

  it('should return null when no relevant meta tags exist', () => {
    const doc = parseHTML(`<html><head>
      <meta charset="utf-8" />
    </head><body></body></html>`);

    const { meta } = extractStructuredData(doc);
    expect(meta).toBeNull();
  });

  // --- Full page ---

  it('should populate all sections on a full page', () => {
    const doc = parseHTML(`<html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Breaking News"
      }</script>
      <meta property="og:title" content="OG Title" />
      <meta property="og:image" content="https://example.com/og.png" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:site" content="@example" />
      <meta name="description" content="Full page test" />
      <meta name="author" content="John Smith" />
      <meta name="keywords" content="test, structured, data" />
      <link rel="canonical" href="https://example.com/full" />
    </head><body><p>Content</p></body></html>`);

    const result = extractStructuredData(doc);

    // JSON-LD
    expect(result.jsonLd).toHaveLength(1);
    expect(result.jsonLd[0].headline).toBe('Breaking News');

    // Open Graph
    expect(result.openGraph).not.toBeNull();
    expect(result.openGraph.title).toBe('OG Title');
    expect(result.openGraph.image).toBe('https://example.com/og.png');

    // Twitter Card
    expect(result.twitterCard).not.toBeNull();
    expect(result.twitterCard.card).toBe('summary');
    expect(result.twitterCard.site).toBe('@example');

    // Meta
    expect(result.meta).not.toBeNull();
    expect(result.meta.description).toBe('Full page test');
    expect(result.meta.author).toBe('John Smith');
    expect(result.meta.keywords).toBe('test, structured, data');
    expect(result.meta.canonical).toBe('https://example.com/full');
  });
});
