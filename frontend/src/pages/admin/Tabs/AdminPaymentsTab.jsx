import React from 'react';

export default function AdminPaymentsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Payments</h2>
        <p className="text-slate-500 text-xs">
          Admin view for payment settlements, escrow payouts, and transaction ledger.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200">
        <p className="text-slate-400 italic text-xs">
          Payments module is not implemented yet. This page is now routed separately from Bookings.
        </p>
      </div>
    </div>
  );
}

