import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Library, BarChart2, BookOpen, SlidersHorizontal, X, Heart } from 'lucide-react';
import MangaCard from './components/MangaCard.jsx';
import MangaDetail from './components/MangaDetail.jsx';
import MangaForm from './components/MangaForm.jsx';
import Reader from './components/Reader.jsx';
import Stats from './components/Stats.jsx';
import { useApi } from './hooks/useApi.js';

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'reading',   label: 'En cours' },
  { value: 'completed', label: 'Terminés' },
  { value: 'paused',    label: 'Pause' },
  { value: 'to_read',   label: 'À lire' },
];

const SORT_OPTIONS = [
  { value: 'title',      label: 'A–Z' },
  { value: 'updated_at', label: 'Récent' },
  { value: 'rating',     label: 'Note' },
];

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%231a1a1a'/%3E%3Ctext x='100' y='145' font-size='48' text-anchor='middle' fill='%23333'%3E📚%3C/text%3E%3C/svg%3E";

export default function App() {
  const api = useApi();
  const [view, setView]           = useState('library');
  const [mangas, setMangas]       = useState([]);
  const [recent, setRecent]       = useState([]);
  const [detail, setDetail]       = useState(null);
  const [reader, setReader]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [favOnly, setFavOnly]     = useState(false);
  const [sort, setSort]           = useState('title');
  const [showFilters, setShowFilters] = useState(false);

  const loadMangas = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search)       params.set('search', search);
    params.set('sort', sort);
    params.set('order', sort === 'title' ? 'ASC' : 'DESC');
    let data = await api.get(`/mangas?${params}`);
    if (favOnly) data = data.filter(m => m.favorite);
    setMangas(data);
  }, [statusFilter, search, sort, favOnly]);

  const loadRecent = useCallback(async () => {
    const data = await api.get('/mangas/recent');
    setRecent(data);
  }, []);

  useEffect(() => { loadMangas(); }, [loadMangas]);
  useEffect(() => { loadRecent(); }, [loadRecent]);

  const openReader = async (manga) => {
    const full = await api.get(`/mangas/${manga.id}`);
    if (full.status === 'to_read') {
      await api.put(`/mangas/${full.id}`, { ...full, status: 'reading' });
      full.status = 'reading';
    }
    setReader(full);
  };

  const openDetail = async (manga) => {
    const full = await api.get(`/mangas/${manga.id}`);
    setDetail(full);
  };

  const handleFavorite = async (manga) => {
    await fetch('/api/mangas/favorite-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: manga.id }),
    });
    loadMangas();
  };

  const handleChapterSave = async (chapter) => {
    if (!reader) return;
    const updated = await api.put(`/mangas/${reader.id}`, { ...reader, current_chapter: chapter, status: 'reading' });
    setReader(updated);
    loadMangas();
    loadRecent();
  };

  const handleAdd = async (data) => {
    await api.post('/mangas', data);
    setShowForm(false);
    loadMangas();
  };

  const handleEdit = async (data) => {
    await api.put(`/mangas/${editTarget.id}`, data);
    setEditTarget(null); setShowForm(false);
    if (detail?.id === editTarget.id) {
      const updated = await api.get(`/mangas/${editTarget.id}`);
      setDetail(updated);
    }
    loadMangas();
  };

  const handleDelete = async () => {
    await api.del(`/mangas/${detail.id}`);
    setDetail(null); loadMangas();
  };

  const handleDetailUpdate = async (patch) => {
    await api.put(`/mangas/${detail.id}`, { ...detail, ...patch });
    setDetail(await api.get(`/mangas/${detail.id}`));
    loadMangas();
  };

  if (reader) {
    return (
      <Reader
        manga={reader}
        onClose={() => { setReader(null); loadMangas(); loadRecent(); }}
        onChapterSave={handleChapterSave}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 16, height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={16} color="#fff" />
          </div>
          <span className="bebas" style={{ fontSize: 22, color: 'var(--red)', letterSpacing: 2 }}>
            MANGA<span style={{ color: 'var(--text)' }}>TRACK</span>
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 2, marginLeft: 24 }}>
          {[
            { id: 'library',   icon: Library,   label: 'Bibliothèque' },
            { id: 'favorites', icon: Heart,      label: 'Favoris' },
            { id: 'stats',     icon: BarChart2,  label: 'Statistiques' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setView(id); if (id === 'favorites') setFavOnly(true); else setFavOnly(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              color: view === id ? 'var(--red)' : 'var(--text-muted)',
              background: view === id ? 'rgba(232,33,58,0.1)' : 'transparent',
              border: view === id ? '1px solid rgba(232,33,58,0.25)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}>
              <Icon size={14} fill={id === 'favorites' && view === id ? 'var(--red)' : 'none'} />
              {label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={15} /> Ajouter
        </button>
      </header>

      <main style={{ flex: 1, padding: '28px 24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {view === 'stats' ? (
          <div>
            <h1 className="bebas" style={{ fontSize: 36, marginBottom: 24 }}>STATISTIQUES</h1>
            <Stats />
          </div>
        ) : (
          <>
            {/* ── Derniers lus (uniquement sur la bibliothèque principale) ── */}
            {view === 'library' && recent.length > 0 && !search && !statusFilter && (
              <div style={{ marginBottom: 36 }}>
                <h2 className="bebas" style={{ fontSize: 22, marginBottom: 14, color: 'var(--text-muted)', letterSpacing: 2 }}>
                  DERNIERS LUS
                </h2>
                <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
                  {recent.map(m => (
                    <div
                      key={m.id}
                      onClick={() => openReader(m)}
                      style={{
                        flexShrink: 0, width: 110, cursor: 'pointer',
                        transition: 'transform 0.18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid var(--red)', aspectRatio: '2/3' }}>
                        <img
                          src={m.cover_url || PLACEHOLDER}
                          alt={m.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => { e.target.src = PLACEHOLDER; }}
                        />
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                          padding: '20px 6px 6px',
                        }}>
                          <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>Ch. {m.current_chapter}</div>
                        </div>
                      </div>
                      <p className="bebas" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.2, color: 'var(--text)', textAlign: 'center' }}>
                        {m.title.length > 18 ? m.title.slice(0, 16) + '…' : m.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Barre de recherche ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un manga ou un auteur…"
                  style={{
                    width: '100%', background: 'var(--bg-1)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--text)', padding: '9px 12px 9px 36px', outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--red)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'var(--border)'; }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <button className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowFilters(f => !f)}>
                <SlidersHorizontal size={14} /> Filtres
              </button>
            </div>

            {showFilters && (
              <div style={{
                display: 'flex', gap: 16, padding: '14px 16px',
                background: 'var(--bg-1)', border: '1px solid var(--border)',
                borderRadius: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 4 }}>Statut</span>
                  {STATUS_FILTERS.map(f => (
                    <button key={f.value} onClick={() => setStatusFilter(f.value)} style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: statusFilter === f.value ? 'var(--red)' : 'var(--bg-3)',
                      color: statusFilter === f.value ? '#fff' : 'var(--text-muted)',
                      border: 'none', transition: 'all 0.15s',
                    }}>{f.label}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 4 }}>Trier</span>
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSort(o.value)} style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: sort === o.value ? 'var(--bg-3)' : 'transparent',
                      color: sort === o.value ? 'var(--text)' : 'var(--text-muted)',
                      border: `1px solid ${sort === o.value ? 'var(--border)' : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}>{o.label}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <h1 className="bebas" style={{ fontSize: 36 }}>
                {view === 'favorites' ? (
                  <><Heart size={28} fill="var(--red)" style={{ color: 'var(--red)', verticalAlign: 'middle', marginRight: 10 }} />FAVORIS</>
                ) : 'BIBLIOTHÈQUE'}
                <span style={{ fontSize: 18, color: 'var(--text-muted)', marginLeft: 12 }}>{mangas.length}</span>
              </h1>
            </div>

            {api.loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>
            ) : mangas.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16, color: 'var(--text-muted)', textAlign: 'center' }}>
                {view === 'favorites'
                  ? <><Heart size={48} strokeWidth={1} /><p style={{ fontSize: 16 }}>Aucun favori pour l'instant.</p><p style={{ fontSize: 13 }}>Clique sur ❤ sur une carte pour l'ajouter.</p></>
                  : <><BookOpen size={48} strokeWidth={1} /><p style={{ fontSize: 16 }}>Aucun manga trouvé.</p></>
                }
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16 }}>
                {mangas.map(m => (
                  <MangaCard
                    key={m.id}
                    manga={m}
                    onRead={() => openReader(m)}
                    onInfo={() => openDetail(m)}
                    onFavorite={() => handleFavorite(m)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {detail && (
        <MangaDetail
          manga={detail}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditTarget(detail); setShowForm(true); setDetail(null); }}
          onDelete={handleDelete}
          onUpdate={handleDetailUpdate}
        />
      )}

      {showForm && (
        <MangaForm
          manga={editTarget}
          onSave={editTarget ? handleEdit : handleAdd}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
