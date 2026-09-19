// Pairs a slide deck with the talk it was presented at.
//
// The hard part is that Kasper gives the same talk repeatedly: "Breaking Free
// with Open Standards" has three decks (ContainerDays, a Dutch meetup, Cloud
// Native Rheinland) but only one of those deliveries was recorded. Matching on
// title alone hands that single recording to all three.
//
// Two signals keep it honest:
//
//   Direction of time. A talk's `date` is its YouTube publish date, which comes
//   on or after the day it was given — never before. So a video published 75
//   days BEFORE a deck's event is a recording of some other delivery, and the
//   pairing is rejected outright. This alone throws out 5 of the 10 false
//   pairings in the current data.
//
//   Exclusivity. A talk can back at most one deck. Where several decks survive
//   the checks for the same recording, the closest in time wins and the rest
//   are left unlinked, which is the honest answer: those deliveries have slides
//   but no video.
//
// `event` is deliberately NOT required to match. For YouTube-sourced talks it
// holds the channel title ("Kasper Borg Nissen", "Platform Engineering"), not
// the conference, so requiring it would reject good pairs. It is used only as
// a tie-breaking bonus when it does line up.

import { titleSimilarity } from './talk-merge.mjs';

// A video normally lands within a few weeks of the talk. The real gaps in the
// current data are 0, 3, 9, 11 and 22 days; 60 leaves headroom for a slow
// conference editor without reaching the next delivery of a recurring talk.
export const MAX_LAG_DAYS = 60;
export const MIN_TITLE_SIMILARITY = 0.85;

const DAY = 86_400_000;

// `new Date(null)` is the epoch, not an invalid date, so an absent end_date
// would silently read as 1970 and blow every date window. Reject empties first.
const toTime = (d) => {
  if (d instanceof Date) return d.getTime();
  if (d === null || d === undefined || d === '') return NaN;
  return new Date(d).getTime();
};

