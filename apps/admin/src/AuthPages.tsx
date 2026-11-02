import React, { useEffect, useState } from 'react';
import { authApi, tokenStore, type AuthSession } from './api';
import { OtpInput } from './components';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from './ToastContext';

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
  onGoRegister: () => void;
  onGoForgot: () => void;
  onBack?: () => void;
}

export function LoginPage({ onLogin, onGoRegister, onGoForgot, onBack }: LoginPageProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await authApi.login({ email: email.trim().toLowerCase(), password });
      tokenStore.setAccess(session.accessToken);
      tokenStore.setRefresh(session.refreshToken);
      onLogin(session);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div className="brand-logo" style={{ width: 48, height: 48, fontSize: 24 }}>T</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>TRACE</div>
              <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: '0.08em' }}>MUET • Campus Lost & Found</div>
            </div>
          </div>
          <h1>Find what's<br />lost. Return<br />it safely.</h1>
          <p>Verified campus lost-and-found platform for Mehran University students.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">📧</div>
              <span>University email verification only</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✅</div>
              <span>Ownership verified before handover</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🛡️</div>
              <span>Safe campus handover points</span>
            </div>
          </div>
        </div>
        <div className="auth-brand-footer">
          <ThemeToggle />
          <div style={{ marginTop: 12, opacity: 0.6, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            © 2026 TRACE — Mehran University of Engineering & Technology
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-wrap">
          {onBack && <button className="btn btn-ghost" onClick={onBack} style={{ alignSelf: 'flex-start', padding: 0 }}>← Back to TRACE home</button>}
          <div>
            <p className="text-micro" style={{ color: 'var(--c-primary)', marginBottom: 8 }}>WELCOME BACK</p>
            <h2>Sign in to TRACE</h2>
            <p className="subtitle" style={{ marginTop: 8 }}>Use your MUET university email address</p>
          </div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">University Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="23cs066@students.muet.edu.pk"
                required
                autoComplete="username"
                disabled={loading}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-group icon-right">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-icon input-icon-right"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                >
                  {showPwd ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            {error && (
              <div id="login-error" className="form-error" role="alert">
                ⚠️ {error}
              </div>
            )}
            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full${loading ? ' btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? '' : 'Sign In'}
            </button>
          </form>
          <button
            className="btn btn-ghost w-full"
            onClick={onGoForgot}
            style={{ fontSize: 14, color: 'var(--c-primary)' }}
          >
            Forgot your password?
          </button>
          <div className="auth-divider">or</div>
          <button className="btn btn-secondary w-full" onClick={onGoRegister}>
            Create a new account
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-text-muted)' }}>
            By signing in you agree to our{' '}
            <a href="#" style={{ color: 'var(--c-primary)' }}>Terms of Service</a> and{' '}
            <a href="#" style={{ color: 'var(--c-primary)' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

interface RegisterPageProps {
  onSuccess: (email: string, devCode?: string) => void;
  onGoLogin: () => void;
  onBack?: () => void;
}

export function RegisterPage({ onSuccess, onGoLogin, onBack }: RegisterPageProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', department: '', batchYear: new Date().getFullYear(), studentId: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: k === 'batchYear' ? Number(e.target.value) : e.target.value }));

  function checkEmail(email: string) {
    if (!email.includes('@')) return;
    const domain = email.split('@')[1] ?? '';
    if (!domain.endsWith('muet.edu.pk')) {
      setEmailWarning('⚠️ Please use your MUET university email');
    } else {
      setEmailWarning('');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError('You must agree to the Terms of Service');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register({
        fullName: form.fullName,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        department: form.department,
        batchYear: form.batchYear,
        ...(form.studentId ? { studentId: form.studentId } : {}),
      });
      showToast('Account created! Verification code shown on next screen.', 'success');
      onSuccess(form.email.trim().toLowerCase(), res.devVerificationCode);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const pwdStrength = form.password.length >= 12 ? 'Strong' : form.password.length >= 8 ? 'Good' : form.password.length > 0 ? 'Weak' : '';
  const pwdColor = pwdStrength === 'Strong' ? 'var(--c-success)' : pwdStrength === 'Good' ? 'var(--c-warning)' : 'var(--c-danger)';

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div className="brand-logo" style={{ width: 48, height: 48, fontSize: 24 }}>T</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>TRACE</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>MUET • Campus Lost & Found</div>
            </div>
          </div>
          <h1>Join your<br />campus<br />community.</h1>
          <p>Register with your MUET email to post lost & found items and help others.</p>
        </div>
        <div className="auth-brand-footer">
          <ThemeToggle />
          <div style={{ marginTop: 12, opacity: 0.6, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            © 2026 TRACE — Mehran University of Engineering & Technology
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-wrap">
          {onBack && <button className="btn btn-ghost" onClick={onBack} style={{ alignSelf: 'flex-start', padding: 0 }}>← Back to TRACE home</button>}
          <div>
            <p className="text-micro" style={{ color: 'var(--c-primary)', marginBottom: 8 }}>NEW ACCOUNT</p>
            <h2>Create your TRACE account</h2>
          </div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input id="fullName" type="text" className="form-input" value={form.fullName} onChange={set('fullName')} placeholder="Ali Hassan" required minLength={2} maxLength={120} disabled={loading} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">University Email</label>
              <input
                id="reg-email"
                type="email"
                className={`form-input${emailWarning ? ' error' : ''}`}
                value={form.email}
                onChange={e => { set('email')(e); checkEmail(e.target.value); }}
                placeholder="23cs066@students.muet.edu.pk"
                required
                disabled={loading}
                aria-describedby={emailWarning ? 'email-warn' : undefined}
              />
              {emailWarning && <span id="email-warn" className="form-error">{emailWarning}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className="input-group icon-right">
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-icon input-icon-right"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label="Toggle password visibility"
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                >
                  {showPwd ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {pwdStrength && <span className="form-helper" style={{ color: pwdColor }}>Strength: {pwdStrength}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="department">Department</label>
                <input id="department" type="text" className="form-input" value={form.department} onChange={set('department')} placeholder="Computer Systems" required minLength={2} disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="batchYear">Batch Year</label>
                <input id="batchYear" type="number" className="form-input" value={form.batchYear} onChange={set('batchYear')} min={2000} max={2100} required disabled={loading} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="studentId">
                Student ID <span className="form-label-opt">(optional — for ID card alerts)</span>
              </label>
              <input id="studentId" type="text" className="form-input" value={form.studentId} onChange={set('studentId')} placeholder="23CS066" maxLength={80} disabled={loading} />
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--c-text-muted)' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2 }} aria-label="Agree to terms" />
              <span>I agree to the <a href="#" style={{ color: 'var(--c-primary)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--c-primary)' }}>Privacy Policy</a></span>
            </label>
            {error && <div className="form-error" role="alert">⚠️ {error}</div>}
            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full${loading ? ' btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? '' : 'Create Account'}
            </button>
          </form>
          <button className="btn btn-ghost w-full" onClick={onGoLogin} style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>
            Already have an account? <span style={{ color: 'var(--c-primary)', fontWeight: 700 }}>Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface VerifyOtpPageProps {
  email: string;
  devCode?: string;
  onVerified: (session: AuthSession) => void;
  onGoLogin: () => void;
}

export function VerifyOtpPage({ email, devCode: initialDevCode, onVerified, onGoLogin }: VerifyOtpPageProps) {
  const { showToast } = useToast();
  const [code, setCode] = useState('000000');
  const [devCode, setDevCode] = useState('000000');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    void verify(devCode);
  }, [devCode]);

  useEffect(() => {
    if (code.length === 6 && !loading) void verify(code);
  }, [code]);

  async function verify(c: string) {
    setLoading(true);
    setError('');
    try {
      const session = await authApi.verifyEmail({ email, code: c });
      tokenStore.setAccess(session.accessToken);
      tokenStore.setRefresh(session.refreshToken);
      showToast('Email verified! Welcome to TRACE 🎉', 'success');
      onVerified(session);
    } catch (err: unknown) {
      setError((err as Error).message);
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const res = await authApi.resendOtp(email);
      showToast('New code sent! Dev code is always 000000.', 'success');
      setCooldown(60);
      const iv = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; }), 1000);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="brand-logo" style={{ width: 56, height: 56, fontSize: 28, marginBottom: 24 }}>T</div>
          <h1>Development Code: 000000</h1>
          <p>Local dev mode — your verification code is <strong>000000</strong>. Enter it below or click "Use code 000000".</p>
        </div>
        <div className="auth-brand-footer">
          <ThemeToggle />
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-wrap" style={{ textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <h2>Verify your email</h2>
            <p style={{ marginTop: 8 }}>Enter the 6-digit code sent to<br /><strong style={{ color: 'var(--c-text)' }}>{email}</strong></p>
          </div>
          <div style={{
            background: 'var(--c-primary-soft)',
            border: '2px solid var(--c-primary)',
            borderRadius: 'var(--r-lg)',
            padding: '20px',
            marginBottom: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-primary)', marginBottom: 8 }}>Development verification code</div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '8px', color: 'var(--c-primary)', fontFamily: 'monospace', background: '#fff', padding: '12px 24px', borderRadius: 'var(--r-md)', display: 'inline-block' }}>000000</div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--c-text-muted)' }}>This code works for every account in dev mode</div>
          </div>
          <OtpInput value={code} onChange={setCode} disabled={loading} />
          <button
            onClick={() => { setCode('000000'); void verify('000000'); }}
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            {loading ? 'Verifying…' : 'Use code 000000'}
          </button>
          {error && <div className="form-error" style={{ justifyContent: 'center' }} role="alert">⚠️ {error}</div>}
          {loading && <div style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>Verifying…</div>}
          <button
            className="btn btn-ghost w-full"
            onClick={resend}
            disabled={resending || cooldown > 0}
            style={{ fontSize: 14 }}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : "Didn't get it? Resend code"}
          </button>
          <button className="btn btn-ghost w-full" onClick={onGoLogin} style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

interface ForgotPageProps {
  onGoLogin: () => void;
}

export function ForgotPasswordPage({ onGoLogin }: ForgotPageProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.forgotPassword(email.trim().toLowerCase());
      if (res.devResetCode) setDevCode(res.devResetCode);
      showToast('Reset code sent to your email', 'success');
      setStep('code');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ email: email.trim().toLowerCase(), code, password });
      showToast('Password reset successfully! Please sign in.', 'success');
      onGoLogin();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="brand-logo" style={{ width: 56, height: 56, fontSize: 28, marginBottom: 24 }}>T</div>
          <h1>Reset your<br />password.</h1>
          <p>Enter your MUET email and we'll send you a reset code.</p>
        </div>
        <div className="auth-brand-footer">
          <ThemeToggle />
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 48 }}>🔑</div>
            <h2>Forgot password?</h2>
          </div>
          {step === 'email' ? (
            <form onSubmit={sendCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">University Email</label>
                <input id="forgot-email" type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@muet.edu.pk" required disabled={loading} />
              </div>
              {error && <div className="form-error" role="alert">⚠️ {error}</div>}
              <button
                type="submit"
                className={`btn btn-primary btn-lg w-full${loading ? ' btn-loading' : ''}`}
                disabled={loading}
              >
                {loading ? '' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {devCode && (
                <div style={{ background: 'var(--c-found-soft)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 13, color: 'var(--c-found-text)', textAlign: 'center' }}>
                  Dev mode reset code: <strong>{devCode}</strong>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <OtpInput value={code} onChange={setCode} />
                <p style={{ marginTop: 8, fontSize: 13 }}>Enter the code sent to <strong>{email}</strong></p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-pwd">New Password</label>
                <input id="new-pwd" type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} disabled={loading} />
              </div>
              {error && <div className="form-error" role="alert">⚠️ {error}</div>}
              <button
                type="submit"
                className={`btn btn-primary btn-lg w-full${loading ? ' btn-loading' : ''}`}
                disabled={loading || code.length < 6}
              >
                {loading ? '' : 'Reset Password'}
              </button>
            </form>
          )}
          <button className="btn btn-ghost w-full" onClick={onGoLogin} style={{ fontSize: 14 }}>
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
