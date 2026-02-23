import { describe, it, expect } from 'vitest';
import { toMCP } from '../src/core/mcp-format.js';

describe('MCP Format', () => {
  const mockArticle = {
    title: 'MCP Test',
    content: '<p>Test content for MCP</p>',
    textContent: 'Test content for MCP',
  };

  const mockMetadata = {
    title: 'MCP Test',
    url: 'https://docs.example.com/page',
    domain: 'docs.example.com',
    siteName: 'Example Docs',
    excerpt: 'Testing MCP format',
    wordCount: 4,
    imageCount: 0,
    extractedAt: '2024-01-01T00:00:00.000Z',
  };

  it('should produce valid JSON', () => {
    const result = toMCP(mockArticle, mockMetadata);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should have MCP resource type', () => {
    const result = JSON.parse(toMCP(mockArticle, mockMetadata));
    expect(result.type).toBe('resource');
  });

  it('should have a decant:// URI', () => {
    const result = JSON.parse(toMCP(mockArticle, mockMetadata));
    expect(result.uri).toMatch(/^decant:\/\//);
  });

  it('should include content as plain text', () => {
    const result = JSON.parse(toMCP(mockArticle, mockMetadata));
    expect(result.content).toContain('Test content for MCP');
  });

  it('should include source metadata', () => {
    const result = JSON.parse(toMCP(mockArticle, mockMetadata));
    expect(result.metadata.source.url).toBe('https://docs.example.com/page');
    expect(result.metadata.source.domain).toBe('docs.example.com');
  });

  it('should include stats', () => {
    const result = JSON.parse(toMCP(mockArticle, mockMetadata));
    expect(result.metadata.stats.wordCount).toBe(4);
  });

  it('should include smart data if present', () => {
    const meta = { ...mockMetadata, smartData: { emails: ['test@example.com'] } };
    const result = JSON.parse(toMCP(mockArticle, meta));
    expect(result.content).toContain('test@example.com');
    expect(result.metadata.extractedEntities.emails).toContain('test@example.com');
  });

  it('should include tables in metadata', () => {
    const tables = [{ caption: 'Data', headers: ['A', 'B'], rows: [['1', '2']] }];
    const result = JSON.parse(toMCP(mockArticle, mockMetadata, tables));
    expect(result.metadata.tables).toHaveLength(1);
    expect(result.metadata.tables[0].headers).toEqual(['A', 'B']);
  });
});
