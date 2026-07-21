export default function Skeleton({ className = '', count = 1, height, width, rounded = 'rounded-lg' }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-200 ${rounded} ${className}`}
          style={{ height: height || undefined, width: width || '100%' }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="enterprise-card p-5 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
          <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-200 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="enterprise-card overflow-hidden">
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
