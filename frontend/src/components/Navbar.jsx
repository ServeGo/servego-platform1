import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu, X, Bell, User, ChevronDown, LogOut, Settings, Home,
  Briefcase, LayoutDashboard, Star, MessageSquare, CalendarCheck,
} from 'lucide-react';

function InitialsAvatar({ name, size = 'sm', className = '' }) {
  const initials = (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const sizeClasses = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  };
  return (
    <div
      className={`rounded-full bg-surface-900 text-white font-bold flex items-center justify-center select-none ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      {initials}
    </div>
  );
}

export default function Navbar({
  onNavigate,
  currentPage,
  setSelectedCategoryDetail,
  customerActiveTab,
  setCustomerActiveTab,
  providerActiveTab,
  setProviderActiveTab,
  adminActiveTab,
  setAdminActiveTab,
}) {
  const { currentUser, notifications, markNotificationAsRead, markAllNotificationsRead, logout } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownOpen && notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userDropdownOpen, notifDropdownOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
  }, [currentPage]);

  const unreadNotifications = (notifications || []).filter(
    (n) => !n.read && (n.userId === currentUser?.id || n.role === currentUser?.role)
  );

  const handleSignOutAction = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    onNavigate('login');
  };

  const handleLinkClick = (page, categoryId = null) => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
    onNavigate(page, categoryId);
  };

  const Logo = ({ light = true }) => (
    <div className="flex items-center gap-2.5 cursor-pointer select-none">
      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
        <span className="text-white font-extrabold text-xs leading-none">S</span>
      </div>
      <span className={`font-extrabold text-sm tracking-tight ${light ? 'text-surface-900' : 'text-white'}`}>ServeGo</span>
    </div>
  );

  const NotificationDropdown = ({ isLight = false }) => (
    <div className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl p-0 z-50 overflow-hidden enterprise-scale-in bg-white border-surface-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
        <span className="text-[11px] font-bold text-surface-900 uppercase tracking-wider">Notifications</span>
        <button
          onClick={() => { markAllNotificationsRead(); setNotifDropdownOpen(false); }}
          className="text-[10px] font-bold text-brand-700 hover:text-brand-800 transition-colors"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {unreadNotifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="w-8 h-8 text-surface-300 mx-auto mb-2" />
            <p className="text-surface-400 text-xs font-medium">No unread notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-50">
            {unreadNotifications.slice(0, 5).map((n) => (
              <button
                key={n.id}
                onClick={() => { markNotificationAsRead(n.id); setNotifDropdownOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-surface-900 truncate">{n.title}</p>
                    <p className="text-[11px] text-surface-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {unreadNotifications.length > 5 && (
        <div className="px-4 py-2.5 border-t border-surface-100 bg-surface-50">
          <button className="text-[11px] font-bold text-brand-700 hover:text-brand-800">
            View all {unreadNotifications.length} notifications
          </button>
        </div>
      )}
    </div>
  );

  const UserDropdown = ({ isLight = false }) => (
    <div className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl p-0 z-50 overflow-hidden enterprise-scale-in bg-white border-surface-200">
      <div className="px-4 py-3 border-b border-surface-100 bg-surface-50">
        <p className="text-[13px] font-bold text-surface-900 truncate">{currentUser?.name}</p>
        <p className="text-[11px] text-surface-400 font-mono truncate mt-0.5">{currentUser?.email}</p>
      </div>
      <div className="py-1.5">
        {currentUser?.role === 'customer' && (
          <>
            <DropdownItem onClick={() => { setUserDropdownOpen(false); setCustomerActiveTab('bookings'); handleLinkClick('dashboard-customer'); }} label="Dashboard" icon={LayoutDashboard} />
            <DropdownItem onClick={() => { setUserDropdownOpen(false); setCustomerActiveTab('profile'); handleLinkClick('dashboard-customer'); }} label="Profile" icon={User} />
            <DropdownItem onClick={() => { setUserDropdownOpen(false); setCustomerActiveTab('favorites'); handleLinkClick('dashboard-customer'); }} label="Saved Partners" icon={Star} />
            <DropdownItem onClick={() => { setUserDropdownOpen(false); setCustomerActiveTab('settings'); handleLinkClick('dashboard-customer'); }} label="Settings" icon={Settings} />
          </>
        )}
        {currentUser?.role === 'provider' && (
          <>
            <DropdownItem onClick={() => { setUserDropdownOpen(false); setProviderActiveTab('profile'); handleLinkClick('dashboard-provider'); }} label="Profile" icon={User} />
            <DropdownItem onClick={() => { setUserDropdownOpen(false); setProviderActiveTab('availability'); handleLinkClick('dashboard-provider'); }} label="Availability" icon={CalendarCheck} />
            <DropdownItem onClick={() => { setUserDropdownOpen(false); setProviderActiveTab('support'); handleLinkClick('dashboard-provider'); }} label="Support" icon={MessageSquare} />
          </>
        )}
      </div>
      <div className="border-t border-surface-100 py-1.5">
        <button
          onClick={handleSignOutAction}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  const DropdownItem = ({ onClick, label, icon: Icon }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] font-medium text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors"
    >
      {Icon && <Icon className="w-3.5 h-3.5 text-surface-400" />}
      {label}
    </button>
  );

  // ----------------------------------------------------
  // ADMIN HEADER
  // ----------------------------------------------------
  if (currentUser?.role === 'admin') {
    const adminLinks = [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'providers', label: 'Providers', icon: Briefcase },
      { key: 'bookings', label: 'Bookings', icon: CalendarCheck },
      { key: 'tickets', label: 'Tickets', icon: MessageSquare },
    ];

    return (
      <header className="sticky top-0 z-30 bg-surface-950 border-b border-surface-800">
        <div className="max-w-full mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <div onClick={() => handleLinkClick('admin')} className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-white font-extrabold text-xs leading-none">S</span>
            </div>
            <span className="font-extrabold text-white text-sm tracking-tight hidden sm:block">ServeGo</span>
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider hidden md:block">Admin</span>
          </div>
          <nav className="hidden lg:flex items-center gap-1">
            {adminLinks.map((item) => (
              <button
                key={item.key}
                onClick={() => { setAdminActiveTab(item.key); window.location.hash = `admin/${item.key}`; }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  adminActiveTab === item.key
                    ? 'bg-brand-700/20 text-brand-400'
                    : 'text-surface-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOutAction}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-surface-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-1.5 rounded-lg text-surface-300 hover:bg-white/10">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-surface-900 border-t border-surface-800 px-4 py-3 space-y-1 enterprise-slide-up">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => { setAdminActiveTab(item.key); window.location.hash = `admin/${item.key}`; setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                    adminActiveTab === item.key
                      ? 'bg-brand-700/20 text-brand-400'
                      : 'text-surface-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            <div className="border-t border-surface-800 pt-2 mt-2">
              <button
                onClick={handleSignOutAction}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  // ----------------------------------------------------
  // PROVIDER HEADER
  // ----------------------------------------------------
  if (currentUser?.role === 'provider') {
    const providerLinks = [
      { key: 'leads', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'reviews', label: 'Reviews', icon: Star },
      { key: 'my-services', label: 'My Services', icon: Briefcase },
      { key: 'support', label: 'Support', icon: MessageSquare },
    ];

    return (
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div onClick={() => handleLinkClick('home')} className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-white font-extrabold text-xs leading-none">S</span>
            </div>
            <span className="font-extrabold text-surface-900 text-sm tracking-tight">ServeGo</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider ml-1">Partner</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {providerLinks.map((item) => (
              <button
                key={item.key}
                onClick={() => setProviderActiveTab(item.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  providerActiveTab === item.key
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[7px] font-black text-white border-2 border-white">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>
              {notifDropdownOpen && <NotificationDropdown isLight />}
            </div>
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-surface-700 hover:bg-surface-100 transition-all"
              >
                <InitialsAvatar name={currentUser?.name} size="xs" />
                <span className="hidden sm:block max-w-[80px] truncate">{currentUser?.name?.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
              {userDropdownOpen && <UserDropdown isLight />}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-1.5 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-surface-100 px-4 py-3 space-y-1 enterprise-slide-up shadow-lg">
            {providerLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => { setProviderActiveTab(item.key); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                    providerActiveTab === item.key
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-surface-500 hover:text-surface-900 hover:bg-surface-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            <div className="border-t border-surface-100 pt-2 mt-2">
              <button
                onClick={handleSignOutAction}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  // ----------------------------------------------------
  // CUSTOMER HEADER
  // ----------------------------------------------------
  if (currentUser?.role === 'customer') {
    const customerLinks = [
      { key: 'home', label: 'Home', page: 'home', icon: Home },
      { key: 'services', label: 'Services', page: 'services', icon: Briefcase },
      { key: 'bookings', label: 'My Bookings', page: 'dashboard-customer', icon: CalendarCheck },
      { key: 'tickets', label: 'Support', page: 'dashboard-customer', icon: MessageSquare },
    ];

    return (
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div onClick={() => handleLinkClick('home')} className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-white font-extrabold text-xs leading-none">S</span>
            </div>
            <span className="font-extrabold text-surface-900 text-sm tracking-tight">ServeGo</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {customerLinks.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  if (item.key === 'bookings' || item.key === 'tickets') {
                    setCustomerActiveTab(item.key);
                  }
                  handleLinkClick(item.page);
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  currentPage === item.page && (item.key === 'home' ? currentPage === 'home' : true)
                    ? 'bg-sky-400/10 text-sky-600 font-bold'
                    : 'text-surface-500 hover:text-sky-500 hover:bg-surface-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[7px] font-black text-white border-2 border-white">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>
              {notifDropdownOpen && <NotificationDropdown isLight />}
            </div>
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-surface-700 hover:bg-surface-100 transition-all"
              >
                <InitialsAvatar name={currentUser?.name} size="xs" />
                <span className="hidden sm:block max-w-[80px] truncate">{currentUser?.name?.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
              {userDropdownOpen && <UserDropdown isLight />}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-600">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-surface-100 py-2 px-4 shadow-lg enterprise-slide-up">
            {customerLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.key === 'bookings' || item.key === 'tickets') {
                      setCustomerActiveTab(item.key);
                    }
                    handleLinkClick(item.page);
                  }}
                  className={`w-full flex items-center gap-3 py-3 px-2 text-[12px] font-semibold rounded-lg border-b border-surface-50 last:border-0 transition-colors ${
                    currentPage === item.page && (item.key === 'home' ? currentPage === 'home' : true)
                      ? 'text-sky-600 bg-sky-400/5 font-bold'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            <div className="border-t border-surface-100 mt-1 pt-1">
              <button
                onClick={handleSignOutAction}
                className="w-full flex items-center gap-3 py-3 px-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  // ----------------------------------------------------
  // PUBLIC VISITOR HEADER
  // ----------------------------------------------------
  const publicLinks = [
    { page: 'home', label: 'Home' },
    { page: 'services', label: 'Services' },
    { page: 'partner', label: 'Partner' },
    { page: 'about', label: 'About' },
    { page: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm shadow-slate-200/50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div onClick={() => handleLinkClick('home')} className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
            <span className="text-white font-extrabold text-xs leading-none">S</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-surface-900 text-sm tracking-tight leading-none">ServeGo</span>
            <span className="text-[8px] font-bold text-surface-400 uppercase tracking-[0.15em] leading-none mt-0.5">Trusted Local Experts</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map((item) => (
            <button
              key={item.page}
              onClick={() => handleLinkClick(item.page)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                currentPage === item.page
                  ? 'text-sky-500 font-bold'
                  : 'text-slate-600 hover:text-sky-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLinkClick('services')}
            className="bg-sky-400 hover:bg-sky-500 text-[#0F172A] px-5 py-2.5 rounded-lg text-[11px] font-bold transition-all"
          >
            Book Service
          </button>
          <button
            onClick={() => handleLinkClick('login')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 py-2 px-4 shadow-lg enterprise-slide-up">
          {publicLinks.map((item) => (
            <button
              key={item.page}
              onClick={() => handleLinkClick(item.page)}
              className={`w-full text-left py-3 px-2 text-[12px] font-semibold rounded-lg border-b border-slate-50 last:border-0 transition-colors ${
                currentPage === item.page
                  ? 'text-sky-500 font-bold bg-sky-400/5'
                  : 'text-slate-600 hover:text-sky-500 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleLinkClick('services')}
              className="flex-1 py-2.5 text-[11px] font-bold rounded-lg bg-sky-400 text-[#0F172A] hover:bg-sky-500 transition-colors"
            >
              Book Service
            </button>
            <button
              onClick={() => handleLinkClick('login')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold rounded-lg text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
