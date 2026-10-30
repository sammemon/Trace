import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
type Mode = 'login' | 'register' | 'verify';
type User = { fullName: string; email: string; department: string; batchYear: number; trustScore: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? body.error?.message ?? 'Something went wrong');
  return body.data as T;
}

function App() {
  const [mode, setMode] = useState<Mode>('login');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [batchYear, setBatchYear] = useState('2024');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('trace.accessToken');
    if (!token) return;
    request<User>('/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(setUser).catch(() => localStorage.removeItem('trace.accessToken'));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'register') {
        const result = await request<{ user: User; devVerificationCode?: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password, department, batchYear: Number(batchYear) }) });
        setDevCode(result.devVerificationCode ?? ''); setMode('verify');
      } else if (mode === 'verify') {
        const result = await request<{ accessToken: string; user: User }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) });
        localStorage.setItem('trace.accessToken', result.accessToken); setUser(result.user);
      } else {
        const result = await request<{ accessToken: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        localStorage.setItem('trace.accessToken', result.accessToken); setUser(result.user);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue'); }
    finally { setLoading(false); }
  }

  if (user) return <main className="app-shell"><header><span className="wordmark">TRACE</span><button className="quiet" onClick={() => { localStorage.removeItem('trace.accessToken'); setUser(null); }}>Sign out</button></header><section className="welcome"><p className="eyebrow">MUET COMMUNITY</p><h1>Welcome back, {user.fullName.split(' ')[0]}.</h1><p className="lede">Your trusted campus lost-and-found starts here.</p><div className="stats"><div><strong>{user.trustScore}</strong><span>Trust score</span></div><div><strong>{user.department}</strong><span>Department</span></div><div><strong>{user.batchYear}</strong><span>Batch</span></div></div></section><section className="empty-panel"><div className="icon">+</div><h2>Nothing posted yet</h2><p>When you lose or find something on campus, it will appear here.</p><button className="primary">Create a post</button></section></main>;

  return <main className="auth-layout"><section className="brand-panel"><span className="wordmark">TRACE</span><div><p className="eyebrow">MEHRAN UNIVERSITY</p><h1>Small things find their way home.</h1><p>Verified students. Safer handovers. One calm place to look.</p></div><span className="campus-note">University-only · Asia/Karachi</span></section><section className="form-panel"><div className="form-wrap"><div className="mobile-mark"><span className="wordmark">TRACE</span></div><p className="eyebrow">{mode === 'verify' ? 'CHECK YOUR INBOX' : 'WELCOME TO CAMPUSFIND'}</p><h2>{mode === 'verify' ? 'Verify your email' : mode === 'register' ? 'Create your account' : 'Find what matters'}</h2><p className="muted">{mode === 'verify' ? `Enter the six-digit code sent to ${email}.` : 'Use your university account to continue.'}</p>{error && <div className="error" role="alert">{error}</div>}{mode === 'verify' && devCode && <div className="dev-code">Local development code: <strong>{devCode}</strong></div>}<form onSubmit={submit}>{mode === 'register' && <><label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label><label>Department<input value={department} onChange={(e) => setDepartment(e.target.value)} required /></label><label>Batch year<input type="number" value={batchYear} onChange={(e) => setBatchYear(e.target.value)} required /></label></>}{mode !== 'verify' && <label>University email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@students.muet.edu.pk" required /></label>}{mode !== 'verify' && <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></label>}{mode === 'verify' && <label>Verification code<input className="code-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required /></label>}<button className="primary" disabled={loading}>{loading ? 'Working...' : mode === 'verify' ? 'Verify and continue' : mode === 'register' ? 'Create account' : 'Sign in'}</button></form>{mode !== 'verify' && <p className="switch">{mode === 'login' ? 'New to TRACE?' : 'Already registered?'} <button onClick={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>}</div></section></main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);