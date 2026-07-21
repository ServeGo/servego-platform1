import React from 'react';

export default function DashboardHeader({ user, subtitle }) {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-sky-400 text-[#0F172A] flex items-center justify-center text-lg font-bold border-2 border-white shadow-sm">
          {user?.name?.substring(0, 2).toUpperCase() || 'CU'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Customer'}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {subtitle || dateStr}
          </p>
        </div>
      </div>
    </div>
  );
}
