import { describe, it, expect } from 'vitest';
import { extractTables } from '../src/core/table-detect.js';

describe('Table Detection', () => {
  it('should extract a simple table with headers', () => {
    const html = `
      <table>
        <thead>
          <tr><th>Name</th><th>Age</th><th>City</th></tr>
        </thead>
        <tbody>
          <tr><td>Alice</td><td>30</td><td>Paris</td></tr>
          <tr><td>Bob</td><td>25</td><td>London</td></tr>
        </tbody>
      </table>
    `;

    const tables = extractTables(html);
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['Name', 'Age', 'City']);
    expect(tables[0].rows).toHaveLength(2);
    expect(tables[0].rows[0]).toEqual(['Alice', '30', 'Paris']);
  });

  it('should extract a table without thead', () => {
    const html = `
      <table>
        <tr><td>A</td><td>B</td></tr>
        <tr><td>1</td><td>2</td></tr>
      </table>
    `;

    const tables = extractTables(html);
    expect(tables).toHaveLength(1);
    expect(tables[0].rows.length).toBeGreaterThan(0);
  });

  it('should extract table caption', () => {
    const html = `
      <table>
        <caption>Sales Data</caption>
        <thead><tr><th>Product</th><th>Revenue</th></tr></thead>
        <tbody><tr><td>Widget</td><td>$100</td></tr></tbody>
      </table>
    `;

    const tables = extractTables(html);
    expect(tables[0].caption).toBe('Sales Data');
  });

  it('should generate markdown table', () => {
    const html = `
      <table>
        <thead><tr><th>X</th><th>Y</th></tr></thead>
        <tbody><tr><td>1</td><td>2</td></tr></tbody>
      </table>
    `;

    const tables = extractTables(html);
    expect(tables[0].markdown).toContain('| X | Y |');
    expect(tables[0].markdown).toContain('| --- | --- |');
    expect(tables[0].markdown).toContain('| 1 | 2 |');
  });

  it('should handle multiple tables', () => {
    const html = `
      <table><tr><td>A</td></tr></table>
      <table><tr><td>B</td></tr></table>
    `;

    const tables = extractTables(html);
    expect(tables).toHaveLength(2);
  });

  it('should return empty array for no tables', () => {
    expect(extractTables('<p>No tables here</p>')).toEqual([]);
  });

  it('should return empty array for empty input', () => {
    expect(extractTables('')).toEqual([]);
    expect(extractTables(null)).toEqual([]);
  });
});
