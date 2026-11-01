import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  itemsApi,
  referenceApi,
  type Category,
  type Item,
  type ItemQuery,
} from './api';
import {
  Avatar,
  EmptyState,
  ErrorState,
  SearchBar,
  SkeletonCard,
  Tabs,
} from './components';
import { itemStatusInfo, timeAgo, categoryEmoji } from './utils';
import { useAuth } from './AuthContext';

function ItemCard({ item, onClick, onBookmark }: { item: Item; onClick: () => void; onBookmark?: () => void }) {
  const { label, badgeClass } = itemStatusInfo(item.status);
  const cover = item.images.find((i) => i.isCover) ?? item.images[0];
  const [bookmarked, setBookmarked] = useState(false);
  async function toggleBookmark(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      if (bookmarked) {
        await itemsApi.unbookmark(item.id);
        setBookmarked(false);
      } else {
        await itemsApi.bookmark(item.id);
        setBookmarked(true);
      }
      onBookmark?.();
    } catch { /* ignore */ }
  }
  return (
    <article
      className="item-card"
      onClick={onClick}
      role="article"
      aria-label={`${item.type === 'LOST' ? 'Lost' : 'Found'} item: ${item.title}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <div className="item-card-img">
        {cover ? (
          <img src={cover.url} alt={item.title} loading="lazy" />
        ) : (
          <div className="item-card-img-placeholder">
            {categoryEmoji(item.category.slug)}
          </div>
        )}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: item.type === 'LOST' ? 'var(--c-lost)' : 'var(--c-found)',
          color: '#fff', fontSize: 11, fontWeight: 800,
          padding: '3px 10px', borderRadius: 'var(--r-full)',
          letterSpacing: '0.06em',
        }}>
          {item.type}
        </div>
        <button
          onClick={toggleBookmark}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this item'}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 32, height: 32,
            background: 'rgba(255,255,255,.9)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
          }}
        >
          {bookmarked ? '★' : '☆'}
        </button>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', margin: 0 }}>{item.title}</h3>
          <span className={`badge ${badgeClass}`}>{label}</span>
        </div>
        <div style={{ color: 'var(--c-text-muted)', fontSize: 13, marginBottom: 8 }}>
          {item.category.name} · {item.color} · {timeAgo(item.createdAt)}
        </div>
        <p style={{ color: 'var(--c-text-muted)', fontSize: 13, marginBottom: 8, lineHeight: 1.4 }}>{item.description}</p>
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--c-text-muted)' }}>
          <span>{item.location.name}</span>
          <span>•</span>
          <span>{item.occurredAt ? timeAgo(item.occurredAt) : '—'}</span>
        </div>
      </div>
    </article>
  );
}

type FeedTab = 'ALL' | 'LOST' | 'FOUND';

export function HomeFeed({ onItemClick, onPost }: { onItemClick: (item: Item) => void; onPost: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FeedTab>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    referenceApi.categories().then(setCategories);
  }, []);

  const loadItems = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const q: ItemQuery = {};
      if (query) q.search = query;
      if (typeFilter !== 'ALL') q.type = typeFilter;
      if (categoryFilter !== 'ALL') q.categoryId = categoryFilter;
      q.limit = 20;
      if (!reset && cursor) q.cursor = cursor;
      const res = await itemsApi.list(q);
      setItems((prev) => (reset ? res.data : [...prev, ...res.data]));
      setCursor(res.meta.nextCursor ?? null);
      setHasMore(!!res.meta.nextCursor);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter, categoryFilter, loading, cursor]);

  useEffect(() => {
    loadItems(true);
  }, [query, typeFilter, categoryFilter, loadItems]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title">Home Feed</h1>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Home Feed</h1>
          <p className="page-subtitle">Browse lost and found items on campus</p>
        </div>
        <button className="btn btn-primary" onClick={onPost}>
          + Post Item
        </button>
      </div>
      <SearchBar value={query} onChange={setQuery} onSubmit={() => loadItems(true)} />
      <div style={{ marginBottom: 20 }}>
        <Tabs
          tabs={[
            { id: 'ALL', label: 'All', badge: items.length },
            { id: 'LOST', label: 'Lost', badge: items.filter((i) => i.type === 'LOST').length },
            { id: 'FOUND', label: 'Found', badge: items.filter((i) => i.type === 'FOUND').length },
          ]}
          active={typeFilter}
          onChange={(id: string) => { setTypeFilter(id as FeedTab); loadItems(true); }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            onBookmark={() => loadItems(true)}
          />
        ))}
      </div>
      {hasMore && !loading && (
        <button className="btn btn-secondary" onClick={() => loadItems(false)} style={{ marginTop: 16, display: 'block', margin: '16px auto 0' }}>
          Load more
        </button>
      )}
    </div>
  );
}

export function ItemDetail({ item, onBack, onClaim, onResolve }: { item: Item; onBack: () => void; onClaim: () => void; onResolve: () => void }) {
  const isOwner = item.postedBy.id === 'current-user';
  const isLost = item.type === 'LOST';
  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Back to feed
      </button>
      <div style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', aspectRatio: '4/3', marginBottom: 16 }}>
        {item.images.length > 0 ? (
          <img src={item.images[0].url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {categoryEmoji(item.category.slug)}
          </div>
        )}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          padding: '4px 10px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 800,
        }}>
          {item.type}
        </div>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{item.title}</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <span className={`badge ${itemStatusInfo(item.status).badgeClass}`}>{itemStatusInfo(item.status).label}</span>
        <span style={{ color: 'var(--c-text-muted)', fontSize: 13 }}>{item.category.name}</span>
        <span style={{ color: 'var(--c-text-muted)', fontSize: 13 }}>{item.color}</span>
      </div>
      <p style={{ color: 'var(--c-text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>{item.description}</p>
      <div style={{ display: 'flex', gap: 8, color: 'var(--c-text-muted)', fontSize: 13, marginBottom: 20 }}>
        <span>📍 {item.location.name}</span>
        <span>•</span>
        <span>👤 {item.postedBy.fullName}</span>
        <span>•</span>
        <span>⏰ {timeAgo(item.createdAt)}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {isOwner ? (
          <>
            <button className="btn btn-secondary" onClick={onResolve}>
              Mark Resolved
            </button>
            {isLost && (
              <button className="btn btn-secondary">Renew</button>
            )}
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={onClaim}>
              {isLost ? 'I Found This' : 'This Is Mine'}
            </button>
          </>
        )}
      </div>
      <div style={{ background: 'var(--c-surface)', padding: 16, borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)' }}>
        <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Similar Items</h3>
        <EmptyState icon='🔍' title='No similar items' message='Check back later for similar items.' />
      </div>
    </div>
  );
}
