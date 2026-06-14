import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Check, Loader, AlertTriangle, List, ZoomIn, ZoomOut } from 'lucide-react';

export default function Reader({ manga, onClose, onChapterSave }) {
  const source = manga.reader_url
    ? (manga.reader_url.includes('sushiscan.net') ? 'iframe' : 'sushi')
    : manga.mangadex_id ? 'mangadex' : null;

  const [chapters, setChapters]     = useState([]);
  const [chapterIdx, setChapterIdx] = useState(-1);
  const [pages, setPages]           = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingPages, setLoadingPages]       = useState(false);
  const [error, setError]           = useState('');
  const [saved, setSaved]           = useState(true);
  const [zoom, setZoom]             = useState(100);
  const [showList, setShowList]     = useState(false);
  const readerRef = useRef(null);

  // Charger la liste des chapitres
  useEffect(() => {
    if (!source || source === 'iframe') return;
    setLoadingChapters(true); setError('');

    const url = source === 'sushi'
      ? `/api/reader/chapters?url=${encodeURIComponent(manga.reader_url)}`
      : `/api/mangadex/chapters?id=${manga.mangadex_id}`;

    fetch(url).then(r => r.json()).then(data => {
      if (data.error) { setError(data.error); return; }
      if (!data.length) { setError('Aucun chapitre trouvé.'); return; }
      setChapters(data);
      const idx = data.findIndex(c => c.number >= (manga.current_chapter || 0));
      setChapterIdx(idx >= 0 ? idx : 0);
    }).catch(() => setError('Erreur de connexion.'))
      .finally(() => setLoadingChapters(false));
  }, [source]);

  // Charger les pages
  useEffect(() => {
    if (source === 'iframe' || chapterIdx < 0 || !chapters[chapterIdx]) return;
    setPages([]); setLoadingPages(true); setError('');
    if (readerRef.current) readerRef.current.scrollTop = 0;

    const ch = chapters[chapterIdx];
    const url = source === 'sushi'
      ? `/api/reader/pages?url=${encodeURIComponent(ch.url)}`
      : `/api/mangadex/pages?id=${ch.id}`;

    fetch(url).then(r => r.json()).then(data => {
      if (data.error) { setError(data.error); return; }
      if (!data.length) { setError('Aucune page trouvée.'); return; }
      setPages(data);
    }).catch(() => setError('Erreur lors du chargement des pages.'))
      .finally(() => setLoadingPages(false));
  }, [chapterIdx, chapters]);

  const saveChapter = useCallback(async (chNum) => {
    setSaved(false);
    await onChapterSave(chNum);
    setSaved(true);
  }, [onChapterSave]);

  const goToChapter = (idx) => {
    if (idx < 0 || idx >= chapters.length) return;
    setChapterIdx(idx);
    setShowList(false);
    saveChapter(chapters[idx].number);
  };

  // ── Mode iframe (sushiscan.net) ──
  const [iframeUrl, setIframeUrl] = useState(null);
  const [iframeChapters, setIframeChapters] = useState([]);
  const [iframeIdx, setIframeIdx] = useState(-1);
  const [iframeLoading, setIframeLoading] = useState(false);

  useEffect(() => {
    if (source !== 'iframe') return;
    // Cloudflare bloque toutes les requêtes serveur vers sushiscan.net.
    // On charge directement la page catalogue en iframe (le navigateur passe CF).
    setIframeUrl(manga.reader_url);
  }, [source]);

  const goIframe = (idx) => {
    if (idx < 0 || idx >= iframeChapters.length) return;
    setIframeIdx(idx);
    setIframeUrl(iframeChapters[idx].url);
    saveChapter(iframeChapters[idx].number);
  };

  const proxyImg = (url) => source === 'sushi'
    ? `/api/reader/image?url=${encodeURIComponent(url)}`
    : url; // MangaDex n'a pas besoin de proxy

  const sourceLabel = source === 'sushi' ? '🍣 Sushiscan.fr' : source === 'iframe' ? '🌐 Sushiscan.net' : source === 'mangadex' ? '📖 MangaDex' : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#111', display: 'flex', flexDirection: 'column' }}>

      {/* ── Barre du haut ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
        background: 'rgba(13,13,13,0.97)', borderBottom: '1px solid var(--border)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={onClose}><X size={16} /></button>

        <span className="bebas" style={{ fontSize: 18, color: 'var(--red)', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {manga.title}
        </span>

        {sourceLabel && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'var(--bg-3)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {sourceLabel}
          </span>
        )}

        {/* Nav chapitres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 6px' }}>
          <button onClick={() => goToChapter(chapterIdx - 1)} disabled={chapterIdx <= 0 || loadingPages}
            style={{ padding: '4px 6px', color: chapterIdx <= 0 ? 'var(--text-dim)' : 'var(--text)' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setShowList(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: showList ? 'var(--red)' : 'transparent', color: showList ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: 600 }}>
            <BookOpen size={13} />
            {chapters[chapterIdx] ? `Ch. ${chapters[chapterIdx].number}` : '—'}
          </button>
          <button onClick={() => goToChapter(chapterIdx + 1)} disabled={chapterIdx >= chapters.length - 1 || loadingPages}
            style={{ padding: '4px 6px', color: chapterIdx >= chapters.length - 1 ? 'var(--text-dim)' : 'var(--text)' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: saved ? 'var(--green)' : 'var(--text-muted)' }}>
          <Check size={11} /> {saved ? 'Sauvegardé' : 'Sauvegarde…'}
        </div>

        <div style={{ flex: 1 }} />

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-ghost" style={{ padding: '5px 7px' }} onClick={() => setZoom(z => Math.max(50, z - 10))}><ZoomOut size={14} /></button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36, textAlign: 'center' }}>{zoom}%</span>
          <button className="btn btn-ghost" style={{ padding: '5px 7px' }} onClick={() => setZoom(z => Math.min(200, z + 10))}><ZoomIn size={14} /></button>
          <button className="btn btn-ghost" style={{ padding: '5px 9px', fontSize: 11 }} onClick={() => setZoom(100)}>Reset</button>
        </div>

        <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => setShowList(s => !s)}>
          <List size={15} />
        </button>
      </div>

      {/* ── MODE SUSHISCAN.NET — ouvrir dans un onglet (X-Frame-Options bloque l'iframe) ── */}
      {source === 'iframe' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🌐</div>
          <h2 className="bebas" style={{ fontSize: 28, color: 'var(--red)' }}>Sushiscan.net</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>
            Sushiscan.net interdit l'affichage dans une application (protection Cloudflare + X-Frame-Options).<br/>
            Clique ci-dessous pour lire directement sur le site.
          </p>
          <a
            href={manga.reader_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: 15,
              padding: '12px 28px', borderRadius: 8, textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Ouvrir sur Sushiscan.net ↗
          </a>
          <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Ton avancement est quand même sauvegardé ici quand tu reviens.
          </p>
        </div>
      )}

      {source !== 'iframe' && <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Panel chapitres */}
        {showList && (
          <div style={{ width: 260, flexShrink: 0, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {chapters.length} chapitres · {sourceLabel}
            </div>
            {chapters.map((ch, i) => (
              <button key={i} onClick={() => goToChapter(i)} style={{
                width: '100%', padding: '10px 14px', textAlign: 'left', fontSize: 13,
                borderBottom: '1px solid var(--border)',
                background: i === chapterIdx ? 'rgba(232,33,58,0.12)' : 'transparent',
                color: i === chapterIdx ? 'var(--red)' : i < chapterIdx ? 'var(--text-dim)' : 'var(--text)',
                fontWeight: i === chapterIdx ? 700 : 400,
              }}
                onMouseEnter={e => i !== chapterIdx && (e.currentTarget.style.background = 'var(--bg-2)')}
                onMouseLeave={e => i !== chapterIdx && (e.currentTarget.style.background = 'transparent')}
              >
                {i < chapterIdx ? '✓ ' : ''}Chapitre {ch.number}
                {ch.title ? <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>{ch.title}</span> : null}
              </button>
            ))}
          </div>
        )}

        {/* Zone de lecture */}
        <div ref={readerRef} style={{ flex: 1, overflowY: 'auto', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>

          {(loadingChapters || loadingPages) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 100, color: 'var(--text-muted)' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--red)' }} />
              <p>{loadingChapters ? 'Récupération des chapitres…' : `Chargement du chapitre ${chapters[chapterIdx]?.number}…`}</p>
            </div>
          )}

          {error && !loadingChapters && !loadingPages && (
            <div style={{ maxWidth: 480, margin: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertTriangle size={40} style={{ color: 'var(--red)', marginBottom: 16 }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Impossible de charger</p>
              <p style={{ fontSize: 13 }}>{error}</p>
            </div>
          )}

          {!source && !loadingChapters && (
            <div style={{ textAlign: 'center', marginTop: 100, color: 'var(--text-muted)' }}>
              <BookOpen size={48} strokeWidth={1} style={{ marginBottom: 16, color: 'var(--red)', opacity: 0.5 }} />
              <p style={{ fontSize: 15 }}>Aucune source disponible pour ce manga.</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Modifie le manga (ⓘ → crayon) pour ajouter une URL Sushiscan.</p>
            </div>
          )}

          {!loadingPages && pages.map((imgUrl, i) => (
            <img key={i} src={proxyImg(imgUrl)} alt={`Page ${i + 1}`}
              style={{ width: `${zoom}%`, maxWidth: 900, display: 'block', marginBottom: 4, borderRadius: 4 }} />
          ))}

          {pages.length > 0 && !loadingPages && (
            <div style={{ display: 'flex', gap: 16, marginTop: 32, marginBottom: 20 }}>
              <button className="btn btn-ghost" onClick={() => goToChapter(chapterIdx - 1)} disabled={chapterIdx <= 0} style={{ gap: 8 }}>
                <ChevronLeft size={15} /> Chapitre précédent
              </button>
              <button className="btn btn-primary" onClick={() => goToChapter(chapterIdx + 1)} disabled={chapterIdx >= chapters.length - 1} style={{ gap: 8 }}>
                Chapitre suivant <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
