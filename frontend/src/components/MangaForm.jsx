import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Stars from './Stars.jsx';
import MangaDexSearch from './MangaDexSearch.jsx';
import SushiSearch from './SushiSearch.jsx';

const DEFAULT = {
  title: '', author: '', cover_url: '', total_chapters: '', current_chapter: '',
  status: 'to_read', rating: 0, genre: '', synopsis: '', reader_url: '',
};

export default function MangaForm({ manga, onSave, onClose }) {
  const [form, setForm]           = useState(DEFAULT);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (manga) setForm({ ...DEFAULT, ...manga, total_chapters: manga.total_chapters || '', current_chapter: manga.current_chapter || '' });
    else setForm(DEFAULT);
  }, [manga]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Auto-remplissage depuis MangaDex
  const handleMangaDexSelect = (m) => {
    setForm(f => ({
      ...f,
      title:          m.title          || f.title,
      author:         m.author         || f.author,
      cover_url:      m.cover_url      || f.cover_url,
      genre:          m.genre          || f.genre,
      synopsis:       m.synopsis       || f.synopsis,
      reader_url:     m.reader_url     || f.reader_url,
      total_chapters: m.total_chapters || f.total_chapters,
    }));
    setShowSearch(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      total_chapters:  parseInt(form.total_chapters)  || 0,
      current_chapter: parseInt(form.current_chapter) || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="bebas" style={{ fontSize: 22, color: 'var(--red)' }}>
            {manga ? 'Modifier le manga' : 'Ajouter un manga'}
          </h2>
          <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Recherche MangaDex */}
            <div style={{ background: 'rgba(232,33,58,0.06)', border: '1px solid rgba(232,33,58,0.2)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSearch ? 10 : 0 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  🔍 Remplis automatiquement depuis <strong style={{ color: 'var(--red)' }}>MangaDex</strong>
                </p>
                <button type="button" className={`btn ${showSearch ? 'btn-danger' : 'btn-primary'}`} style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={() => setShowSearch(s => !s)}>
                  {showSearch ? 'Annuler' : 'Rechercher'}
                </button>
              </div>
              {showSearch && (
                <MangaDexSearch
                  initialTitle={form.title}
                  onSelect={handleMangaDexSelect}
                />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Titre *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Jujutsu Kaisen" />
              </div>
              <div className="field">
                <label>Auteur</label>
                <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="Gege Akutami" />
              </div>
              <div className="field">
                <label>Genre</label>
                <input value={form.genre} onChange={e => set('genre', e.target.value)} placeholder="Shōnen, Action" />
              </div>
              <div className="field">
                <label>Chapitres totaux</label>
                <input type="number" min="0" value={form.total_chapters} onChange={e => set('total_chapters', e.target.value)} placeholder="0" />
              </div>
              <div className="field">
                <label>Chapitre actuel</label>
                <input type="number" min="0" value={form.current_chapter} onChange={e => set('current_chapter', e.target.value)} placeholder="0" />
              </div>
              <div className="field">
                <label>Statut</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="to_read">À lire</option>
                  <option value="reading">En cours</option>
                  <option value="paused">Pause</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>
              <div className="field">
                <label>Note</label>
                <div style={{ padding: '6px 0' }}>
                  <Stars value={form.rating} onChange={v => set('rating', v)} size={22} />
                </div>
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>URL de la couverture</label>
                <input value={form.cover_url} onChange={e => set('cover_url', e.target.value)} placeholder="https://…/cover.jpg" />
              </div>
              {form.cover_url && (
                <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center' }}>
                  <img src={form.cover_url} alt="Aperçu" style={{ height: 120, borderRadius: 6, border: '1px solid var(--border)' }} />
                </div>
              )}
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>URL du lecteur</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={form.reader_url}
                    onChange={e => set('reader_url', e.target.value)}
                    placeholder="https://sushiscan.fr/manga/…"
                    style={{ flex: 1 }}
                  />
                  <SushiSearch title={form.title} onSelect={url => set('reader_url', url)} />
                </div>
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Synopsis</label>
                <textarea rows={3} value={form.synopsis} onChange={e => set('synopsis', e.target.value)} placeholder="Résumé…" style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">{manga ? 'Sauvegarder' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
