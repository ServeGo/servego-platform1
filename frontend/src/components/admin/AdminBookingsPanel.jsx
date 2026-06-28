import React from 'react';


export default function AdminBookingsPanel({ bookings, onOverrideCancel }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Global Transaction Escrows list</h2>
        <p className="text-slate-500 text-xs">Live dispatch tracker, schedule audits, security escrow validations, and order cancellations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-3 px-6">Code ID</th>
                <th className="py-3 px-6">Customer Representative</th>
                <th className="py-3 px-6">Allocated Specialist</th>
                <th className="py-3 px-6">Schedule detail</th>
                <th className="py-3 px-6">Safety status</th>
                <th className="py-3 px-6 text-right">Escrow gross</th>
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
                  <td className="py-4 px-6">{bk.bookingDate} • {bk.bookingTimeSlot}</td>
                  <td className="py-4 px-6">
                    {bk.status === 'pending' && (
                      <span className="bg-amber-150 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Awaiting partner</span>
                    )}
                    {bk.status === 'confirmed' && (
                      <span className="bg-indigo-50 text-indigo-850 border border-indigo-200 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Dispatch set</span>
                    )}
                    {bk.status === 'ongoing' && (
                      <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Transit diagnostics</span>
                    )}
                    {bk.status === 'completed' && (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Settled</span>
                    )}
                    {bk.status === 'cancelled' && (
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Cancelled</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right text-indigo-750 font-black text-sm">₹{bk.totalAmount}</td>
                  <td className="py-4 px-6 text-center">
                    {bk.status !== 'completed' && bk.status !== 'cancelled' ? (
                      <button
                        onClick={() => onOverrideCancel(bk.id)}
                        className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-fbold p-1 px-3 text-[10px] rounded-lg transition-colors cursor-pointer"
                      >
                        Overrule Cancel
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[10px] italic">No active override</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

