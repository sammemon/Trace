import { useEffect, useState } from 'react';
type Category = { id: string; name: string };
type Location = { id: string; name: string };
type Props = {
  apiUrl: string;
  token: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
};
async function api<T>(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error?.message ?? 'Unable to complete request');
  return body.data as T;
}
export function PostDialog({ apiUrl, token, onClose, onCreated }: Props) {
  const [type, setType] = useState<'LOST' | 'FOUND'>('LOST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      api<Category[]>(`${apiUrl}/categories`, token),
      api<Location[]>(`${apiUrl}/locations`, token),
    ])
      .then(([nextCategories, nextLocations]) => {
        setCategories(nextCategories);
        setLocations(nextLocations);
        setCategoryId(nextCategories[0]?.id ?? '');
        setLocationId(nextLocations[0]?.id ?? '');
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Reference data unavailable',
        ),
      )
      .finally(() => setLoading(false));
  }, [apiUrl, token]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api(`${apiUrl}/items`, token, {
        method: 'POST',
        body: JSON.stringify({
          type,
          title,
          description,
          categoryId,
          locationId,
          occurredAt: new Date(occurredAt).toISOString(),
          tags: [],
        }),
      });
      await onCreated();
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not publish item',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="dialog-backdrop">
      <form className="dialog post-dialog" onSubmit={submit}>
        <button type="button" className="dialog-close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">NEW CAMPUS POST</p>
        <h2>Help an item find its way home</h2>
        {loading ? (
          <div
            className="post-skeleton"
            aria-label="Loading categories and locations"
          />
        ) : error && !categories.length ? (
          <div className="error" role="alert">
            {error}
            <button type="button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="segmented post-type">
              <button
                type="button"
                className={type === 'LOST' ? 'active lost' : ''}
                onClick={() => setType('LOST')}
              >
                Lost
              </button>
              <button
                type="button"
                className={type === 'FOUND' ? 'active found' : ''}
                onClick={() => setType('FOUND')}
              >
                Found
              </button>
            </div>
            <label>
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                required
                placeholder="Blue wallet near the library"
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                required
                placeholder="Add useful identifying details without private numbers."
              />
            </label>
            <label>
              Category
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Campus location
              <select
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                required
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              When did it happen?
              <input
                type="datetime-local"
                value={occurredAt}
                max={new Date().toISOString().slice(0, 16)}
                onChange={(event) => setOccurredAt(event.target.value)}
                required
              />
            </label>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <button className="primary" disabled={saving}>
              {saving ? 'Publishing...' : 'Publish post'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
