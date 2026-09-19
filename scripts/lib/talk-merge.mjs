// Shared logic for collapsing duplicate talk entries.
//
// The same talk often arrives from two sources: the GitHub profile README
// (hand-curated — real event name, real date the talk was *given*, usually no
// recording link) and the YouTube playlist (has the recording, but `event` is
// just the channel name and `date` is the *upload* date).
//
// fetch-youtube.mjs only dedupes on an exact youtube_id match, so a README
// entry with `youtube_id: null` claims nothing and the playlist writes a second
// row. The result is one talk listed twice, and the copy people land on is the
// one with no video.
//
// Merging on title alone is NOT safe here: Kasper gives recurring talks, so
// "Keynote: Closing Remarks" and "The Paved Path to Observability" each appear
// multiple times as genuinely different recordings. Three guards keep it honest:
//
//   Exactly one side has a recording. Two videos with the same title are two
//   different deliveries and are always left alone.
//
//   Direction of time. A recording's `date` is its upload date, which falls on
//   or after the day the talk was given — never before. A video uploaded BEFORE
//   a delivery is a recording of some earlier delivery of the same talk. This
//   matters most for the upcoming schedule: without it, a recurring talk's
//   existing recording gets merged into a future engagement, overwriting its
//   date and event and effectively deleting it from the calendar.
//
//   Closest delivery wins. Where one recording could belong to several past
//   deliveries, the one it followed most closely claims it and the rest keep
//   their own entry with no video.
//
//   Never two curated entries. A merge pairs a curated entry with a YouTube
//   one; two curated entries are two real deliveries ("Lunar Way's journey" at
//   CloudNative London on 2017-09-27 and at GOTO Copenhagen on 2017-10-01) and
//   must both survive. This also makes the pass idempotent: once a curated
//   entry has absorbed a recording it can no longer pair with anything, so
//   re-running can't cascade one curated entry into another. Without it a
//   second run silently deletes real engagements.

const UNKNOWN_EVENTS = new Set(['', 'unknown', 'unknown event']);

// Conference editors can be slow — the GOTO Copenhagen 2017 talk went up 117
// days later. A year of headroom is safe because the direction-of-time guard
// and closest-delivery-wins do the discriminating work.
export const MAX_MERGE_LAG_DAYS = 400;

const DAY = 86_400_000;

const toTime = (d) => {
  if (d instanceof Date) return d.getTime();
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : NaN;
};

/**
 * Days between a delivery and the upload of its recording, or null when the
 * pair is impossible (unusable dates, or the video predates the delivery).
 */
export function mergeLagDays(withoutVideo, withVideo) {
  const given = toTime(withoutVideo.date);
  const uploaded = toTime(withVideo.date);
  if (!Number.isFinite(given) || !Number.isFinite(uploaded)) return null;
  const lag = Math.round((uploaded - given) / DAY);
  if (lag < 0 || lag > MAX_MERGE_LAG_DAYS) return null;
  return lag;
}

const normalise = (s) =>
  (s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** 0..1 similarity between two talk titles. 1 = identical once normalised. */
export function titleSimilarity(a, b) {
  const A = normalise(a);
  const B = normalise(b);
  if (!A || !B) return 0;
  if (A === B) return 1;

  const [longer, shorter] = A.length >= B.length ? [A, B] : [B, A];
  if (longer.includes(shorter)) {
    return Math.min(1, shorter.length / longer.length + 0.1);
  }

  // Levenshtein, normalised by the longer string.
  const m = longer.length;
  const n = shorter.length;
  const dp = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] =
        longer[i - 1] === shorter[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return 1 - dp[n] / longer.length;
}

const hasVideo = (t) => typeof t.youtube_id === 'string' && t.youtube_id !== 'null' && t.youtube_id !== '';
const isUnknownEvent = (e) => UNKNOWN_EVENTS.has(normalise(e));

/**
 * Field-level merge of a curated entry and a recording entry.
 *
 * `withoutVideo` supplies identity (title, event, the date the talk was given);
 * `withVideo` supplies the recording, the abstract and the playlist position so
 * the merged talk still sorts by playlist order.
 */
export function mergeTalkPair(withoutVideo, withVideo) {
  const preferEvent =
    !isUnknownEvent(withoutVideo.event)
      ? withoutVideo.event
      : !isUnknownEvent(withVideo.event)
        ? withVideo.event
        : withoutVideo.event;

  // The talk happened on or before the day the recording went up.
  const earlier = [withoutVideo.date, withVideo.date].filter(Boolean).sort()[0];

  return {
    ...withVideo,
    ...withoutVideo,
    title: withoutVideo.title || withVideo.title,
    event: preferEvent,
    date: earlier ?? withoutVideo.date,
    youtube_id: withVideo.youtube_id,
    abstract: withoutVideo.abstract ?? withVideo.abstract ?? null,
    location: withoutVideo.location ?? withVideo.location ?? null,
    playlist_position: withVideo.playlist_position ?? withoutVideo.playlist_position ?? null,
    tags: [...new Set([...(withoutVideo.tags ?? []), ...(withVideo.tags ?? [])])],
  };
}

/**
 * Decide which talks to collapse.
 *
 * Returns one plan per merge: `keep` is the file to rewrite with `merged`
 * contents, `drop` is the file to delete. Pairs where both or neither side has
 * a recording are never returned.
 */
export function planMerges(talks, { threshold = 0.7 } = {}) {
  const candidates = [];

  for (let i = 0; i < talks.length; i++) {
    for (let j = i + 1; j < talks.length; j++) {
      const a = talks[i];
      const b = talks[j];

      // Exactly one side has a recording.
      if (hasVideo(a) === hasVideo(b)) continue;
      // Two hand-curated entries are two real deliveries — never collapse them.
      if (a.source === 'curated' && b.source === 'curated') continue;

      const withVideo = hasVideo(a) ? a : b;
      const withoutVideo = hasVideo(a) ? b : a;

      const score = titleSimilarity(a.title, b.title);
      if (score < threshold) continue;

      // Direction of time: the upload cannot precede the delivery.
      const lagDays = mergeLagDays(withoutVideo, withVideo);
      if (lagDays === null) continue;

      candidates.push({ withVideo, withoutVideo, score, lagDays });
    }
  }

  // Closest delivery wins, so a recurring talk's recording attaches to the
  // delivery it actually followed rather than the first one encountered.
  candidates.sort((x, y) => x.lagDays - y.lagDays || y.score - x.score);

  const plans = [];
  const consumed = new Set();
  for (const c of candidates) {
    if (consumed.has(c.withVideo) || consumed.has(c.withoutVideo)) continue;
    consumed.add(c.withVideo);
    consumed.add(c.withoutVideo);
    plans.push({
      keep: c.withoutVideo.file,
      drop: c.withVideo.file,
      score: c.score,
      lagDays: c.lagDays,
      merged: mergeTalkPair(c.withoutVideo, c.withVideo),
    });
  }
  return plans;
}
