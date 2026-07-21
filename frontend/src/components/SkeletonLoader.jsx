import React from 'react';

function SkeletonBlock({ className = '' }) {
  return <div className={`enterprise-skeleton ${className}`} />;
}

export function SkeletonCard({ count = 1, className = '' }) {
  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
          <div className="flex items-start gap-4">
            <SkeletonBlock className="w-14 h-14 rounded-xl" />
            <div className="flex-1 space-y-3">
              <SkeletonBlock className="h-4 rounded-lg w-3/4" />
              <SkeletonBlock className="h-3 rounded-lg w-1/2" />
              <SkeletonBlock className="h-3 rounded-lg w-5/6" />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <SkeletonBlock className="h-9 rounded-lg w-24" />
            <SkeletonBlock className="h-9 rounded-lg w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-3 rounded-lg w-1/4" />
          ))}
        </div>
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="border-b border-slate-50 px-5 py-4 last:border-0">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((j) => (
              <SkeletonBlock key={j} className="h-3 rounded-lg w-1/4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        <SkeletonBlock className="w-16 h-16 rounded-full" />
        <div className="space-y-2.5">
          <SkeletonBlock className="h-5 rounded-lg w-40" />
          <SkeletonBlock className="h-3 rounded-lg w-28" />
        </div>
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-3 rounded-lg w-full" />
        <SkeletonBlock className="h-3 rounded-lg w-5/6" />
        <SkeletonBlock className="h-3 rounded-lg w-3/4" />
        <SkeletonBlock className="h-3 rounded-lg w-4/5" />
      </div>
      <div className="mt-6 pt-5 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-4">
          <SkeletonBlock className="h-10 rounded-lg" />
          <SkeletonBlock className="h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonLoader({ type = 'card', count = 1, className = '' }) {
  const renderCard = () => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <SkeletonBlock className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-4 rounded-lg w-3/4" />
          <SkeletonBlock className="h-3 rounded-lg w-1/2" />
          <SkeletonBlock className="h-3 rounded-lg w-5/6" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <SkeletonBlock className="h-9 rounded-lg w-24" />
        <SkeletonBlock className="h-9 rounded-lg w-24" />
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3 rounded-lg w-1/3" />
              <SkeletonBlock className="h-2.5 rounded-lg w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTable = () => <SkeletonTable rows={count} />;

  const renderStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <SkeletonBlock className="h-8 rounded-lg w-1/2 mb-3" />
          <SkeletonBlock className="h-4 rounded-lg w-3/4" />
        </div>
      ))}
    </div>
  );

  const renderBookingCard = () => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 rounded-lg w-32" />
          <SkeletonBlock className="h-3 rounded-lg w-24" />
        </div>
        <SkeletonBlock className="h-6 rounded-full w-20" />
      </div>
      <div className="flex gap-4 mb-5">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <SkeletonBlock className="h-3 rounded-lg w-16" />
            <SkeletonBlock className="h-2.5 rounded-lg w-12" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 rounded-lg w-24" />
        <SkeletonBlock className="h-9 rounded-lg w-24" />
      </div>
    </div>
  );

  const renderProviderCard = () => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <SkeletonBlock className="h-32" />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <SkeletonBlock className="w-12 h-12 rounded-full -mt-8 border-4 border-white" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-4 rounded-lg w-24" />
            <SkeletonBlock className="h-3 rounded-lg w-16" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <SkeletonBlock className="h-3 rounded-lg w-full" />
          <SkeletonBlock className="h-3 rounded-lg w-3/4" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 rounded-lg flex-1" />
          <SkeletonBlock className="h-9 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  );

  const renderText = () => (
    <div className="space-y-3">
      <SkeletonBlock className="h-4 rounded-lg w-full" />
      <SkeletonBlock className="h-4 rounded-lg w-5/6" />
      <SkeletonBlock className="h-4 rounded-lg w-4/6" />
    </div>
  );

  const skeletons = {
    card: renderCard,
    list: renderList,
    table: renderTable,
    stats: renderStats,
    text: renderText,
    booking: renderBookingCard,
    provider: renderProviderCard,
  };

  const SkeletonComponent = skeletons[type] || skeletons.card;

  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={count > 1 && type !== 'list' && type !== 'table' ? 'mb-4' : ''}>
          <SkeletonComponent />
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
