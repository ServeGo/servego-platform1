import React from 'react';

export default function AdminReviewsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reviews</h2>
        <p className="text-slate-500 text-xs">
          Admin moderation, approval queue, and analytics for customer/provider ratings.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200">
        <p className="text-slate-400 italic text-xs">
          Reviews module is not implemented yet. This page is now routed separately from Support Tickets.
        </p>
      </div>
    </div>
  );
}

