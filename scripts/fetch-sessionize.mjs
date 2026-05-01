import fs from 'node:fs/promises';
import path from 'node:path';

const CONFIG = 'data/sessionize.json';
const OUT_DIR = 'src/content/conferences/sessionize';

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let config;
try {
  config = JSON.parse(await fs.readFile(CONFIG, 'utf8'));
} catch {
  console.warn('[sessionize] no config — skipping');
  process.exit(0);
}

if (!config.events?.length) {
  console.log('[sessionize] config empty — skipping');
  process.exit(0);
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

let n = 0;
for (const ev of config.events) {
  try {
    const r = await fetch(`https://sessionize.com/api/v2/${ev.id}/view/All`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const sessions = j.sessions ?? [];
    const mySessions = sessions.filter((s) =>
      (s.speakers ?? []).some((sp) =>
        (sp.name ?? '').toLowerCase().includes(config.speakerName.toLowerCase()),
      ),
    );
    for (const s of mySessions) {
      const date = (s.startsAt ?? '').slice(0, 10) || '2024-01-01';
      const slug = slugify(`${ev.label}-${s.title}-${date}`);
      const lines = [
        `name: ${JSON.stringify(ev.label)}`,
        `date: ${date}`,
        `location: ${JSON.stringify(ev.location ?? 'Unknown')}`,
        `url: ${JSON.stringify(ev.url)}`,
        `role: speaker`,
        `session_title: ${JSON.stringify(s.title)}`,
      ];
      await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), lines.join('\n') + '\n');
      n++;
    }
  } catch (e) {
    console.warn(`[sessionize] event ${ev.id} failed: ${e.message}`);
  }
}
console.log(`[sessionize] wrote ${n} sessions → ${OUT_DIR}`);
