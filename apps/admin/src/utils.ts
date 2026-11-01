/**
 * Shared utility functions for TRACE web app.
 */

/** Format date relative to now ("2h ago", "3 days ago"). */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Karachi',
  });
}

/** Format absolute date/time in MUET timezone. */
export function formatDate(
  date: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
}

/** Get initials from full name. */
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

/** Category icon emoji mapping. */
export const CATEGORY_ICONS: Record<string, string> = {
  'id-card': '\uD83C\uDD94',
  wallet: '\uD83D\uDC5B',
  keys: '\uD83D\uDD11',
  phone: '\uD83D\uDCF1',
  'laptop-tablet': '\uD83D\uDCBB',
  'books-notes': '\uD83D\uDCDA',
  bag: '\uD83C\uDF92',
  earphones: '\uD83C\uDFA7',
  'water-bottle': '\uD83E\uDDF4',
  documents: '\uD83D\uDCC4',
  clothing: '\uD83D\uDC55',
  jewelry: '\uD83D\uDC8D',
  glasses: '\uD83D\uDC53',
  stationery: '\u270F\uFE0F',
  other: '\uD83D\uDCE6',
};

/** Get emoji for category slug. */
export function categoryEmoji(slug: string): string {
  return CATEGORY_ICONS[slug] ?? CATEGORY_ICONS.other!;
}

/** Trust score label and color. */
export function trustInfo(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Trusted', color: 'var(--c-success)' };
  if (score >= 60) return { label: 'Good', color: 'var(--c-info)' };
  if (score >= 40) return { label: 'Average', color: 'var(--c-warning)' };
  return { label: 'Low', color: 'var(--c-danger)' };
}

/** Item status display config. */
export function itemStatusInfo(status: string): {
  label: string;
  badgeClass: string;
} {
  const map: Record<string, { label: string; badgeClass: string }> = {
    ACTIVE: { label: 'Active', badgeClass: 'badge-active' },
    CLAIM_PENDING: { label: 'Claim Pending', badgeClass: 'badge-pending' },
    RETURNED: { label: 'Returned \u2713', badgeClass: 'badge-returned' },
    RESOLVED: { label: 'Resolved', badgeClass: 'badge-resolved' },
    EXPIRED: { label: 'Expired', badgeClass: 'badge-expired' },
    REMOVED: { label: 'Removed', badgeClass: 'badge-removed' },
  };
  return map[status] ?? { label: status, badgeClass: 'badge-neutral' };
}

/** Claim status display. */
export function claimStatusInfo(status: string): {
  label: string;
  badgeClass: string;
  icon: string;
} {
  const map: Record<
    string,
    { label: string; badgeClass: string; icon: string }
  > = {
    PENDING: { label: 'Pending', badgeClass: 'badge-pending', icon: '\u23F3' },
    MORE_INFO_REQUESTED: {
      label: 'More Info Needed',
      badgeClass: 'badge-warning',
      icon: '\u2139\uFE0F',
    },
    APPROVED: {
      label: 'Approved',
      badgeClass: 'badge-success',
      icon: '\u2713',
    },
    REJECTED: { label: 'Rejected', badgeClass: 'badge-danger', icon: '\u2717' },
    CANCELLED: {
      label: 'Cancelled',
      badgeClass: 'badge-neutral',
      icon: '\u21A9',
    },
    EXPIRED: { label: 'Expired', badgeClass: 'badge-expired', icon: '\u23F0' },
    COMPLETED: {
      label: 'Completed',
      badgeClass: 'badge-returned',
      icon: '\u2713',
    },
  };
  return (
    map[status] ?? {
      label: status,
      badgeClass: 'badge-neutral',
      icon: '\uD83D\uDCCB',
    }
  );
}

/** Notification type to icon and color. */
export function notifInfo(type: string): { icon: string; color: string } {
  const map: Record<string, { icon: string; color: string }> = {
    CLAIM_RECEIVED: { icon: '\uD83D\uDCE8', color: 'var(--c-primary)' },
    CLAIM_APPROVED: { icon: '\u2713', color: 'var(--c-success)' },
    CLAIM_REJECTED: { icon: '\u2717', color: 'var(--c-danger)' },
    CLAIM_EXPIRED: { icon: '\u23F0', color: 'var(--c-text-muted)' },
    NEW_MESSAGE: { icon: '\uD83D\uDCAC', color: 'var(--c-info)' },
    MATCH_FOUND: { icon: '\uD83D\uDD0D', color: 'var(--c-primary)' },
    ID_CARD_POSSIBLE_MATCH: { icon: '\uD83C\uDD94', color: 'var(--c-warning)' },
    SAVED_SEARCH_HIT: { icon: '\uD83D\uDD14', color: 'var(--c-primary)' },
    ITEM_EXPIRING_SOON: { icon: '\u23F0', color: 'var(--c-warning)' },
    HANDOVER_COMPLETED: { icon: '\u2713', color: 'var(--c-success)' },
    HANDOVER_PROPOSED: { icon: '\uD83D\uDCCC', color: 'var(--c-found)' },
    REPORT_UPDATE: { icon: '\uD83D\uDCCB', color: 'var(--c-info)' },
    ACCOUNT_WARNING: { icon: '\u26A0\uFE0F', color: 'var(--c-danger)' },
    ANNOUNCEMENT: { icon: '\uD83D\uDCE2', color: 'var(--c-primary)' },
    ITEM_STATUS_CHANGED: { icon: '\uD83D\uDCCB', color: 'var(--c-info)' },
  };
  return map[type] ?? { icon: '\uD83D\uDD14', color: 'var(--c-primary)' };
}

/** Phone/email masking in chat. */
export function maskSensitive(text: string): string {
  let out = text.replace(
    /(\+?92|0)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4,7}/g,
    '[contact hidden for safety]',
  );
  out = out.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[email hidden for safety]',
  );
  return out;
}

/** Debounce function. */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Generate avatar URL placeholder (colored initial). */
export function avatarBg(name: string): string {
  const colors = [
    '#151515',
    '#B38A2E',
    '#3A3934',
    '#8C6A1F',
    '#6B6251',
    '#292929',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx] ?? '#151515';
}

/** Format file size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
