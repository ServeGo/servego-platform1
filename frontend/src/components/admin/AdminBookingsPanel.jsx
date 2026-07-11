import React from 'react';

const STATUS_BADGES = {
  pending: { label: 'Awaiting partner', cls: 'bg-amber-150 text-amber-800 border-amber-300' },
  confirmed: { label: 'Dispatch set', cls: 'bg-indigo-50 text-indigo-850 border-indigo-200' },
  ongoing: { label: 'Transit diagnostics', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed: { label: 'Settled', cls: 'bg-emerald-50 text-emerald-800 border-emerald-250' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
};

function StatusBadge({ status }) {
  const meta = STATUS_BADGES[status];
  if (!meta) return null;
  return (
    <span className={`${meta.cls} border px-2 py-0.5 rounded text-[9px] font-extrabold uppercase`}>
      {meta.label}
    </span>
  );
}

function CancelAction({ bk, onOverrideCancel }) {
  if (bk.status !== 'completed' && bk.status !== 'cancelled') {
    return (
      <button
        onClick={() => onOverrideCancel(bk.id)}
        className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold p-1 px-3 text-[10px] rounded-lg transition-colors cursor-pointer"
      >
        Overrule Cancel
      </button>
    );
  }
  return <span className="text-slate-400 text-[10px] italic">No active override</span>;
}

export default function AdminBookingsPanel({ bookings, onOverrideCancel }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Global Transaction Escrows list</h2>
        <p className="text-slate-500 text-xs">Live dispatch tracker, schedule audits, security escrow validations, and order cancellations.</p>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-3 px-6">Code ID</th>
                <th className="py-3 px-6">Customer Representative</th>
                <th className="py-3 px-6">Allocated Specialist</th>
                <th className="py-3 px-6">Schedule detail</th>
                <th className="py-3 px-6">Safety status</th>
                <th className="py-3 px-6 text-center">Operational action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {bookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-slate-900">{bk.id}</td>
                  <td className="py-4 px-6">
                    <span className="text-slate-950 block font-extrabold text-sm leading-tight">{bk.customerName}</span>
                    <span className="text-[10px] text-slate-400 font-normal font-mono">{bk.customerPhone}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-900 block font-extrabold leading-tight">{bk.providerName}</span>
                    <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">{bk.serviceCategory} Division</span>
                  </td>
                  <td className="py-4 px-6">{bk.bookingDateLabel || bk.bookingDate} • {bk.bookingTimeSlot}</td>
                  <td className="py-4 px-6"><StatusBadge status={bk.status} /></td>
                  <td className="py-4 px-6 text-center">
                    <CancelAction bk={bk} onOverrideCancel={onOverrideCancel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {bookings.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-8">No bookings on record.</p>
        )}
        {bookings.map((bk) => (
          <div key={bk.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-slate-900 text-xs">{bk.id}</span>
              <StatusBadge status={bk.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Customer</span>
                <span className="font-extrabold text-slate-900">{bk.customerName}</span>
                <span className="block text-[10px] text-slate-400 font-mono">{bk.customerPhone}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Specialist</span>
                <span className="font-extrabold text-slate-900">{bk.providerName}</span>
                <span className="block text-[10px] text-indigo-700 font-bold uppercase">{bk.serviceCategory}</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-600 font-semibold">
              {bk.bookingDateLabel || bk.bookingDate} • {bk.bookingTimeSlot}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <CancelAction bk={bk} onOverrideCancel={onOverrideCancel} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
