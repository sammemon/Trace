import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { OfflineBanner } from './components';
import { timeAgo } from './utils';
import {
  LoginPage,
  RegisterPage,
  VerifyOtpPage,
  ForgotPasswordPage,
} from './AuthPages';
import { HomeFeed, ItemDetail } from './FeedPages';
import { PostWizard } from './PostWizard';
import { ClaimWizard } from './ClaimWizard';
import { ActivityPage } from './ActivityPages';
import { ChatPage } from './ChatPage';
import { ProfilePage } from './ProfilePages';
import {
  AdminDashboard,
  AdminReports,
  AdminUsers,
  AdminItems,
  HandoverDesk,
  AuditLogs,
} from './AdminPages';
import {
  tokenStore,
  authApi,
  type AuthSession,
  type Item,
  type Claim,
} from './api';
import { LandingPage } from './LandingPage';
import { ThemeToggle, getStoredTheme, applyTraceTheme } from './ThemeToggle';

// ── Auth gate ──────────────────────────────────────────────────────────────
type AuthView = 'login' | 'register' | 'verify-otp' | 'forgot';

function AuthGate({ onAuthenticated, initialView = 'login', onBack }: { onAuthenticated: (session: AuthSession) => void; initialView?: AuthView; onBack?: () => void }) {
  const [view, setView] = useState<AuthView>(initialView);
  const [pendingEmail, setPendingEmail] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();

  return (
    <>
      {view === 'login' && (
        <LoginPage
          onLogin={onAuthenticated}
          onGoRegister={() => setView('register')}
          onGoForgot={() => setView('forgot')}
          onBack={onBack}
        />
      )}
      {view === 'register' && (
        <RegisterPage
          onSuccess={(email: string, code?: string) => { setPendingEmail(email); setDevCode(code); setView('verify-otp'); }}
          onGoLogin={() => setView('login')}
          onBack={onBack}
        />
      )}
      {view === 'verify-otp' && (
        <VerifyOtpPage
          email={pendingEmail}
          devCode={devCode}
          onVerified={onAuthenticated}
          onGoLogin={() => setView('login')}
        />
      )}
      {view === 'forgot' && (
        <ForgotPasswordPage onGoLogin={() => setView('login')} />
      )}
    </>
  );
}

// ── Main app (after login) ─────────────────────────────────────────────────
type Page =
  | 'home' | 'item-detail' | 'post'
  | 'activity' | 'claim-detail'
  | 'chat'
  | 'profile' | 'settings'
  | 'admin-dashboard' | 'admin-reports' | 'admin-users' | 'admin-items' | 'admin-handover' | 'admin-audit';

