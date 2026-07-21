import React from 'react';
import { Home, CalendarCheck, Search, MessageSquare, User } from 'lucide-react';

export default function CustomerBottomNav({
  currentPage,
  activeTab,
  onNavigate,
  setCustomerActiveTab,
  notificationsCount = 0,
}) {
  const onDashboard = currentPage === 'dashboard-customer';

  const goToTab = (tab) => {
    setCustomerActiveTab?.(tab);
    onNavigate('dashboard-customer');
  };

  const items = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      isActive: onDashboard && activeTab === 'bookings',
      onClick: () => goToTab('bookings'),
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: CalendarCheck,
      isActive: onDashboard && activeTab === 'bookings',
      onClick: () => goToTab('bookings'),
    },
    {
      id: 'services',
      label: 'Services',
      icon: Search,
      isActive: currentPage === 'services',
      onClick: () => onNavigate('services'),
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      isActive: onDashboard && activeTab === 'messages',
      onClick: () => goToTab('messages'),
      badge: notificationsCount,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      isActive: onDashboard && activeTab === 'profile',
      onClick: () => goToTab('profile'),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              aria-current={item.isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold transition-all ${
                item.isActive
                  ? 'text-sky-500 bg-sky-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={item.isActive ? 2.5 : 2} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[7px] font-black flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
