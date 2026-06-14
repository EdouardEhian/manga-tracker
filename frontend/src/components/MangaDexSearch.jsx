import React, { useState, useRef } from 'react';
import { Search, X, Download, Loader } from 'lucide-react';

export default function MangaDexSearch({ initialTitle = '', onSelect }) {
  const [query, setQuery]     = useState(initialTitle);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const timer = useRef(null);

  const search = async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/mangadex/search?title=${encodeURIComponent(q)}`);
      const data = await r.json();
      setResults(data);
      setOpen(true);
    } catch {}
    setLoading(false);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(e.target.value), 500);
  };

  const handleSelect = (manga) => {
    onSelect(manga);
    setOpen(false);
    setResults([]);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          {loading && <Loader size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--red)', animation: 'spin 1s linear infinite' }} />}
          <input
            value={query}
            onChange={handleChange}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Rechercher sur MangaDex…"
            style={{
              width: '100%', background: 'var(--bg-3)', border: '1px solid var(--red)',
              borderRadius: 6, color: 'var(--text)', padding: '8px 12px 8px 32px', outline: 'none',
            }}
          />
        </div>
        {query && (
          <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => { setQuery(''); setResults([]); setOpen(false); }}>
            <X size={14} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
          marginTop: 4, maxHeight: 360, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {results.map(m => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              style={{
                width: '100%', display: 'flex', gap: 12, padding: '10px 12px',
                borderBottom: '1px solid var(--border)', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {m.cover_url && (
                <img src={m.cover_url} alt="" style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                {m.author && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.author}</div>}
                {m.genre  && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>{m.genre}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--red)', flexShrink: 0 }}>
                <Download size={14} />
              </div>
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
