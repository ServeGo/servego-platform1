import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../utils/apiClient';

export default function AdminAnalyticsTab() {
  const { bookings, providers, services } = useApp();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(response => { setMetrics(response.ok ? response.data : null); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statusCounts = ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'].map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: bookings.filter(b => b.status === s).length,
    color: { pending: 'bg-amber-400', confirmed: 'bg-sky-400', ongoing: 'bg-purple-400', completed: 'bg-emerald-400', cancelled: 'bg-rose-400' }[s]
  }));

  const serviceCounts = services.map(svc => ({
    name: svc.name,
    count: bookings.filter(b => (b.serviceCategory || '').toLowerCase() === svc.name.toLowerCase()).length
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  const totalBookings = bookings.length || 1;

  const statCards = loading || !metrics ? [] : [
    { label: 'Total Providers', value: metrics.totalProviders, color: 'text-brand-700 bg-brand-50 border-brand-100' },
    { label: 'Total Customers', value: metrics.totalCustomers, color: 'text-teal-700 bg-teal-50 border-teal-100' },
    { label: 'Active Bookings', value: metrics.activeBookings, color: 'text-amber-700 bg-amber-50 border-amber-100' },
    { label: 'Completed This Month', value: metrics.completedThisMonth, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'Pending Approvals', value: metrics.pendingApprovals, color: 'text-rose-700 bg-rose-50 border-rose-100' },
    { label: 'Open Tickets', value: metrics.openTickets, color: 'text-surface-700 bg-surface-50 border-surface-200' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Platform Analytics</h2>
        <p className="text-surface-500 text-xs">Live metrics from the platform.</p>
      </div>

      {loading ? (
        <p className="text-surface-400 text-xs italic">Loading metrics...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(c => (
            <div key={c.label} className={`enterprise-card p-4 text-center border ${c.color}`}>
              <span className="block text-2xl font-black">{c.value ?? '—'}</span>
              <span className="block text-[10px] font-bold uppercase tracking-wide mt-1 opacity-70">{c.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="enterprise-card p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-surface-900 uppercase tracking-tight">Booking Status Breakdown</h3>
        <div className="space-y-3">
          {statusCounts.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-24 text-xs font-bold text-surface-600 text-right shrink-0">{s.label}</span>
              <div className="flex-1 bg-surface-100 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full ${s.color} transition-all`} style={{ width: `${Math.round((s.count / totalBookings) * 100)}%` }} />
              </div>
              <span className="w-8 text-xs font-black text-surface-800 shrink-0">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {serviceCounts.length > 0 && (
        <div className="enterprise-card p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-surface-900 uppercase tracking-tight">Bookings by Service</h3>
          <div className="space-y-3">
            {serviceCounts.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-24 text-xs font-bold text-surface-600 text-right shrink-0 truncate">{s.name}</span>
                <div className="flex-1 bg-surface-100 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full bg-brand-400 transition-all" style={{ width: `${Math.round((s.count / totalBookings) * 100)}%` }} />
                </div>
                <span className="w-8 text-xs font-black text-surface-800 shrink-0">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="enterprise-card p-6 space-y-3">
        <h3 className="text-sm font-extrabold text-surface-900 uppercase tracking-tight">Provider Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Stat label="Total Providers" value={providers.length} />
          <Stat label="Verified" value={providers.filter(p => p.isVerified).length} />
          <Stat label="Featured" value={providers.filter(p => p.isFeatured).length} />
          <Stat label="Avg Rating" value={providers.length ? (providers.reduce((s, p) => s + (p.rating || 0), 0) / providers.length).toFixed(1) : '—'} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-surface-50 border border-surface-200 rounded-xl p-3">
      <span className="block text-xl font-black text-surface-900">{value}</span>
      <span className="block text-[10px] font-bold text-surface-400 uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}
