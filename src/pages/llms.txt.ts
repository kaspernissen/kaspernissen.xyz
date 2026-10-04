import { getCollection } from 'astro:content';
import { published, blogSlug } from '../lib/blog';
import { displayTitle, isDelivered, visible } from '../lib/engagement';
import { talkSlug } from '../lib/slug';
import { cleanAbstract, metaDescription } from '../lib/talkText';
import { abs, profiles } from '../lib/person';

/**
 * /llms.txt (https://llmstxt.org): a plain-markdown map of the site for
 * assistants and coding agents, which otherwise have to guess which of a
 * hundred talk pages matter.
 *
 * Generated from the collections rather than written by hand, so a new post
 * or talk shows up here on the next build like it does everywhere else.
 */

// How many distinct talks to list. The full archive is one link away.
const TALK_LIMIT = 20;

export async function GET() {
  const posts = published(await getCollection('blog'));
  const talks = visible(await getCollection('talks'))
    .filter((t) => isDelivered(t) && t.data.role !== 'attendee' && (t.data.youtube_id || t.data.deck_file))
    .sort((a, b) => +b.data.date - +a.data.date);
  const writing = (await getCollection('writing'))
    .filter((w) => w.data.kind === 'blog' || w.data.kind === 'guide' || w.data.kind === 'book' || w.data.kind === 'course')
    .sort((a, b) => +b.data.date - +a.data.date)
    .slice(0, 12);

  // Kasper gives the same talk at several events. List each talk once, at its
  // latest delivery with material, so the list covers more ground.
  const seen = new Set<string>();
  const distinctTalks = talks
    .filter((t) => {
      const key = displayTitle(t.data).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, TALK_LIMIT);

  const talkLine = (t: (typeof talks)[number]) => {
    const url = abs(`/talks/${t.data.slug ?? talkSlug(displayTitle(t.data), t.data.date)}`);
    const abstract = cleanAbstract(t.data.abstract);
    const when = `${t.data.event}, ${t.data.date.toISOString().slice(0, 10)}`;
    const has = [t.data.youtube_id && 'recording', t.data.deck_file && 'slides'].filter(Boolean).join(' + ');
    return `- [${displayTitle(t.data)}](${url}): ${when} (${has})${abstract ? `. ${metaDescription(abstract, 200)}` : ''}`;
  };

  const own = posts.filter((p) => !p.data.canonical);
  const imported = posts.filter((p) => p.data.canonical);
  const postLine = (p: (typeof posts)[number]) =>
    `- [${p.data.title}](${abs(`/blog/${blogSlug(p)}`)}): ${p.data.date.toISOString().slice(0, 10)}` +
    (p.data.summary ? `. ${metaDescription(p.data.summary, 200)}` : '');

  const body = `# Kasper Borg Nissen

> Kasper Borg Nissen (also written Kasper Nissen) is Director of Developer Relations at Dash0, based in Denmark. He speaks and writes about observability, OpenTelemetry, platform engineering and observability for AI agents. He is a CNCF, MergeForward and AAIF Ambassador, a Golden Kubestronaut, a former co-chair of KubeCon + CloudNativeCon Europe and North America, and a co-founder of Cloud Native Nordics.

This site is his talks archive (slides and recordings), blog, and speaker kit. Pieces he wrote for other publications are linked from /writing.

## About

- [Home](${abs('/')}): Current role, latest talks and writing, upcoming conferences
- [About](${abs('/about')}): Who Kasper is: role at Dash0, community work, background at Lunar
- [Speaker kit](${abs('/speaker-kit')}): Official bio, headshots, and talk topics for event organisers
- [Badges and roles](${abs('/badges')}): CNCF Ambassador terms, KubeCon roles, certifications
- [Conferences](${abs('/conferences')}): Past and upcoming speaking engagements

## Talks

- [All talks](${abs('/talks')}): Every talk with slides, recordings, and photos
${distinctTalks.map(talkLine).join('\n')}

## Blog

${own.map(postLine).join('\n')}

## Writing elsewhere

- [Writing index](${abs('/writing')}): Articles, guides, newsletters, a book and a course
- [Podcasts](${abs('/podcasts')}): Podcast appearances
${writing.map((w) => `- [${w.data.title}](${w.data.url}): ${w.data.publication}, ${w.data.date.toISOString().slice(0, 10)}`).join('\n')}

## Profiles

${profiles.map((p) => `- ${p}`).join('\n')}

## Optional

${imported.map(postLine).join('\n')}
- [RSS feed](${abs('/rss.xml')})
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
