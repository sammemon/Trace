/**
 * TRACE API Client — typed fetch wrapper with auto token refresh.
 */

const BASE_URL =
  (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') + '/api/v1';

// ── Token storage ──────────────────────────────────────────────────────────
const TOKEN_KEY = 'trace_access_token';
const REFRESH_KEY = 'trace_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setAccess: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ── Types ──────────────────────────────────────────────────────────────────
export interface ApiError {
  code?: string;
  message: string;
  details?: unknown;
}

export class TraceApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ── Refresh logic ──────────────────────────────────────────────────────────
let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const rt = tokenStore.getRefresh();
  if (!rt) throw new TraceApiError('No refresh token', 401);
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!res.ok) {
    tokenStore.clear();
    throw new TraceApiError('Session expired', 401);
  }
  const body = await res.json();
  const { accessToken, refreshToken } = body.data;
  tokenStore.setAccess(accessToken);
  tokenStore.setRefresh(refreshToken);
  return accessToken;
}

async function getValidToken(): Promise<string> {
  const at = tokenStore.getAccess();
  if (!at) throw new TraceApiError('Not authenticated', 401);
  // Decode to check expiry (without verify — backend verifies properly)
  try {
    const payload = JSON.parse(atob(at.split('.')[1]));
    if (payload.exp && payload.exp * 1000 > Date.now() + 30_000) return at;
  } catch {
    /* can't decode, try anyway */
  }
  // Need refresh
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Core fetch ─────────────────────────────────────────────────────────────
interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = opts;
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) {
    try {
      headers['Authorization'] = `Bearer ${await getValidToken()}`;
    } catch (e) {
      if ((e as TraceApiError).status === 401) {
        window.dispatchEvent(new CustomEvent('trace:unauthorized'));
      }
      throw e;
    }
  }
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new TraceApiError(
      'API is unavailable. Start the backend and database, then try again.',
      503,
      'API_UNAVAILABLE',
    );
  }
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text);
  } catch {
    /* binary or empty */
  }

  if (!res.ok) {
    const err = (data as { error?: ApiError }).error;
    throw new TraceApiError(
      err?.message ?? `HTTP ${res.status}`,
      res.status,
      err?.code,
    );
  }
  return (data as { data?: T }).data ?? (data as T);
}

// ── Auth endpoints ─────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  department: string;
  batchYear: number;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  trustScore: number;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: Record<string, unknown>) =>
    request<{ verificationRequired: boolean; devVerificationCode?: string }>(
      '/auth/register',
      { method: 'POST', body: data, auth: false },
    ),
  verifyEmail: (data: { email: string; code: string }) =>
    request<AuthSession>('/auth/verify-email', {
      method: 'POST',
      body: data,
      auth: false,
    }),
  resendOtp: (email: string) =>
    request<{ verificationRequired: boolean }>('/auth/resend-otp', {
      method: 'POST',
      body: { email },
      auth: false,
    }),
  login: (data: { email: string; password: string }) =>
    request<AuthSession>('/auth/login', {
      method: 'POST',
      body: data,
      auth: false,
    }),
  refresh: (refreshToken: string) =>
    request<AuthSession>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    }),
  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: { refreshToken: tokenStore.getRefresh() },
    }),
  logoutAll: () =>
    request<{ success: boolean }>('/auth/logout-all', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ accepted: boolean; devResetCode?: string }>(
      '/auth/forgot-password',
      { method: 'POST', body: { email }, auth: false },
    ),
  resetPassword: (data: { email: string; code: string; password: string }) =>
    request<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: data,
      auth: false,
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: data,
    }),
};

// ── User endpoints ─────────────────────────────────────────────────────────
export const usersApi = {
  me: () => request<AuthUser>('/users/me'),
  update: (data: Record<string, unknown>) =>
    request<AuthUser>('/users/me', { method: 'PATCH', body: data }),
  deleteAccount: () =>
    request<{ success: boolean }>('/users/me', { method: 'DELETE' }),
  publicProfile: (id: string) =>
    request<Partial<AuthUser>>(`/users/${id}/public`),
  updateNotifPrefs: (prefs: Record<string, unknown>) =>
    request<{ success: boolean }>('/users/me/notification-prefs', {
      method: 'PATCH',
      body: prefs,
    }),
  block: (id: string) =>
    request<{ success: boolean }>(`/users/${id}/block`, { method: 'POST' }),
  unblock: (id: string) =>
    request<{ success: boolean }>(`/users/${id}/block`, { method: 'DELETE' }),
};

// ── Reference data ─────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isSensitive: boolean;
  verificationTemplates: string[];
}

export interface CampusLocation {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  description?: string;
  isSafeHandoverPoint: boolean;
}

