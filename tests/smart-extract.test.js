import { describe, it, expect } from 'vitest';
import { extractSmartData } from '../src/core/smart-extract.js';

describe('Smart Extraction', () => {
  describe('Email detection', () => {
    it('should extract simple emails', () => {
      const result = extractSmartData('Contact us at hello@example.com for info.');
      expect(result.emails).toContain('hello@example.com');
    });

    it('should extract multiple emails', () => {
      const text = 'Email john@test.com or jane@company.org';
      const result = extractSmartData(text);
      expect(result.emails).toHaveLength(2);
      expect(result.emails).toContain('john@test.com');
      expect(result.emails).toContain('jane@company.org');
    });

    it('should deduplicate emails', () => {
      const text = 'Email us at info@test.com and info@test.com again';
      const result = extractSmartData(text);
      expect(result.emails).toHaveLength(1);
    });
  });

  describe('Price detection', () => {
    it('should extract USD prices', () => {
      const result = extractSmartData('Price is $49.99 per month');
      expect(result.prices).toContain('$49.99');
    });

    it('should extract EUR prices', () => {
      const result = extractSmartData('Costs \u20AC29.90 for the plan');
      expect(result.prices).toContain('\u20AC29.90');
    });

    it('should extract prices with currency codes', () => {
      const result = extractSmartData('Total: 150 USD');
      expect(result.prices).toContain('150 USD');
    });
  });

  describe('Phone detection', () => {
    it('should extract phone numbers', () => {
      const result = extractSmartData('Call us at +1-555-123-4567');
      expect(result.phones).toBeDefined();
      expect(result.phones.length).toBeGreaterThan(0);
    });

    it('should ignore short number sequences', () => {
      const result = extractSmartData('Version 1.2.3 was released');
      expect(result.phones).toBeUndefined();
    });
  });

  describe('Date detection', () => {
    it('should extract ISO dates', () => {
      const result = extractSmartData('Published on 2024-03-15');
      expect(result.dates).toContain('2024-03-15');
    });

    it('should extract written dates', () => {
      const result = extractSmartData('Updated January 5, 2024');
      expect(result.dates).toContain('January 5, 2024');
    });

    it('should extract abbreviated month dates', () => {
      const result = extractSmartData('Deadline: Mar 20, 2025');
      expect(result.dates).toContain('Mar 20, 2025');
    });
  });

  describe('Obfuscated email detection', () => {
    it('should detect [at] [dot] format', () => {
      const result = extractSmartData('Contact user [at] domain [dot] com');
      expect(result.emails).toContain('user@domain.com');
    });

    it('should detect (at) (dot) format', () => {
      const result = extractSmartData('Email: admin (at) site (dot) org');
      expect(result.emails).toContain('admin@site.org');
    });
  });

  describe('European date format', () => {
    it('should extract "23 February 2026" format', () => {
      const result = extractSmartData('Published 23 February 2026');
      expect(result.dates).toContain('23 February 2026');
    });

    it('should extract "15 Dec 2025" format', () => {
      const result = extractSmartData('Due date: 15 Dec 2025');
      expect(result.dates).toContain('15 Dec 2025');
    });
  });

  describe('Empty input', () => {
    it('should return empty object for empty text', () => {
      expect(extractSmartData('')).toEqual({});
    });

    it('should return empty object for null', () => {
      expect(extractSmartData(null)).toEqual({});
    });

    it('should return empty object for text with no entities', () => {
      const result = extractSmartData('This is just a plain sentence with no data.');
      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
