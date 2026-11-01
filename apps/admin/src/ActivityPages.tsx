import React, { useEffect, useState } from 'react';
import {
  claimsApi,
  notificationsApi,
  type AppNotification,
  type Claim,
} from './api';
import { Avatar, EmptyState, ErrorState, SkeletonList } from './components';
import { claimStatusInfo, notifInfo, timeAgo } from './utils';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface ActivityPageProps {
  onClaimClick: (claim: Claim) => void;
}

export function ActivityPage({ onClaimClick }: ActivityPageProps) {
  const [activeTab, setActiveTab] = useState<'claims' | 'notifications'>('claims');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [errorClaims, setErrorClaims] = useState('');
  const [errorNotifs, setErrorNotifs] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    setLoadingClaims(true);
    claimsApi
      .mine()
      .then(setClaims)
      .catch((e) => setErrorClaims(e.message))
      .finally(() => setLoadingClaims(false));
  }, []);

  useEffect(() => {
    setLoadingNotifs(true);
    notificationsApi
      .list()
      .then(setNotifs)
      .catch((e) => setErrorNotifs(e.message))
      .finally(() => setLoadingNotifs(false));
  }, []);

  async function markAllRead() {
    await notificationsApi.markAllRead();
    setNotifs((ns) =>
      ns.map((n) => ({ ...n, readAt: new Date().toISOString() })),
    );
    showToast('All notifications marked as read', 'success');
  }

  async function markRead(id: string) {
    await notificationsApi.markRead(id);
    setNotifs((ns) =>
      ns.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }

  async function deleteNotif(id: string) {
    await notificationsApi.delete(id);
    setNotifs((ns) => ns.filter((n) => n.id !== id));
  }

  const unreadCount = notifs.filter((n) => !n.readAt).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Activity</h1>
        <p className="page-subtitle">Track your claims and notifications</p>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--c-surface-2)', padding: 4, borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)' }}>
        <button
          className={`tab-btn${activeTab === 'claims' ? ' active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          Claims
        </button>
        <button
          className={`tab-btn${activeTab === 'notifications' ? ' active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications ({unreadCount > 0 ? unreadCount : ''})
        </button>
      </div>
      {activeTab === 'claims' ? (
        loadingClaims ? (
          <SkeletonList count={5} />
        ) : errorClaims ? (
          <ErrorState message={errorClaims} />
        ) : claims.length === 0 ? (
          <EmptyState icon='📭' title='No claims yet' message="Start claiming lost items you've found or post your own." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {claims.map((claim) => {
              const info = claimStatusInfo(claim.status);
              return (
                <div
                  key={claim.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--c-surface)',
                    cursor: 'pointer',
                  }}
                  onClick={() => onClaimClick(claim)}
                >
                  <Avatar name={claim.claimant?.fullName ?? 'Unknown'} url={claim.claimant?.avatarUrl ?? null} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>
                      {claim.item.title}
                    </div>
                    <div style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>
                      {timeAgo(claim.createdAt)}
                    </div>
                  </div>
                  <span className={`badge ${info.badgeClass}`}>{info.label}</span>
                </div>
              );
            })}
          </div>
        )
      ) : (
        loadingNotifs ? (
          <SkeletonList count={5} />
        ) : errorNotifs ? (
          <ErrorState message={errorNotifs} />
        ) : notifs.length === 0 ? (
          <EmptyState icon='🔔' title='No notifications' message='You are all caught up.' />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifs.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '12px 16px',
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-lg)',
                  background: n.readAt ? 'var(--c-bg)' : 'var(--c-surface-2)',
                }}
              >
                <div style={{ fontSize: 20 }}>{notifInfo(n.type).icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>{n.title}</div>
                  <div style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>{n.body}</div>
                  <div style={{ color: 'var(--c-text-muted)', fontSize: 12, marginTop: 4 }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                {!n.readAt && (
                  <button
                    className='btn btn-secondary'
                    onClick={() => markRead(n.id)}
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
            <button className='btn btn-secondary' onClick={markAllRead} style={{ marginTop: 8 }}>
              Mark all as read
            </button>
          </div>
        )
      )}
    </div>
  );
}
