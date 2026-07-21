import React from 'react';

export default function AdminPaymentsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Payments</h2>
        <p className="text-surface-500 text-xs">Payment settlements, escrow payouts, and transaction ledger.</p>
      </div>
      <div className="enterprise-card p-8">
        <p className="text-surface-400 italic text-xs">Payments module is not implemented yet. Routed separately from Bookings.</p>
      </div>
    </div>
  );
}
