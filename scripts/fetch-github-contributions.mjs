import fs from 'node:fs/promises';

const USERNAME = 'kaspernissen';
const OUT = 'data/github.json';

async function fetchContrib() {
  const url = `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`contributions API ${r.status}`);
  return r.json();
}

try {
  const j = await fetchContrib();
  const days = (j.contributions ?? []).map((d) => ({
    date: d.date,
    count: d.count,
    level: d.level,
  }));
  let total = 0;
  if (typeof j.total === 'number') total = j.total;
  else if (j.total && typeof j.total === 'object') {
    total = Object.values(j.total).reduce((a, b) => Number(a) + Number(b), 0);
  } else {
    total = days.reduce((a, b) => a + b.count, 0);
  }
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(OUT, JSON.stringify({ total, days }));
  console.log(`[github-contrib] wrote ${days.length} days, ${total} total → ${OUT}`);
} catch (e) {
  console.warn(`[github-contrib] failed: ${e.message} — keeping existing data/github.json`);
}
