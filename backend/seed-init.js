const db = require('./database');
const fs = require('fs');
const path = require('path');

const count = db.prepare('SELECT COUNT(*) as c FROM mangas').get();
console.log('Mangas actuels en DB:', count.c);

if (count.c === 0) {
  const seedPath = path.join(__dirname, 'seed-prod.sql');
  if (fs.existsSync(seedPath)) {
    db.exec(fs.readFileSync(seedPath, 'utf8'));
    const after = db.prepare('SELECT COUNT(*) as c FROM mangas').get();
    console.log('Seed appliqué:', after.c, 'mangas insérés');
  } else {
    console.log('Fichier seed-prod.sql introuvable');
  }
} else {
  console.log('DB déjà remplie, rien à faire');
}
