import { describe, it, expect } from 'vitest';
import { toJSON } from '../src/core/json-export.js';

describe('JSON Export', () => {
  const mockArticle = {
    title: 'Test Article',
    content: '<h1>Hello</h1><p>World</p><a href="https://example.com">Link</a>',
    textContent: 'Hello\nWorld\nLink',
  };

  const mockMetadata = {
    title: 'Test Article',
    url: 'https://example.com/article',
    domain: 'example.com',
    siteName: 'Example',
    excerpt: 'A test article',
    wordCount: 3,
    imageCount: 0,
    extractedAt: '2024-01-01T00:00:00.000Z',
  };

  it('should produce valid JSON', () => {
    const result = toJSON(mockArticle, mockMetadata);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should include version field', () => {
    const result = JSON.parse(toJSON(mockArticle, mockMetadata));
    expect(result.version).toBe('1.0');
  });

  it('should include metadata', () => {
    const result = JSON.parse(toJSON(mockArticle, mockMetadata));
    expect(result.metadata.title).toBe('Test Article');
    expect(result.metadata.url).toBe('https://example.com/article');
    expect(result.metadata.domain).toBe('example.com');
  });

  it('should extract headings', () => {
    const result = JSON.parse(toJSON(mockArticle, mockMetadata));
    expect(result.content.headings).toEqual([
      { level: 1, text: 'Hello' }
    ]);
  });

  it('should extract links', () => {
    const result = JSON.parse(toJSON(mockArticle, mockMetadata));
    const links = result.content.links;
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].text).toBe('Link');
  });

  it('should include plain text content', () => {
    const result = JSON.parse(toJSON(mockArticle, mockMetadata));
    expect(result.content.plain).toBeTruthy();
  });

  it('should include tables array', () => {
    const tables = [{ caption: 'T1', headers: ['A'], rows: [['1']] }];
    const result = JSON.parse(toJSON(mockArticle, mockMetadata, tables));
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].caption).toBe('T1');
  });
});
