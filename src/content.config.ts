import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * One entry per speaking engagement — scheduled or delivered.
 *
 * This replaces what used to be three overlapping collections (conferences,
 * talks, decks) joined by fuzzy title+date matching. They described the same
 * events from three angles and could not be reconciled: only 1 of 20 past
 * conferences recorded what was actually presented, and a talk's `event` was
 * often just a YouTube channel name.
 *
 * Now a single entry carries the engagement through its whole life: announced
 * with an event and a date, then gaining a deck and a recording once given.
 * Photos join on date + event, so a talk page can show all three.
 */
const talks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/talks' }),
  schema: z.object({
    // Optional: an event Kasper organises, MCs or attends has no session title.
    // Listings fall back to the event name.
    title: z.string().nullable().default(null),
    event: z.string(),
    event_url: z.string().url().nullable().default(null),
    session_url: z.string().url().nullable().default(null),
    date: z.coerce.date(),
    // Only for multi-day events; a single session leaves this null.
    end_date: z.coerce.date().nullable().default(null),
    location: z.string().nullable().default(null),
    role: z
      .enum(['speaker', 'keynote', 'co-chair', 'organiser', 'moderator', 'panelist', 'mc', 'attendee'])
      .default('speaker'),
    // Normally derived from the date — see src/lib/engagement.ts. Set this only
    // to override that, e.g. an event that was cancelled or is still unlisted.
    status: z.enum(['scheduled', 'delivered', 'cancelled']).nullable().default(null),
    co_speakers: z.array(z.string()).default([]),
    abstract: z.string().nullable().default(null),
    // Filled in after the fact, by the fetchers, as they become available.
    youtube_id: z.string().nullable().default(null),
    deck_file: z.string().nullable().default(null),
    deck_size_mb: z.number().nullable().default(null),
    notist_url: z.string().url().nullable().default(null),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    slug: z.string().optional(),
    // Position in the YouTube playlist; 0 = most recently added. Null for
    // entries that don't come from the playlist.
    playlist_position: z.number().nullable().default(null),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/writing' }),
  schema: z.object({
    kind: z.enum(['blog', 'guide', 'knowledge', 'podcast', 'newsletter', 'interview', 'book', 'course']),
    title: z.string(),
    publication: z.string(),
    date: z.coerce.date(),
    url: z.string().url(),
    duration_min: z.number().nullable().default(null),
    summary: z.string().nullable().default(null),
    // Cover art, when a fetcher or a hand-written entry can supply one. A
    // YouTube episode's still is derived from its URL instead (see
    // PodcastCard.astro), and anything else falls back to generated artwork.
    image: z.string().url().nullable().default(null),
  }),
});

const speakers = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/speakers' }),
  schema: z.object({
    slug: z.string(),
    caption: z.string(),
    event: z.string(),
    // Null where the photo carries no EXIF date and its folder spans several
    // events, so no date can be inferred without inventing one.
    date: z.coerce.date().nullable().default(null),
    photographer: z.string(),
    license: z.string(),
    src: z.string(),
    download: z.string(),
  }),
});

const badges = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/badges' }),
  schema: z.object({
    name: z.string(),
    issuer: z.string(),
    issued: z.coerce.date(),
    url: z.string().url(),
    image: z.string(),
  }),
});

export const collections = { talks, writing, speakers, badges };
