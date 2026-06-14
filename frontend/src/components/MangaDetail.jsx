import React, { useState } from 'react';
import { X, BookOpen, Edit2, Trash2, Play, ChevronUp, ChevronDown } from 'lucide-react';
import Stars from './Stars.jsx';
import StatusTag from './StatusTag.jsx';
import Reader from './Reader.jsx';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%231a1a1a'/%3E%3Ctext x='100' y='145' font-size='48' text-anchor='middle' fill='%23333'%3E📚%3C/text%3E%3C/svg%3E";

export default function MangaDetail({ manga, onClose, onEdit, onDelete, onUpdate }) {
  const [showReader, setShowReader] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const progress = manga.total_chapters > 0
    ? Math.round((manga.current_chapter / manga.total_chapters) * 100)
    : null;

  const changeChapter = (delta) => {
    const next = Math.max(0, manga.current_chapter + delta);
    if (manga.total_chapters > 0 && next > manga.total_chapters) return;
    onUpdate({ current_chapter: next });
  };

  const updateRating = (r) => onUpdate({ rating: r });

  if (showReader) return <Reader manga={manga} onClose={() => setShowReader(false)} />;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <StatusTag status={manga.status} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={onEdit} title="Modifier">
              <Edit2 size={14} />
            </button>
            <button
              className="btn btn-danger" style={{ padding: '6px 8px' }}
              onClick={() => setConfirmDelete(true)} title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
            <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ gap: 20 }}>
          {/* Header with cover */}
          <div style={{ display: 'flex', gap: 20 }}>
            <img
              src={manga.cover_url || PLACEHOLDER}
              alt={manga.title}
              style={{ width: 120, height: 168, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border)' }}
              onError={e => { e.target.src = PLACEHOLDER; }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <h1 className="bebas" style={{ fontSize: 28, color: 'var(--text)', lineHeight: 1.1 }}>{manga.title}</h1>
                {manga.author && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>par {manga.author}</p>}
                {manga.genre && (
                  <p style={{ color: 'var(--red)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
                    {manga.genre}
                  </p>
                )}
              </div>

              <div style={{ marginTop: 'auto' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Note</p>
                <Stars value={manga.rating} onChange={updateRating} size={20} />
              </div>

              {manga.reader_url && (
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setShowReader(true)}>
                  <Play size={14} /> Lire
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={15} style={{ color: 'var(--red)' }} />
                <span style={{ fontWeight: 600 }}>Progression</span>
              </div>
              {progress !== null && (
                <span className="bebas" style={{ fontSize: 20, color: progress === 100 ? 'var(--green)' : 'var(--red)' }}>
                  {progress}%
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <button
                className="btn btn-ghost" style={{ padding: '6px 10px' }}
                onClick={() => changeChapter(-1)} disabled={manga.current_chapter <= 0}
              >
                <ChevronDown size={16} />
              </button>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div className="bebas" style={{ fontSize: 32, color: 'var(--text)', lineHeight: 1 }}>
                  {manga.current_chapter}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {manga.total_chapters > 0 ? `/ ${manga.total_chapters} chapitres` : 'chapitres lus'}
                </div>
              </div>
              <button
                className="btn btn-ghost" style={{ padding: '6px 10px' }}
                onClick={() => changeChapter(1)}
                disabled={manga.total_chapters > 0 && manga.current_chapter >= manga.total_chapters}
              >
                <ChevronUp size={16} />
              </button>
            </div>

            {progress !== null && (
              <div className="progress-bar" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          {/* Synopsis */}
          {manga.synopsis && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Synopsis</p>
              <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: 13 }}>{manga.synopsis}</p>
            </div>
          )}

          {/* Recent sessions */}
          {manga.recent_sessions?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Historique</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {manga.recent_sessions.slice(0, 5).map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>Chapitre {s.chapter}</span>
                    <span>{new Date(s.read_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(232,33,58,0.3)', background: 'rgba(232,33,58,0.05)', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, color: 'var(--text)' }}>Supprimer <strong>{manga.title}</strong> ?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Annuler</button>
              <button className="btn btn-danger" onClick={onDelete}>Supprimer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
