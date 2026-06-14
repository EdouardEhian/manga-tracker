const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('D:/manga-tracker/backend/mangas.db');

const manga = db.prepare("SELECT id, title, reader_url, mangadex_id FROM mangas WHERE title LIKE '%orohedoro%'").get();
console.log('Found:', JSON.stringify(manga));

// Mettre à jour reader_url avec sushiscan.net
if (manga && !manga.reader_url) {
  db.prepare("UPDATE mangas SET reader_url = ? WHERE id = ?").run('https://sushiscan.net/catalogue/dorohedoro/', manga.id);
  console.log('Updated reader_url to sushiscan.net');
} else if (manga) {
  console.log('Already has reader_url:', manga.reader_url);
}
