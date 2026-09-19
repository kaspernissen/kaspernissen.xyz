// Tests for scripts/lib/talk-merge.mjs — the rules that decide when two talk
// entries are the same talk. The guard these protect: Kasper gives recurring
// talks, so identical titles with different recordings are COMMON and must
// never be collapsed.
// @ts-expect-error — plain .mjs module, no type declarations
import { titleSimilarity, planMerges, mergeTalkPair } from '../../scripts/lib/talk-merge.mjs';
import { describe, it, expect } from 'vitest';

const talk = (over: Record<string, unknown> = {}) => ({
  title: 'A talk',
  event: 'Some event',
  date: '2020-01-01',
  youtube_id: null,
  tags: [],
  file: `/tmp/${Math.random()}.yaml`,
  ...over,
});

describe('titleSimilarity', () => {
  it('scores identical titles as 1 regardless of case and punctuation', () => {
    expect(titleSimilarity("Lunar Way's journey", 'LUNAR WAY S JOURNEY!')).toBe(1);
  });

  it('scores a title that contains the other highly', () => {
    const s = titleSimilarity(
      "Lunar Way's journey towards Cloud Native utopia",
      "Lunar Way's Journey Towards Cloud Native Utopia • Kasper Nissen • GOTO 2017",
    );
    expect(s).toBeGreaterThan(0.7);
  });

  it('scores unrelated titles low', () => {
    expect(titleSimilarity('Keynote: Closing Remarks', 'Debugging OpenTelemetry')).toBeLessThan(0.5);
  });

  it('returns 0 when either title is empty', () => {
    expect(titleSimilarity('', 'anything')).toBe(0);
  });
});

describe('planMerges — safety guard', () => {
  it('never merges two talks that both have recordings, even with identical titles', () => {
    const plans = planMerges([
      talk({ title: 'Keynote: Closing Remarks', youtube_id: 'VYIHpk6TdTU' }),
      talk({ title: 'Keynote: Closing Remarks', youtube_id: 'vvxzQxeSKWA' }),
    ]);
    expect(plans).toEqual([]);
  });

  it('never merges two talks that both lack a recording', () => {
    const plans = planMerges([
      talk({ title: 'The Paved Path to Observability' }),
      talk({ title: 'The Paved Path to Observability' }),
    ]);
    expect(plans).toEqual([]);
  });

  it('does not merge dissimilar titles even when only one has a recording', () => {
    const plans = planMerges([
      talk({ title: 'Debugging OpenTelemetry' }),
      talk({ title: 'Keynote: Opening Remarks', youtube_id: 'abc12345678' }),
    ]);
    expect(plans).toEqual([]);
  });

  it('merges when titles match and exactly one side has a recording', () => {
    const plans = planMerges([
      talk({ title: "Lunar Way's journey towards Cloud Native utopia", file: '/keep.yaml' }),
      talk({
        title: "Lunar Way's Journey Towards Cloud Native Utopia • Kasper Nissen • GOTO 2017",
        youtube_id: 'a9Q5agqV1cE',
        file: '/drop.yaml',
      }),
    ]);
    expect(plans).toHaveLength(1);
    expect(plans[0].keep).toBe('/keep.yaml');
    expect(plans[0].drop).toBe('/drop.yaml');
    expect(plans[0].merged.youtube_id).toBe('a9Q5agqV1cE');
  });

  // Regression: a recording uploaded 2026-06-05 was merged into the YOW!
  // Brisbane engagement on 2026-12-03, overwriting its date and event. An
  // upload cannot predate the talk it records.
  it('never attaches a recording uploaded before the delivery', () => {
    const plans = planMerges([
      talk({ title: 'Rethinking Observability', date: '2026-12-03' }),
      talk({ title: 'Rethinking Observability', date: '2026-06-05', youtube_id: 'B29H8cx6UyM' }),
    ]);
    expect(plans).toEqual([]);
  });

  it('gives a recording to the delivery it most closely followed', () => {
    const plans = planMerges([
      talk({ title: 'Recurring Talk', date: '2025-01-01', file: '/far.yaml' }),
      talk({ title: 'Recurring Talk', date: '2025-06-01', file: '/near.yaml' }),
      talk({ title: 'Recurring Talk', date: '2025-06-10', youtube_id: 'aaaaaaaaaaa', file: '/vid.yaml' }),
    ]);
    expect(plans).toHaveLength(1);
    expect(plans[0].keep).toBe('/near.yaml');
  });

  // Regression: "Lunar Way's journey" was given at CloudNative London on
  // 2017-09-27 and at GOTO Copenhagen on 2017-10-01. Collapsing the two
  // deleted a real engagement.
  it('never collapses two curated entries into each other', () => {
    const plans = planMerges([
      talk({ title: 'Same Talk', date: '2017-09-27', source: 'curated' }),
      talk({
        title: 'Same Talk', date: '2017-10-01', source: 'curated',
        youtube_id: 'a9Q5agqV1cE',
      }),
    ]);
    expect(plans).toEqual([]);
  });

  it('still merges a curated entry with a YouTube-sourced recording', () => {
    const plans = planMerges([
      talk({ title: 'Same Talk', date: '2017-10-01', source: 'curated', file: '/keep.yaml' }),
      talk({
        title: 'Same Talk', date: '2018-01-26', source: 'youtube',
        youtube_id: 'a9Q5agqV1cE', file: '/drop.yaml',
      }),
    ]);
    expect(plans).toHaveLength(1);
    expect(plans[0].keep).toBe('/keep.yaml');
  });

  it('consumes each talk at most once', () => {
    const plans = planMerges([
      talk({ title: 'Same Talk' }),
      talk({ title: 'Same Talk', youtube_id: 'aaaaaaaaaaa' }),
      talk({ title: 'Same Talk', youtube_id: 'bbbbbbbbbbb' }),
    ]);
    expect(plans).toHaveLength(1);
  });
});

describe('mergeTalkPair', () => {
  const curated = talk({
    title: "Lunar Way's journey towards Cloud Native utopia",
    event: 'GOTO Copenhagen',
    date: '2017-10-01',
  });
  const recording = talk({
    title: "Lunar Way's Journey … • GOTO 2017",
    event: 'GOTO Conferences',
    date: '2018-01-26',
    youtube_id: 'a9Q5agqV1cE',
    abstract: 'Recorded at GOTO Copenhagen 2017',
    playlist_position: 51,
  });

  it('keeps the curated title and event', () => {
    const m = mergeTalkPair(curated, recording);
    expect(m.title).toBe("Lunar Way's journey towards Cloud Native utopia");
    expect(m.event).toBe('GOTO Copenhagen');
  });

  it('keeps the earlier date — the talk predates the upload', () => {
    expect(mergeTalkPair(curated, recording).date).toBe('2017-10-01');
  });

  it('takes the recording, abstract and playlist position from the video entry', () => {
    const m = mergeTalkPair(curated, recording);
    expect(m.youtube_id).toBe('a9Q5agqV1cE');
    expect(m.abstract).toBe('Recorded at GOTO Copenhagen 2017');
    expect(m.playlist_position).toBe(51);
  });

  it('falls back to the video entry event when the curated one is Unknown', () => {
    const m = mergeTalkPair(talk({ event: 'Unknown event' }), recording);
    expect(m.event).toBe('GOTO Conferences');
  });

  it('unions tags from both entries', () => {
    const m = mergeTalkPair(talk({ tags: ['gitops'] }), talk({ tags: ['k8s', 'gitops'], youtube_id: 'x' }));
    expect([...m.tags].sort()).toEqual(['gitops', 'k8s']);
  });
});