export const referenceApi = {
  categories: () => request<Category[]>('/categories', { auth: false }),
  locations: () => request<CampusLocation[]>('/locations', { auth: false }),
};

// ── Items ──────────────────────────────────────────────────────────────────
export interface ItemImage {
  id: string;
  url: string;
  position: number;
  isCover: boolean;
  width?: number;
  height?: number;
}

export interface Item {
  id: string;
  type: 'LOST' | 'FOUND';
  title: string;
  description: string;
  category: Pick<Category, 'id' | 'name' | 'slug' | 'icon' | 'isSensitive'>;
  location: Pick<CampusLocation, 'id' | 'name' | 'type' | 'lat' | 'lng'>;
  color?: string;
  brand?: string;
  tags: string[];
  images: ItemImage[];
  verificationQuestions?: Array<{ question: string }>;
  locationNote?: string;
  occurredAt: string;
  isTimeApproximate: boolean;
  status:
    | 'ACTIVE'
    | 'CLAIM_PENDING'
    | 'RETURNED'
    | 'RESOLVED'
    | 'EXPIRED'
    | 'REMOVED';
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  postedBy: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    department: string;
    trustScore: number;
  };
}

export interface PaginatedItems {
  data: Item[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

export interface ItemQuery {
  type?: 'LOST' | 'FOUND';
  categoryId?: string;
  locationId?: string;
  status?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}

export const itemsApi = {
  list: (q?: ItemQuery) => {
    const params = new URLSearchParams();
    if (q)
      Object.entries(q).forEach(
        ([k, v]) => v != null && params.set(k, String(v)),
      );
    return request<PaginatedItems>(`/items?${params}`, { auth: false });
  },
  get: (id: string) => request<Item>(`/items/${id}`, { auth: false }),
  create: (data: Record<string, unknown>) =>
    request<Item>('/items', { method: 'POST', body: data }),
  update: (id: string, data: Record<string, unknown>) =>
    request<Item>(`/items/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/items/${id}`, { method: 'DELETE' }),
  resolve: (id: string) =>
    request<{ success: boolean }>(`/items/${id}/resolve`, { method: 'POST' }),
  renew: (id: string) =>
    request<Item>(`/items/${id}/renew`, { method: 'POST' }),
  mine: () => request<Item[]>('/items/mine'),
  similar: (id: string) =>
    request<Item[]>(`/items/${id}/similar`, { auth: false }),
  matches: (id: string) => request<unknown[]>(`/items/${id}/matches`),
  bookmark: (id: string) =>
    request<{ bookmarked: boolean }>(`/items/${id}/bookmark`, {
      method: 'POST',
    }),
  unbookmark: (id: string) =>
    request<{ bookmarked: boolean }>(`/items/${id}/bookmark`, {
      method: 'DELETE',
    }),
  bookmarks: () => request<Item[]>('/bookmarks'),
};

// ── Uploads ────────────────────────────────────────────────────────────────
export const uploadsApi = {
  presign: (data: { mimeType: string; sizeBytes: number; fileName: string }) =>
    request<{ uploadUrl: string; objectKey: string }>('/uploads/presign', {
      method: 'POST',
      body: data,
    }),
  confirm: (data: Record<string, unknown>) =>
    request<{ url: string }>('/uploads/confirm', {
      method: 'POST',
      body: data,
    }),
};

// ── Claims ─────────────────────────────────────────────────────────────────
export interface Claim {
  id: string;
  status: string;
  message: string;
  answers: Array<{ id: string; question: string; answer: string }>;
  expiresAt: string;
  createdAt: string;
  item: Pick<Item, 'id' | 'title' | 'type'> & { status?: string };
  claimant?: AuthUser;
}

export const claimsApi = {
  create: (itemId: string, data: Record<string, unknown>) =>
    request<Claim>(`/items/${itemId}/claims`, { method: 'POST', body: data }),
  mine: () => request<Claim[]>('/claims/mine'),
  forItem: (itemId: string) => request<Claim[]>(`/items/${itemId}/claims`),
  get: (id: string) => request<Claim>(`/claims/${id}`),
  approve: (id: string) =>
    request<Claim>(`/claims/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) =>
    request<Claim>(`/claims/${id}/reject`, {
      method: 'POST',
      body: { reason },
    }),
  requestMoreInfo: (id: string, note: string) =>
    request<Claim>(`/claims/${id}/request-more-info`, {
      method: 'POST',
      body: { note },
    }),
  cancel: (id: string) =>
    request<Claim>(`/claims/${id}/cancel`, { method: 'POST' }),
  generateHandoverCode: (id: string) =>
    request<{ code: string; expiresAt: string }>(
      `/claims/${id}/handover-code`,
      { method: 'POST' },
    ),
  complete: (id: string, code: string) =>
    request<{ success: boolean; status: string }>(`/claims/${id}/complete`, {
      method: 'POST',
      body: { code },
    }),
};

// ── Chat ───────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'SYSTEM' | 'MEETUP_PROPOSAL';
  body: string;
  imageUrl?: string;
  meta?: Record<string, unknown>;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  claimId: string;
  itemId: string;
  userAId: string;
  userBId: string;
  status: 'OPEN' | 'READ_ONLY' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  item?: Pick<Item, 'id' | 'title' | 'type'>;
  otherUser?: Partial<AuthUser>;
  lastMessage?: Message;
  unreadCount?: number;
}

export const chatApi = {
  conversations: () => request<Conversation[]>('/conversations'),
  messages: (id: string, cursor?: string) => {
    const q = cursor ? `?cursor=${cursor}` : '';
    return request<{ data: Message[]; meta: { nextCursor: string | null } }>(
      `/conversations/${id}/messages${q}`,
    );
  },
  send: (id: string, body: string) =>
    request<Message>(`/conversations/${id}/messages`, {
      method: 'POST',
      body: { body },
    }),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/conversations/${id}/read`, {
      method: 'POST',
    }),
};

// ── Notifications ──────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  readAt?: string;
  createdAt: string;
}

export const notificationsApi = {
  list: () => request<AppNotification[]>('/notifications'),
  unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'POST',
    }),
  markAllRead: () =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}`, { method: 'DELETE' }),
};

// ── Reports ────────────────────────────────────────────────────────────────
export const reportsApi = {
  create: (data: Record<string, unknown>) =>
    request<{ id: string }>('/reports', { method: 'POST', body: data }),
  mine: () => request<unknown[]>('/reports/mine'),
};

// ── Saved searches ─────────────────────────────────────────────────────────
export const savedSearchesApi = {
  list: () => request<unknown[]>('/saved-searches'),
  create: (data: Record<string, unknown>) =>
    request<unknown>('/saved-searches', { method: 'POST', body: data }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/saved-searches/${id}`, {
      method: 'DELETE',
    }),
};

