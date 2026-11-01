/** TRACE UI Component Library */
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { avatarBg, initials } from './utils';
import { categoryEmoji } from './utils';
import { trustInfo } from './utils';
import type { Category } from './api';

// ── Avatar ────────────────────────────────────────────────────────────────
export interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
  trustScore?: number;
}
export function Avatar({ name, url, size = 36, trustScore }: AvatarProps) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: size * 0.38,
  };
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        className="user-avatar"
        style={{ ...style, background: url ? undefined : avatarBg(name) }}
      >
        {url ? <img src={url} alt={name} /> : initials(name)}
      </div>
      {trustScore !== undefined && trustScore >= 80 && (
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            fontSize: 12,
            lineHeight: 1,
          }}
          title="Trusted user"
        >
          ✓
        </span>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
export interface SkeletonProps {
  w?: string | number;
  h?: number;
  radius?: string;
}
export function Skeleton({ w, h, radius }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width: w ?? '100%',
        height: h ?? 16,
        borderRadius: radius,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton" style={{ aspectRatio: '4/3' }} aria-hidden="true" />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton h={18} w="75%" />
        <Skeleton h={14} w="50%" />
        <Skeleton h={14} w="60%" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ display: 'flex', gap: 12, alignItems: 'center' }}
        >
          <Skeleton w={44} h={44} radius="50%" />
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <Skeleton h={16} w="70%" />
            <Skeleton h={13} w="45%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────
export interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}
export function EmptyState({ icon = '', title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && (
        <button className="btn btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="error-state">
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h3 style={{ color: 'var(--c-danger)' }}>Something went wrong</h3>
      <p>{message ?? 'Unable to load data. Please try again.'}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  center?: boolean;
}
export function Modal({ open, onClose, title, children, center }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className={`modal-backdrop${center ? ' center' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        {!center && <div className="modal-handle" />}
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close modal">
              ×
            </button>
          </div>
        )}
        {!title && center && (
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            style={{ marginBottom: 16, alignSelf: 'flex-end', position: 'absolute', right: 16, top: 16 }}
          >
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────
export interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} center>
      <p style={{ marginBottom: 24 }}>{message}</p>
      <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`badge ${className ?? ''}`}>{children}</span>;
}

// ── OTP Input ─────────────────────────────────────────────────────────────
export interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}
export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const handleChange = (idx: number, val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const arr = (value + '      ').slice(0, 6).split('');
    arr[idx] = cleaned;
    const next = arr.join('').trimEnd();
    onChange(next);
    if (cleaned && idx < 5) inputs.current[idx + 1]?.focus();
  };
  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); e.preventDefault(); }
  };
  return (
    <div className="otp-grid" role="group" aria-label="One-time password input">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          className={`otp-input${value[i] ? ' filled' : ''}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of 6`}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────
export interface TabsProps {
  tabs: Array<{ id: string; label: string; icon?: string; badge?: number }>;
  active: string;
  onChange: (id: string) => void;
}
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`tab-btn${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <span>{t.icon}</span>}
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span className="nav-badge" style={{ marginLeft: 6 }}>
              {t.badge > 99 ? '99+' : t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Step Progress ─────────────────────────────────────────────────────────
export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="step-progress" role="list" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className={`step${done ? ' done' : active ? ' active' : ''}`} role="listitem">
            <div className="step-dot">{done ? '✓' : i + 1}</div>
            <span className="step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Offline Banner ────────────────────────────────────────────────────────
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="offline-banner" role="alert">
      <span>📡</span>
      <span>No internet connection — showing cached data</span>
    </div>
  );
}

// ── Search Bar ────────────────────────────────────────────────────────────
export interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange, placeholder = 'Search items…', onSubmit }, ref) => (
    <div className="search-bar">
      <span style={{ fontSize: 18, color: 'var(--c-text-muted)' }} aria-hidden="true">🔍</span>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit?.(); }}
        autoComplete="off"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ fontSize: 18, color: 'var(--c-text-muted)' }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
);
SearchBar.displayName = 'SearchBar';

// ── Color Swatch Picker ───────────────────────────────────────────────────
const COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Black', 'White', 'Brown', 'Grey', 'Gold', 'Silver'];
const COLOR_HEX: Record<string, string> = {
  Red: '#EF4444', Orange: '#F97316', Yellow: '#EAB308', Green: '#22C55E',
  Blue: '#3B82F6', Purple: '#A855F7', Pink: '#EC4899', Black: '#1E293B',
  White: '#F8FAFC', Brown: '#92400E', Grey: '#64748B', Gold: '#CA8A04', Silver: '#94A3B8',
};
export function ColorSwatchPicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {COLORS.map(c => (
        <button
          key={c}
          title={c}
          aria-label={`Color: ${c}${value === c ? ' (selected)' : ''}`}
          onClick={() => onChange(value === c ? '' : c)}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: COLOR_HEX[c],
            border: value === c ? '3px solid var(--c-primary)' : '2px solid var(--c-border)',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: value === c ? '0 0 0 2px white, 0 0 0 4px var(--c-primary)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ── Category Tile ─────────────────────────────────────────────────────────
export function CategoryTile({ cat, selected, onClick }: { cat: Category; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '16px 12px', borderRadius: 'var(--r-lg)',
        border: selected ? '2px solid var(--c-primary)' : '2px solid var(--c-border)',
        background: selected ? 'var(--c-primary-soft)' : 'var(--c-surface)',
        color: selected ? 'var(--c-primary)' : 'var(--c-text-muted)',
        cursor: 'pointer', transition: 'all 0.15s', minWidth: 80,
      }}
    >
      <span style={{ fontSize: 28 }}>{categoryEmoji(cat.slug)}</span>
      <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{cat.name}</span>
    </button>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
      />
    </div>
  );
}

// ── Trust Badge ───────────────────────────────────────────────────────────
export function TrustBadge({ score }: { score: number }) {
  const { label, color } = trustInfo(score);
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 'var(--r-full)',
        fontSize: 11, fontWeight: 700,
        background: `${color}20`, color, border: `1px solid ${color}40`,
      }}
    >
      ◐ {label} ({score})
    </span>
  );
}