function MainApp() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showPost, setShowPost] = useState(false);
  const [claimItem, setClaimItem] = useState<Item | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  // Apply stored theme on mount
  useEffect(() => {
    const theme = getStoredTheme();
    applyTraceTheme(theme);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 56, height: 56,
          background: 'linear-gradient(135deg, var(--c-primary) 0%, #B7791F 100%)',
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 28, fontWeight: 800,
          boxShadow: '0 8px 24px rgba(79,70,229,.4)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>T</div>
        <div style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>Loading TRACE...</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(.97)} }`}</style>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  // Nav items
  const mainNavItems = [
    { id: 'home', icon: undefined, label: 'Home', page: 'home' as Page },
    { id: 'activity', icon: undefined, label: 'Activity', page: 'activity' as Page },
    { id: 'chat', icon: undefined, label: 'Chat', page: 'chat' as Page },
    { id: 'profile', icon: undefined, label: 'Profile', page: 'profile' as Page },
  ];
  const adminNavItems = [
    { id: 'admin-dashboard', icon: undefined, label: 'Dashboard', page: 'admin-dashboard' as Page },
    { id: 'admin-reports', icon: undefined, label: 'Reports', page: 'admin-reports' as Page },
    { id: 'admin-items', icon: undefined, label: 'Items', page: 'admin-items' as Page },
    { id: 'admin-users', icon: undefined, label: 'Users', page: 'admin-users' as Page },
    { id: 'admin-handover', icon: undefined, label: 'Handover Desk', page: 'admin-handover' as Page },
    { id: 'admin-audit', icon: undefined, label: 'Audit Log', page: 'admin-audit' as Page },
  ];

  function navigate(p: Page) {
    setPage(p);
    setSelectedItem(null);
    setSelectedClaim(null);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }

  function renderPage() {
    switch (page) {
      case 'home':
        return (
          <HomeFeed
            key={feedKey}
            onItemClick={(item: Item) => { setSelectedItem(item); setPage('item-detail'); }}
            onPost={() => setShowPost(true)}
          />
        );
      case 'item-detail':
        return selectedItem ? (
          <ItemDetail
            item={selectedItem}
            onBack={() => setPage('home')}
            onClaim={() => setClaimItem(selectedItem)}
            onResolve={() => { setPage('home'); setFeedKey(k => k + 1); }}
          />
        ) : null;
      case 'activity':
        return (
          <ActivityPage
            onClaimClick={(claim: Claim) => { setSelectedClaim(claim); setPage('claim-detail'); }}
          />
        );
      case 'claim-detail':
        return selectedClaim ? (
          <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
            <button className="btn btn-ghost" onClick={() => setPage('activity')} style={{ marginBottom: 20 }}>
              ← Back to Activity
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Claim Details</h1>
            <div style={{ padding: 20, borderRadius: 'var(--r-lg)', background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--c-text)' }}>Status:</span>
                <span className={`badge badge-${selectedClaim.status.toLowerCase()}`}>{selectedClaim.status}</span>
              </div>
              <div style={{ color: 'var(--c-text-muted)', fontSize: 14, lineHeight: 1.6 }}>{selectedClaim.message}</div>
              <div style={{ marginTop: 16, color: 'var(--c-text-muted)', fontSize: 13 }}>
                Claimed on {timeAgo(selectedClaim.createdAt)}
              </div>
            </div>
          </div>
        ) : null;
      case 'chat':
        return <ChatPage />;
      case 'profile':
        return (
          <ProfilePage
            onItemClick={(item: Item) => { setSelectedItem(item); setPage('item-detail'); }}
            onSettings={() => setPage('settings')}
            onLogout={() => navigate('home')}
          />
        );
      case 'settings':
        return (
          <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
            <button className="btn btn-ghost" onClick={() => setPage('profile')} style={{ marginBottom: 20 }}>
              ← Back to Profile
            </button>
            <h1 className="page-title">Settings</h1>
            <div style={{ background: 'var(--c-surface)', padding: 20, borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Account Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-secondary" style={{ textAlign: 'left' }}>
                  Notifications
                </button>
                <button className="btn btn-secondary" style={{ textAlign: 'left' }}>
                  Privacy & Safety
                </button>
                <button className="btn btn-secondary" style={{ textAlign: 'left' }}>
                  Appearance
                </button>
                <button className="btn btn-secondary" style={{ textAlign: 'left' }}>
                  Language
                </button>
                <button className="btn btn-secondary" style={{ textAlign: 'left' }}>
                  Blocked Users
                </button>
                <button className="btn btn-danger" style={{ textAlign: 'left' }}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );
      // Admin pages
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-reports':
        return <AdminReports />;
      case 'admin-users':
        return <AdminUsers />;
      case 'admin-items':
        return <AdminItems />;
      case 'admin-handover':
        return <HandoverDesk />;
      case 'admin-audit':
        return <AuditLogs />;
      default:
        return null;
    }
  }

  const activePage = ['home', 'item-detail'].includes(page) ? 'home'
    : ['activity', 'claim-detail'].includes(page) ? 'activity'
      : page;

  return (
    <div className="app-layout">
      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <nav className={`sidebar${sidebarOpen ? ' open' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">T</div>
          <div>
            <div className="brand-name">TRACE</div>
            <div className="brand-sub">MUET Lost & Found</div>
          </div>
        </div>
        {/* Nav */}
        <div className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {mainNavItems.map(nav => (
            <button
              key={nav.id}
              className={`nav-item${activePage === nav.page ? ' active' : ''}`}
              onClick={() => navigate(nav.page)}
              aria-current={activePage === nav.page ? 'page' : undefined}
            >
              <span className="nav-icon">{nav.icon}</span>
              {nav.label}
            </button>
          ))}
          {isAdmin && (
            <>
              <div className="nav-section-label" style={{ marginTop: 16 }}>Moderation</div>
              {adminNavItems.map(nav => (
                <button
                  key={nav.id}
                  className={`nav-item${page === nav.page ? ' active' : ''}`}
                  onClick={() => navigate(nav.page)}
                  aria-current={page === nav.page ? 'page' : undefined}
                >
                  <span className="nav-icon">{nav.icon}</span>
                  {nav.label}
                  {nav.id === 'admin-reports' && <span className="nav-badge">!</span>}
                </button>
              ))}
            </>
          )}
        </div>
        {/* User footer */}
        {user && (
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--c-primary), #B7791F)' }}>
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} /> : user.fullName[0]?.toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user.fullName}</div>
                <div className="user-role">{user.role.toLowerCase()}</div>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => navigate('settings')}
                aria-label="Settings"
              >⚙️</button>
            </div>
          </div>
        )}
      </nav>
      {/* Main content */}
      <div className="main-content">
        <OfflineBanner />
        {/* Page header */}
        <header className="page-header">
          <button
            className="btn btn-ghost btn-icon mobile-only"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <ThemeToggle />
          </div>
          {/* Post button (desktop) */}
          <button
            className="btn btn-primary"
            onClick={() => setShowPost(true)}
            style={{ background: 'linear-gradient(135deg, var(--c-primary), #B7791F)' }}
            aria-label="Post a new item"
          >
            + Post Item
          </button>
        </header>
        {/* Page content */}
        <main className="page-content" id="main-content">
          {renderPage()}
        </main>
      </div>
      {/* Mobile bottom nav */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <div className="bottom-nav-inner">
          {mainNavItems.slice(0, 2).map(nav => (
            <button
              key={nav.id}
              className={`bottom-nav-item${activePage === nav.page ? ' active' : ''}`}
              onClick={() => navigate(nav.page)}
              aria-label={nav.label}
              aria-current={activePage === nav.page ? 'page' : undefined}
            >
              <span className="nav-icon">{nav.icon}</span>
              <span>{nav.label}</span>
            </button>
          ))}
          {/* FAB */}
          <button
            className="bottom-nav-fab"
            onClick={() => setShowPost(true)}
            aria-label="Post a new item"
          >+</button>
          {mainNavItems.slice(2).map(nav => (
            <button
              key={nav.id}
              className={`bottom-nav-item${activePage === nav.page ? ' active' : ''}`}
              onClick={() => navigate(nav.page)}
              aria-label={nav.label}
              aria-current={activePage === nav.page ? 'page' : undefined}
            >
              <span className="nav-icon">{nav.icon}</span>
              <span>{nav.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {/* Post wizard (full-screen) */}
      {showPost && (
        <PostWizard
          onClose={() => setShowPost(false)}
          onPublished={() => { setShowPost(false); navigate('home'); setFeedKey(k => k + 1); }}
        />
      )}
      {claimItem && (
        <ClaimWizard
          item={claimItem}
          onClose={() => setClaimItem(null)}
          onSubmitted={() => { setClaimItem(null); navigate('activity'); }}
        />
      )}
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────
export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const at = tokenStore.getAccess();
    return at ? { accessToken: at, refreshToken: tokenStore.getRefresh() ?? '', user: {} as AuthSession['user'] } : null;
  });
  function handleLogin(s: AuthSession) {
    tokenStore.setAccess(s.accessToken);
    tokenStore.setRefresh(s.refreshToken);
    setSession(s);
  }
  return (
    <ToastProvider>
      <AuthProvider>
        <AppInner onLogin={handleLogin} />
      </AuthProvider>
    </ToastProvider>
  );
}

function AppInner({ onLogin }: { onLogin: (s: AuthSession) => void }) {
  const { user, loading } = useAuth();
  const [publicView, setPublicView] = useState<'landing' | AuthView>('landing');
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--c-primary) 0%, #B7791F 100%)',
            borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 28, fontWeight: 800,
          }}>T</div>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>Loading TRACE...</div>
        </div>
      </div>
    );
  }
  if (!user) {
    if (publicView === 'landing') {
      return <LandingPage onLogin={() => setPublicView('login')} onRegister={() => setPublicView('register')} />;
    }
    return <AuthGate initialView={publicView} onAuthenticated={s => { onLogin(s); }} onBack={() => setPublicView('landing')} />;
  }
  return <MainApp />;
}
