import React, { useEffect, useRef, useState } from 'react';

export type TraceTheme = 'night' | 'ivory' | 'white-gold' | 'forest';

export const THEMES: Array<{ id: TraceTheme; name: string; icon: string }> = [
  { id: 'night', name: 'Night Gold', icon: '\uD83C\uDF19' },
  { id: 'ivory', name: 'Ivory Gold', icon: '\u2600\uFE0F' },
  { id: 'white-gold', name: 'White & Gold', icon: '\u2728' },
  { id: 'forest', name: 'Forest', icon: '\uD83C\uDF33' },
];

export function getStoredTheme(): TraceTheme {
  const s = localStorage.getItem('trace_theme');
  if (s && ['night', 'ivory', 'white-gold', 'forest'].includes(s))
    return s as TraceTheme;
  return 'night';
}

export function applyTraceTheme(theme: TraceTheme) {
  localStorage.setItem('trace_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<TraceTheme>(() => getStoredTheme());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTraceTheme(theme);
  }, [theme]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const cur = THEMES.find((t) => t.id === theme);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 36,
          background: 'var(--c-surface-2)',
          border: '1px solid var(--c-border)',
          color: 'var(--c-text-muted)',
          cursor: 'pointer',
          fontSize: 13,
          minHeight: 36,
        }}
        aria-label="Change theme"
      >
        <span>{cur?.icon ?? '\uD83C\uDF19'}</span>
        <span style={{ marginLeft: 4 }}>{cur?.name ?? 'Theme'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 12,
            padding: 8,
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,.3)',
            minWidth: 200,
          }}
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              onMouseDown={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                width: '100%',
                borderRadius: 8,
                border: 'none',
                background:
                  theme === t.id ? 'var(--c-primary-soft)' : 'transparent',
                color: theme === t.id ? 'var(--c-primary)' : 'var(--c-text)',
                cursor: 'pointer',
                fontWeight: theme === t.id ? 700 : 500,
                textAlign: 'left',
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <div>
                <div>{t.name}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--c-text-muted)',
                    marginTop: 2,
                  }}
                >
                  {t.id === 'night'
                    ? 'Dark with gold accents'
                    : t.id === 'ivory'
                      ? 'Light with gold accents'
                      : t.id === 'white-gold'
                        ? 'Clean white, golden highlights'
                        : 'Dark green nature theme'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
