import React from 'react';
import { Info, BookOpen, Star, Heart } from 'lucide-react';
import StatusTag from './StatusTag.jsx';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%231a1a1a'/%3E%3Ctext x='100' y='145' font-size='48' text-anchor='middle' fill='%23333'%3E📚%3C/text%3E%3C/svg%3E";

export default function MangaCard({ manga, onRead, onInfo, onFavorite }) {
  const progress = manga.total_chapters > 0
    ? Math.round((manga.current_chapter / manga.total_chapters) * 100)
    : null;

  return (
    <div
      style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--red)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,33,58,0.15)';
        e.currentTarget.querySelector('.card-overlay').style.opacity = '1';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.querySelector('.card-overlay').style.opacity = '0';
      }}
      style={{
        background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
        transition: 'all 0.2s ease', cursor: 'pointer',
      }}
    >
      {/* Cover — clic = lire */}
      <div
        onClick={onRead}
        style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: 'var(--bg-2)' }}
      >
        <img
          src={manga.cover_url || PLACEHOLDER}
          alt={manga.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(13,13,13,0.95) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <StatusTag status={manga.status} />
        </div>
        {manga.rating > 0 && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.75)', borderRadius: 6, padding: '3px 7px',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 700, color: '#f5c518',
          }}>
            <Star size={11} fill="#f5c518" /> {manga.rating}
          </div>
        )}

        {/* Hover overlay */}
        <div className="card-overlay" style={{
          position: 'absolute', inset: 0,
          background: 'rgba(232,33,58,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s',
        }}>
          <div style={{
            background: 'var(--red)', color: '#fff', borderRadius: 8,
            padding: '8px 18px', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ▶ Lire
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
          <h3 className="bebas" style={{ fontSize: 16, lineHeight: 1.2, flex: 1 }}>{manga.title}</h3>
          <button
            onClick={e => { e.stopPropagation(); onFavorite?.(); }}
            style={{ color: manga.favorite ? '#e8213a' : 'var(--text-dim)', flexShrink: 0, padding: 2, borderRadius: 4, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e8213a'}
            onMouseLeave={e => e.currentTarget.style.color = manga.favorite ? '#e8213a' : 'var(--text-dim)'}
            title={manga.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={13} fill={manga.favorite ? '#e8213a' : 'none'} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onInfo(); }}
            style={{ color: 'var(--text-dim)', flexShrink: 0, padding: 2, borderRadius: 4, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
            title="Détails"
          >
            <Info size={13} />
          </button>
        </div>

        {manga.author && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{manga.author}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 'auto' }}>
          <BookOpen size={12} />
          <span>Ch. {manga.current_chapter}{manga.total_chapters > 0 ? ` / ${manga.total_chapters}` : ''}</span>
          {progress !== null && (
            <span style={{ marginLeft: 'auto', color: progress === 100 ? 'var(--green)' : 'var(--text-muted)' }}>{progress}%</span>
          )}
        </div>

        {progress !== null && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
