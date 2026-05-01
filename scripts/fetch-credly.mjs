import fs from 'node:fs/promises';
import path from 'node:path';

const USERNAME = 'kasper-nissen';
const OUT_DIR = 'src/content/badges';
const IMG_DIR = 'src/assets/badges';

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchPage(page) {
  const url = `https://www.credly.com/users/${USERNAME}/badges.json?sort=most_recent&page=${page}&page_size=48`;
  const r = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'kaspernissen.xyz portfolio fetcher',
    },
  });
  if (!r.ok) throw new Error(`Credly ${r.status}`);
  return r.json();
}

let badges = [];
try {
  let page = 1;
  while (page <= 10) {
    const j = await fetchPage(page);
    const data = j.data ?? [];
    badges = badges.concat(data);
    if (data.length < 48) break;
    page++;
  }
} catch (e) {
  console.warn(`[credly] fetch failed: ${e.message} — keeping existing files`);
  process.exit(0);
}

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.mkdir(IMG_DIR, { recursive: true });
for (const f of await fs.readdir(OUT_DIR)) {
  if (f.endsWith('.yaml')) await fs.unlink(path.join(OUT_DIR, f));
}

let n = 0;
for (const b of badges) {
  const tpl = b.badge_template ?? b;
  const name = tpl.name ?? b.name;
  const issuer =
    tpl.issuer?.entities?.[0]?.entity?.name ??
    tpl.issuer?.summary ??
    tpl.issuer?.name ??
    'Unknown';
  const issuedRaw = b.issued_at ?? b.issued_at_date ?? b.created_at;
  const issued = (issuedRaw ?? '').slice(0, 10);
  const url = b.public_url ?? b.url ?? `https://www.credly.com/users/${USERNAME}`;
  const imgUrl = tpl.image_url ?? tpl.image?.url ?? b.image_url;
  if (!name || !issued) continue;

  const slug = slugify(`${name}-${issued}`);
  let imgRel = '';
  if (imgUrl) {
    try {
      const ext = imgUrl.match(/\.(png|svg|jpg|jpeg)/i)?.[1]?.toLowerCase() ?? 'png';
      const imgPath = path.join(IMG_DIR, `${slug}.${ext}`);
      const r = await fetch(imgUrl);
      if (r.ok) {
        await fs.writeFile(imgPath, Buffer.from(await r.arrayBuffer()));
        imgRel = `./${slug}.${ext}`;
      }
    } catch {}
  }
  const lines = [
    `name: ${JSON.stringify(name)}`,
    `issuer: ${JSON.stringify(issuer)}`,
    `issued: ${issued}`,
    `url: ${JSON.stringify(url)}`,
    `image: ${JSON.stringify(imgRel || './missing.png')}`,
  ];
  await fs.writeFile(path.join(OUT_DIR, `${slug}.yaml`), lines.join('\n') + '\n');
  n++;
}
console.log(`[credly] wrote ${n} badges → ${OUT_DIR}`);
