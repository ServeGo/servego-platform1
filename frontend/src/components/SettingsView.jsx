import React from 'react';

export default function SettingsView() {
  const settings = [
    { title: 'Instant Dispatch SMS Toggles', desc: 'Push real-time technician movement status on phone.', status: 'ACTIVE' },
    { title: '₹10,000 Insurance Cover Auto-opt', desc: 'Complementary cover for home mechanics.', status: 'ACTIVE' },
    { title: 'Security Waypoint Masking', desc: 'Conceal address coordinates until active work window.', status: 'ENABLED' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6 text-left">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Safety & Notification Parameters</h3>
        <p className="text-slate-500 text-xs mt-1 font-medium">Configure emergency triggers and privacy templates.</p>
      </div>
      
      <div className="divide-y divide-slate-100">
        {settings.map((s, idx) => (
          <div key={idx} className="py-4 flex justify-between items-center text-xs font-bold">
            <div>
              <span className="text-slate-900 block">{s.title}</span>
              <span className="text-slate-400 text-[10px] block mt-0.5 font-medium">{s.desc}</span>
            </div>
            <span className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-wider ${s.status === 'ACTIVE' || s.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
