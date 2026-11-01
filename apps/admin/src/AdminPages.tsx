import React, { useEffect, useState } from 'react';
import { adminApi } from './api';
import { Avatar, EmptyState, ErrorState, SkeletonList } from './components';
import { itemStatusInfo, timeAgo } from './utils';
import { useToast } from './ToastContext';

export function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.dashboard()
      .then((data) => setStats(data as Record<string, number>))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <SkeletonList count={6} />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const kpis = [
    { label: 'Active Lost Items', value: stats?.activeLost ?? 0, color: 'var(--c-lost-soft)', iconColor: 'var(--c-lost)' },
    { label: 'Active Found Items', value: stats?.activeFound ?? 0, color: 'var(--c-found-soft)', iconColor: 'var(--c-found)' },
    { label: 'Items Returned', value: stats?.returned ?? 0, color: '#ECFDF5', iconColor: 'var(--c-success)' },
    { label: 'Return Rate', value: `${stats?.returnRate ?? 0}%`, color: 'var(--c-primary-soft)', iconColor: 'var(--c-primary)' },
    { label: 'Open Reports', value: stats?.openReports ?? 0, color: '#FFFBEB', iconColor: 'var(--c-warning)' },
    { label: 'New Users (7d)', value: stats?.newUsersWeek ?? 0, color: '#F0F9FF', iconColor: 'var(--c-info)' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title">Admin Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className="stat-card" style={{
            padding: '20px', borderRadius: 'var(--r-lg)', background: kpi.color,
            border: '1px solid var(--c-border)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: kpi.iconColor }}>{kpi.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--c-surface)', padding: 20, borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => showToast('Reports queue opened', 'success')}>
            View Reports
          </button>
          <button className="btn btn-secondary">Manage Items</button>
          <button className="btn btn-secondary">Manage Users</button>
          <button className="btn btn-secondary">Audit Log</button>
          <button className="btn btn-secondary">Announcements</button>
        </div>
      </div>
    </div>
  );
}

export function AdminReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.reports()
      .then((data) => setReports(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title">Reports Queue</h1>
        <SkeletonList count={5} />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title">Reports Queue</h1>
      {reports.length === 0 ? (
        <EmptyState icon='📋' title='No reports' message='All caught up on moderation.' />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--c-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Target</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Reason</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13, fontFamily: 'monospace' }}>{r.id.slice(0, 8)}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{r.targetType}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{r.reason}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    <span className={`badge ${itemStatusInfo(r.status).badgeClass}`}>{r.status}</span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    <button className="btn btn-secondary" onClick={() => showToast(`Resolved report ${r.id.slice(0, 8)}`, 'success')}>
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.users()
      .then((data) => setUsers(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title">Users</h1>
        <SkeletonList count={5} />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title">Users</h1>
      {users.length === 0 ? (
        <EmptyState icon='👥' title='No users' message='No users found.' />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--c-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Trust</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{u.fullName}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{u.role}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{u.status}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{u.trustScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.items()
      .then((data: any) => setItems(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title">Items</h1>
        <SkeletonList count={5} />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title">Items Management</h1>
      {items.length === 0 ? (
        <EmptyState icon='📦' title='No items' message='No items found.' />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--c-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Title</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{i.title}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{i.type}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    <span className={`badge ${itemStatusInfo(i.status).badgeClass}`}>{i.status}</span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{i.moderationStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function HandoverDesk() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.handoverDesk()
      .then((data) => setItems(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title">Handover Desk</h1>
        <SkeletonList count={5} />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title">Handover Desk</h1>
      {items.length === 0 ? (
        <EmptyState icon='🏢' title='No items at office' message='No items deposited at the Lost & Found office.' />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--c-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Item</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Location</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{i.title}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{i.location}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    <button className="btn btn-primary" onClick={() => showToast(`Marked ${i.title} as returned`, 'success')}>
                      Mark Returned
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.auditLogs()
      .then((data) => setLogs(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title">Audit Log</h1>
        <SkeletonList count={5} />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-title">Audit Log</h1>
      {logs.length === 0 ? (
        <EmptyState icon='📜' title='No audit entries' message='No admin actions recorded yet.' />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--c-border)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Action</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Actor</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Target</th>
                <th style={{ padding: '12px 8px', color: 'var(--c-text-muted)', fontSize: 12, textTransform: 'uppercase' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{l.action}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{l.actorId?.slice(0, 8) ?? '—'}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{l.targetType}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