// ── Admin ──────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => request<Record<string, unknown>>('/admin/dashboard'),
  reports: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return request<unknown[]>(`/admin/reports${q}`);
  },
  resolveReport: (id: string, data: Record<string, unknown>) =>
    request<unknown>(`/admin/reports/${id}/resolve`, {
      method: 'POST',
      body: data,
    }),
  items: (q?: Record<string, string>) => {
    const params = new URLSearchParams(q ?? {});
    return request<unknown>(`/admin/items?${params}`);
  },
  hideItem: (id: string) =>
    request<unknown>(`/admin/items/${id}/hide`, { method: 'POST' }),
  restoreItem: (id: string) =>
    request<unknown>(`/admin/items/${id}/restore`, { method: 'POST' }),
  removeItem: (id: string) =>
    request<unknown>(`/admin/items/${id}/remove`, { method: 'POST' }),
  users: (q?: string) =>
    request<unknown[]>(`/admin/users${q ? `?search=${q}` : ''}`),
  warnUser: (id: string, note: string) =>
    request<unknown>(`/admin/users/${id}/warn`, {
      method: 'POST',
      body: { note },
    }),
  suspendUser: (id: string, days: number) =>
    request<unknown>(`/admin/users/${id}/suspend`, {
      method: 'POST',
      body: { days },
    }),
  banUser: (id: string) =>
    request<unknown>(`/admin/users/${id}/ban`, { method: 'POST' }),
  restoreUser: (id: string) =>
    request<unknown>(`/admin/users/${id}/restore`, { method: 'POST' }),
  handoverDesk: () => request<unknown[]>('/admin/handover-desk'),
  markReturned: (itemId: string) =>
    request<unknown>(`/admin/handover-desk/${itemId}/mark-returned`, {
      method: 'POST',
    }),
  auditLogs: () => request<unknown[]>('/admin/audit-logs'),
  analytics: () => request<unknown>('/admin/analytics'),
  categories: () => request<Category[]>('/admin/categories'),
  createCategory: (data: Record<string, unknown>) =>
    request<Category>('/admin/categories', { method: 'POST', body: data }),
  updateCategory: (id: string, data: Record<string, unknown>) =>
    request<Category>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: data,
    }),
  locations: () => request<CampusLocation[]>('/admin/locations'),
  createLocation: (data: Record<string, unknown>) =>
    request<CampusLocation>('/admin/locations', { method: 'POST', body: data }),
};

// ── Search ─────────────────────────────────────────────────────────────────
export const searchApi = {
  suggestions: (q: string) =>
    request<string[]>(`/search/suggestions?q=${encodeURIComponent(q)}`, {
      auth: false,
    }),
};
