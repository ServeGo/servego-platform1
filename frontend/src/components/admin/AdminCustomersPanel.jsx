import React from 'react';

export default function AdminCustomersPanel({ customersList }) {
  const safeCustomers = Array.isArray(customersList) ? customersList : [];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Customer Portals</h2>
        <p className="text-slate-500 text-xs">Registered residents across Hyderabad operational core sectors.</p>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-3 px-6">Customer Representative</th>
                <th className="py-3 px-6">Email Address</th>
                <th className="py-3 px-6">Phone line</th>
                <th className="py-3 px-6">Joined Date</th>
                <th className="py-3 px-6">Identity Vetting</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {customersList.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <img
                      className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-205"
                      src={cust.avatar}
                      alt={cust.name}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-slate-900 block font-black text-sm">{cust.name}</span>
                      <span className="text-[10px] text-slate-400 block font-normal font-mono">Resident Code {cust.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-800">{cust.email}</td>
                  <td className="py-4 px-6">{cust.phone}</td>
                  <td className="py-4 px-6">{cust.joinedDate}</td>
                  <td className="py-4 px-6">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase">
                      OTP Verified
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                      {cust.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {customersList.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-8">No customers registered yet.</p>
        )}
        {customersList.map((cust) => (
          <div key={cust.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <img
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                src={cust.avatar}
                alt={cust.name}
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <span className="text-slate-900 block font-black text-sm truncate">{cust.name}</span>
                <span className="text-[10px] text-slate-400 block font-mono truncate">{cust.email}</span>
              </div>
              <span className="ml-auto bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0">
                {cust.status || 'Active'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Phone</span>
                <span className="font-semibold text-slate-700">{cust.phone}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Joined</span>
                <span className="font-semibold text-slate-700">{cust.joinedDate}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase">
                OTP Verified
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
