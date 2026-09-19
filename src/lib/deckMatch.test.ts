import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain .mjs helper shared with the build scripts
import { scorePair, planDeckLinks, MAX_LAG_DAYS } from '../../scripts/lib/deck-match.mjs';

const deck = (title: string, date: string, event = 'Some Conference') => ({ title, date, event });
const talk = (
  title: string,
  date: string,
  youtube_id: string | null = 'vid00000001',
  event = 'Kasper Borg Nissen',
) => ({ title, date, youtube_id, event });

describe('scorePair', () => {
  it('pairs a deck with a recording published days later', () => {
    const r = scorePair(deck('The Paved Path', '2025-10-27'), talk('The Paved Path', '2025-10-30'));
    expect(r).not.toBeNull();
    expect(r.lagDays).toBe(3);
  });

  it('accepts a same-day recording', () => {
    expect(scorePair(deck('A Talk', '2025-06-23'), talk('A Talk', '2025-06-23'))?.lagDays).toBe(0);
  });

  it('rejects a recording that predates the event', () => {
    // The real failure this guards: one "Breaking Free" video, three decks.
    // Against the December deck the video is 75 days early — a different
    // delivery of the same recurring talk.
    expect(scorePair(deck('Breaking Free', '2025-12-15'), talk('Breaking Free', '2025-10-01'))).toBeNull();
  });

  it('rejects a recording published long after the event', () => {
    expect(scorePair(deck('A Talk', '2025-01-01'), talk('A Talk', '2025-06-01'))).toBeNull();
  });

  it('accepts a lag exactly at the limit and rejects one past it', () => {
    const at = new Date(Date.UTC(2025, 0, 1 + MAX_LAG_DAYS)).toISOString().slice(0, 10);
    const past = new Date(Date.UTC(2025, 0, 2 + MAX_LAG_DAYS)).toISOString().slice(0, 10);
    expect(scorePair(deck('A Talk', '2025-01-01'), talk('A Talk', at))).not.toBeNull();
    expect(scorePair(deck('A Talk', '2025-01-01'), talk('A Talk', past))).toBeNull();
  });

  it('rejects a talk with no recording', () => {
    expect(scorePair(deck('A Talk', '2025-01-01'), talk('A Talk', '2025-01-02', null))).toBeNull();
  });

  it('rejects titles that are merely similar', () => {
    expect(
      scorePair(deck('Rethinking Observability as a Platform Capability', '2026-03-12'),
        talk('Keynote The Observability Platform Engineering Advantage', '2026-03-20')),
    ).toBeNull();
  });

  it('does not require the event to match, since YouTube reports a channel name', () => {
    const r = scorePair(
      deck('Debugging OpenTelemetry', '2025-06-17', 'KubeCon+CloudNativeCon Japan 2025'),
      talk('Debugging OpenTelemetry', '2025-06-26', 'vid00000001', 'Kasper Borg Nissen, Dash0'),
    );
    expect(r).not.toBeNull();
    expect(r.sameEvent).toBe(false);
  });

  it('notices when the event does agree despite different wording', () => {
    const r = scorePair(
      deck('Golden Paths', '2025-12-05', 'KCD Suisse Romande 2025'),
      talk('Golden Paths', '2025-12-16', 'vid00000001', 'Cloud Native Suisse Romande'),
    );
    expect(r?.sameEvent).toBe(true);
  });
});

describe('planDeckLinks', () => {
  it('gives one recording to only the closest of several repeat decks', () => {
    const sept = deck('Breaking Free', '2025-09-09');
    const dec = deck('Breaking Free', '2025-12-15');
    const march = deck('Breaking Free', '2026-03-05');
    const recording = talk('Breaking Free', '2025-10-01');

    const { links, unlinkedDecks } = planDeckLinks([sept, dec, march], [recording]);
    expect(links).toHaveLength(1);
    expect(links[0].deck).toBe(sept);
    expect(unlinkedDecks).toEqual([dec, march]);
  });

  it('pairs each deck with its own recording when both exist', () => {
    const d1 = deck('Talk One', '2025-01-01');
    const d2 = deck('Talk Two', '2025-02-01');
    const t1 = talk('Talk One', '2025-01-05', 'aaaaaaaaaaa');
    const t2 = talk('Talk Two', '2025-02-03', 'bbbbbbbbbbb');

    const { links } = planDeckLinks([d1, d2], [t1, t2]);
    expect(links).toHaveLength(2);
    expect(links.find((l) => l.deck === d1)?.talk).toBe(t1);
    expect(links.find((l) => l.deck === d2)?.talk).toBe(t2);
  });

  it('never assigns the same talk twice', () => {
    const { links } = planDeckLinks(
      [deck('A Talk', '2025-01-01'), deck('A Talk', '2025-01-02')],
      [talk('A Talk', '2025-01-10')],
    );
    expect(links).toHaveLength(1);
  });

  it('reports every deck as unlinked when nothing matches', () => {
    const decks = [deck('Solo Deck', '2025-01-01')];
    const { links, unlinkedDecks } = planDeckLinks(decks, [talk('Unrelated Subject', '2025-01-02')]);
    expect(links).toHaveLength(0);
    expect(unlinkedDecks).toEqual(decks);
  });

  it('handles empty inputs', () => {
    expect(planDeckLinks([], []).links).toHaveLength(0);
    expect(planDeckLinks([], [talk('A Talk', '2025-01-01')]).links).toHaveLength(0);
  });
});
