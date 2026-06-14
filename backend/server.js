const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── MANGAS ──────────────────────────────────────────────────────────────────

// Ajouter mangadex_id si absent (migration)
try { db.exec('ALTER TABLE mangas ADD COLUMN mangadex_id TEXT'); } catch {}
try { db.exec('ALTER TABLE mangas ADD COLUMN favorite INTEGER DEFAULT 0'); } catch {}

// Routes spécifiques AVANT /:id pour éviter les conflits
app.get('/api/mangas/recent', (req, res) => {
  const rows = db.prepare(
    "SELECT * FROM mangas WHERE current_chapter > 0 ORDER BY updated_at DESC LIMIT 7"
  ).all();
  res.json(rows);
});

app.post('/api/mangas/favorite-toggle', (req, res) => {
  const { id } = req.body;
  const manga = db.prepare('SELECT * FROM mangas WHERE id = ?').get(id);
  if (!manga) return res.status(404).json({ error: 'Not found' });
  const newVal = manga.favorite ? 0 : 1;
  db.prepare('UPDATE mangas SET favorite = ? WHERE id = ?').run(newVal, id);
  res.json({ favorite: newVal });
});

app.get('/api/mangas', (req, res) => {
  const { status, search, sort = 'updated_at', order = 'DESC' } = req.query;
  const allowed = ['title', 'updated_at', 'created_at', 'rating', 'current_chapter'];
  const safeSort = allowed.includes(sort) ? sort : 'updated_at';
  const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

  let query = 'SELECT * FROM mangas WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (title LIKE ? OR author LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ` ORDER BY ${safeSort} ${safeOrder}`;
  res.json(db.prepare(query).all(...params));
});

app.get('/api/mangas/:id', (req, res) => {
  const manga = db.prepare('SELECT * FROM mangas WHERE id = ?').get(req.params.id);
  if (!manga) return res.status(404).json({ error: 'Manga not found' });
  const sessions = db.prepare('SELECT * FROM reading_sessions WHERE manga_id = ? ORDER BY read_at DESC LIMIT 20').all(req.params.id);
  res.json({ ...manga, recent_sessions: sessions });
});

