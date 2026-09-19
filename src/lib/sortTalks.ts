type SortableTalk = {
  data: { date: Date; playlist_position?: number | null };
};

/**
 * Orders talks by when they were given, most recent first.
 *
 * Caveat on `date`: for talks sourced from the GitHub README (and for talks the
 * dedupe pass merged) this is the real date the talk was delivered. For talks
 * that exist only in the YouTube playlist it's the video's publish date, which
 * is the closest proxy available — YouTube exposes no "recorded on" field.
 *
 * `playlist_position` is only a tie-breaker now: when two talks share a date,
 * the one nearer the top of the playlist (more recently added) comes first.
 */
export function compareTalks(a: SortableTalk, b: SortableTalk): number {
  const byDate = +b.data.date - +a.data.date;
  if (byDate !== 0) return byDate;

  const pa = a.data.playlist_position;
  const pb = b.data.playlist_position;
  const hasA = typeof pa === 'number';
  const hasB = typeof pb === 'number';
  if (hasA && hasB) return pa - pb;
  if (hasA) return -1;
  if (hasB) return 1;
  return 0;
}

export function sortTalks<T extends SortableTalk>(talks: T[]): T[] {
  return [...talks].sort(compareTalks);
}
