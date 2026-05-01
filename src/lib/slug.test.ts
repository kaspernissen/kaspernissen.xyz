import { describe, it, expect } from 'vitest';
import { slugify, talkSlug } from './slug';

describe('slugify', () => {
  it('lowercases and replaces non-alphanumerics with dashes', () => {
    expect(slugify('From Zero to Production!')).toBe('from-zero-to-production');
  });
  it('collapses multiple dashes and trims edges', () => {
    expect(slugify('  Hello —  World  ')).toBe('hello-world');
  });
  it('handles unicode by stripping accents', () => {
    expect(slugify('Café Deluxe')).toBe('cafe-deluxe');
  });
});

describe('talkSlug', () => {
  it('combines title and date into yyyy-mm slug', () => {
    expect(talkSlug('From Zero to OTel', new Date('2025-04-02'))).toBe('from-zero-to-otel-2025-04');
  });
});
