import React from 'react';

export default function AdminReportsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reports</h2>
        <p className="text-slate-500 text-xs">
          Exportable reports, audit logs, and operational KPIs.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200">
        <p className="text-slate-400 italic text-xs">
          Reports module is not implemented yet. This page is now routed separately from Analytics.
        </p>
      </div>
    </div>
  );
}

