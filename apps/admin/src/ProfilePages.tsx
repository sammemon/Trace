import React, { useEffect, useState } from 'react';
import { authApi, itemsApi, type Item } from './api';
import {
  Avatar,
  EmptyState,
  ErrorState,
  SkeletonList,
  TrustBadge,
} from './components';
import { itemStatusInfo, timeAgo } from './utils';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface ProfilePageProps {
  onItemClick: (item: Item) => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function ProfilePage({ onItemClick, onSettings, onLogout }: ProfilePageProps) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts');
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [bookmarks, setBookmarks] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [errorItems, setErrorItems] = useState('');

  useEffect(() => {
    itemsApi.mine()
      .then(setMyItems)
      .catch((e) => setErrorItems(e.message))
      .finally(() => setLoadingItems(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'bookmarks' && bookmarks.length === 0) {
      setLoadingBookmarks(true);
      itemsApi.bookmarks().then(setBookmarks).finally(() => setLoadingBookmarks(false));
    }
  }, [activeTab]);

  async function handleLogout() {
    if (!confirm('Sign out of TRACE?')) return;
    await logout();
    onLogout();
  }

  if (!user) return null;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div className="card card-padded" style={{ marginBottom: 24, display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Avatar name={user.fullName} url={user.avatarUrl} size={72} trustScore={user.trustScore} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{user.fullName}</h1>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 8 }}>
            {user.department} · Batch {user.batchYear}
          </div>
          <TrustBadge score={user.trustScore} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={onSettings} style={{ padding: '10px 16px' }}>
            Settings
          </button>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '10px 16px' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>My Posts</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            className={`tab-btn${activeTab === 'posts' ? ' active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`tab-btn${activeTab === 'bookmarks' ? ' active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            Saved
          </button>
        </div>
        {activeTab === 'posts' ? (
          loadingItems ? (
            <SkeletonList count={5} />
          ) : errorItems ? (
            <ErrorState message={errorItems} />
          ) : myItems.length === 0 ? (
            <EmptyState icon='📝' title='No posts yet' message='Post your first lost or found item.' />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: '12px', border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-lg)', background: 'var(--c-surface)',
                  }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 'var(--r-md)', background: 'var(--c-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {categoryEmoji(item.category.slug)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>{item.title}</div>
                    <div style={{ color: 'var(--c-text-muted)', fontSize: 13 }}>
                      {itemStatusInfo(item.status).label} · {timeAgo(item.createdAt)}
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => onItemClick(item)} style={{ fontSize: 13 }}>
                    View
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          loadingBookmarks ? (
            <SkeletonList count={5} />
          ) : bookmarks.length === 0 ? (
            <EmptyState icon='🔖' title='No saved items' message='Bookmark items to save them here.' />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookmarks.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: '12px', border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-lg)', background: 'var(--c-surface)',
                  }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 'var(--r-md)', background: 'var(--c-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {categoryEmoji(item.category.slug)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>{item.title}</div>
                    <div style={{ color: 'var(--c-text-muted)', fontSize: 13 }}>
                      {itemStatusInfo(item.status).label} · {timeAgo(item.createdAt)}
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => onItemClick(item)} style={{ fontSize: 13 }}>
                    View
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function categoryEmoji(slug: string): string {
  const icons: Record<string, string> = {
    'id-card': '🪪', wallet: '👛', keys: '🔑', phone: '📱',
    'laptop-tablet': '💻', 'books-notes': '📚', bag: '👜', earphones: '🎧',
    'water-bottle': '💧', documents: '📄', clothing: '👕', jewelry: '⌚',
    glasses: '👓', stationery: '✏️', other: '📦',
  };
  return icons[slug] ?? icons.other;
}
