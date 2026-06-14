import React from 'react';

const LABELS = {
  reading:   'En cours',
  completed: 'Terminé',
  paused:    'Pause',
  to_read:   'À lire',
};

export default function StatusTag({ status }) {
  return <span className={`tag tag-${status}`}>{LABELS[status] || status}</span>;
}
