import React, { useState } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { api } from '../../utils/apiClient';

const STATUS_BADGES = {
  pending: { label: 'Awaiting partner', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'Dispatch set', cls: 'bg-brand-50 text-brand-800 border-brand-200' },
  ongoing: { label: 'In progress', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed: { label: 'Settled', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
};

function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const meta = STATUS_BADGES[key];
  if (!meta) return <span className="text-surface-400 text-[9px] uppercase font-bold">{status}</span>;
  return <span className={`${meta.cls} border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase`}>{meta.label}</span>;
}

function TimelineModal({ bookingId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/bookings/${bookingId}/timeline`).then(res => {
      if (cancelled) return;
      if (res.ok) setData(res.data); else setError(res.data?.message || 'Failed to load timeline.');
    }).catch(() => { if (!cancelled) setError('Network error.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bookingId]);

  return (
    <div className="fixed inset-0 z-50 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-surface-200 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <div>
            <h3 className="text-base font-extrabold text-surface-900">Booking Timeline</h3>
            <p className="text-[11px] text-surface-500 font-mono mt-0.5">{bookingId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          {loading && <p className="text-xs text-surface-400 text-center py-8">Loading timeline...</p>}
          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-[9px] uppercase font-bold text-surface-400 block">Customer</span><span className="font-bold text-surface-800">{data.customer?.name || '—'}</span><span className="block text-surface-500 text-[10px]">{data.customer?.email}</span></div>
                <div><span className="text-[9px] uppercase font-bold text-surface-400 block">Provider</span><span className="font-bold text-surface-800">{data.provider?.name || '—'}</span></div>
                <div><span className="text-[9px] uppercase font-bold text-surface-400 block">Service</span><span className="font-bold text-surface-800">{data.serviceCategory}</span></div>
                <div><span className="text-[9px] uppercase font-bold text-surface-400 block">Status</span><StatusBadge status={data.currentStatus} /></div>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-surface-400 block mb-3">Event Log</span>
                {(!data.timeline || data.timeline.length === 0) ? (
                  <p className="text-xs text-surface-400 italic">No events recorded.</p>
                ) : (
                  <ol className="relative border-l border-surface-200 space-y-4 ml-2">
                    {data.timeline.map((event, i) => (
                      <li key={i} className="ml-4">
                        <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-white" />
                        <div className="flex items-start gap-2">
                          <Clock className="w-3 h-3 text-surface-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-surface-700">{event.status}</span>
                            {event.note && <p className="text-[11px] text-surface-500 mt-0.5">{event.note}</p>}
                            <p className="text-[10px] text-surface-400 mt-0.5">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingsPanel({ bookings, onOverrideCancel }) {
  const [searchId, setSearchId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timelineBookingId, setTimelineBookingId] = useState(null);

  const filtered = React.useMemo(() => {
    let arr = Array.isArray(bookings) ? bookings : [];
    if (searchId.trim()) {
      const q = searchId.trim().toLowerCase();
      arr = arr.filter(bk => bk.id?.toLowerCase().includes(q) || bk.customerName?.toLowerCase().includes(q) || bk.providerName?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') arr = arr.filter(bk => (bk.status || '').toLowerCase() === statusFilter);
    return arr;
  }, [bookings, searchId, statusFilter]);

  const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'ongoing', 'completed', 'cancelled'];

  return (
    <div className="space-y-6">
      {timelineBookingId && <TimelineModal bookingId={timelineBookingId} onClose={() => setTimelineBookingId(null)} />}

      <div>
        <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Global Transaction Escrows</h2>
        <p className="text-surface-500 text-xs">Live dispatch tracker, audits, and cancellations.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-surface-400" />
          <input value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="Search by ID, customer, provider..." className="enterprise-input !pl-9 w-full" />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${statusFilter === s ? 'bg-surface-900 text-white border-surface-900' : 'bg-white text-surface-500 border-surface-200 hover:bg-surface-50'}`}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="hidden md:block enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-surface-200 text-surface-400 font-bold uppercase tracking-wider text-[10px] bg-surface-50/50">
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Provider</th>
                <th className="py-3 px-5">Schedule</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700">
              {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-xs text-surface-400 italic">No bookings match.</td></tr>}
              {filtered.map(bk => (
                <tr key={bk.id} className="hover:bg-surface-50 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-surface-900 text-[11px]">{bk.id}</td>
                  <td className="py-4 px-5"><span className="text-surface-900 block font-extrabold leading-tight">{bk.customerName}</span><span className="text-[10px] text-surface-400 font-mono">{bk.customerPhone}</span></td>
                  <td className="py-4 px-5"><span className="text-surface-900 block font-extrabold leading-tight">{bk.providerName}</span><span className="text-[10px] text-brand-700 font-bold uppercase tracking-wider">{bk.serviceCategory}</span></td>
                  <td className="py-4 px-5">{bk.bookingDateLabel || bk.bookingDate} · {bk.bookingTimeSlot}</td>
                  <td className="py-4 px-5"><StatusBadge status={bk.status} /></td>
                  <td className="py-4 px-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setTimelineBookingId(bk.id)} className="enterprise-btn-secondary !text-[10px] !py-1.5 !px-3">Timeline</button>
                      {bk.status !== 'completed' && bk.status !== 'cancelled' && <button onClick={() => onOverrideCancel(bk.id)} className="enterprise-btn-secondary !text-[10px] !py-1.5 !px-3 !text-red-600 !border-red-200 hover:!bg-red-50">Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.length === 0 && <p className="text-xs text-surface-400 italic text-center py-8">No bookings match.</p>}
        {filtered.map(bk => (
          <div key={bk.id} className="enterprise-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-surface-900 text-xs">{bk.id}</span>
              <StatusBadge status={bk.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div><span className="block text-[9px] uppercase font-bold text-surface-400">Customer</span><span className="font-extrabold text-surface-900">{bk.customerName}</span></div>
              <div><span className="block text-[9px] uppercase font-bold text-surface-400">Provider</span><span className="font-extrabold text-surface-900">{bk.providerName}</span><span className="block text-[10px] text-brand-700 font-bold uppercase">{bk.serviceCategory}</span></div>
            </div>
            <div className="mt-3 text-[11px] text-surface-600 font-semibold">{bk.bookingDateLabel || bk.bookingDate} · {bk.bookingTimeSlot}</div>
            <div className="mt-3 pt-3 border-t border-surface-100 flex gap-2 justify-end">
              <button onClick={() => setTimelineBookingId(bk.id)} className="enterprise-btn-secondary !text-[10px] !py-1.5 !px-3">Timeline</button>
              {bk.status !== 'completed' && bk.status !== 'cancelled' && <button onClick={() => onOverrideCancel(bk.id)} className="enterprise-btn-secondary !text-[10px] !py-1.5 !px-3 !text-red-600 !border-red-200 hover:!bg-red-50">Cancel</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
