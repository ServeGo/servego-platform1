import React from 'react';
import { Activity, Landmark, Users, MessageSquare, DollarSign, UserCheck } from 'lucide-react';

export default function AdminDashboardPanel({
  platformCommission, totalVolume, administrativeEarnings,
  pendingPartnersCount, activeTicketsCount, bookings, providers,
  handlePartnerApproval, setActiveTab, activeTab,
}) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">System Administrator Console</h2>
          <p className="text-surface-500 text-xs">Real-time monitoring, escrow checks, and dispatch operations.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Core Active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Gross Escrow Vol.', value: `₹${totalVolume}`, sub: `Platform comm ${platformCommission}%`, icon: Landmark, color: 'bg-teal-50 text-teal-700', valueColor: 'text-surface-950' },
          { label: 'Admin Net Payout', value: `₹${administrativeEarnings}`, sub: 'Accumulated commission', icon: DollarSign, color: 'bg-emerald-50 text-emerald-700', valueColor: 'text-teal-700' },
          { label: 'Vetting Backlog', value: `${pendingPartnersCount} applicants`, sub: 'Partner registration queue', icon: Users, color: 'bg-amber-50 text-amber-600', valueColor: 'text-amber-600' },
          { label: 'Dispute Tickets', value: `${activeTicketsCount} open`, sub: 'Customer & Partner complaints', icon: MessageSquare, color: 'bg-rose-50 text-rose-600', valueColor: 'text-rose-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="enterprise-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-surface-400 font-extrabold uppercase block tracking-wider mb-1">{card.label}</span>
                <span className={`text-lg sm:text-2xl font-black ${card.valueColor} block`}>{card.value}</span>
                <span className="text-[10px] text-surface-400 block mt-1">{card.sub}</span>
              </div>
              <div className={`p-3 rounded-xl shrink-0 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 enterprise-card p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-surface-100">
            <h3 className="font-extrabold text-surface-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Recent dispatch ledger</span>
            </h3>
            <button onClick={() => setActiveTab('bookings')} className="text-brand-700 font-extrabold text-xs hover:underline uppercase tracking-wide">
              View all ({bookings.length})
            </button>
          </div>
          <div className="space-y-3.5">
            {bookings.slice(0, 4).map((bk) => (
              <div key={bk.id} className="p-3.5 rounded-xl border border-surface-100 hover:bg-surface-50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold bg-surface-100 text-surface-800 px-1.5 py-0.5 rounded">{bk.id}</span>
                    <span className="text-surface-900 font-extrabold text-sm">{bk.serviceCategory}</span>
                  </div>
                  <div className="text-[11px] text-surface-500 font-medium">
                    Customer: <span className="text-surface-700 font-bold">{bk.customerName}</span> • Provider: <span className="text-surface-700 font-bold">{bk.providerName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                  <div className="font-mono text-surface-500 text-[10px]">{bk.bookingDate} • {bk.bookingTimeSlot}</div>
                  <BookingStatusPill status={bk.status} />
                  <span className="text-surface-900 font-black">₹{bk.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 enterprise-card p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-surface-100">
            <h3 className="font-extrabold text-surface-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>Awaiting Vetting</span>
            </h3>
            <button onClick={() => setActiveTab('providerServiceRequests')} className="text-brand-700 font-extrabold text-xs hover:underline uppercase tracking-wide">Queue</button>
          </div>
          {pendingPartnersCount === 0 ? (
            <p className="text-surface-400 italic text-center py-10 text-xs font-semibold">No pending service requests.</p>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <span className="text-3xl font-black text-amber-600">{pendingPartnersCount}</span>
              <span className="text-xs text-surface-500 font-semibold">pending approval{pendingPartnersCount !== 1 ? 's' : ''}</span>
              <button onClick={() => setActiveTab('providerServiceRequests')} className="enterprise-btn-primary !bg-amber-500 hover:!bg-amber-600 !border-amber-500">
                Review Requests
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingStatusPill({ status }) {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-brand-100 text-brand-800',
    ongoing: 'bg-purple-100 text-purple-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-rose-100 text-rose-800',
  };
  return (
    <span className={`${map[status] || 'bg-surface-100 text-surface-800'} px-2 py-0.5 rounded text-[9px] font-extrabold uppercase`}>
      {status}
    </span>
  );
}
