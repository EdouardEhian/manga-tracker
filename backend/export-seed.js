const db = require('./database');
const fs = require('fs');

const mangas = db.prepare('SELECT * FROM mangas').all();

const lines = mangas.map(m => {
  const vals = [
    m.id, m.title, m.author, m.cover_url, m.total_chapters,
    m.current_chapter, m.status, m.rating, m.genre, m.synopsis,
    m.reader_url, m.mangadex_id, m.favorite
  ].map(v => v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
  return `INSERT OR IGNORE INTO mangas (id,title,author,cover_url,total_chapters,current_chapter,status,rating,genre,synopsis,reader_url,mangadex_id,favorite) VALUES (${vals.join(',')});`;
});

const sql = lines.join('\n');
fs.writeFileSync('./seed-prod.sql', sql);
console.log(`Exporté ${mangas.length} mangas dans seed-prod.sql`);
