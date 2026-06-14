import React, { useState } from 'react';

export default function Stars({ value = 0, onChange, readonly = false, size = 16 }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`star ${i <= display ? 'star-filled' : 'star-empty'}`}
          style={{ cursor: readonly ? 'default' : 'pointer', fontSize: size }}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(i === value ? 0 : i)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