app.post('/api/mangas', (req, res) => {
  const { title, author, cover_url, total_chapters, current_chapter, status, rating, genre, synopsis, reader_url } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const { mangadex_id } = req.body;
  const result = db.prepare(`
    INSERT INTO mangas (title, author, cover_url, total_chapters, current_chapter, status, rating, genre, synopsis, reader_url, mangadex_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, author || null, cover_url || null, total_chapters || 0, current_chapter || 0,
         status || 'to_read', rating || 0, genre || null, synopsis || null, reader_url || null, mangadex_id || null);

  res.status(201).json(db.prepare('SELECT * FROM mangas WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/mangas/:id', (req, res) => {
  const { title, author, cover_url, total_chapters, current_chapter, status, rating, genre, synopsis, reader_url } = req.body;
  const manga = db.prepare('SELECT * FROM mangas WHERE id = ?').get(req.params.id);
  if (!manga) return res.status(404).json({ error: 'Manga not found' });

  if (current_chapter !== undefined && current_chapter > manga.current_chapter) {
    db.prepare('INSERT INTO reading_sessions (manga_id, chapter) VALUES (?, ?)').run(manga.id, current_chapter);
  }

  const { mangadex_id } = req.body;
  db.prepare(`
    UPDATE mangas SET
      title = ?, author = ?, cover_url = ?, total_chapters = ?, current_chapter = ?,
      status = ?, rating = ?, genre = ?, synopsis = ?, reader_url = ?, mangadex_id = ?
    WHERE id = ?
  `).run(
    title ?? manga.title, author ?? manga.author, cover_url ?? manga.cover_url,
    total_chapters ?? manga.total_chapters, current_chapter ?? manga.current_chapter,
    status ?? manga.status, rating ?? manga.rating, genre ?? manga.genre,
    synopsis ?? manga.synopsis, reader_url ?? manga.reader_url,
    mangadex_id ?? manga.mangadex_id, req.params.id
  );

  res.json(db.prepare('SELECT * FROM mangas WHERE id = ?').get(req.params.id));
});

app.delete('/api/mangas/:id', (req, res) => {
  const result = db.prepare('DELETE FROM mangas WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Manga not found' });
  res.json({ success: true });
});

// Derniers lus (par updated_at, avec au moins 1 chapitre lu)
app.get('/api/mangas/recent', (req, res) => {
  const rows = db.prepare(
    "SELECT * FROM mangas WHERE current_chapter > 0 ORDER BY updated_at DESC LIMIT 7"
  ).all();
  res.json(rows);
});

// Toggle favori
app.post('/api/mangas/:id/favorite', (req, res) => {
  const manga = db.prepare('SELECT * FROM mangas WHERE id = ?').get(req.params.id);
  if (!manga) return res.status(404).json({ error: 'Not found' });
  const newVal = manga.favorite ? 0 : 1;
  db.prepare('UPDATE mangas SET favorite = ? WHERE id = ?').run(newVal, req.params.id);
  res.json({ favorite: newVal });
});

// ─── STATS ───────────────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM mangas').get().count;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM mangas GROUP BY status').all();
  const chaptersRead = db.prepare('SELECT SUM(current_chapter) as total FROM mangas').get().total || 0;
  const avgRating = db.prepare('SELECT AVG(rating) as avg FROM mangas WHERE rating > 0').get().avg || 0;
  const completionRate = db.prepare(`
    SELECT AVG(CASE WHEN total_chapters > 0 THEN (current_chapter * 100.0 / total_chapters) ELSE 0 END) as rate
    FROM mangas WHERE total_chapters > 0
  `).get().rate || 0;
  const recentActivity = db.prepare(`
    SELECT rs.chapter, rs.read_at, m.title FROM reading_sessions rs
    JOIN mangas m ON m.id = rs.manga_id
    ORDER BY rs.read_at DESC LIMIT 10
  `).all();

  res.json({ total, byStatus, chaptersRead, avgRating: Math.round(avgRating * 10) / 10, completionRate: Math.round(completionRate), recentActivity });
});

// ─── MANGADEX SEARCH ─────────────────────────────────────────────────────────

app.get('/api/mangadex/search', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: 'title requis' });

  try {
    const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=6&order_by=popularity&sort=asc`;
    const r = await fetch(url, { headers: { 'User-Agent': 'MangaTracker/1.0' } });
    const json = await r.json();

    const results = (json.data || []).map(m => ({
      id:             String(m.mal_id),
      title:          m.title_english || m.title || '',
      author:         m.authors?.[0]?.name || '',
      cover_url:      m.images?.jpg?.large_image_url || m.images?.jpg?.image_url || null,
      synopsis:       m.synopsis || '',
      genre:          (m.genres || []).map(g => g.name).join(', '),
      total_chapters: m.chapters || 0,
      reader_url:     '',
    }));

    res.json(results);
  } catch (err) {
    res.status(502).json({ error: 'Jikan inaccessible', detail: err.message });
  }
});

// ─── SUSHISCAN.NET (iframe mode) ─────────────────────────────────────────────
// Cloudflare protège les pages HTML, mais l'API WP REST est parfois accessible.
// Si ça échoue, on renvoie l'URL du catalogue pour que le frontend charge en iframe.
app.get('/api/sushinet/chapters', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url requis' });

  // Extraire le slug depuis l'URL catalogue (ex: https://sushiscan.net/catalogue/dorohedoro/)
  const slugMatch = url.match(/\/catalogue\/([^\/]+)\/?$/);
  if (!slugMatch) return res.json([]);
  const slug = slugMatch[1];

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  };

  try {
    // Essai 1 : WP REST API posts par slug
    const wpUrl = `https://sushiscan.net/wp-json/wp/v2/posts?slug=${slug}&per_page=1&_fields=id,slug`;
    const wpR = await fetch(wpUrl, { headers: HEADERS });
    if (wpR.ok) {
      const posts = await wpR.json();
      if (posts && posts.length > 0) {
        const postId = posts[0].id;
        // Récupérer les chapitres via taxonomie ou meta
        // Essai 2 : endpoint chapitres personnalisé (souvent présent sur MangaPress/Madara themes)
        const chUrl = `https://sushiscan.net/wp-admin/admin-ajax.php`;
        const formData = `action=manga_get_chapters&manga=${postId}`;
        const chR = await fetch(chUrl, {
          method: 'POST',
          headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': url },
          body: formData,
        });
        if (chR.ok) {
          const html = await chR.text();
          const re = /href="(https:\/\/sushiscan\.net\/[^"]*chapitre-([0-9]+(?:\.[0-9]+)?)[^"]*)"/gi;
          const chapters = []; const seen = new Set();
          let m;
          while ((m = re.exec(html)) !== null) {
            const num = parseFloat(m[2]);
            if (!seen.has(num)) {
              seen.add(num);
              chapters.push({ number: num, url: m[1].split('?')[0].replace(/\/?$/, '/') });
            }
          }
          if (chapters.length) {
            chapters.sort((a, b) => a.number - b.number);
            return res.json(chapters);
          }
        }
      }
    }
  } catch {}

  // Fallback : pas de chapitres trouvés — le frontend chargera la page catalogue en iframe
  return res.json([]);
});

