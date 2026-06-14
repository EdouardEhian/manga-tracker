import React, { useEffect, useState } from 'react';
import { BookOpen, Star, TrendingUp, Library, Clock, CheckCircle, PauseCircle, Bookmark } from 'lucide-react';

const STATUS_ICONS = {
  reading:   { icon: BookOpen,     color: 'var(--blue)',   label: 'En cours' },
  completed: { icon: CheckCircle,  color: 'var(--green)',  label: 'Terminés' },
  paused:    { icon: PauseCircle,  color: 'var(--orange)', label: 'En pause' },
  to_read:   { icon: Bookmark,     color: 'var(--text-muted)', label: 'À lire' },
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="bebas" style={{ fontSize: 26, lineHeight: 1, color: 'var(--text)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: 'var(--text-muted)' }}>
      Chargement…
    </div>
  );

  const byStatus = Object.fromEntries(stats.byStatus.map(s => [s.status, s.count]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Main stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard icon={Library}     label="Mangas total"     value={stats.total}         color="var(--red)" />
        <StatCard icon={BookOpen}    label="Chapitres lus"    value={stats.chaptersRead}  color="var(--blue)" />
        <StatCard icon={Star}        label="Note moyenne"     value={stats.avgRating || '—'} color="var(--gold)" sub={stats.avgRating ? '/ 5' : undefined} />
        <StatCard icon={TrendingUp}  label="Progression moy." value={`${stats.completionRate}%`} color="var(--green)" />
      </div>

      {/* By status */}
      <div>
        <h3 className="bebas" style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 14, letterSpacing: 2 }}>PAR STATUT</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {Object.entries(STATUS_ICONS).map(([status, { icon: Icon, color, label }]) => (
            <div key={status} style={{
              background: 'var(--bg-1)',
              border: `1px solid ${color}30`,
              borderRadius: 10, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Icon size={18} style={{ color }} />
              <div>
                <div className="bebas" style={{ fontSize: 22, lineHeight: 1, color }}>{byStatus[status] || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {stats.recentActivity?.length > 0 && (
        <div>
          <h3 className="bebas" style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 14, letterSpacing: 2 }}>ACTIVITÉ RÉCENTE</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {stats.recentActivity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: i < stats.recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
                  <span style={{ fontWeight: 500 }}>{a.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>ch. {a.chapter}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {new Date(a.read_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
