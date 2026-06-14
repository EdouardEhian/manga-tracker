const db = require('./database');
const fetch = require('node-fetch');

async function main() {
  const HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' };

  // Vérifier si l'original existe
  const r1 = await fetch('https://sushiscan.fr/catalogue/jujutsu-kaisen/', { headers: HEADERS });
  console.log('jujutsu-kaisen status:', r1.status);

  // Mettre à jour JJK original avec la bonne URL
  if (r1.ok) {
    db.prepare("UPDATE mangas SET reader_url = ? WHERE id = 94").run('https://sushiscan.fr/catalogue/jujutsu-kaisen/');
    console.log('JJK mis à jour vers /catalogue/jujutsu-kaisen/');
  }

  // Ajouter JJK Modulo
  const existing = db.prepare("SELECT id FROM mangas WHERE title = 'Jujutsu Kaisen Modulo'").get();
  if (!existing) {
    db.prepare("INSERT INTO mangas (title, reader_url, status) VALUES (?, ?, 'to_read')")
      .run('Jujutsu Kaisen Modulo', 'https://sushiscan.fr/catalogue/jujutsu-kaisen-modulo/');
    console.log('Jujutsu Kaisen Modulo ajouté');
  } else {
    console.log('Jujutsu Kaisen Modulo existe déjà');
  }

  const all = db.prepare("SELECT id, title, reader_url FROM mangas WHERE title LIKE '%jujutsu%'").all();
  console.log('Résultat:', JSON.stringify(all, null, 2));
}

main().catch(console.error);
