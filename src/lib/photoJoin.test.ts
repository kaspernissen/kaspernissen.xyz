import { describe, expect, it } from 'vitest';
import { assignPhotos, claimants } from './photoJoin';

const engagement = (event: string, date: string, end?: string, title?: string) => ({
  data: {
    event,
    title: title ?? null,
    date: new Date(date),
    end_date: end ? new Date(end) : null,
  },
});

const photo = (event: string | null, date: string | null) => ({
  data: { event, date: date ? new Date(date) : null },
});

const kubeconEu2026 = engagement('KubeCon + CloudNativeCon Europe 2026', '2026-03-23', '2026-03-26');
const observabilityDay = engagement(
  'CNCF-Hosted Co-located Events Europe 2026',
  '2026-03-23',
  '2026-03-24',
  'Observability Day',
);

describe('claimants', () => {
  it('keeps a co-located event’s photos off the conference containing it', () => {
    const shot = photo('Observability Day', '2026-03-23');
    expect(claimants([kubeconEu2026, observabilityDay], shot)).toEqual([observabilityDay]);
  });

  it('matches the event name as well as the session title', () => {
    const shot = photo('CNCF-Hosted Co-located Events Europe 2026', '2026-03-23');
    expect(claimants([kubeconEu2026, observabilityDay], shot)).toEqual([observabilityDay]);
  });

  it('ignores punctuation and case when comparing names', () => {
    const shot = photo('observability  day', '2026-03-23');
    expect(claimants([kubeconEu2026, observabilityDay], shot)).toEqual([observabilityDay]);
  });

  it('lets the date choose between two entries for the same event', () => {
    const delivery = engagement('KCD Helsinki 2025', '2025-05-20');
    const recording = engagement('KCD Helsinki 2025', '2025-05-27');
    expect(claimants([delivery, recording], photo('KCD Helsinki 2025', '2025-05-20'))).toEqual([
      delivery,
    ]);
    expect(claimants([delivery, recording], photo('KCD Helsinki 2025', '2025-05-27'))).toEqual([
      recording,
    ]);
  });

  it('keeps a named photo on its event even when the date falls outside', () => {
    const only = engagement('KCD Helsinki 2025', '2025-05-20');
    expect(claimants([only], photo('KCD Helsinki 2025', '2025-08-01'))).toEqual([only]);
  });

  it('falls back to the date when the name matches no engagement', () => {
    // The label is written for people to read, not for matching: the entry is
    // called "Container Days Conference" and the photo "ContainerDays Hamburg
    // 2025". Dropping it from every page would be worse than dating it.
    const hamburg = engagement('Container Days Conference', '2025-09-09');
    const shot = photo('ContainerDays Hamburg 2025', '2025-09-09');
    expect(claimants([hamburg], shot)).toEqual([hamburg]);
  });

  it('treats the import placeholders as no name at all', () => {
    const tbd = engagement('TBD', '2030-01-01');
    const real = engagement('Some Conference', '2025-09-09');
    expect(claimants([tbd, real], photo('TBD', '2025-09-09'))).toEqual([real]);
    expect(claimants([tbd, real], photo('Unknown', '2025-09-09'))).toEqual([real]);
  });

  it('claims nothing for a photo with neither a date nor a known event', () => {
    expect(claimants([kubeconEu2026], photo('TBD', null))).toEqual([]);
  });

  it('still covers the last day of a multi-day event', () => {
    const shot = photo(null, '2026-03-26');
    expect(claimants([kubeconEu2026], shot)).toEqual([kubeconEu2026]);
  });
});

describe('assignPhotos', () => {
  it('gives every engagement a gallery, empty ones included', () => {
    const photos = [photo('Observability Day', '2026-03-23'), photo('Observability Day', '2026-03-24')];
    const galleries = assignPhotos([kubeconEu2026, observabilityDay], photos);
    expect(galleries.get(kubeconEu2026)).toEqual([]);
    expect(galleries.get(observabilityDay)).toHaveLength(2);
  });
});