// ─── SUSHISCAN SEARCH ────────────────────────────────────────────────────────

app.get('/api/sushiscan/search', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: 'title requis' });

  try {
    const searchUrl = `https://sushiscan.fr/?s=${encodeURIComponent(title)}`;
    const r = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    });
    const html = await r.text();

    // Sushiscan utilise /catalogue/ avec title= sur le lien <a>
    const results = [];
    const re = /href="(https:\/\/sushiscan\.fr\/catalogue\/[^"\/]+\/)"[^>]*title="([^"]+)"/g;
    const seen = new Set();
    let match;
    while ((match = re.exec(html)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        results.push({ url: match[1], name: match[2] });
      }
    }
    res.json(results.slice(0, 8));
  } catch (err) {
    res.status(502).json({ error: 'Sushiscan inaccessible', detail: err.message });
  }
});

// ─── MANGADEX READER ─────────────────────────────────────────────────────────

app.get('/api/mangadex/chapters', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id requis' });
  try {
    async function fetchAllChapters(lang) {
      const all = []; let offset = 0;
      while (true) {
        const r = await fetch(
          `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=${lang}&limit=500&offset=${offset}&order[chapter]=asc`,
          { headers: { 'User-Agent': 'MangaTracker/1.0' } }
        );
        const d = await r.json();
        if (!d.data?.length) break;
        all.push(...d.data);
        if (all.length >= d.total) break;
        offset += 500;
      }
      return all;
    }

    // Récupérer FR et EN, fusionner en préférant FR
    const [rawFr, rawEn] = await Promise.all([
      fetchAllChapters('fr'),
      fetchAllChapters('en'),
    ]);

    const byNum = new Map();
    // EN d'abord (priorité basse)
    for (const c of rawEn) {
      const num = parseFloat(c.attributes.chapter) || 0;
      if (!byNum.has(num))
        byNum.set(num, { id: c.id, number: num, title: c.attributes.title || '', lang: 'en' });
    }
    // FR ensuite (écrase EN)
    for (const c of rawFr) {
      const num = parseFloat(c.attributes.chapter) || 0;
      byNum.set(num, { id: c.id, number: num, title: c.attributes.title || '', lang: 'fr' });
    }

    const chapters = [...byNum.values()].sort((a, b) => a.number - b.number);
    res.json(chapters);
  } catch (err) { res.status(502).json({ error: err.message }); }
});

app.get('/api/mangadex/pages', async (req, res) => {
  const { id } = req.query; // chapter ID
  if (!id) return res.status(400).json({ error: 'id requis' });
  try {
    const r = await fetch(`https://api.mangadex.org/at-home/server/${id}`, {
      headers: { 'User-Agent': 'MangaTracker/1.0' }
    });
    const d = await r.json();
    const base = d.baseUrl;
    const hash = d.chapter?.hash;
    const images = (d.chapter?.data || []).map(f => `${base}/data/${hash}/${f}`);
    res.json(images);
  } catch (err) { res.status(502).json({ error: err.message }); }
});

