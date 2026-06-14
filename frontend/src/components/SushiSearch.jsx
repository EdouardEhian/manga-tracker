import React, { useState } from 'react';
import { Loader } from 'lucide-react';

export default function SushiSearch({ title, onSelect }) {
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState([]);
  const [open,     setOpen]     = useState(false);
  const [error,    setError]    = useState('');

  const search = async () => {
    if (!title.trim()) return;
    setLoading(true); setError(''); setResults([]);
    try {
      const r = await fetch(`/api/sushiscan/search?title=${encodeURIComponent(title)}`);
      const data = await r.json();
      if (data.error) { setError(data.error); }
      else if (data.length === 0) { setError('Aucun résultat'); }
      else { setResults(data); setOpen(true); }
    } catch { setError('Erreur réseau'); }
    setLoading(false);
  };

  const pick = (url) => { onSelect(url); setOpen(false); setResults([]); };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={search}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: 'rgba(232,33,58,0.12)', color: 'var(--red)',
          border: '1px solid rgba(232,33,58,0.3)', cursor: loading ? 'wait' : 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}
        onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--red)', e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,33,58,0.12)', e.currentTarget.style.color = 'var(--red)')}
      >
        {loading
          ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
          : '🍣'}
        Sushiscan
      </button>

      {error && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', zIndex: 300 }}>
          {error}
        </div>
      )}

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 300,
          background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 260, maxWidth: 340,
        }}>
          <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            Résultats Sushiscan
          </div>
          {results.map((r, i) => (
            <button
              key={i} type="button" onClick={() => pick(r.url)}
              style={{
                width: '100%', display: 'flex', flexDirection: 'column', padding: '10px 14px',
                textAlign: 'left', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
