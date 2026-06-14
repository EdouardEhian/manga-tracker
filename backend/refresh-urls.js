const db    = require('./database');
const fetch = require('node-fetch');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function searchSushiscan(title) {
  try {
    const r = await fetch(`https://sushiscan.fr/?s=${encodeURIComponent(title)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    });
    const html = await r.text();
    const re = /href="(https:\/\/sushiscan\.fr\/catalogue\/[^"\/]+\/)"[^>]*title="([^"]+)"/g;
    const results = [];
    let m;
    while ((m = re.exec(html)) !== null) results.push({ url: m[1], name: m[2] });
    return results[0] || null;
  } catch { return null; }
}

// Vérifie si l'URL retourne des chapitres (page valide)
async function hasChapters(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html' }
    });
    if (!r.ok) return false;
    const html = await r.text();
    return html.includes('data-num=') && html.includes('chapterlist');
  } catch { return false; }
}

function similarity(a, b) {
  a = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  b = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.8;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  let matches = 0;
  for (const c of shorter) if (longer.includes(c)) matches++;
  return matches / longer.length;
}

async function main() {
  const mangas = db.prepare("SELECT * FROM mangas WHERE reader_url LIKE '%sushiscan.fr%' ORDER BY title").all();
  console.log(`\n🔄 Vérification des URLs sushiscan.fr pour ${mangas.length} mangas...\n`);

  let updated = 0, ok = 0, failed = 0;

  for (const manga of mangas) {
    // Vérifier si l'URL actuelle est valide
    const valid = await hasChapters(manga.reader_url);
    if (valid) {
      console.log(`✅  ${manga.title} — OK`);
      ok++;
      await delay(300);
      continue;
    }

    // URL cassée — chercher la nouvelle
    console.log(`🔍  ${manga.title} — URL invalide, recherche...`);
    const result = await searchSushiscan(manga.title);

    if (result && similarity(manga.title, result.name) > 0.4) {
      db.prepare('UPDATE mangas SET reader_url = ? WHERE id = ?').run(result.url, manga.id);
      console.log(`    ✅ Mis à jour: ${result.url}`);
      updated++;
    } else {
      console.log(`    ❌ Non trouvé${result ? ` (meilleur: ${result.name})` : ''}`);
      failed++;
    }

    await delay(600);
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✅  Déjà valides : ${ok}`);
  console.log(`🔄  Mis à jour   : ${updated}`);
  console.log(`❌  Échecs       : ${failed}`);
}

main();
