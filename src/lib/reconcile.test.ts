import { describe, it, expect } from 'vitest';
import { isBlank, fillBlanks, mergeSources, indexBySource } from '../../scripts/lib/reconcile-rules.mjs';

describe('isBlank', () => {
  it('treats absent, null, empty string and empty array as blank', () => {
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank('')).toBe(true);
    expect(isBlank('   ')).toBe(true);
    expect(isBlank([])).toBe(true);
  });

  it('treats a real value as not blank, including false and zero', () => {
    expect(isBlank('x')).toBe(false);
    expect(isBlank(['a'])).toBe(false);
    // playlist_position 0 means "most recently added", not "missing".
    expect(isBlank(0)).toBe(false);
    expect(isBlank(false)).toBe(false);
  });
});

describe('fillBlanks', () => {
  it('fills a field that has no value yet', () => {
    const r = fillBlanks({ title: null }, { title: 'Beyond Supports OpenTelemetry' });
    expect(r.fields.title).toBe('Beyond Supports OpenTelemetry');
    expect(r.filled).toEqual(['title']);
  });

  it('never overwrites a field that already has a value', () => {
    // The whole point: a hand-corrected date must outlive every future fetch.
    const r = fillBlanks({ date: '2026-06-23' }, { date: '2026-06-30' });
    expect(r.fields.date).toBe('2026-06-23');
    expect(r.filled).toEqual([]);
    expect(r.kept).toEqual(['date']);
  });

  it('does not report a field upstream agrees about as kept', () => {
    const r = fillBlanks({ event: 'KubeCon' }, { event: 'KubeCon' });
    expect(r.kept).toEqual([]);
    expect(r.filled).toEqual([]);
  });

  it('ignores blanks offered by the fetcher', () => {
    const r = fillBlanks({ location: null }, { location: null, event: 'KCD' });
    expect(r.fields.location).toBe(null);
    expect(r.filled).toEqual(['event']);
  });

  it('leaves the input object untouched', () => {
    const entry = { title: null };
    fillBlanks(entry, { title: 'x' });
    expect(entry.title).toBe(null);
  });

  it('leaves sources to mergeSources', () => {
    const r = fillBlanks({ sources: { youtube: 'a' } }, { sources: { youtube: 'b' } });
    expect(r.fields.sources).toEqual({ youtube: 'a' });
    expect(r.filled).toEqual([]);
  });
});

describe('mergeSources', () => {
  it('records a new provenance key', () => {
    const r = mergeSources({ sources: {} }, 'youtube', 'q_Ffw2P_31Q');
    expect(r.sources).toEqual({ youtube: 'q_Ffw2P_31Q' });
    expect(r.changed).toBe(true);
  });

  it('is a no-op when the key is already recorded', () => {
    const r = mergeSources({ sources: { youtube: 'q_Ffw2P_31Q' } }, 'youtube', 'q_Ffw2P_31Q');
    expect(r.changed).toBe(false);
    expect(r.conflict).toBe(null);
  });

  it('reports a conflict rather than repointing an existing key', () => {
    // Two different videos claiming one engagement is a human problem.
    const r = mergeSources({ sources: { youtube: 'aaa' } }, 'youtube', 'bbb');
    expect(r.changed).toBe(false);
    expect(r.conflict).toBe('aaa');
    expect(r.sources).toEqual({ youtube: 'aaa' });
  });

  it('keeps other sources when adding one', () => {
    const r = mergeSources({ sources: { sessionize: 'kcd' } }, 'youtube', 'vid');
    expect(r.sources).toEqual({ sessionize: 'kcd', youtube: 'vid' });
  });

  it('handles an entry with no sources at all', () => {
    const r = mergeSources({}, 'notist', 'https://noti.st/x');
    expect(r.sources).toEqual({ notist: 'https://noti.st/x' });
  });
});

describe('indexBySource', () => {
  it('indexes only entries carrying that source', () => {
    const a = { sources: { youtube: 'v1' } };
    const b = { sources: { sessionize: 's1' } };
    const c = {};
    const index = indexBySource([a, b, c], 'youtube');
    expect(index.size).toBe(1);
    expect(index.get('v1')).toBe(a);
  });
});
