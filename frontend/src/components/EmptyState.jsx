import React from 'react';
import { Calendar, Bell, Search, Users, LifeBuoy } from 'lucide-react';

const colorMap = {
  sky: {
    bg: 'bg-sky-50',
    icon: 'text-sky-500',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-500',
  },
  slate: {
    bg: 'bg-slate-100',
    icon: 'text-slate-400',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-500',
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  color = 'sky',
  className = '',
}) {
  const palette = colorMap[color] || colorMap.sky;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {Icon && (
        <div className={`w-16 h-16 rounded-2xl ${palette.bg} flex items-center justify-center mb-5`}>
          <Icon className={`w-7 h-7 ${palette.icon}`} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-[15px] font-bold text-surface-700 mb-1.5">{title || 'No data found'}</h3>
      {description && (
        <p className="text-[13px] text-surface-400 mb-6 max-w-sm leading-relaxed">{description}</p>
      )}
      {onAction && actionLabel && (
        <button onClick={onAction} className="enterprise-btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyBookings({ onAction }) {
  return (
    <EmptyState
      title="No bookings yet"
      description="You haven't made any service bookings. Browse our services to find the help you need."
      actionLabel="Browse Services"
      onAction={onAction}
      icon={Calendar}
      color="sky"
    />
  );
}

export function EmptyNotifications({ onClear }) {
  return (
    <EmptyState
      title="All caught up!"
      description="You don't have any new notifications at the moment."
      actionLabel="Clear All"
      onAction={onClear}
      icon={Bell}
      color="teal"
    />
  );
}

export function EmptySearchResults({ query, onClear }) {
  return (
    <EmptyState
      title="No results found"
      description={`No providers matching "${query}" were found. Try adjusting your search or filters.`}
      actionLabel="Clear Search"
      onAction={onClear}
      icon={Search}
      color="sky"
    />
  );
}

export function EmptyProviders({ onAction }) {
  return (
    <EmptyState
      title="No providers available"
      description="There are no verified service providers in this category yet. Please check back later."
      actionLabel="Browse All Services"
      onAction={onAction}
      icon={Users}
      color="teal"
    />
  );
}

export function EmptyTickets({ onAction }) {
  return (
    <EmptyState
      title="No support tickets"
      description="You haven't submitted any support tickets. Contact us if you need assistance."
      actionLabel="Contact Support"
      onAction={onAction}
      icon={LifeBuoy}
      color="slate"
    />
  );
}

export default EmptyState;