function normaliseEvent(s) {
  return (s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Loose containment rather than equality: "KCD Suisse Romande 2025" vs
// "Cloud Native Suisse Romande" should count as agreement.
export function eventAgrees(deckEvent, talkEvent) {
  const a = normaliseEvent(deckEvent);
  const b = normaliseEvent(talkEvent);
  if (!a || !b) return false;

  // YouTube channel names are often run together ("KCDCzechSlovak"), which has
  // no word overlap with "KCD Czech & Slovak 2026" even though it is plainly
  // the same event. Compare with the spaces removed before giving up.
  const squashedA = a.replace(/ /g, '');
  const squashedB = b.replace(/ /g, '');
  const [long, short] = squashedA.length >= squashedB.length
    ? [squashedA, squashedB]
    : [squashedB, squashedA];
  if (short.length >= 8 && long.includes(short)) return true;

  const aw = new Set(a.split(' ').filter((w) => w.length > 3));
  const bw = new Set(b.split(' ').filter((w) => w.length > 3));
  if (aw.size === 0 || bw.size === 0) return false;

  const sharedWords = [...aw].filter((w) => bw.has(w));
  if (sharedWords.length < Math.min(2, Math.min(aw.size, bw.size))) return false;

  // At least one shared word has to actually identify the event. Nearly every
  // event here is called "Cloud Native something", so an overlap of only
  // generic words is no evidence at all: it once matched a KCD Suisse Romande
  // recording to the "Dutch Cloud Native & AI Community" meetup and published
  // the wrong talk under the wrong deck.
  return sharedWords.some((w) => !GENERIC_EVENT_WORDS.has(w));
}

const GENERIC_EVENT_WORDS = new Set([
  'cloud', 'native', 'community', 'conference', 'conferences', 'meetup',
  'meetups', 'edition', 'group', 'user', 'users', 'tech', 'technology',
  // "CNCF [Cloud Native Computing Foundation]" is a channel, not an event, and
  // it shares three words with "Cloud Native Computing Rheinland".
  'computing', 'foundation',
  'event', 'events', 'online', 'virtual', 'live', 'talks', 'session',
  'sessions', 'january', 'february', 'march', 'april', 'june', 'july',
  'august', 'september', 'october', 'november', 'december',
]);

/**
 * Scores one deck against one talk. Returns null when the pair is impossible.
 */
export function scorePair(deck, talk) {
  if (!deck?.title || !talk?.title) return null;
  // A deck can only be paired with a talk that has a recording to offer.
  if (!talk.youtube_id) return null;

  const similarity = titleSimilarity(deck.title, talk.title);
  if (similarity < MIN_TITLE_SIMILARITY) return null;

  const start = toTime(talk.date);
  const end = Number.isFinite(toTime(talk.end_date)) ? toTime(talk.end_date) : start;
  const lagDays = Math.round((start - toTime(deck.date)) / DAY);
  if (!Number.isFinite(lagDays)) return null;
  // Negative lag = the deck went up after the talk's date, which normally means
  // a different delivery of the same talk. The exception is a multi-day event:
  // once an entry carries the conference's real start date, a deck posted on
  // day two is "after" it by a day and was being thrown away. KCD Suisse
  // Romande ran 4-5 December and the deck went up on the 5th, which left the
  // slides stranded in their own entry next to the conference.
  const span = Math.max(0, Math.round((end - start) / DAY));
  if (lagDays < -span - 1 || lagDays > MAX_LAG_DAYS) return null;

  const sameEvent = eventAgrees(deck.event, talk.event);

  // Closeness in time dominates; title and a matching event nudge ties.
  const score =
    (1 - Math.max(lagDays, 0) / (MAX_LAG_DAYS + 1)) * 0.6 +
    similarity * 0.3 +
    (sameEvent ? 0.1 : 0);

  return { similarity, lagDays, sameEvent, score };
}

/**
 * Pairs a leftover deck with a scheduled engagement that has neither slides nor
 * a recording — the Notist deck and the Sessionize entry for one delivery, e.g.
 * the "Beyond Supports OpenTelemetry" deck and "ContainerDays Hamburg 2026".
 *
 * Title similarity is useless here: an engagement often has no session title at
 * all and falls back to displaying the event name. So the signals are the event
 * name and the date landing inside the engagement's run, which for a specific
 * conference on specific days is a stronger claim than a title match anyway.
 */
export function scoreEngagementPair(deck, engagement) {
  if (engagement.youtube_id || engagement.deck_file) return null;
  if (!eventAgrees(deck.event, engagement.event)) return null;

  const start = toTime(engagement.date);
  const deckAt = toTime(deck.date);
  if (!Number.isFinite(start) || !Number.isFinite(deckAt)) return null;
  const end = Number.isFinite(toTime(engagement.end_date)) ? toTime(engagement.end_date) : start;

  // A day either side absorbs timezone skew and Sessionize's month-end guesses.
  const offDays = Math.round(
    (deckAt < start ? start - deckAt : deckAt > end ? deckAt - end : 0) / DAY,
  );
  if (offDays > 1) return null;

  return { offDays, score: 1 - offDays / 2 };
}

/**
 * Greedy, exclusive pairing of leftover decks to recording-less engagements.
 * Returns { links, unlinkedDecks }; each link is { deck, engagement, offDays }.
 */
export function planEngagementDeckLinks(decks, engagements) {
  const candidates = [];
  for (const deck of decks) {
    for (const engagement of engagements) {
      const scored = scoreEngagementPair(deck, engagement);
      if (scored) candidates.push({ deck, engagement, ...scored });
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const links = [];
  const claimedDecks = new Set();
  const claimedEngagements = new Set();
  for (const c of candidates) {
    if (claimedDecks.has(c.deck) || claimedEngagements.has(c.engagement)) continue;
    claimedDecks.add(c.deck);
    claimedEngagements.add(c.engagement);
    links.push(c);
  }
  return { links, unlinkedDecks: decks.filter((d) => !claimedDecks.has(d)) };
}

/**
 * Works out which deck belongs to which talk.
 *
 * Returns { links, unlinkedDecks }. Each link is
 * { deck, talk, score, lagDays, similarity, sameEvent }.
 */
export function planDeckLinks(decks, talks) {
  const candidates = [];
  for (const deck of decks) {
    for (const talk of talks) {
      const scored = scorePair(deck, talk);
      if (scored) candidates.push({ deck, talk, ...scored });
    }
  }

  // Greedy by score: the most confident pairing claims its talk first.
  candidates.sort((a, b) => b.score - a.score);

  const links = [];
  const claimedTalks = new Set();
  const claimedDecks = new Set();
  for (const c of candidates) {
    if (claimedDecks.has(c.deck) || claimedTalks.has(c.talk)) continue;
    claimedDecks.add(c.deck);
    claimedTalks.add(c.talk);
    links.push(c);
  }

  return { links, unlinkedDecks: decks.filter((d) => !claimedDecks.has(d)) };
}
