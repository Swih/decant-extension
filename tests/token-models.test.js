import { describe, it, expect } from 'vitest';
import {
  TOKEN_MODELS,
  CONTEXT_WINDOWS,
  estimateForModel,
  estimateAllModels,
} from '../src/core/token-models.js';

describe('token-models', () => {
  // 1. estimateForModel returns 0 tokens for empty/null text
  it('returns 0 tokens for empty string', () => {
    const result = estimateForModel('', 'claude');
    expect(result.tokens).toBe(0);
    expect(result.pctContext).toBe(0);
  });

  it('returns 0 tokens for null text', () => {
    const result = estimateForModel(null, 'claude');
    expect(result.tokens).toBe(0);
    expect(result.pctContext).toBe(0);
  });

  // 2. estimateForModel returns correct structure
  it('returns correct structure { tokens, pctContext, modelId }', () => {
    const result = estimateForModel('hello world', 'claude');
    expect(result).toHaveProperty('tokens');
    expect(result).toHaveProperty('pctContext');
    expect(result).toHaveProperty('modelId');
    expect(typeof result.tokens).toBe('number');
    expect(typeof result.pctContext).toBe('number');
    expect(typeof result.modelId).toBe('string');
  });

  // 3. Claude ratio (3.8): 1000 chars -> ~263 tokens
  it('estimates ~263 tokens for 1000 chars with Claude (ratio 3.8)', () => {
    const text = 'a'.repeat(1000);
    const result = estimateForModel(text, 'claude');
    expect(result.tokens).toBe(Math.round(1000 / 3.8)); // 263
  });

  // 4. GPT-4o ratio (4.0): 1000 chars -> 250 tokens
  it('estimates 250 tokens for 1000 chars with GPT-4o (ratio 4.0)', () => {
    const text = 'a'.repeat(1000);
    const result = estimateForModel(text, 'gpt4o');
    expect(result.tokens).toBe(250);
  });

  // 5. Llama ratio (3.5): 1000 chars -> ~286 tokens
  it('estimates ~286 tokens for 1000 chars with Llama (ratio 3.5)', () => {
    const text = 'a'.repeat(1000);
    const result = estimateForModel(text, 'llama');
    expect(result.tokens).toBe(Math.round(1000 / 3.5)); // 286
  });

  // 6. Unknown model falls back to first model (claude)
  it('falls back to claude for unknown model id', () => {
    const text = 'a'.repeat(1000);
    const result = estimateForModel(text, 'nonexistent');
    // Should use claude ratio (3.8) as fallback
    expect(result.tokens).toBe(Math.round(1000 / 3.8));
    // modelId stays as the requested one
    expect(result.modelId).toBe('nonexistent');
  });

  // 7. pctContext calculation: 200K context = 204800 tokens, 1000 tokens -> ~0%
  it('calculates pctContext correctly (1000 tokens in 200K context rounds to 0)', () => {
    // 1000 tokens / 204800 total * 100 = 0.488... -> rounds to 0
    const text = 'a'.repeat(3800); // 3800 / 3.8 = 1000 tokens
    const result = estimateForModel(text, 'claude');
    expect(result.tokens).toBe(1000);
    expect(result.pctContext).toBe(0);
  });

  // 8. estimateAllModels returns keys for all 6 models
  it('estimateAllModels returns keys for all 6 models', () => {
    const text = 'a'.repeat(1000);
    const all = estimateAllModels(text);
    const expectedKeys = TOKEN_MODELS.map(m => m.id);
    expect(Object.keys(all)).toEqual(expectedKeys);
    expect(Object.keys(all)).toHaveLength(6);
  });

  // 9. estimateAllModels returns consistent structure for each model
  it('estimateAllModels returns consistent structure for each model', () => {
    const text = 'a'.repeat(1000);
    const all = estimateAllModels(text);
    for (const modelId of Object.keys(all)) {
      const entry = all[modelId];
      expect(entry).toHaveProperty('tokens');
      expect(entry).toHaveProperty('pctContext');
      expect(entry).toHaveProperty('modelId');
      expect(entry.modelId).toBe(modelId);
      expect(typeof entry.tokens).toBe('number');
      expect(typeof entry.pctContext).toBe('number');
      expect(entry.tokens).toBeGreaterThan(0);
    }
  });

  // 10. Large text (100K chars) produces reasonable estimates across models
  it('produces reasonable estimates for large text (100K chars)', () => {
    const text = 'a'.repeat(100_000);
    const all = estimateAllModels(text);
    for (const model of TOKEN_MODELS) {
      const entry = all[model.id];
      const expectedTokens = Math.round(100_000 / model.ratio);
      expect(entry.tokens).toBe(expectedTokens);
      // Tokens should be in a reasonable range (20K-30K)
      expect(entry.tokens).toBeGreaterThan(20_000);
      expect(entry.tokens).toBeLessThan(30_000);
      // pctContext should be a small positive number for most models
      expect(entry.pctContext).toBeGreaterThanOrEqual(0);
      expect(entry.pctContext).toBeLessThanOrEqual(100);
    }
  });
});
