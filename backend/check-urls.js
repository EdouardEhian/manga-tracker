const db = require('./database');
const fetch = require('node-fetch');

const mangas = db.prepare("SELECT id, title, reader_url FROM mangas WHERE reader_url LIKE '%sushiscan.fr%' LIMIT 5").all();
console.log('Sample URLs in DB:');
mangas.forEach(m => console.log(`  ${m.title}: ${m.reader_url}`));

// Tester la première
async function test() {
  const m = mangas[0];
  if (!m) return;
  console.log('\nTesting:', m.reader_url);
  const r = await fetch(m.reader_url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
  });
  console.log('Status:', r.status);
  const html = await r.text();
  const re = /href="(https:\/\/sushiscan\.fr\/[^"]*chapitre-([0-9]+(?:\.[0-9]+)?)[^"]*)"/gi;
  let count = 0, m2;
  while ((m2 = re.exec(html)) !== null) count++;
  console.log('Chapters found:', count);
}
test().catch(console.error);
