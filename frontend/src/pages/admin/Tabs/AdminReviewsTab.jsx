import React, { useEffect, useState } from 'react';
import { api } from '../../../utils/apiClient';

const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

export default function AdminReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/reviews').then(response => {
      if (!response.ok) throw new Error(response.status);
      setReviews(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    }).catch(() => { setError('Failed to load reviews.'); setLoading(false); });
  }, []);

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase();
    return (r.reviewerName || '').toLowerCase().includes(q) || (r.provider?.user?.name || '').toLowerCase().includes(q) || (r.comment || '').toLowerCase().includes(q) || (r.serviceCategory || '').toLowerCase().includes(q);
  });

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Customer Reviews</h2>
          <p className="text-surface-500 text-xs">All reviews submitted by customers.</p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="enterprise-card px-4 py-2"><span className="block text-[10px] font-bold text-surface-400 uppercase">Total</span><span className="block text-lg font-black text-surface-900">{reviews.length}</span></div>
          <div className="enterprise-card px-4 py-2"><span className="block text-[10px] font-bold text-surface-400 uppercase">Avg</span><span className="block text-lg font-black text-amber-500">{avgRating}</span></div>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." className="enterprise-input w-full sm:w-80" />

      {loading && <p className="text-surface-400 text-xs italic">Loading reviews...</p>}
      {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="enterprise-card p-8 text-center text-surface-400 text-xs italic">No reviews found.</div>
      )}

      <div className="space-y-3">
        {filtered.map(rev => (
          <div key={rev.id} className="enterprise-card p-5 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-surface-900">{rev.reviewerName || rev.reviewer?.name || 'Customer'}</span>
                <span className="text-[10px] font-bold text-surface-400 uppercase bg-surface-100 px-2 py-0.5 rounded">{rev.serviceCategory || 'General'}</span>
              </div>
              <div className="text-amber-400 text-sm font-bold tracking-wider">{stars(rev.rating)}<span className="text-surface-500 text-xs font-semibold ml-1">({rev.rating}/5)</span></div>
              {rev.comment && <p className="text-surface-600 text-xs font-medium italic">"{rev.comment}"</p>}
            </div>
            <div className="text-right shrink-0 space-y-1">
              <p className="text-xs font-bold text-surface-700">Provider: <span className="text-brand-700">{rev.provider?.user?.name || '—'}</span></p>
              <p className="text-[10px] text-surface-400 font-mono">{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
