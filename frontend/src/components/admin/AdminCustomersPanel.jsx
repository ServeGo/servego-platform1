import React from 'react';

export default function AdminCustomersPanel({ customersList }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Active Customer Portals</h2>
        <p className="text-surface-500 text-xs">Registered customers across Hyderabad operations.</p>
      </div>

      <div className="hidden md:block enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-surface-200 text-surface-400 font-bold uppercase tracking-wider text-[10px] bg-surface-50/50">
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Email</th>
                <th className="py-3 px-6">Phone</th>
                <th className="py-3 px-6">Joined</th>
                <th className="py-3 px-6">Verification</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700">
              {customersList.map((cust) => (
                <tr key={cust.id} className="hover:bg-surface-50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <img className="w-9 h-9 rounded-xl object-cover shrink-0 border border-surface-200" src={cust.avatar} alt={cust.name} referrerPolicy="no-referrer" />
                    <div>
                      <span className="text-surface-900 block font-black text-sm">{cust.name}</span>
                      <span className="text-[10px] text-surface-400 block font-mono">Code {cust.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-surface-800">{cust.email}</td>
                  <td className="py-4 px-6">{cust.phone}</td>
                  <td className="py-4 px-6">{cust.joinedDate}</td>
                  <td className="py-4 px-6">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase">OTP Verified</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase">{cust.status || 'Active'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {customersList.length === 0 && <p className="text-xs text-surface-400 italic text-center py-8">No customers registered yet.</p>}
        {customersList.map((cust) => (
          <div key={cust.id} className="enterprise-card p-4">
            <div className="flex items-center gap-3">
              <img className="w-10 h-10 rounded-xl object-cover shrink-0 border border-surface-200" src={cust.avatar} alt={cust.name} referrerPolicy="no-referrer" />
              <div className="min-w-0">
                <span className="text-surface-900 block font-black text-sm truncate">{cust.name}</span>
                <span className="text-[10px] text-surface-400 block font-mono truncate">{cust.email}</span>
              </div>
              <span className="ml-auto bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0">{cust.status || 'Active'}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[9px] uppercase font-bold text-surface-400 tracking-wider">Phone</span>
                <span className="font-semibold text-surface-700">{cust.phone}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-surface-400 tracking-wider">Joined</span>
                <span className="font-semibold text-surface-700">{cust.joinedDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
