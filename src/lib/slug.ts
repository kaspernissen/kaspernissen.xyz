export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The URL for one engagement.
 *
 * The full date is part of the slug, not just year-month, because Kasper gives
 * the same talk repeatedly and often twice in a month: YOW! Brisbane on
 * 2026-12-07 and KCD Provence on 2026-12-10 both carry "Rethinking Observability
 * as a Platform Product". On a year-month slug they collided, and Astro dropped
 * one of the two pages with only a build warning — the engagement existed in
 * the content but had no page.
 *
 * Deliberately derived from the entry alone, with no knowledge of the other
 * entries, so a card can work out a link without loading the whole collection.
 */
export function talkSlug(title: string, date: Date): string {
  const ymd = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
  return `${slugify(title)}-${ymd}`;
}
