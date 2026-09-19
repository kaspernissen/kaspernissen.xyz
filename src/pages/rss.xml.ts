import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { published, blogSlug } from '../lib/blog';

export async function GET(context: APIContext) {
  const posts = published(await getCollection('blog'));
  return rss({
    title: 'Kasper Nissen — Blog',
    description: 'Posts on Kubernetes, observability, and platform engineering.',
    site: context.site ?? 'https://kaspernissen.xyz',
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.summary ?? undefined,
      link: `/blog/${blogSlug(p)}`,
      categories: p.data.tags,
      author: 'Kasper Nissen',
    })),
    customData: '<language>en-us</language>',
  });
}
