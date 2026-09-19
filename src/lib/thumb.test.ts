import { describe, it, expect } from 'vitest';
import { hashString, paletteFor, layoutFor, PALETTES, LAYOUT_COUNT } from './thumb';

describe('generated talk artwork', () => {
  it('is stable for the same title', () => {
    // The whole point: a talk must not change colour between builds.
    expect(paletteFor('The Paved Path to Observability'))
      .toBe(paletteFor('The Paved Path to Observability'));
    expect(layoutFor('The Paved Path to Observability'))
      .toBe(layoutFor('The Paved Path to Observability'));
  });

  it('always picks a real palette and layout', () => {
    for (const title of ['a', '', 'Æøå — “quoted”', 'x'.repeat(500)]) {
      expect(PALETTES).toContain(paletteFor(title));
      expect(layoutFor(title)).toBeGreaterThanOrEqual(0);
      expect(layoutFor(title)).toBeLessThan(LAYOUT_COUNT);
    }
  });

  it('spreads real talk titles across palettes and layouts', () => {
    const titles = [
      'The Paved Path to Observability',
      'Breaking Free with Open Standards',
      'Golden Paths for Async Workflows',
      'Debugging OpenTelemetry',
      'Rethinking Observability as a Platform Capability',
      'Bridging Platform Engineering and Observability',
      'Beyond “Supports OpenTelemetry”',
      'Two Years in Production with Kubernetes',
    ];
    expect(new Set(titles.map((t) => PALETTES.indexOf(paletteFor(t)))).size).toBeGreaterThan(2);
    expect(new Set(titles.map(layoutFor)).size).toBeGreaterThan(1);
  });

  it('does not tie layout to palette', () => {
    // Both come from the same title, so a shared hash would make every card in
    // one colour share one layout.
    const titles = Array.from({ length: 60 }, (_, i) => `Talk number ${i}`);
    const pairs = new Set(titles.map((t) => `${PALETTES.indexOf(paletteFor(t))}:${layoutFor(t)}`));
    expect(pairs.size).toBeGreaterThan(PALETTES.length);
  });

  it('hashes to an unsigned 32-bit integer', () => {
    for (const s of ['', 'abc', 'a'.repeat(1000)]) {
      const h = hashString(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });
});
