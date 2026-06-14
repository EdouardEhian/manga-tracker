const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// En production Railway, stocker dans /data (volume persistant)
const dbPath = process.env.RAILWAY_ENVIRONMENT
  ? '/data/mangas.db'
  : path.join(__dirname, 'mangas.db');

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS mangas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    cover_url TEXT,
    total_chapters INTEGER DEFAULT 0,
    current_chapter INTEGER DEFAULT 0,
    status TEXT DEFAULT 'to_read',
    rating REAL DEFAULT 0,
    genre TEXT,
    synopsis TEXT,
    reader_url TEXT,
    mangadex_id TEXT,
    favorite INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reading_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manga_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    read_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TRIGGER IF NOT EXISTS update_manga_timestamp
  AFTER UPDATE ON mangas
  BEGIN
    UPDATE mangas SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
`);

// Migrations
try { db.exec('ALTER TABLE mangas ADD COLUMN mangadex_id TEXT'); } catch {}
try { db.exec('ALTER TABLE mangas ADD COLUMN favorite INTEGER DEFAULT 0'); } catch {}

// Seed initial (uniquement si la DB est vide)
const count = db.prepare('SELECT COUNT(*) as c FROM mangas').get();
if (count.c === 0) {
  const seedPath = path.join(__dirname, 'seed-prod.sql');
  if (fs.existsSync(seedPath)) {
    db.exec(fs.readFileSync(seedPath, 'utf8'));
    console.log('DB initialisée avec le seed de production.');
  }
}

module.exports = db;
