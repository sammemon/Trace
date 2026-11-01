import React, { useEffect, useState } from 'react';
import { itemsApi, referenceApi, type Category, type CampusLocation } from './api';
import { CategoryTile, ColorSwatchPicker, Modal, ProgressBar, StepProgress } from './components';
import { categoryEmoji } from './utils';
import { useToast } from './ToastContext';
interface DraftItem {  type?: 'LOST' | 'FOUND';  categoryId?: string;  title?: string;  description?: string;  color?: string;  brand?: string;  tags?: string[];  locationId?: string;  locationNote?: string;  occurredAt?: string;  isTimeApproximate?: boolean;  privateDetails?: string;  verificationQuestions?: Array<{ question: string }>;  handoverMode?: 'MEET_ON_CAMPUS' | 'DEPOSITED_AT_OFFICE';  idNumber?: string;}
const STEPS = ['Type', 'Category', 'Details', 'Location & Time', 'Verification', 'Review'];
interface PostWizardProps {  onClose: () => void;  onPublished: () => void;}
export function PostWizard({ onClose, onPublished }: PostWizardProps) {  const { showToast } = useToast();
const [step, setStep] = useState(0);
const [draft, setDraft] = useState<DraftItem>(() => {    try { return JSON.parse(localStorage.getItem('trace_draft') ?? '{}'); } catch { return {}; }  });
const [categories, setCategories] = useState<Category[]>([]);
const [locations, setLocations] = useState<CampusLocation[]>([]);
const [loading, setLoading] = useState(false);
const [tagInput, setTagInput] = useState('');  // Persist draft  useEffect(() => { localStorage.setItem('trace_draft', JSON.stringify(draft)); }, [draft]);  useEffect(() => {    referenceApi.categories().then(setCategories).catch(() => { });    referenceApi.locations().then(setLocations).catch(() => { });  }, []);
const set = (updates: Partial<DraftItem>) => setDraft(d => ({ ...d, ...updates }));
const selectedCat = categories.find(c => c.id === draft.categoryId);
function addTag() {    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');    if (t && !(draft.tags ?? []).includes(t) && (draft.tags ?? []).length < 10) {      set({ tags: [...(draft.tags ?? []), t] });    }    setTagInput('');  }
function removeTag(t: string) { set({ tags: (draft.tags ?? []).filter(x => x !== t) }); }  async function publish() {    setLoading(true);    try {      const payload = {        type: draft.type!,        title: draft.title!,        description: draft.description!,        categoryId: draft.categoryId!,        locationId: draft.locationId!,        color: draft.color ?? undefined,        brand: draft.brand ?? undefined,        tags: draft.tags ?? [],        locationNote: draft.locationNote ?? undefined,        occurredAt: draft.occurredAt ?? new Date().toISOString(),        isTimeApproximate: draft.isTimeApproximate ?? false,        ...(draft.type === 'FOUND' ? {          privateDetails: draft.privateDetails,          verificationQuestions: draft.verificationQuestions,          handoverMode: draft.handoverMode ?? 'MEET_ON_CAMPUS',          idNumber: draft.idNumber ?? undefined,        } : {}),      };      await itemsApi.create(payload);      localStorage.removeItem('trace_draft');      showToast('Item published! ', 'success');      onPublished();    } catch (err: unknown) {      showToast((err as Error).message, 'error');    } finally {      setLoading(false);    }  }
function canProceed(): boolean {    switch (step) {      case 0: return !!draft.type;      case 1: return !!draft.categoryId;      case 2: return !!(draft.title?.trim() && draft.description?.trim());      case 3: return !!draft.locationId && !!draft.occurredAt;      case 4: return draft.type !== 'FOUND' || !!(draft.privateDetails?.trim());      case 5: return true;      default: return true;    }  }  return (    <div style={{ position: 'fixed', inset: 0, background: 'var(--c-bg)', zIndex: 100, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>      {/* Header */}      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
<button className="btn btn-ghost" onClick={onClose} aria-label="Close wizard">✕</button>
<div style={{ flex: 1 }}>
<div style={{ fontSize: 18, fontWeight: 700 }}>Post an Item</div>
<div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</div>
</div>
<div style={{ width: 120 }}>
<ProgressBar value={step + 1} max={STEPS.length} />
</div>
</div>      {/* Step progress */}      <div style={{ background: 'var(--c-surface)', padding: '20px 24px 0', borderBottom: '1px solid var(--c-border)' }}>
<StepProgress steps={STEPS} current={step} />
</div>      {/* Step content */}      <div style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: '32px 24px', width: '100%' }}>        {/* Step 0: Type */} {step === 0 && (          <div>
<h2 style={{ marginBottom: 8 }}>What would you like to post?</h2>
<p style={{ color: 'var(--c-text-muted)', marginBottom: 32 }}>Select whether you've lost something or found something.</p>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
<button                onClick={() => set({ type: 'LOST' })}                aria-pressed={draft.type === 'LOST'}                style={{                  padding: '40px 24px',                  borderRadius: 'var(--r-xl)',                  border: draft.type === 'LOST' ? '3px solid var(--c-lost)' : '2px solid var(--c-border)',                  background: draft.type === 'LOST' ? 'var(--c-lost-soft)' : 'var(--c-surface)',                  cursor: 'pointer',                  textAlign: 'center',                  transition: 'all 0.15s',                }}              >
<div style={{ fontSize: 56, marginBottom: 16 }}>
</div>
<div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-lost-text)', marginBottom: 8 }}>I Lost Something</div>
<p style={{ fontSize: 14, color: 'var(--c-text-muted)', margin: 0 }}>Post a lost item and let others help you find it</p>
</button>
<button                onClick={() => set({ type: 'FOUND' })}                aria-pressed={draft.type === 'FOUND'}                style={{                  padding: '40px 24px',                  borderRadius: 'var(--r-xl)',                  border: draft.type === 'FOUND' ? '3px solid var(--c-found)' : '2px solid var(--c-border)',                  background: draft.type === 'FOUND' ? 'var(--c-found-soft)' : 'var(--c-surface)',                  cursor: 'pointer',                  textAlign: 'center',                  transition: 'all 0.15s',                }}              >
<div style={{ fontSize: 56, marginBottom: 16 }}>
</div>
<div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-found-text)', marginBottom: 8 }}>I Found Something</div>
<p style={{ fontSize: 14, color: 'var(--c-text-muted)', margin: 0 }}>Help return a found item to its owner safely</p>
</button>
</div>
</div>        )} {/* Step 1: Category */} {step === 1 && (          <div>
<h2 style={{ marginBottom: 8 }}>What category is this item?</h2>
<p style={{ color: 'var(--c-text-muted)', marginBottom: 24 }}>Choose the category that best describes the item.</p>            {selectedCat?.isSensitive && (              <div style={{ background: 'var(--c-lost-soft)', border: '1px solid rgba(249,115,22,.3)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--c-lost-text)' }}>                ⚠️ <strong>Sensitive category:</strong> This type of item may contain personal information. Make sure to blur or hide any personal numbers in photos before uploading.              </div>            )}            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>              {categories.map(cat => (                <CategoryTile key={cat.id} cat={cat} selected={draft.categoryId === cat.id} onClick={() => set({ categoryId: cat.id })} />              ))}            </div>
</div>        )} {/* Step 2: Details */} {step === 2 && (          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
<div>
<h2 style={{ marginBottom: 4 }}>Item details</h2>
<p style={{ color: 'var(--c-text-muted)' }}>Describe the {draft.type === 'LOST' ? 'lost' : 'found'} item clearly.</p>
</div>
<div className="form-group">
<label className="form-label" htmlFor="item-title">                Title <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{draft.title?.length ?? 0}/80</span>
</label>
<input                id="item-title" type="text" className="form-input"                value={draft.title ?? ''} onChange={e => set({ title: e.target.value })}                placeholder={`e.g. ${selectedCat ? categoryEmoji(selectedCat.slug) + ' ' : ''}Blue Samsung Galaxy S23`}                maxLength={80} required              />
</div>
<div className="form-group">
<label className="form-label" htmlFor="item-desc">                Description <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{draft.description?.length ?? 0}/1000</span>
</label>
<textarea                id="item-desc" className="form-textarea"                value={draft.description ?? ''} onChange={e => set({ description: e.target.value })}                placeholder="Describe the item in detail — distinctive features, condition, any marks, etc."                maxLength={1000} rows={5}              />
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
<div className="form-group">
<label className="form-label">Color <span className="form-label-opt">(optional)</span>
</label>
<ColorSwatchPicker value={draft.color} onChange={v => set({ color: v || undefined })} />
</div>
<div className="form-group">
<label className="form-label" htmlFor="item-brand">Brand <span className="form-label-opt">(optional)</span>
</label>
<input id="item-brand" type="text" className="form-input" value={draft.brand ?? ''} onChange={e => set({ brand: e.target.value || undefined })} placeholder="Samsung, Apple, etc." maxLength={80} />
</div>
</div>
<div className="form-group">
<label className="form-label">Tags <span className="form-label-opt">(optional)</span>
</label>
<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
<input                  type="text" className="form-input" style={{ flex: 1 }}                  value={tagInput} onChange={e => setTagInput(e.target.value)}                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}                  placeholder="Add a tag and press Enter"                  maxLength={30}                />
<button type="button" className="btn btn-secondary" onClick={addTag} disabled={!tagInput.trim()}>Add</button>
</div>              {(draft.tags ?? []).length > 0 && (                <div className="tag-list">                  {(draft.tags ?? []).map(t => (                    <span key={t}
className="tag">                      #{t}                      <button className="tag-remove" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>×</button>
</span>                  ))}                </div>              )}            </div>
</div>        )} {/* Step 3: Location & Time */} {step === 3 && (          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
<div>
<h2 style={{ marginBottom: 4 }}>Where & when?</h2>
<p style={{ color: 'var(--c-text-muted)' }}>Help others understand where and when this happened.</p>
</div>
<div className="form-group">
<label className="form-label" htmlFor="location-select">Campus Location</label>
<select id="location-select" className="form-select" value={draft.locationId ?? ''} onChange={e => set({ locationId: e.target.value })}>
<option value="">— Select a location —</option>                {locations.map(loc => (                  <option key={loc.id} value={loc.id}>{loc.name} {loc.isSafeHandoverPoint ? ' ✅' : ''}</option>                ))}              </select>
<span className="form-helper">✅ = Safe handover point</span>
</div>
<div className="form-group">
<label className="form-label" htmlFor="location-note">Additional location note <span className="form-label-opt">(optional)</span>
</label>
<input id="location-note" type="text" className="form-input" value={draft.locationNote ?? ''} onChange={e => set({ locationNote: e.target.value || undefined })} placeholder="e.g. Near the vending machines on 2nd floor" maxLength={240} />
</div>
<div className="form-group">
<label className="form-label" htmlFor="occurred-at">Date & Time</label>
<input                id="occurred-at" type="datetime-local" className="form-input"                value={draft.occurredAt ? draft.occurredAt.slice(0, 16) : new Date().toISOString().slice(0, 16)}                max={new Date().toISOString().slice(0, 16)}                onChange={e => set({ occurredAt: new Date(e.target.value).toISOString() })}              />
</div>
<label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, padding: '12px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
<input type="checkbox" checked={draft.isTimeApproximate ?? false} onChange={e => set({ isTimeApproximate: e.target.checked })} />
<div>
<div style={{ fontWeight: 600 }}>Approximate time</div>
<div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Check this if you're not sure of the exact time</div>
</div>
</label>
</div>        )} {/* Step 4: Verification (FOUND only) / Skip for LOST */} {step === 4 && draft.type === 'FOUND' && (          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
<div>
<h2 style={{ marginBottom: 4 }}>Private verification details</h2>
<p style={{ color: 'var(--c-text-muted)' }}>These details are <strong>never shown publicly</strong>. They're used to verify the rightful owner when someone claims this item.</p>
</div>
<div style={{ background: 'var(--c-primary-soft)', border: '1px solid rgba(79,70,229,.2)', borderRadius: 'var(--r-lg)', padding: '16px' }}>
<div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--c-primary)' }}> Private details (never shown publicly)</div>
<textarea                className="form-textarea"                value={draft.privateDetails ?? ''}                onChange={e => set({ privateDetails: e.target.value })}                placeholder="e.g. The wallet contains a blue library card, a Nadra ID, and approximately Rs 500. The keychain has a red enamel charm."                rows={5}                required              />
</div>
<div>
<div style={{ fontWeight: 700, marginBottom: 12 }}>Verification questions</div>
<p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 16 }}>Add 1-3 questions that only the real owner could answer.</p>              {[0, 1, 2].map(idx => (                <div key={idx}
className="form-group" style={{ marginBottom: 12 }}>
<label className="form-label">Question {idx + 1} {idx > 0 ? <span className="form-label-opt">(optional)</span> : ''}</label>
<input                    type="text" className="form-input"                    value={(draft.verificationQuestions ?? [])[idx]?.question ?? ''}                    onChange={e => {                      const qs = [...((draft.verificationQuestions ?? [{ question: '' }, { question: '' }, { question: '' }]))];                      qs[idx] = { question: e.target.value };                      set({ verificationQuestions: qs.filter(q => q.question.trim()) });                    }}                    placeholder={                      idx === 0 ? 'e.g. What color is the phone case?' :                        idx === 1 ? 'e.g. What app was last open on the screen?' :                          'e.g. What sticker is on the back?'                    }                    maxLength={300}                  />
</div>              ))}            </div>
<div className="form-group">
<label className="form-label">Handover preference</label>
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>                {[                  { value: 'MEET_ON_CAMPUS', label: ' Meet on campus', desc: 'Arrange a meeting at a safe campus location' },                  { value: 'DEPOSITED_AT_OFFICE', label: ' Deposit at office', desc: 'Leave the item at the Campus Security / Lost & Found office' },                ].map(opt => (                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '14px 16px', borderRadius: 'var(--r-md)', border: draft.handoverMode === opt.value ? '2px solid var(--c-primary)' : '2px solid var(--c-border)', background: draft.handoverMode === opt.value ? 'var(--c-primary-soft)' : 'var(--c-surface)' }}>
<input type="radio" name="handoverMode" value={opt.value} checked={draft.handoverMode === opt.value} onChange={() => set({ handoverMode: opt.value as 'MEET_ON_CAMPUS' | 'DEPOSITED_AT_OFFICE' })} />
<div>
<div style={{ fontWeight: 600 }}>{opt.label}</div>
<div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{opt.desc}</div>
</div>
</label>                ))}              </div>
</div>            {selectedCat?.slug === 'id-card' && (              <div className="form-group">
<label className="form-label" htmlFor="id-number">                  ID Number <span className="form-label-opt">(optional — for automatic owner matching)</span>
</label>
<input                  id="id-number" type="text" className="form-input"                  value={draft.idNumber ?? ''}                  onChange={e => set({ idNumber: e.target.value || undefined })}                  placeholder="e.g. 23CS066"                  maxLength={120}                />
<span className="form-helper"> Stored securely as a hash — never displayed publicly</span>
</div>            )}          </div>        )} {/* Step 4 for LOST: just a note */} {step === 4 && draft.type === 'LOST' && (          <div style={{ textAlign: 'center', padding: '40px 0' }}>
<div style={{ fontSize: 64, marginBottom: 20 }}>
</div>
<h2>Almost done!</h2>
<p style={{ color: 'var(--c-text-muted)', maxWidth: 400, margin: '12px auto 0' }}>              Once you post this lost item, we'll automatically search for matching found items and notify you of any potential matches.            </p>
</div>        )} {/* Step 5: Review */} {step === 5 && (          <div>
<h2 style={{ marginBottom: 4 }}>Review & Publish</h2>
<p style={{ color: 'var(--c-text-muted)', marginBottom: 24 }}>Check the details below before publishing.</p>
<div className="card card-padded" style={{ marginBottom: 16 }}>
<div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
<div style={{                  width: 80, height: 80, borderRadius: 'var(--r-lg)', background: 'var(--c-surface-2)',                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0,                }}>                  {selectedCat ? categoryEmoji(selectedCat.slug) : ''}                </div>
<div style={{ flex: 1 }}>
<div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
<span className={`badge ${draft.type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>{draft.type}</span>
<span className="badge badge-neutral">{selectedCat?.name}</span>                    {draft.color && <span className="badge badge-neutral">{draft.color}</span>}                  </div>
<div style={{ fontWeight: 700, fontSize: 18 }}>{draft.title ?? '—'}</div>
<p style={{ fontSize: 14, marginTop: 8, color: 'var(--c-text)', lineHeight: 1.5 }}>{draft.description?.slice(0, 200)} {(draft.description?.length ?? 0) > 200 ? '…' : ''}</p>
</div>
</div>
</div>
<div className="card card-padded">
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
<div>
<div style={{ color: 'var(--c-text-muted)', marginBottom: 2 }}>Location</div>
<div style={{ fontWeight: 600 }}> {locations.find(l => l.id === draft.locationId)?.name ?? '—'}</div>
</div>
<div>
<div style={{ color: 'var(--c-text-muted)', marginBottom: 2 }}>Date & Time</div>
<div style={{ fontWeight: 600 }}>                    {draft.occurredAt ? new Date(draft.occurredAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) : '—'} {draft.isTimeApproximate ? ' (approx.)' : ''}                  </div>
</div>                {draft.brand && (                  <div>
<div style={{ color: 'var(--c-text-muted)', marginBottom: 2 }}>Brand</div>
<div style={{ fontWeight: 600 }}>{draft.brand}</div>
</div>                )} {draft.type === 'FOUND' && (                  <div>
<div style={{ color: 'var(--c-text-muted)', marginBottom: 2 }}>Handover</div>
<div style={{ fontWeight: 600 }}>{draft.handoverMode === 'DEPOSITED_AT_OFFICE' ? ' At office' : ' Meet on campus'}</div>
</div>                )}              </div>
</div>
</div>        )}      </div>      {/* Footer navigation */}      <div style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0, zIndex: 10 }}>
<button          className="btn btn-secondary"          onClick={() => { if (step > 0) setStep(s => s - 1); else onClose(); }}        >          {step === 0 ? 'Cancel' : '← Back'}        </button>        {step < STEPS.length - 1 ? (          <button            className="btn btn-primary"            onClick={() => setStep(s => s + 1)}            disabled={!canProceed()}          >            Next →          </button>        ) : (          <button            className={`btn btn-primary btn-lg${loading ? ' btn-loading' : ''}`}            onClick={publish}            disabled={loading}            style={{ background: 'linear-gradient(135deg, var(--c-primary), #B7791F)' }}          >            {loading ? '' : ' Publish Item'}          </button>        )}      </div>
</div>  );}