/**
 * Which engagement a photo belongs to.
 *
 * The original rule was the date alone: a photo shot between an engagement's
 * first and last day belongs to it. That is the right default — most photos
 * arrive with nothing but EXIF — but it cannot separate two engagements that
 * overlap, and at a flagship conference they always do. KubeCon + CloudNativeCon
 * Europe 2026 runs 23-26 March and Observability Day, a co-located event, runs
 * inside it, so every Observability Day photo appeared on both pages.
 *
 * A photo that names its event is stating something the date cannot, and the
 * name wins. The date then only chooses between entries for that same event —
 * KCD Helsinki 2025 has one entry for the delivery and one for the recording,
 * and the photos belong to the day they were taken.
 *
 * Falling back rather than failing matters: a photo whose event matches nothing
 * (a name we render for people, not for matching) keeps the old date behaviour
 * instead of vanishing from every page.
 */

const DAY = 86_400_000;

// import-photos writes these when it refuses to guess. They are placeholders,
// not event names, and must never match an engagement called "TBD".
const UNNAMED = new Set(['', 'tbd', 'unknown']);

type PhotoLike = { data: { event?: string | null; date?: Date | null } };
type EngagementLike = {
  data: { event: string; title?: string | null; date: Date; end_date?: Date | null };
};

const normalise = (s?: string | null) =>
  (s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** True when the photo was taken on one of the engagement's days. */
function covers(engagement: EngagementLike, photo: PhotoLike): boolean {
  const at = photo.data.date;
  if (!at) return false;
  const from = +engagement.data.date;
  const to = +(engagement.data.end_date ?? engagement.data.date) + DAY;
  return +at >= from && +at < to;
}

/**
 * The engagements that may show this photo. Usually one; empty for a photo with
 * no date and no matching event name, which stays in the general gallery.
 */
export function claimants<E extends EngagementLike>(engagements: E[], photo: PhotoLike): E[] {
  const named = normalise(photo.data.event);

  if (named && !UNNAMED.has(named)) {
    const byName = engagements.filter(
      (e) => normalise(e.data.event) === named || normalise(e.data.title) === named,
    );
    if (byName.length > 0) {
      // Several entries can carry one event name — the engagement and the
      // recording of it. The date decides between them; if it sits outside all
      // of them the name still stands, because it is the stronger claim.
      const dated = byName.filter((e) => covers(e, photo));
      return dated.length > 0 ? dated : byName;
    }
  }

  return engagements.filter((e) => covers(e, photo));
}

/** Every engagement's gallery in one pass, keyed by the engagement itself. */
export function assignPhotos<E extends EngagementLike, P extends PhotoLike>(
  engagements: E[],
  photos: P[],
): Map<E, P[]> {
  const galleries = new Map<E, P[]>(engagements.map((e) => [e, []]));
  for (const photo of photos) {
    for (const engagement of claimants(engagements, photo)) {
      galleries.get(engagement)!.push(photo);
    }
  }
  return galleries;
}
