import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function EarningsChart({ completedJobs }) {
  const weeklyData = [
    { day: 'Mon', amount: 4800 },
    { day: 'Tue', amount: 6200 },
    { day: 'Wed', amount: 9500 },
    { day: 'Thu', amount: 11000 },
    { day: 'Fri', amount: 13500 },
    { day: 'Sat', amount: 7800 },
    { day: 'Sun', amount: 5200 }
  ];
  const maxAmount = 15000;
  const netPending = completedJobs.reduce((sum, j) => sum + (j.totalAmount - j.serviceFee - j.tax), 0);

  return (
    <div className="space-y-8 text-left">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-800 text-sm">Weekly Revenue Index</h4>
          <div className="h-64 flex flex-col justify-between pt-6">
            <div className="flex-grow flex items-end justify-between gap-4 px-2 pb-2 border-b border-slate-200 max-h-[170px]">
              {weeklyData.map((d, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-30">
                    ₹{d.amount.toLocaleString()}
                  </div>
                  <div className="w-full bg-indigo-600 hover:bg-slate-900 rounded-t-lg transition-all duration-300" style={{ height: `${(d.amount / maxAmount) * 100}%` }} />
                  <span className="text-[10px] text-slate-500 font-extrabold mt-2 uppercase">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center font-bold">
              <span>⚡ 7-Day Escrow Settlement Cycle</span>
              <span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="w-4 h-4" /> +11% Growth</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-6">
          <h4 className="text-base font-bold tracking-tight">Escrow Wallet</h4>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest block">Net Pending Payout</span>
            <span className="text-3xl font-black text-indigo-400 block mt-2">₹{netPending}</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-medium">{completedJobs.length} active jobs done recently</span>
          </div>
          <div className="text-xs text-slate-400 leading-relaxed font-semibold italic opacity-80">
            ⓘ Payments protected by escrow security rules. standard Tuesday morning credits.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200">
        <h4 className="font-extrabold text-slate-800 text-sm mb-4">Completed Payments Log</h4>
        {completedJobs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No job transactions listed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5">Job Code</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Client</th>
                  <th className="py-2.5 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {completedJobs.map(j => (
                  <tr key={j.id}>
                    <td className="py-3 font-mono text-slate-900">{j.id}</td>
                    <td className="py-3 font-medium">{j.bookingDate}</td>
                    <td className="py-3 font-medium">{j.customerName}</td>
                    <td className="py-3 text-right text-emerald-600 font-black">₹{j.totalAmount - j.serviceFee - j.tax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
