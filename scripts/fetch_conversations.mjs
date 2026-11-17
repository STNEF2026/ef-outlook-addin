// Builds conversations.json from executiveforecast.com's public conversation feed.
// Run with Node 18+:  node scripts/fetch_conversations.mjs
// Quotes are read once per conversation from the page's description and kept on later runs.
import { readFile, writeFile } from 'node:fs/promises';

const SITE = 'https://executiveforecast.com';
const OUT = new URL('../conversations.json', import.meta.url);
const UA = { 'User-Agent': 'EF-Outlook-Addin-Refresh/1.0' };

const decode = (s) => s
  .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

function cleanQuote(desc) {
  if (!desc) return '';
  let s = decode(desc).trim();
  const cut = s.search(/["”]\s*[-–—]\s+\S/);
  if (cut > 0) s = s.slice(0, cut + 1);
  return s.replace(/^["“]+/, '').replace(/["”]+$/, '').trim();
}

async function getJson(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  throw new Error('Failed: ' + url);
}

async function quoteFor(slug) {
  try {
    const r = await fetch(`${SITE}/conversations/${encodeURIComponent(slug)}`, { headers: UA });
    if (!r.ok) return '';
    const h = await r.text();
    const m = h.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    return cleanQuote(m && m[1]);
  } catch { return ''; }
}

let previous = new Map();
try {
  const old = JSON.parse(await readFile(OUT, 'utf8'));
  for (const r of old.rows || []) previous.set(r.slug, r);
} catch { /* first run */ }

const first = await getJson(`${SITE}/api/conversations?page=1`);
const rows = [...first.rows];
for (let p = 2; p <= first.totalPages; p++) {
  const j = await getJson(`${SITE}/api/conversations?page=${p}`);
  rows.push(...j.rows);
}

const seen = new Set();
const out = [];
for (const r of rows) {
  if (!r.slug || seen.has(r.slug)) continue;
  seen.add(r.slug);
  out.push({
    slug: r.slug, name: r.name, role: r.role, company: r.company,
    headline: r.headline, title: r.title, region: r.region, year: r.year,
    img: r.img || '', initials: r.initials,
    people: (r.people || []).map((p) => ({ name: p.name, role: p.role })),
    publishedAt: r.publishedAt,
    quote: previous.get(r.slug)?.quote ?? null,
  });
}

// Fetch quotes only for conversations we have not seen before (4 at a time).
const todo = out.filter((r) => r.quote === null);
for (let i = 0; i < todo.length; i += 4) {
  await Promise.all(todo.slice(i, i + 4).map(async (r) => { r.quote = await quoteFor(r.slug); }));
}

await writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), total: out.length, rows: out }));
console.log(`conversations.json: ${out.length} conversations (${todo.length} new quotes fetched)`);
