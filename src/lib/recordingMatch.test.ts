// Tests for scripts/lib/recording-match.mjs — attaching a YouTube recording to
// the engagement it was recorded at. The entries this pass joins are the ones
// dedupe-talks can never see: an engagement with no session title and a video
// whose `event` is a channel name.
// @ts-expect-error — plain .mjs module, no type declarations
import { registrableDomain, domainsIn, scoreRecordingPair, planRecordingLinks } from '../../scripts/lib/recording-match.mjs';
import { describe, it, expect } from 'vitest';

const recording = (over: Record<string, unknown> = {}) => ({
  title: 'The Paved Path to Observability',
  event: 'Kasper Borg Nissen',
  date: '2026-08-03',
  youtube_id: 'Pc1bTfyD0Fo',
  abstract: '🌐 Website: https://cloudnativedays.ro/',
  ...over,
});

const engagement = (over: Record<string, unknown> = {}) => ({
  title: null,
  event: 'Cloud Native Days Romania 2026',
  event_url: 'https://www.cloudnativedays.ro',
  date: '2026-05-31',
  end_date: null,
  youtube_id: null,
  ...over,
});

describe('registrableDomain', () => {
  it('drops www and deeper subdomains', () => {
    expect(registrableDomain('https://www.cloudnativedays.ro')).toBe('cloudnativedays.ro');
    expect(registrableDomain('https://2026.platformcon.com/live-day-london')).toBe('platformcon.com');
  });

  it('keeps three labels for two-part suffixes', () => {
    expect(registrableDomain('https://foo.example.co.uk/x')).toBe('example.co.uk');
  });

  it('returns null for rubbish', () => {
    expect(registrableDomain('not a url')).toBe(null);
    expect(registrableDomain(null)).toBe(null);
  });
});

describe('domainsIn', () => {
  it('ignores social and video hosts that identify no event', () => {
    const found = domainsIn(
      'Watch https://youtube.com/x and https://www.linkedin.com/y and https://kcdromania.dev/',
    );
    expect(found).toEqual(['kcdromania.dev']);
  });

  it('returns an empty list for missing text', () => {
    expect(domainsIn(null)).toEqual([]);
  });
});

describe('scoreRecordingPair', () => {
  it('matches on the event link in the description', () => {
    const s = scoreRecordingPair(recording(), engagement());
    expect(s).not.toBe(null);
    expect(s.matchedBy).toBe('domain');
    expect(s.lagDays).toBe(64);
  });

  // Regression: `new Date(null)` is the epoch, so a missing end_date read as
  // 1970 and every lag landed ~20,000 days out of range. Nothing ever matched.
  it('treats a missing end_date as a single-day event, not 1970', () => {
    const withEnd = scoreRecordingPair(recording(), engagement({ end_date: '2026-05-31' }));
    const without = scoreRecordingPair(recording(), engagement({ end_date: null }));
    expect(without).not.toBe(null);
    expect(without.lagDays).toBe(withEnd.lagDays);
  });

  it('rejects an upload that predates the event', () => {
    expect(scoreRecordingPair(recording({ date: '2026-01-01' }), engagement())).toBe(null);
  });

  it('rejects an upload far beyond the window', () => {
    expect(scoreRecordingPair(recording({ date: '2027-06-01' }), engagement())).toBe(null);
  });

  it('matches a run-together channel name against the event name', () => {
    const s = scoreRecordingPair(
      recording({ event: 'KCDCzechSlovak', abstract: null, date: '2026-06-05' }),
      engagement({
        event: 'KCD Czech & Slovak 2026', event_url: null,
        date: '2026-05-21', end_date: '2026-05-22',
      }),
    );
    expect(s).not.toBe(null);
    expect(s.matchedBy).toBe('event name');
  });

  it('will not claim an engagement that already has a recording', () => {
    expect(scoreRecordingPair(recording(), engagement({ youtube_id: 'xxxxxxxxxxx' }))).toBe(null);
  });
});

describe('planRecordingLinks', () => {
  it('lets a second session at one event keep its own entry', () => {
    const keynote = recording({ event: 'KCDCzechSlovak', youtube_id: 'aaaaaaaaaaa', abstract: null, date: '2026-06-05' });
    const panel = recording({ event: 'KCDCzechSlovak', youtube_id: 'bbbbbbbbbbb', abstract: null, date: '2026-06-06' });
    const kcd = engagement({
      event: 'KCD Czech & Slovak 2026', event_url: null,
      date: '2026-05-21', end_date: '2026-05-22',
    });

    const { links, adoptions } = planRecordingLinks([keynote, panel], [kcd]);
    expect(links).toHaveLength(1);
    expect(adoptions).toHaveLength(1);
    // Two entries survive in total: the absorbed engagement and the adopter.
    expect(links[0].engagement).toBe(kcd);
    expect(adoptions[0].engagement).toBe(kcd);
  });

  it('prefers a domain match over a name match for the same recording', () => {
    const rec = recording();
    const byName = engagement({ event: 'Cloud Native Days Romania', event_url: null });
    const byDomain = engagement();
    const { links } = planRecordingLinks([rec], [byName, byDomain]);
    expect(links[0].engagement).toBe(byDomain);
  });
});
