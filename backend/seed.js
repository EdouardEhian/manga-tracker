const db = require('./database');

const mangas = [
  'Baduque', 'Gokurakugai', 'Tsui no Taimashi',
  'My Dearest Self with Malice Aforethought', 'Kuroi Shi', 'Oyasumi Punpun',
  'Manchuria Opium Squad', 'Unknown', 'Gachiakuta', 'Gigantis',
  'Starving Anonymous', 'Bibliomania', 'Beageruta', 'Gyakusatsu Happy End',
  'Soloist in a Cage', 'Adabana', 'Lili Men', 'Gannibal', 'The Killer Inside',
  'Casinogui', 'Majo to Yaju', 'Biorg Trinity', 'Mahoutsukai to Aka no Pilgrim',
  'Under Ninja', 'Hakaiju', "L'Habitant de l'Infini", 'After God',
  'Wild Strawberry', 'Levius', 'Tomahawk Angel', 'Ogres and Greed',
  'Kimi Shi ni Tamō Koto Nakare', 'Magi', 'Ao no Exorcist', 'Rurouni Kenshin',
  'Samurai 8', 'Shiga Hime', 'Dorohedoro', 'Shin Ango Onchi', 'Jackals',
  'All You Need Is Kill', 'Feng Shen Ji', 'Fire Punch', 'Mieruko-chan',
  'Hour of the Zombie', 'Wallman', 'Shigurui', 'Bestarius', 'Ingoshima',
  'Tougen Anki', 'The Devils of Gods', 'Sanctum Raqiya', 'Phantom Seer', 'Site',
  'Dragon Ball Super', 'Nihon Saikyou Bugeisha Ketteisen',
  "Eden: It's an Endless World!", 'Link Click', 'Les Fleurs du Mal',
  'Yomotsu Hegui', 'I Am a Hero', 'Solo', 'Inuyashiki', 'Usuogi', 'Grashros',
  'Jujika no Rokunin', 'Apocalypse no Toride', '20th Century Boys',
  'Dead Dead Demons Dededede Destruction', 'Phantom Blade 0', 'Sword of the Sea',
  'Foamstars', 'Towers of Agg', 'The Bugle Call', 'Go Go Loser Ranger',
  'Heart Gear', 'Dear Anemone', 'Homunculus', 'Tenkaichi', 'Mother Parasite',
  'Shin Zero', 'Fool Night', "Hool!gans", 'Ubel Blatt', 'Nito Exorcist',
  'Die Wergelder', 'Centuria', 'Mad', 'Tower Dungeon', 'Magus of the Library',
  'Parashoppers',
];

try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_mangas_title ON mangas(title)');
} catch {}

const insert = db.prepare(`INSERT OR IGNORE INTO mangas (title, status) VALUES (?, 'to_read')`);

db.exec('BEGIN');
let inserted = 0, skipped = 0;
for (const title of mangas) {
  const r = insert.run(title);
  if (r.changes) inserted++; else skipped++;
}
db.exec('COMMIT');

console.log(`✅  ${inserted} manga(s) insérés — ${skipped} déjà présents (ignorés)`);
