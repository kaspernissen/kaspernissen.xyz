import { describe, it, expect } from 'vitest';
import { sortTalks } from './sortTalks';

const talk = (date: string, playlist_position: number | null = null) => ({
  data: { date: new Date(date), playlist_position },
});

describe('sortTalks', () => {
  it('orders by date, most recent first', () => {
    const out = sortTalks([talk('2019-01-01'), talk('2026-01-01'), talk('2022-01-01')]);
    expect(out.map((t) => t.data.date.getUTCFullYear())).toEqual([2026, 2022, 2019]);
  });

  it('sorts by date even when playlist positions disagree', () => {
    // Playlist order is curation order, not chronology: a recently-added video
    // can be an old talk. Date must win.
    const out = sortTalks([talk('2017-10-01', 0), talk('2026-05-07', 40)]);
    expect(out.map((t) => t.data.date.getUTCFullYear())).toEqual([2026, 2017]);
  });

  it('mixes playlist and non-playlist talks purely by date', () => {
    const out = sortTalks([talk('2020-01-01', 3), talk('2024-01-01'), talk('2022-01-01', 1)]);
    expect(out.map((t) => t.data.date.getUTCFullYear())).toEqual([2024, 2022, 2020]);
  });

  it('breaks date ties by playlist position', () => {
    const out = sortTalks([talk('2026-01-01', 5), talk('2026-01-01', 2)]);
    expect(out.map((t) => t.data.playlist_position)).toEqual([2, 5]);
  });

  it('puts a playlist talk ahead of a non-playlist talk on a tied date', () => {
    const out = sortTalks([talk('2026-01-01'), talk('2026-01-01', 7)]);
    expect(out[0].data.playlist_position).toBe(7);
  });

  it('treats position 0 as a real position on a tied date', () => {
    const out = sortTalks([talk('2026-01-01', 9), talk('2026-01-01', 0)]);
    expect(out[0].data.playlist_position).toBe(0);
  });

  it('does not mutate the input array', () => {
    const input = [talk('2020-01-01', 1), talk('2021-01-01', 0)];
    const copy = [...input];
    sortTalks(input);
    expect(input).toEqual(copy);
  });
});
