const STATUS_MAP = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' },
  confirmed: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Confirmed' },
  'in-progress': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'In Progress' },
  in_progress: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'In Progress' },
  ongoing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'In Progress' },
  en_route: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'En Route' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
  reviewed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Reviewed' },
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Verified' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Paid' },
  resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Resolved' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Cancelled' },
  declined: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Declined' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rejected' },
  suspended: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Suspended' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Inactive' },
  open: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Open' },
  investigating: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Investigating' },
  processing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Processing' },
  refunded: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Refunded' },
};

export default function StatusPill({ status, size = 'sm', className = '' }) {
  const key = (status || '').toLowerCase();
  const s = STATUS_MAP[key] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: status || 'Unknown' };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[9px]',
    sm: 'px-2.5 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-bold border ${s.bg} ${s.text} ${s.border} ${sizeClasses[size] || sizeClasses.sm} uppercase tracking-wide ${className}`}>
      {s.label}
    </span>
  );
}
