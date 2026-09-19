// Attaches a YouTube recording to the engagement it was recorded at.
//
// dedupe-talks can only pair entries whose titles match. That misses the common
// case entirely: a Sessionize engagement usually has NO session title (it shows
// the event name instead), and a YouTube entry's `event` is the channel title
// ("Kasper Borg Nissen"), not the conference. So "The Paved Path to
// Observability" uploaded on 2026-08-03 sat as its own entry instead of joining
// "Cloud Native Days Romania 2026" on 2026-05-31 in Bucharest.
//
// The signal that does work is the link in the video description. Conference
// channels put the event's own site there, so a video whose description points
// at cloudnativedays.ro belongs to the engagement whose event_url is
// cloudnativedays.ro. Matching registrable domains is a far stronger claim than
// any fuzzy title comparison, and it is paired with the same direction-of-time
// rule used everywhere else: an upload cannot predate the talk.

import { eventAgrees } from './deck-match.mjs';

const DAY = 86_400_000;

// A conference video normally goes up within a couple of months. This is wider
// than the deck window because conference editors are slower than Kasper is.
export const MAX_RECORDING_LAG_DAYS = 120;

// `new Date(null)` is the epoch, not an invalid date, so an absent end_date
// would silently read as 1970 and blow every lag window. Reject empties first.
const toTime = (d) => {
  if (d instanceof Date) return d.getTime();
  if (d === null || d === undefined || d === '') return NaN;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : NaN;
};

// Hosts that appear in nearly every description and identify no event.
const IGNORED_HOSTS = [
  'youtube.com', 'youtu.be', 'linkedin.com', 'twitter.com', 'x.com',
  'github.com', 'bsky.app', 'mastodon.social', 'instagram.com',
  'facebook.com', 'slack.com', 'bit.ly', 'cncf.io', 'linuxfoundation.org',
];

/** Registrable-ish domain: drops `www.` and any deeper subdomain. */
export function registrableDomain(url) {
  if (!url) return null;
  let host;
  try {
    host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
  host = host.toLowerCase().replace(/^www\./, '');
  const parts = host.split('.');
  // Keep three labels for two-part public suffixes (.co.uk, .com.au).
  if (parts.length > 2 && /^(co|com|org|net|ac|gov)$/.test(parts.at(-2))) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/** Every event-looking domain mentioned in a block of text. */
export function domainsIn(text) {
  if (!text) return [];
  const out = new Set();
  for (const m of String(text).matchAll(/https?:\/\/[^\s<>"')\]]+/g)) {
    const d = registrableDomain(m[0]);
    if (d && !IGNORED_HOSTS.includes(d)) out.add(d);
  }
  return [...out];
}

/**
 * Scores one recording against one engagement, or null when impossible.
 *
 * `engagement` must have an event_url and no recording of its own; `recording`
 * must have a youtube_id and a description naming the engagement's domain.
 */
export function scoreRecordingPair(recording, engagement) {
  if (!recording?.youtube_id) return null;
  if (engagement?.youtube_id) return null;

  // Either signal is enough to identify the event. The domain is the stronger
  // one, so it outranks a name match when both are available for one video.
  const target = registrableDomain(engagement?.event_url);
  const byDomain = target ? domainsIn(recording.abstract).includes(target) : false;
  // "Cloud Native Summit Munich" (the channel) vs "Cloud Native Summit 2026"
  // (the engagement) share enough words to be the same event. The date window
  // below is what keeps the 2025 and 2026 editions apart.
  const byName = eventAgrees(recording.event, engagement.event);
  if (!byDomain && !byName) return null;

  const start = toTime(engagement.date);
  const uploaded = toTime(recording.date);
  if (!Number.isFinite(start) || !Number.isFinite(uploaded)) return null;
  const end = Number.isFinite(toTime(engagement.end_date)) ? toTime(engagement.end_date) : start;

  // Direction of time: the upload follows the delivery. A day of slack covers
  // timezone skew and Sessionize's month-end date guesses.
  const lagDays = Math.round((uploaded - end) / DAY);
  if (lagDays < -1 || lagDays > MAX_RECORDING_LAG_DAYS) return null;

  return {
    lagDays,
    domain: byDomain ? target : null,
    matchedBy: byDomain ? 'domain' : 'event name',
    // Closeness in time decides; a domain match breaks ties in its favour.
    score: (1 - Math.max(lagDays, 0) / (MAX_RECORDING_LAG_DAYS + 1)) + (byDomain ? 0.5 : 0),
  };
}

/**
 * Greedy pairing of recordings to engagements.
 *
 * One engagement can only be *absorbed* once — it is a single file, and the
 * best-scoring recording takes it over. But Kasper often does several sessions
 * at one conference (at KCD Czech & Slovak 2026 he gave the keynote and sat on
 * a panel, so there are two recordings for one Sessionize entry). Those extra
 * recordings keep their own entry and merely *adopt* the engagement's event
 * name, location and real dates, which is what they were missing: on their own
 * they are labelled with the YouTube channel and the upload date.
 *
 * Returns { links, adoptions, unlinked }.
 */
export function planRecordingLinks(recordings, engagements) {
  const candidates = [];
  for (const recording of recordings) {
    for (const engagement of engagements) {
      const scored = scoreRecordingPair(recording, engagement);
      if (scored) candidates.push({ recording, engagement, ...scored });
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const links = [];
  const adoptions = [];
  const claimedRecordings = new Set();
  const claimedEngagements = new Set();
  for (const c of candidates) {
    if (claimedRecordings.has(c.recording)) continue;
    if (claimedEngagements.has(c.engagement)) {
      claimedRecordings.add(c.recording);
      adoptions.push(c);
      continue;
    }
    claimedRecordings.add(c.recording);
    claimedEngagements.add(c.engagement);
    links.push(c);
  }
  return { links, adoptions, unlinked: recordings.filter((r) => !claimedRecordings.has(r)) };
}
