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
//
// The second group matters as much as the social links: meetup.com, Sessionize
// and friends host thousands of different events, so two entries sharing one of
// them agree on nothing. A ContainerDays recording was handed to a Cloud Native
// London meetup purely because both mentioned meetup.com.
const IGNORED_HOSTS = [
  'youtube.com', 'youtu.be', 'linkedin.com', 'twitter.com', 'x.com',
  'github.com', 'bsky.app', 'mastodon.social', 'instagram.com',
  'facebook.com', 'slack.com', 'bit.ly', 'cncf.io', 'linuxfoundation.org',
  // Event-hosting platforms — a shared domain says nothing about the event.
  'meetup.com', 'sessionize.com', 'eventbrite.com', 'eventbrite.co.uk',
  'lu.ma', 'hopin.com', 'tito.io', 'ti.to', 'community.cncf.io', 'cvent.com',
  'papercall.io', 'pretix.eu', 'universe.com', 'twitch.tv',
];

// Channels that publish talks from hundreds of different events. Their name
// identifies the publisher, never the event, so a name match against one is
// worthless and the description's domain has to carry the claim on its own.
//
// "CNCF [Cloud Native Computing Foundation]" shares three words with "Cloud
// Native Computing Rheinland - March Edition" and duly handed a Cologne meetup
// two KubeCon recordings, abstracts included.
const UMBRELLA_CHANNELS = [
  /\bcncf\b/, /cloud native computing foundation/, /linux foundation/,
  /\bkubecon\b/, /cloudnativecon/, /\bkubecrash\b/,
];

const isUmbrellaChannel = (name) => {
  const n = (name ?? '').toLowerCase();
  return UMBRELLA_CHANNELS.some((re) => re.test(n));
};

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
  const byName = !isUmbrellaChannel(recording.event) && eventAgrees(recording.event, engagement.event);
  if (!byDomain && !byName) return null;

  const start = toTime(engagement.date);
  const uploaded = toTime(recording.date);
  if (!Number.isFinite(start) || !Number.isFinite(uploaded)) return null;
  const end = Number.isFinite(toTime(engagement.end_date)) ? toTime(engagement.end_date) : start;

  // Direction of time: the recording cannot predate the event. Anchoring the
  // lower bound to the FIRST day rather than the last matters once a pass has
  // already corrected a recording's date to the day the talk was given — a
  // ContainerDays talk given on 9 September at a conference running 9-11 is two
  // days "before the end" and was rejected as impossible, leaving the
  // conference and its own recording as two entries. A day of slack either side
  // covers timezone skew and Sessionize's month-end date guesses.
  if (Math.round((uploaded - start) / DAY) < -1) return null;
  const lagDays = Math.round((uploaded - end) / DAY);
  if (lagDays > MAX_RECORDING_LAG_DAYS) return null;

  return {
    // Within the event's own days the lag is zero, not negative: a talk and its
    // recording on the same days are as close as a pair can be.
    lagDays: Math.max(lagDays, 0),
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
