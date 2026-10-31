import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
type Mode = 'login' | 'register' | 'verify';
type User = { id: string; fullName: string; email: string; department: string; batchYear: number; trustScore: number };
type Item = { id: string; type: 'LOST' | 'FOUND'; title: string; description: string; category?: { name: string }; location?: { name: string }; createdAt: string; postedBy?: { fullName: string } };
type Search = { id: string; query: string; notify: boolean };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? body.message ?? 'Something went wrong');
  return body.data as T;
}

function App() {
  const [mode, setMode] = useState<Mode>('login');
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [searches, setSearches] = useState<Search[]>([]);
  const [filter, setFilter] = useState<'' | 'LOST' | 'FOUND'>('');
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); const [department, setDepartment] = useState(''); const [batchYear, setBatchYear] = useState('2024'); const [code, setCode] = useState(''); const [devCode, setDevCode] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [feedLoading, setFeedLoading] = useState(false); const [offline, setOffline] = useState(!navigator.onLine);
  const token = () => localStorage.getItem('trace.accessToken') ?? '';

  async function loadFeed(nextFilter = filter, nextQuery = query) {
    setFeedLoading(true); setError('');
    try { const params = new URLSearchParams({ ...(nextFilter ? { type: nextFilter } : {}), ...(nextQuery ? { search: nextQuery } : {}) }); const result = await request<{ data: Item[] }>(`/items?${params}`); setItems(result.data); setOffline(false); }
    catch (reason) { setOffline(!navigator.onLine); setError(reason instanceof Error ? reason.message : 'Feed unavailable'); }
    finally { setFeedLoading(false); }
  }

  async function loadAccount(accessToken: string) {
    const profile = await request<User>('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } }); setUser(profile); setOffline(false);
    const saved = await request<Search[]>('/saved-searches', { headers: { Authorization: `Bearer ${accessToken}` } }); setSearches(saved);
    await loadFeed();
  }

  useEffect(() => { const stored = token(); if (stored) loadAccount(stored).catch(() => localStorage.removeItem('trace.accessToken')); const onOnline = () => setOffline(false); const onOffline = () => setOffline(true); window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline); return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); }; }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'register') { const result = await request<{ devVerificationCode?: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password, department, batchYear: Number(batchYear) }) }); setDevCode(result.devVerificationCode ?? ''); setMode('verify'); }
      else if (mode === 'verify') { const result = await request<{ accessToken: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) }); localStorage.setItem('trace.accessToken', result.accessToken); await loadAccount(result.accessToken); }
      else { const result = await request<{ accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('trace.accessToken', result.accessToken); await loadAccount(result.accessToken); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue'); } finally { setLoading(false); }
  }

  async function saveSearch() { if (!query.trim()) return; try { const saved = await request<Search>('/saved-searches', { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: JSON.stringify({ query, filters: filter ? { type: filter } : {}, notify: true }) }); setSearches((current) => [saved, ...current]); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save search'); } }
  async function bookmark(itemId: string) { try { await request(`/items/${itemId}/bookmark`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } }); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not bookmark item'); } }

  if (user) return <main className="app-shell"><header><span className="wordmark">TRACE</span><button className="quiet" onClick={() => { localStorage.removeItem('trace.accessToken'); setUser(null); }}>Sign out</button></header>{offline && <div className="offline" role="status">You are offline. Showing the last available view.</div>}<section className="welcome"><p className="eyebrow">MUET COMMUNITY</p><h1>Find what matters, {user.fullName.split(' ')[0]}.</h1><p className="lede">A verified campus feed for lost and found belongings.</p></section><section className="feed-toolbar"><div className="segmented"><button className={!filter ? 'active' : ''} onClick={() => { setFilter(''); void loadFeed('', query); }}>All</button><button className={filter === 'LOST' ? 'active lost' : ''} onClick={() => { setFilter('LOST'); void loadFeed('LOST', query); }}>Lost</button><button className={filter === 'FOUND' ? 'active found' : ''} onClick={() => { setFilter('FOUND'); void loadFeed('FOUND', query); }}>Found</button></div><div className="search-row"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void loadFeed(filter, query); }} placeholder="Search the campus feed" /><button className="quiet" onClick={() => void saveSearch()}>Save search</button></div></section>{error && <div className="error" role="alert">{error}<button onClick={() => void loadFeed()}>Retry</button></div>}<section className="feed-grid">{feedLoading ? [1, 2, 3].map((key) => <div className="item-card skeleton" key={key} />) : items.length ? items.map((item) => <article className="item-card" key={item.id}><div className={`item-type ${item.type.toLowerCase()}`}>{item.type}</div><h2>{item.title}</h2><p>{item.description}</p><div className="item-meta"><span>{item.category?.name ?? 'Other'}</span><span>{item.location?.name ?? 'Campus'}</span></div><div className="item-footer"><small>{item.postedBy?.fullName ?? 'Verified student'}</small><button aria-label={`Bookmark ${item.title}`} onClick={() => void bookmark(item.id)}>☆</button></div></article>) : <div className="empty-panel"><div className="icon">+</div><h2>Nothing here yet</h2><p>Try another filter or save this search for later alerts.</p><button className="primary" onClick={() => { setFilter(''); void loadFeed('', query); }}>Browse everything</button></div>}</section>{searches.length > 0 && <section className="saved-strip"><span>Saved searches</span>{searches.slice(0, 3).map((saved) => <button key={saved.id} onClick={() => { setQuery(saved.query); void loadFeed(filter, saved.query); }}>{saved.query}</button>)}</section>}</main>;

  return <main className="auth-layout"><section className="brand-panel"><span className="wordmark">TRACE</span><div><p className="eyebrow">MEHRAN UNIVERSITY</p><h1>Small things find their way home.</h1><p>Verified students. Safer handovers. One calm place to look.</p></div><span className="campus-note">University-only · Asia/Karachi</span></section><section className="form-panel"><div className="form-wrap"><div className="mobile-mark"><span className="wordmark">TRACE</span></div><p className="eyebrow">{mode === 'verify' ? 'CHECK YOUR INBOX' : 'WELCOME TO CAMPUSFIND'}</p><h2>{mode === 'verify' ? 'Verify your email' : mode === 'register' ? 'Create your account' : 'Find what matters'}</h2><p className="muted">{mode === 'verify' ? `Enter the six-digit code sent to ${email}.` : 'Use your university account to continue.'}</p>{error && <div className="error" role="alert">{error}</div>}{mode === 'verify' && devCode && <div className="dev-code">Local development code: <strong>{devCode}</strong></div>}<form onSubmit={submit}>{mode === 'register' && <><label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label><label>Department<input value={department} onChange={(e) => setDepartment(e.target.value)} required /></label><label>Batch year<input type="number" value={batchYear} onChange={(e) => setBatchYear(e.target.value)} required /></label></>}{mode !== 'verify' && <label>University email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@students.muet.edu.pk" required /></label>}{mode !== 'verify' && <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></label>}{mode === 'verify' && <label>Verification code<input className="code-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required /></label>}<button className="primary" disabled={loading}>{loading ? 'Working...' : mode === 'verify' ? 'Verify and continue' : mode === 'register' ? 'Create account' : 'Sign in'}</button></form>{mode !== 'verify' && <p className="switch">{mode === 'login' ? 'New to TRACE?' : 'Already registered?'} <button onClick={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>}</div></section></main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
