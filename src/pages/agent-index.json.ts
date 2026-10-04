import { getCollection } from 'astro:content';
import { published, blogSlug } from '../lib/blog';
import { displayTitle, isDelivered, isScheduled, visible } from '../lib/engagement';
import { talkSlug } from '../lib/slug';
import { deckUrl } from '../lib/deckHost';
import { cleanAbstract } from '../lib/talkText';
import { abs, bio, bioTitle, person, profiles } from '../lib/person';

/**
 * /agent-index.json: everything the WebMCP tools (src/components/WebMcp.astro)
 * answer from, built from the same collections as the pages. The tools fetch
 * it on their first call, so a visitor without an agent never downloads it.
 */

const day = (d: Date) => d.toISOString().slice(0, 10);

export async function GET() {
  const engagements = visible(await getCollection('talks')).filter((t) => t.data.role !== 'attendee');

  const talks = engagements
    .filter((t) => isDelivered(t))
    .sort((a, b) => +b.data.date - +a.data.date)
    .map((t) => {
      const d = t.data;
      return {
        title: displayTitle(d),
        event: d.event,
        date: day(d.date),
        location: d.location || null,
        role: d.role,
        co_speakers: d.co_speakers,
        url: abs(`/talks/${d.slug ?? talkSlug(displayTitle(d), d.date)}`),
        recording: d.youtube_id ? `https://www.youtube.com/watch?v=${d.youtube_id}` : null,
        slides: d.deck_file ? deckUrl(d.deck_file) : null,
        abstract: cleanAbstract(d.abstract) || null,
      };
    });

  const upcoming = engagements
    .filter((t) => isScheduled(t))
    .sort((a, b) => +a.data.date - +b.data.date)
    .map((t) => ({
      title: t.data.title ? displayTitle(t.data) : null,
      event: t.data.event,
      date: day(t.data.date),
      end_date: t.data.end_date ? day(t.data.end_date) : null,
      location: t.data.location || null,
      role: t.data.role,
      url: t.data.session_url ?? t.data.event_url ?? null,
    }));

  const posts = published(await getCollection('blog')).map((p) => ({
    title: p.data.title,
    date: day(p.data.date),
    url: abs(`/blog/${blogSlug(p)}`),
    summary: p.data.summary ?? null,
    tags: p.data.tags,
    publication: 'kaspernissen.xyz',
  }));

  const elsewhere = (await getCollection('writing'))
    .sort((a, b) => +b.data.date - +a.data.date)
    .map((w) => ({
      title: w.data.title,
      date: day(w.data.date),
      url: w.data.url,
      summary: null,
      tags: [],
      publication: w.data.publication,
      kind: w.data.kind,
    }));

  const index = {
    generated: new Date().toISOString(),
    profile: {
      name: person.name,
      alternate_name: person.alternateName,
      job_title: person.jobTitle,
      employer: person.worksFor.name,
      headline: bioTitle,
      bio,
      knows_about: person.knowsAbout,
      ...('award' in person ? { awards: person.award } : {}),
      profiles,
      speaker_kit: abs('/speaker-kit'),
      contact: 'https://www.linkedin.com/in/kaspernissen/',
    },
    talks,
    upcoming,
    writing: [...posts, ...elsewhere].sort((a, b) => b.date.localeCompare(a.date)),
  };

  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
