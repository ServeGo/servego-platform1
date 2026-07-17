import React from 'react';

export function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        {title || 'No data found'}
      </h3>
      
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm shadow-sm"
        >
          {actionLabel || 'Take Action'}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function EmptyBookings({ onAction }) {
  return (
    <EmptyState
      title="No bookings yet"
      description="You haven't made any service bookings. Browse our services to find the help you need."
      actionLabel="Browse Services"
      onAction={onAction}
      icon={() => (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
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
      icon={() => (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )}
    />
  );
}

export function EmptySearchResults({ query, onClear }) {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find any providers matching "${query}". Try adjusting your search or filters.`}
      actionLabel="Clear Search"
      onAction={onClear}
      icon={() => (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}
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
      icon={() => (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )}
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
      icon={() => (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    />
  );
}

export default EmptyState;
