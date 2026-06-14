const db    = require('./database');
const fetch = require('node-fetch');

// Ajouter la colonne si elle n'existe pas encore
try { db.exec('ALTER TABLE mangas ADD COLUMN mangadex_id TEXT'); } catch {}

const delay = ms => new Promise(r => setTimeout(r, ms));

function similarity(a, b) {
  a = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  b = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.8;
  let matches = 0;
  const shorter = a.length <= b.length ? a : b;
  const longer  = a.length <= b.length ? b : a;
  for (const c of shorter) if (longer.includes(c)) matches++;
  return matches / longer.length;
}

async function findOnMangaDex(title) {
  const r = await fetch(
    `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=5`,
    { headers: { 'User-Agent': 'MangaTracker/1.0' } }
  );
  const d = await r.json();
  if (!d.data?.length) return null;
  for (const m of d.data) {
    const t = m.attributes.title?.en || m.attributes.title?.fr || Object.values(m.attributes.title)[0] || '';
    if (similarity(title, t) > 0.45) return { id: m.id, title: t };
  }
  return null;
}

async function main() {
  // Mangas sans sushiscan et sans mangadex_id
  const mangas = db.prepare("SELECT * FROM mangas WHERE (reader_url IS NULL OR reader_url = '') AND (mangadex_id IS NULL OR mangadex_id = '') ORDER BY title").all();
  console.log(`\n🔍 Recherche MangaDex pour ${mangas.length} mangas sans URL...\n`);

  let found = 0, notFound = 0;

  for (const manga of mangas) {
    const result = await findOnMangaDex(manga.title);
    if (result) {
      db.prepare("UPDATE mangas SET mangadex_id = ? WHERE id = ?").run(result.id, manga.id);
      console.log(`✅  ${manga.title} → MangaDex: ${result.id} (${result.title})`);
      found++;
    } else {
      console.log(`❌  ${manga.title} — non trouvé`);
      notFound++;
    }
    await delay(400);
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✅  Trouvés    : ${found}`);
  console.log(`❌  Non trouvés: ${notFound}`);
}

main().catch(console.error);
