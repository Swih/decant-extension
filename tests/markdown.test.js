import { describe, it, expect } from 'vitest';
import { toMarkdown, detectLanguage } from '../src/core/markdown.js';

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


describe('detectLanguage', () => {
  function makeCodeEl(className = '', attrs = {}, parentClassName = '') {
    const doc = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
    const pre = doc.createElement('pre');
    if (parentClassName) pre.className = parentClassName;
    const code = doc.createElement('code');
    if (className) code.className = className;
    for (const [k, v] of Object.entries(attrs)) code.setAttribute(k, v);
    pre.appendChild(code);
    doc.body.appendChild(pre);
    return code;
  }

  it('should detect standard language-python class', () => {
    const el = makeCodeEl('language-python');
    expect(detectLanguage(el)).toBe('python');
  });

  it('should detect hljs-javascript class', () => {
    const el = makeCodeEl('hljs-javascript');
    expect(detectLanguage(el)).toBe('javascript');
  });

  it('should detect data-lang="ruby" attribute', () => {
    const el = makeCodeEl('', { 'data-lang': 'ruby' });
    expect(detectLanguage(el)).toBe('ruby');
  });

  it('should detect data-language="go" attribute', () => {
    const el = makeCodeEl('', { 'data-language': 'go' });
    expect(detectLanguage(el)).toBe('go');
  });

  it('should detect Prism pattern prism-typescript', () => {
    const el = makeCodeEl('prism-typescript');
    expect(detectLanguage(el)).toBe('typescript');
  });

  it('should detect SyntaxHighlighter brush: python', () => {
    const el = makeCodeEl('brush: python');
    expect(detectLanguage(el)).toBe('python');
  });

  it('should detect Rouge pattern rouge-bash', () => {
    const el = makeCodeEl('rouge-bash');
    expect(detectLanguage(el)).toBe('bash');
  });

  it('should detect Pandoc sourceCode python', () => {
    const el = makeCodeEl('sourceCode python');
    expect(detectLanguage(el)).toBe('python');
  });

  it('should normalize language-js to javascript', () => {
    const el = makeCodeEl('language-js');
    expect(detectLanguage(el)).toBe('javascript');
  });

  it('should normalize language-py to python', () => {
    const el = makeCodeEl('language-py');
    expect(detectLanguage(el)).toBe('python');
  });

  it('should normalize language-ts to typescript', () => {
    const el = makeCodeEl('language-ts');
    expect(detectLanguage(el)).toBe('typescript');
  });

  it('should normalize language-sh to bash', () => {
    const el = makeCodeEl('language-sh');
    expect(detectLanguage(el)).toBe('bash');
  });

  it('should fallback to parent element class', () => {
    const el = makeCodeEl('', {}, 'language-rust');
    expect(detectLanguage(el)).toBe('rust');
  });

  it('should return empty string when no hints', () => {
    const el = makeCodeEl('');
    expect(detectLanguage(el)).toBe('');
  });

  it('should return empty string for null element', () => {
    expect(detectLanguage(null)).toBe('');
  });
});
