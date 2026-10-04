import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

// Talk titles come from YouTube, Notist and Sessionize, and arrive with the
// uploader's habits attached: the speaker's name tacked on, an episode number
// for a title, runs of spaces. The title becomes the page <title>, the Event
// name in the schema and a line in llms.txt, so it has to be the talk's name
// and nothing else. Hidden entries are tombstones and are not checked.
const DIR = path.resolve('src/content/talks');
const talks = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ file: f, data: parse(fs.readFileSync(path.join(DIR, f), 'utf8')) }))
  .filter(({ data }) => !data.hidden && data.title);

describe('talk titles', () => {
  it.each(talks.map((t) => [t.file, String(t.data.title)]))('%s is clean', (_file, title) => {
    expect(title, 'speaker name in the title').not.toMatch(/\bKasper\b/);
    expect(title, 'doubled space').not.toMatch(/ {2}/);
    expect(title, 'HTML entity').not.toMatch(/&#?\w+;|#039/);
    expect(title, 'only an episode number').not.toMatch(/^#?\d+$/);
    expect(title, 'leading or trailing space').toBe(title.trim());
  });
});
