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
  it('combines title and date into a yyyy-mm-dd slug', () => {
    expect(talkSlug('From Zero to OTel', new Date('2025-04-02'))).toBe('from-zero-to-otel-2025-04-02');
  });

  // Regression: on a year-month slug these two collided and Astro silently
  // dropped one of the pages, so a real engagement had no URL.
  it('distinguishes the same talk given twice in one month', () => {
    const brisbane = talkSlug('Rethinking Observability', new Date('2026-12-07'));
    const provence = talkSlug('Rethinking Observability', new Date('2026-12-10'));
    expect(brisbane).not.toBe(provence);
  });

  it('uses UTC so a local timezone cannot shift the day', () => {
    expect(talkSlug('X', new Date('2025-01-01T00:00:00Z'))).toBe('x-2025-01-01');
  });
});
