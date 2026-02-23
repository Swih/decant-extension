import { describe, it, expect } from 'vitest';
import { toMarkdown } from '../src/core/markdown.js';

describe('Markdown Conversion', () => {
  const mockMetadata = {
    title: 'Test Page',
    url: 'https://example.com',
    siteName: 'Example',
    excerpt: 'A test page',
    wordCount: 10,
    extractedAt: '2024-01-01T00:00:00.000Z',
  };

  it('should include title as h1', () => {
    const article = { content: '<p>Hello world</p>', textContent: 'Hello world' };
    const result = toMarkdown(article, mockMetadata);
    expect(result).toContain('# Test Page');
  });

  it('should include source URL', () => {
    const article = { content: '<p>Hello</p>', textContent: 'Hello' };
    const result = toMarkdown(article, mockMetadata);
    expect(result).toContain('https://example.com');
  });

  it('should convert paragraphs', () => {
    const article = { content: '<p>First paragraph</p><p>Second paragraph</p>', textContent: 'First paragraph Second paragraph' };
    const result = toMarkdown(article, mockMetadata);
    expect(result).toContain('First paragraph');
    expect(result).toContain('Second paragraph');
  });

  it('should convert headings', () => {
    const article = { content: '<h2>Section</h2><p>Content</p>', textContent: 'Section Content' };
    const result = toMarkdown(article, mockMetadata);
    expect(result).toContain('## Section');
  });

  it('should convert links', () => {
    const article = { content: '<a href="https://test.com">Click here</a>', textContent: 'Click here' };
    const result = toMarkdown(article, mockMetadata);
    expect(result).toContain('[Click here](https://test.com)');
  });

  it('should include images when enabled', () => {
    const article = { content: '<img src="https://img.com/photo.png" alt="Photo">', textContent: '' };
    const result = toMarkdown(article, mockMetadata, { includeImages: true });
    expect(result).toContain('![Photo](https://img.com/photo.png)');
  });

  it('should exclude images when disabled', () => {
    const article = { content: '<img src="https://img.com/photo.png" alt="Photo">', textContent: '' };
    const result = toMarkdown(article, mockMetadata, { includeImages: false });
    expect(result).not.toContain('![Photo]');
  });

  it('should append smart data section if present', () => {
    const article = { content: '<p>Hello</p>', textContent: 'Hello' };
    const meta = { ...mockMetadata, smartData: { emails: ['test@example.com'] } };
    const result = toMarkdown(article, meta);
    expect(result).toContain('test@example.com');
  });

  it('should not have excessive whitespace', () => {
    const article = { content: '<p>A</p>\n\n\n\n\n\n<p>B</p>', textContent: 'A B' };
    const result = toMarkdown(article, mockMetadata);
    expect(result).not.toMatch(/\n{4,}/);
  });
});
