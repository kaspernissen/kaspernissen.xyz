import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const talks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    date: z.coerce.date(),
    location: z.string().optional(),
    abstract: z.string().optional(),
    youtube_id: z.string().nullable().default(null),
    slides_pdf: z.string().nullable().default(null),
    co_speakers: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    slug: z.string().optional(),
  }),
});

const decks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/decks' }),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    date: z.coerce.date(),
    file: z.string(),
    talk_slug: z.string().nullable().default(null),
    size_mb: z.number().nullable().default(null),
  }),
});

const conferences = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/conferences' }),
  schema: z.object({
    name: z.string(),
    date: z.coerce.date(),
    end_date: z.coerce.date().nullable().default(null),
    location: z.string(),
    url: z.string().url(),
    role: z.enum(['speaker', 'co-chair', 'organiser', 'mc', 'attendee']),
    session_title: z.string().nullable().default(null),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/writing' }),
  schema: z.object({
    kind: z.enum(['blog', 'podcast', 'newsletter', 'interview']),
    title: z.string(),
    publication: z.string(),
    date: z.coerce.date(),
    url: z.string().url(),
    duration_min: z.number().nullable().default(null),
    summary: z.string().nullable().default(null),
  }),
});

const speakers = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/speakers' }),
  schema: z.object({
    slug: z.string(),
    caption: z.string(),
    event: z.string(),
    date: z.coerce.date(),
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

export const collections = { talks, decks, conferences, writing, speakers, badges };
