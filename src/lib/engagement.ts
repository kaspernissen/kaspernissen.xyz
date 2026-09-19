/**
 * The lifecycle of a speaking engagement.
 *
 * "Delivered" is derived from the date rather than being a flag to maintain:
 * the date is already entered when the talk is announced, so a talk moves from
 * "where I'll be" to "talks I've given" on its own. `status` in the YAML only
 * exists to override that — a cancelled event, or one confirmed but not yet
 * publicly announced.
 *
 * Multi-day events count as upcoming until their last day is past, so a
 * conference doesn't drop out of the schedule halfway through.
 */
export type EngagementStatus = 'scheduled' | 'delivered' | 'cancelled';

type Engagement = {
  data: {
    date: Date;
    end_date?: Date | null;
    status?: EngagementStatus | null;
    youtube_id?: string | null;
    deck_file?: string | null;
  };
};

export function statusOf(entry: Engagement, now: Date = new Date()): EngagementStatus {
  if (entry.data.status) return entry.data.status;
  const last = entry.data.end_date ?? entry.data.date;
  return last < now ? 'delivered' : 'scheduled';
}

export const isDelivered = (e: Engagement, now?: Date) => statusOf(e, now) === 'delivered';
export const isScheduled = (e: Engagement, now?: Date) => statusOf(e, now) === 'scheduled';
export const isCancelled = (e: Engagement, now?: Date) => statusOf(e, now) === 'cancelled';

/** A delivered engagement is worth its own page once it has something to show. */
export function hasMaterial(e: Engagement): boolean {
  return Boolean(e.data.youtube_id || e.data.deck_file);
}

/** What to call an entry in a listing: its session title, else the event. */
export function displayTitle(data: { title?: string | null; event: string }): string {
  return data.title?.trim() || data.event;
}