// Recherche MangaDex ID depuis un titre
app.get('/api/mangadex/find', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: 'title requis' });
  try {
    const r = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=5&includes[]=cover_art`,
      { headers: { 'User-Agent': 'MangaTracker/1.0' } }
    );
    const d = await r.json();
    const results = (d.data || []).map(m => {
      const coverRel = m.relationships.find(r => r.type === 'cover_art');
      const coverFile = coverRel?.attributes?.fileName;
      return {
        id: m.id,
        title: m.attributes.title?.en || m.attributes.title?.fr || Object.values(m.attributes.title)[0] || '',
        cover_url: coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.512.jpg` : null,
      };
    });
    res.json(results);
  } catch (err) { res.status(502).json({ error: err.message }); }
});

// ─── SUSHI READER ────────────────────────────────────────────────────────────

// Liste des chapitres d'un manga
app.get('/api/reader/chapters', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url requis' });

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://sushiscan.fr/',
      }
    });
    const html = await r.text();

    const chapters = [];
    const seen = new Set();
    let m;
    // Nouveau format sushiscan : <li data-num="N"><a href="...">
    const re = /<li[^>]+data-num="([0-9]+(?:\.[0-9]+)?)"[^>]*>[\s\S]*?<a href="(https:\/\/sushiscan\.fr\/[^"]+)"/g;
    while ((m = re.exec(html)) !== null) {
      const url = m[2].split('?')[0].replace(/\/?$/, '/');
      if (!seen.has(url)) {
        seen.add(url);
        chapters.push({ number: parseFloat(m[1]), url });
      }
    }
    chapters.sort((a, b) => a.number - b.number);
    res.json(chapters);
  } catch (err) {
    res.status(502).json({ error: 'Impossible de récupérer les chapitres', detail: err.message });
  }
});

// Pages (images) d'un chapitre
app.get('/api/reader/pages', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url requis' });

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://sushiscan.fr/',
      }
    });
    const html = await r.text();

    let images = [];

    // Méthode 1 : ts_reader.run JSON
    const tsMatch = html.match(/ts_reader\.run\((\{[\s\S]+?\})\)/);
    if (tsMatch) {
      try {
        const data = JSON.parse(tsMatch[1]);
        images = data.sources?.[0]?.images || [];
      } catch {}
    }

    // Méthode 2 : chapter_preloaded_images
    if (images.length === 0) {
      const pre = html.match(/chapter_preloaded_images\s*=\s*(\[[\s\S]+?\])/);
      if (pre) { try { images = JSON.parse(pre[1]); } catch {} }
    }

    // Méthode 3 : balises <img> dans le reader
    if (images.length === 0) {
      const re = /<img[^>]+class="[^"]*wp-manga-chapter-img[^"]*"[^>]+src="([^"]+)"/gi;
      let m;
      while ((m = re.exec(html)) !== null) images.push(m[1]);
    }

    // Trier les pages par numéro extrait du nom de fichier (001.jpg, 002.jpg…)
    const valid = images.filter(u => u && u.startsWith('http'));
    valid.sort((a, b) => {
      const numA = parseInt((a.match(/(\d+)\.[a-z]+(?:\?|$)/i) || [])[1] || '0');
      const numB = parseInt((b.match(/(\d+)\.[a-z]+(?:\?|$)/i) || [])[1] || '0');
      return numA - numB;
    });
    res.json(valid);
  } catch (err) {
    res.status(502).json({ error: 'Impossible de récupérer les pages', detail: err.message });
  }
});

// Proxy image (contourne le hotlink protection)
app.get('/api/reader/image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).end();
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://sushiscan.fr/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      }
    });
    if (!r.ok) return res.status(r.status).end();
    const buffer = await r.buffer();
    const type = r.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buffer);
  } catch (err) {
    res.status(502).end();
  }
});

// ─── PROXY READER ────────────────────────────────────────────────────────────

app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url param required' });

  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Referer': new URL(url).origin,
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    const body = await response.text();
    const base = new URL(url).origin;
    const patched = body.replace('<head>', `<head><base href="${base}">`);

    res.setHeader('Content-Type', contentType);
    res.send(patched);
  } catch (err) {
    res.status(502).json({ error: 'Proxy fetch failed', detail: err.message });
  }
});

// Servir le frontend buildé en production
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
