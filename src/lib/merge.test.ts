import { describe, it, expect } from 'vitest';
import { titleSimilarity, shouldMergeYouTube } from './merge';

describe('titleSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(titleSimilarity('Hello World', 'Hello World')).toBe(1);
  });
  it('returns >0.8 for near-duplicate titles', () => {
    const score = titleSimilarity(
      'From Zero to Production with OpenTelemetry',
      'From Zero to Production with OpenTelemetry — KubeCon EU 2025',
    );
    expect(score).toBeGreaterThan(0.8);
  });
  it('returns <0.5 for unrelated strings', () => {
    expect(titleSimilarity('Kubernetes intro', 'OpenTelemetry deep dive')).toBeLessThan(0.5);
  });
});

describe('shouldMergeYouTube', () => {
  it('matches when manual entry has the same youtube_id', () => {
    const manual = [{ title: 'X', youtube_id: 'abc' }];
    expect(shouldMergeYouTube(manual, { title: 'Different', youtube_id: 'abc' })).toEqual(manual[0]);
  });
  it('matches by title similarity > 0.8', () => {
    const manual = [{ title: 'From Zero to Production with OpenTelemetry', youtube_id: null }];
    expect(
      shouldMergeYouTube(manual, {
        title: 'From Zero to Production with OpenTelemetry — KubeCon EU 2025',
        youtube_id: 'xyz',
      })?.title,
    ).toBe(manual[0].title);
  });
  it('returns null when nothing matches', () => {
    expect(shouldMergeYouTube([{ title: 'Foo', youtube_id: null }], { title: 'Bar', youtube_id: 'q' })).toBeNull();
  });
});
