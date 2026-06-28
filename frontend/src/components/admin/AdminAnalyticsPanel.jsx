import React from 'react';

export default function AdminAnalyticsPanel() {
  // Keeping existing analytics UI inline was out of scope for this step.
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Analytics & Metrics Charts</h2>
        <p className="text-slate-500 text-xs">Track active booking distributions, revenue progressions, and service division performances.</p>
      </div>
      {/* Intentionally not refactoring analytics visuals in this phase. */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 text-xs text-slate-500 italic">
        Analytics UI will be extracted in a follow-up step.
      </div>
    </div>
  );
}

