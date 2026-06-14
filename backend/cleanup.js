const db    = require('./database');
const fetch = require('node-fetch');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  // 1. Supprimer les mangas sans aucune source
  const lost = db.prepare(
    "SELECT id, title FROM mangas WHERE (reader_url IS NULL OR reader_url = '') AND (mangadex_id IS NULL OR mangadex_id = '')"
  ).all();

  console.log(`\n🗑  Suppression de ${lost.length} mangas sans source :`);
  for (const m of lost) {
    db.prepare('DELETE FROM mangas WHERE id = ?').run(m.id);
    console.log(`  - ${m.title}`);
  }

  // 2. Vérifier Centuria et Bugle Call
  const existing = db.prepare(
    "SELECT title, reader_url, mangadex_id FROM mangas WHERE title LIKE '%enturia%' OR title LIKE '%ugle%'"
  ).all();
  console.log('\n✅ Déjà présents :');
  for (const m of existing) console.log(`  - ${m.title} → ${m.reader_url || m.mangadex_id || '?'}`);

  // 3. Ajouter Berserk
  const hasBerserk = db.prepare("SELECT id FROM mangas WHERE title LIKE '%erserk%'").get();
  if (hasBerserk) {
    console.log('\n⏭  Berserk déjà présent');
    return;
  }

  console.log('\n🔍 Ajout de Berserk...');

  // Chercher sur sushiscan
  let readerUrl = null, mangadexId = null, cover = null, author = null, totalChapters = 0;

  try {
    const r = await fetch('https://sushiscan.fr/?s=berserk', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
    });
    const html = await r.text();
    const m = html.match(/href="(https:\/\/sushiscan\.fr\/catalogue\/[^"\/]*berserk[^"\/]*\/)"[^>]*title="([^"]+)"/i);
    if (m) { readerUrl = m[1]; console.log('  Sushiscan:', readerUrl); }
  } catch {}

  // Chercher sur MangaDex
  try {
    const r = await fetch('https://api.mangadex.org/manga?title=berserk&limit=5', {
      headers: { 'User-Agent': 'MangaTracker/1.0' }
    });
    const d = await r.json();
    const berserk = d.data?.find(m => {
      const t = Object.values(m.attributes.title)[0]?.toLowerCase() || '';
      return t === 'berserk';
    });
    if (berserk) {
      mangadexId = berserk.id;
      totalChapters = parseInt(berserk.attributes.lastChapter) || 364;
      author = berserk.relationships?.find(r => r.type === 'author')?.attributes?.name || 'Kentaro Miura';
      console.log('  MangaDex ID:', mangadexId);

      // Couverture
      const r2 = await fetch(`https://api.mangadex.org/manga/${mangadexId}?includes[]=cover_art`, {
        headers: { 'User-Agent': 'MangaTracker/1.0' }
      });
      const d2 = await r2.json();
      const coverRel = d2.data?.relationships?.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName)
        cover = `https://uploads.mangadex.org/covers/${mangadexId}/${coverRel.attributes.fileName}.512.jpg`;
    }
  } catch {}

  db.prepare(`
    INSERT INTO mangas (title, author, cover_url, total_chapters, status, reader_url, mangadex_id)
    VALUES (?, ?, ?, ?, 'to_read', ?, ?)
  `).run('Berserk', author || 'Kentaro Miura', cover, totalChapters, readerUrl, mangadexId);

  console.log('✅  Berserk ajouté !');

  const total = db.prepare('SELECT COUNT(*) as c FROM mangas').get().c;
  console.log(`\n📚 Total mangas en bibliothèque : ${total}`);
}

main().catch(console.error);
