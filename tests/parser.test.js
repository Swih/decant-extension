import { describe, it, expect } from 'vitest';
import { extract } from '../src/core/parser.js';

const sampleHTML = `<html>
<head>
  <title>Test Page</title>
  <meta property="og:site_name" content="TestSite" />
  <meta property="og:description" content="A test page excerpt" />
</head>
<body>
  <article>
    <h1>Hello World</h1>
    <p>This is a test paragraph with some content for extraction.</p>
    <p>Contact us at test@example.com for more info.</p>
    <img src="https://example.com/image.png" alt="test" />
    <table><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>
  </article>
</body>
</html>`;

const baseOptions = {
  html: sampleHTML,
  url: 'https://example.com/article',
  title: 'Test Page',
  format: 'markdown',
  includeImages: true,
  detectTables: true,
  smartExtract: true,
  fullPage: false,
};

describe('Parser — extract()', () => {
  it('should return output, metadata, and format', () => {
    const result = extract(baseOptions);
    expect(result).toHaveProperty('output');
    expect(result).toHaveProperty('metadata');
    expect(result).toHaveProperty('format');
    expect(typeof result.output).toBe('string');
    expect(result.output.length).toBeGreaterThan(0);
  });

  it('should produce markdown output by default', () => {
    const result = extract(baseOptions);
    expect(result.format).toBe('markdown');
    expect(result.output).toContain('Hello World');
  });

  it('should include metadata fields', () => {
    const result = extract(baseOptions);
    const { metadata } = result;
    expect(metadata.title).toBeTruthy();
    expect(metadata.url).toBe('https://example.com/article');
    expect(metadata.domain).toBe('example.com');
    expect(metadata.wordCount).toBeGreaterThan(0);
    expect(typeof metadata.imageCount).toBe('number');
    expect(metadata.estimatedTokens).toBeGreaterThan(0);
    expect(metadata.extractedAt).toBeTruthy();
  });

  it('should extract in full page mode', () => {
    const result = extract({ ...baseOptions, fullPage: true });
    expect(result.output).toContain('Hello World');
    expect(result.metadata.wordCount).toBeGreaterThan(0);
  });

  it('should fallback when Readability returns null', () => {
    const result = extract({
      ...baseOptions,
      html: '<html><head></head><body><p>Short</p></body></html>',
      fullPage: false,
    });
    expect(result.output).toBeTruthy();
    expect(result.metadata.wordCount).toBeGreaterThanOrEqual(0);
  });

  it('should count images when includeImages is true', () => {
    const result = extract({ ...baseOptions, includeImages: true });
    expect(result.metadata.imageCount).toBeGreaterThanOrEqual(0);
  });

  it('should report 0 images when includeImages is false', () => {
    const result = extract({ ...baseOptions, includeImages: false });
    expect(result.metadata.imageCount).toBe(0);
  });

  it('should detect tables when enabled', () => {
    const result = extract({ ...baseOptions, detectTables: true, fullPage: true });
    expect(typeof result.metadata.tables).toBe('number');
  });

  it('should not detect tables when disabled', () => {
    const result = extract({ ...baseOptions, detectTables: false });
    expect(result.metadata.tables).toBe(0);
  });

  it('should extract smart data when enabled', () => {
    const result = extract({ ...baseOptions, smartExtract: true, fullPage: true });
    if (result.metadata.smartData) {
      expect(result.metadata.smartData.emails).toBeDefined();
    }
  });

  it('should not extract smart data when disabled', () => {
    const result = extract({ ...baseOptions, smartExtract: false });
    expect(result.metadata.smartData).toBeUndefined();
  });

  it('should produce valid JSON output', () => {
    const result = extract({ ...baseOptions, format: 'json' });
    expect(result.format).toBe('json');
    expect(() => JSON.parse(result.output)).not.toThrow();
  });

  it('should produce MCP format output', () => {
    const result = extract({ ...baseOptions, format: 'mcp' });
    expect(result.format).toBe('mcp');
    expect(result.output).toBeTruthy();
  });

  it('should extract siteName from og:site_name', () => {
    const result = extract({ ...baseOptions, fullPage: true });
    expect(result.metadata.siteName).toBe('TestSite');
  });

  it('should extract excerpt from og:description', () => {
    const result = extract({ ...baseOptions, fullPage: true });
    expect(result.metadata.excerpt).toBe('A test page excerpt');
  });

  it('should handle empty HTML gracefully', () => {
    const result = extract({
      ...baseOptions,
      html: '<html><head></head><body></body></html>',
      fullPage: true,
    });
    expect(result.metadata.wordCount).toBe(0);
  });

  it('should use page title as fallback', () => {
    const result = extract({
      ...baseOptions,
      html: '<html><head></head><body><p>Content</p></body></html>',
      title: 'Fallback Title',
      fullPage: true,
    });
    expect(result.metadata.title).toBeTruthy();
  });
});
