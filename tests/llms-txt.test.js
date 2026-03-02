import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectLlmsLink, detectLlmsTxt } from '../src/core/llms-txt.js';

describe('llms.txt Detection', () => {
  describe('detectLlmsLink', () => {
    it('should find <link rel="llms"> and return href', () => {
      const html = '<html><head><link rel="llms" href="/llms.txt"></head><body></body></html>';
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(detectLlmsLink(doc)).toBe('/llms.txt');
    });

    it('should find <link rel="llms-txt"> and return href', () => {
      const html = '<html><head><link rel="llms-txt" href="https://example.com/llms-full.txt"></head><body></body></html>';
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(detectLlmsLink(doc)).toBe('https://example.com/llms-full.txt');
    });

    it('should return null when no llms link is present', () => {
      const html = '<html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>';
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(detectLlmsLink(doc)).toBeNull();
    });

    it('should return null for null doc', () => {
      expect(detectLlmsLink(null)).toBeNull();
    });
  });

  describe('detectLlmsTxt', () => {
    const originalFetch = globalThis.fetch;
    let mockFetch;

    beforeEach(() => {
      mockFetch = vi.fn();
      globalThis.fetch = mockFetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should return found when /llms.txt responds successfully', async () => {
      const content = '# Example LLMs.txt\n\nThis site provides an API for developers.';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => content,
      });

      const result = await detectLlmsTxt('https://example.com/some/page');
      expect(result.found).toBe(true);
      expect(result.url).toBe('https://example.com/llms.txt');
      expect(result.content).toBe(content);
    });

    it('should return not found when response is an HTML error page', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => '<!DOCTYPE html><html><body>404 Not Found</body></html>',
      });

      const result = await detectLlmsTxt('https://example.com/page');
      expect(result.found).toBe(false);
    });

    it('should return not found when response body is too short', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'short',
      });

      const result = await detectLlmsTxt('https://example.com/page');
      expect(result.found).toBe(false);
    });

    it('should return not found when fetch throws (CORS/timeout)', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await detectLlmsTxt('https://example.com/page');
      expect(result.found).toBe(false);
    });

    it('should return not found for invalid URL', async () => {
      const result = await detectLlmsTxt('not-a-url');
      expect(result.found).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should find llms-full.txt when llms.txt fails', async () => {
      const content = '# Full LLMs documentation for this website with all details.';

      // /llms.txt — 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // /llms-full.txt — success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => content,
      });

      const result = await detectLlmsTxt('https://example.com/page');
      expect(result.found).toBe(true);
      expect(result.url).toBe('https://example.com/llms-full.txt');
      expect(result.content).toBe(content);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
