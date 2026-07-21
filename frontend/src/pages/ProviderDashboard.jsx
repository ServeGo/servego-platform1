import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StatusPill, EmptyState } from '../components/ui';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  DollarSign,
  Star,
  Settings,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Clock,
  MapPin,
  User,
  TrendingUp,
  CheckCircle2,
  Play,
  ChevronRight,
  Upload,
  Shield,
  AlertTriangle,
  MessageSquare,
  Send,
  Edit3,
  Save,
  ToggleLeft,
  ToggleRight,
  Check,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Wallet,
  PiggyBank,
  CreditCard,
  Inbox,
  History,
  Camera,
} from 'lucide-react';

export const ProviderDashboard = ({ onNavigate, activeTab: activeTabProp, setActiveTabExternal }) => {
  const {
    currentUser, providers, bookings, notifications, tickets,
    updateBookingStatus, updateProviderAvailability, updateProviderProfile,
    submitSupportTicket, logout, sendChatMessage, markNotificationAsRead,
    markAllNotificationsRead, services,
  } = useApp();

  const activeProvider = useMemo(() => {
    const providerIdCandidate = currentUser?.providerId;
    const providerUserIdCandidate = currentUser?.id;
    const byProviderId = providerIdCandidate ? providers.find(p => p.id === providerIdCandidate) : null;
    const byUserId = providerUserIdCandidate ? providers.find(p => p.userId === providerUserIdCandidate) : null;
    return byProviderId || byUserId || null;
  }, [providers, currentUser]);

  const [internalActiveTab, setInternalActiveTab] = useState('dashboard');
  const activeTab = activeTabProp || internalActiveTab;
  const setActiveTab = setActiveTabExternal || setInternalActiveTab;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [chatInput, setChatInput] = useState('');

  const allocatedBookings = useMemo(
    () => bookings.filter(b => b.providerId === activeProvider?.id),
    [bookings, activeProvider]
  );

  const userNotifications = useMemo(
    () => notifications.filter(n => n.userId === currentUser?.id),
    [notifications, currentUser]
  );

  const unreadCount = useMemo(
    () => userNotifications.filter(n => !n.read && !n.isRead).length,
    [userNotifications]
  );

  const pendingJobs = useMemo(
    () => allocatedBookings.filter(b => b.status === 'pending'),
    [allocatedBookings]
  );

  const activeJobs = useMemo(
    () => allocatedBookings.filter(b => ['confirmed', 'in_progress', 'en_route', 'ongoing'].includes(b.status)),
    [allocatedBookings]
  );

  const completedJobs = useMemo(
    () => allocatedBookings.filter(b => ['completed', 'reviewed'].includes(b.status)),
    [allocatedBookings]
  );

  const todayJobs = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return allocatedBookings.filter(b => b.bookingDate === today);
  }, [allocatedBookings]);

  const handleLogout = () => {
    logout();
    if (onNavigate) onNavigate('home');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Job Requests', icon: Briefcase },
    { id: 'schedule', label: 'My Schedule', icon: Calendar },
    { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'services', label: 'My Services & Pricing', icon: Settings },
    { id: 'profile', label: 'Profile & Documents', icon: FileText },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const tabTitles = {
    dashboard: 'Dashboard',
    jobs: 'Job Requests',
    schedule: 'My Schedule',
    earnings: 'Earnings & Payouts',
    reviews: 'Reviews & Ratings',
    services: 'My Services & Pricing',
    profile: 'Profile & Documents',
    help: 'Help & Support',
  };

  return (
    <div className="flex h-screen bg-[#F4F8FB] overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 enterprise-backdrop" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl enterprise-slide-up z-50">
            <SidebarContent
              navItems={navItems}
              activeTab={activeTab}
              setActiveTab={(t) => { setActiveTab(t); setSidebarOpen(false); }}
              onLogout={handleLogout}
              provider={activeProvider}
              onClose={() => setSidebarOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col shrink-0">
        <SidebarContent
          navItems={navItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          provider={activeProvider}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-50">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">{tabTitles[activeTab] || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </button>

            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setAvatarOpen(false); }}
                className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-100 rounded-xl shadow-xl z-50 enterprise-scale-in max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                        Mark all read
                      </button>
                    )}
                  </div>
                  {userNotifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400 font-medium">No notifications yet</div>
                  ) : (
                    userNotifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                          !n.read && !n.isRead ? 'bg-sky-50/50' : ''
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-800">{n.title || 'Notification'}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setAvatarOpen(!avatarOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs">
                  {activeProvider?.name?.charAt(0) || currentUser?.name?.charAt(0) || 'P'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 enterprise-scale-in overflow-hidden">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{activeProvider?.name || currentUser?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setActiveTab('profile'); setAvatarOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => { setActiveTab('settings'); setAvatarOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="enterprise-fade-in max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardTab
                isOnline={isOnline}
                setIsOnline={setIsOnline}
                pendingJobs={pendingJobs}
                activeJobs={activeJobs}
                completedJobs={completedJobs}
                todayJobs={todayJobs}
                provider={activeProvider}
                allocatedBookings={allocatedBookings}
                onAcceptJob={(id) => updateBookingStatus(id, 'confirmed', 'Accepted.')}
                onDeclineJob={(id) => updateBookingStatus(id, 'cancelled', 'Declined.')}
                updateBookingStatus={updateBookingStatus}
                sendChatMessage={sendChatMessage}
                chatBookingId={chatBookingId}
                setChatBookingId={setChatBookingId}
                chatInput={chatInput}
                setChatInput={setChatInput}
              />
            )}
            {activeTab === 'jobs' && (
              <JobsTab
                pendingJobs={pendingJobs}
                activeJobs={activeJobs}
                completedJobs={completedJobs}
                onAcceptJob={(id) => updateBookingStatus(id, 'confirmed', 'Accepted.')}
                onDeclineJob={(id) => updateBookingStatus(id, 'cancelled', 'Declined.')}
                updateBookingStatus={updateBookingStatus}
                sendChatMessage={sendChatMessage}
                chatBookingId={chatBookingId}
                setChatBookingId={setChatBookingId}
                chatInput={chatInput}
                setChatInput={setChatInput}
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleTab allocatedBookings={allocatedBookings} />
            )}
            {activeTab === 'earnings' && (
              <EarningsTab completedJobs={completedJobs} provider={activeProvider} />
            )}
            {activeTab === 'reviews' && (
              <ReviewsTab provider={activeProvider} />
            )}
            {activeTab === 'services' && (
              <ServicesTab provider={activeProvider} services={services} />
            )}
            {activeTab === 'profile' && (
              <ProfileTab provider={activeProvider} currentUser={currentUser} updateProviderProfile={updateProviderProfile} />
            )}
            {activeTab === 'help' && (
              <HelpTab tickets={tickets} currentUser={currentUser} submitSupportTicket={submitSupportTicket} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

function SidebarContent({ navItems, activeTab, setActiveTab, onLogout, provider, onClose, isMobile }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-400 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-extrabold text-slate-900 tracking-tight">ServeGo</span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-50">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="px-4 py-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm shrink-0">
            {provider?.name?.charAt(0) || 'P'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{provider?.name || 'Provider'}</p>
            <p className="text-[11px] text-slate-500 font-medium truncate">{provider?.category || 'Service Pro'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-sky-400/10 text-sky-600 border-l-2 border-sky-400 ml-0'
                  : 'text-slate-500 hover:bg-slate-50 border-l-2 border-transparent ml-0'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-rose-500 hover:bg-rose-50 transition-all"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendUp, color, bgColor, borderColor }) {
  return (
    <div className="enterprise-card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgColor} ${borderColor} border`}>
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-1 ${trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span className="text-[11px] font-bold">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardTab({ isOnline, setIsOnline, pendingJobs, activeJobs, completedJobs, todayJobs, provider, allocatedBookings, onAcceptJob, onDeclineJob, updateBookingStatus, sendChatMessage, chatBookingId, setChatBookingId, chatInput, setChatInput }) {
  const thisWeekEarnings = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return completedJobs
      .filter(b => b.bookingDate && new Date(b.bookingDate) >= weekStart)
      .reduce((sum, b) => sum + (b.price || b.amount || 0), 0);
  }, [completedJobs]);

  const rating = provider?.rating || 4.8;
  const acceptanceRate = useMemo(() => {
    const total = allocatedBookings.length;
    if (total === 0) return 100;
    const accepted = allocatedBookings.filter(b => b.status !== 'cancelled').length;
    return Math.round((accepted / total) * 100);
  }, [allocatedBookings]);

  const [showCountdown, setShowCountdown] = useState(null);
  const countdownRef = useRef(null);
  const [countdownVal, setCountdownVal] = useState(60);

  const handleIncomingAccept = useCallback((id) => {
    setShowCountdown(null);
    clearInterval(countdownRef.current);
    onAcceptJob(id);
  }, [onAcceptJob]);

  const handleIncomingDecline = useCallback((id) => {
    setShowCountdown(null);
    clearInterval(countdownRef.current);
    onDeclineJob(id);
  }, [onDeclineJob]);

  useEffect(() => {
    if (pendingJobs.length > 0 && showCountdown === null) {
      setShowCountdown(pendingJobs[0].id);
      setCountdownVal(60);
    }
  }, [pendingJobs]);

  useEffect(() => {
    if (showCountdown) {
      setCountdownVal(60);
      countdownRef.current = setInterval(() => {
        setCountdownVal(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setShowCountdown(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdownRef.current);
    }
  }, [showCountdown]);

  const incomingJob = pendingJobs.find(b => b.id === showCountdown) || pendingJobs[0];

  return (
    <div className="space-y-6">
      <div className="enterprise-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Availability Status</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isOnline ? 'You are visible to customers. Accepting jobs.' : 'You are offline. Not receiving new requests.'}
          </p>
        </div>
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            isOnline
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-600'
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Jobs Today" value={todayJobs.length || pendingJobs.length} trend="+2 from yesterday" trendUp color="text-sky-600" bgColor="bg-sky-50" borderColor="border-sky-100" />
        <StatCard icon={DollarSign} label="This Week" value={`₹${thisWeekEarnings.toLocaleString()}`} trend="+12% vs last week" trendUp color="text-emerald-600" bgColor="bg-emerald-50" borderColor="border-emerald-100" />
        <StatCard icon={Star} label="Rating" value={rating.toFixed(1)} trend="+0.2 this month" trendUp color="text-amber-600" bgColor="bg-amber-50" borderColor="border-amber-100" />
        <StatCard icon={CheckCircle2} label="Acceptance" value={`${acceptanceRate}%`} color="text-teal-600" bgColor="bg-teal-50" borderColor="border-teal-100" />
      </div>

      {incomingJob && (
        <div className="enterprise-card border-l-4 border-sky-400 p-5 enterprise-slide-up">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-sky-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-bold text-slate-900">Incoming Job Request</h4>
                <span className="enterprise-badge enterprise-badge-info">New</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{incomingJob.customerName || 'Customer'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{incomingJob.serviceCategory || 'Service'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate">{incomingJob.locationAddress || 'Address'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-900">₹{incomingJob.price || incomingJob.amount || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Auto-decline in</span>
              <span className="text-xs font-bold text-sky-600">{countdownVal}s</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdownVal / 60) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => handleIncomingAccept(incomingJob.id)}
              className="enterprise-btn-primary flex-1 sm:flex-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Job
            </button>
            <button
              onClick={() => handleIncomingDecline(incomingJob.id)}
              className="enterprise-btn-danger flex-1 sm:flex-none"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Today's Schedule</h3>
        {todayJobs.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No jobs scheduled for today</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-4">
              {todayJobs.map((job, i) => {
                const statusColor = job.status === 'completed' ? 'emerald' : job.status === 'ongoing' || job.status === 'in_progress' ? 'amber' : 'sky';
                return (
                  <div key={job.id || i} className="flex items-start gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 bg-white border-2 border-${statusColor}-400`}>
                      <Clock className={`w-3.5 h-3.5 text-${statusColor}-500`} />
                    </div>
                    <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3.5 -mt-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{job.customerName || 'Customer'}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{job.serviceCategory || 'Service'} &middot; {job.locationAddress || 'Location'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">{job.bookingTimeSlot || '—'}</span>
                          <StatusPill status={job.status} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



function JobsTab({ pendingJobs, activeJobs, completedJobs, onAcceptJob, onDeclineJob, updateBookingStatus, sendChatMessage, chatBookingId, setChatBookingId, chatInput, setChatInput }) {
  const [subTab, setSubTab] = useState('new');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {[
          { id: 'new', label: 'New Requests', count: pendingJobs.length },
          { id: 'active', label: 'Active Jobs', count: activeJobs.length },
          { id: 'history', label: 'Job History', count: completedJobs.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              subTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                subTab === t.id ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'new' && (
        <div className="space-y-3">
          {pendingJobs.length === 0 ? (
            <EmptyState icon={Inbox} title="No New Requests" description="New job requests from customers will appear here." />
          ) : (
            pendingJobs.map(job => (
              <JobRequestCard
                key={job.id}
                job={job}
                onAccept={() => onAcceptJob(job.id)}
                onDecline={() => onDeclineJob(job.id)}
                chatBookingId={chatBookingId}
                setChatBookingId={setChatBookingId}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendChatMessage={sendChatMessage}
              />
            ))
          )}
        </div>
      )}

      {subTab === 'active' && (
        <div className="space-y-3">
          {activeJobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No Active Jobs" description="Accepted jobs will appear here for you to manage." />
          ) : (
            activeJobs.map(job => (
              <ActiveJobCard
                key={job.id}
                job={job}
                updateBookingStatus={updateBookingStatus}
                chatBookingId={chatBookingId}
                setChatBookingId={setChatBookingId}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendChatMessage={sendChatMessage}
              />
            ))
          )}
        </div>
      )}

      {subTab === 'history' && (
        <div className="space-y-3">
          {completedJobs.length === 0 ? (
            <EmptyState icon={History} title="No Job History" description="Completed jobs will appear here." />
          ) : (
            <div className="enterprise-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedJobs.map(job => (
                      <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-600">{job.bookingDate || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{job.customerName || 'Customer'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{job.serviceCategory || '—'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">₹{job.price || job.amount || '—'}</td>
                        <td className="px-4 py-3"><StatusPill status={job.status} /></td>
                        <td className="px-4 py-3">
                          {job.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-bold text-slate-700">{job.rating}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No rating</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JobRequestCard({ job, onAccept, onDecline, chatBookingId, setChatBookingId, chatInput, setChatInput, sendChatMessage }) {
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleAccept = () => { clearInterval(timerRef.current); onAccept(); };
  const handleDecline = () => { clearInterval(timerRef.current); onDecline(); };

  if (timedOut) return null;

  return (
    <div className="enterprise-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{job.customerName || 'Customer'}</p>
            <p className="text-xs text-slate-500 font-medium">{job.serviceCategory || 'Service'}</p>
          </div>
        </div>
        <span className="enterprise-badge enterprise-badge-info">New</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium truncate">{job.locationAddress || 'Address not provided'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium">{job.bookingDate || '—'} {job.bookingTimeSlot ? `at ${job.bookingTimeSlot}` : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-900">₹{job.price || job.amount || '—'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-sky-400 rounded-full transition-all duration-1000" style={{ width: `${(countdown / 60) * 100}%` }} />
        </div>
        <span className="text-[11px] font-bold text-slate-500">{countdown}s</span>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleAccept} className="enterprise-btn-primary text-sm flex-1 sm:flex-none">
          <CheckCircle2 className="w-4 h-4" />
          Accept
        </button>
        <button onClick={handleDecline} className="enterprise-btn-danger text-sm flex-1 sm:flex-none">
          <X className="w-4 h-4" />
          Decline
        </button>
        <button
          onClick={() => setChatBookingId(chatBookingId === job.id ? null : job.id)}
          className="enterprise-btn-secondary text-sm"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      {chatBookingId === job.id && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { sendChatMessage(job.id, chatInput, 'provider'); setChatInput(''); } }}
              placeholder="Type a message..."
              className="enterprise-input text-sm flex-1"
            />
            <button
              onClick={() => { if (chatInput.trim()) { sendChatMessage(job.id, chatInput, 'provider'); setChatInput(''); } }}
              className="enterprise-btn-primary !px-3"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveJobCard({ job, updateBookingStatus, chatBookingId, setChatBookingId, chatInput, setChatInput, sendChatMessage }) {
  const steps = ['pending', 'confirmed', 'en_route', 'ongoing', 'completed'];
  const statusIndex = steps.indexOf(job.status);

  const stepLabels = ['Requested', 'Accepted', 'En Route', 'Started', 'Completed'];

  const nextStep = () => {
    if (job.status === 'confirmed') return 'en_route';
    if (job.status === 'en_route' || job.status === 'in_progress' || job.status === 'ongoing') return 'completed';
    return null;
  };

  const actionLabel = () => {
    if (job.status === 'confirmed') return 'Mark as En Route';
    if (job.status === 'en_route' || job.status === 'in_progress' || job.status === 'ongoing') return 'Mark as Completed';
    return null;
  };

  const handleAction = () => {
    const next = nextStep();
    if (next) updateBookingStatus(job.id, next, `${next} from provider`);
  };

  return (
    <div className="enterprise-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{job.customerName || 'Customer'}</p>
            <p className="text-xs text-slate-500 font-medium">{job.serviceCategory || 'Service'} &middot; ₹{job.price || job.amount || '—'}</p>
          </div>
        </div>
        <StatusPill status={job.status} />
      </div>

      <div className="flex items-center gap-1 mb-4 overflow-x-auto">
        {stepLabels.map((label, i) => {
          const done = i <= Math.max(statusIndex, 0);
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[10px] font-bold ${done ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 mt-[-14px] ${i < statusIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="font-medium">{job.locationAddress || 'Address'}</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {actionLabel() && (
          <button onClick={handleAction} className="enterprise-btn-primary text-sm">
            <Play className="w-4 h-4" />
            {actionLabel()}
          </button>
        )}
        <button
          onClick={() => setChatBookingId(chatBookingId === job.id ? null : job.id)}
          className="enterprise-btn-secondary text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
      </div>

      {chatBookingId === job.id && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { sendChatMessage(job.id, chatInput, 'provider'); setChatInput(''); } }}
              placeholder="Type a message..."
              className="enterprise-input text-sm flex-1"
            />
            <button
              onClick={() => { if (chatInput.trim()) { sendChatMessage(job.id, chatInput, 'provider'); setChatInput(''); } }}
              className="enterprise-btn-primary !px-3"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleTab({ allocatedBookings }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7;

  const [weekOffset, setWeekOffset] = useState(0);
  const [blockedSlots, setBlockedSlots] = useState({});

  const getWeekDates = useCallback(() => {
    const start = new Date(today);
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    start.setDate(today.getDate() + mondayOffset + weekOffset * 7);
    return days.map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekOffset]);

  const weekDates = getWeekDates();

  const jobsByDateAndHour = useMemo(() => {
    const map = {};
    allocatedBookings.forEach(job => {
      if (!job.bookingDate) return;
      const hour = job.bookingTimeSlot ? parseInt(job.bookingTimeSlot) : 10;
      const key = `${job.bookingDate}-${hour}`;
      if (!map[key]) map[key] = [];
      map[key].push(job);
    });
    return map;
  }, [allocatedBookings]);

  const toggleBlock = (date, hour) => {
    const key = `${date}-${hour}`;
    setBlockedSlots(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="enterprise-card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="enterprise-btn-secondary !px-3 !py-2">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">
              {weekDates[0]} &mdash; {weekDates[6]}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Weekly Schedule</p>
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)} className="enterprise-btn-secondary !px-3 !py-2">
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs font-bold text-sky-600 hover:text-sky-700">
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-200" /> Pending</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200" /> Confirmed</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200" /> In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200" /> Blocked</span>
        </div>
      </div>

      <div className="enterprise-card overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-100">
            <div className="p-3 text-[10px] font-bold text-slate-400 uppercase">Time</div>
            {days.map((day, i) => {
              const isToday = weekOffset === 0 && i === todayDayIndex;
              return (
                <div key={day} className={`p-3 text-center border-l border-slate-50 ${isToday ? 'bg-sky-50/50' : ''}`}>
                  <p className="text-xs font-bold text-slate-600">{day}</p>
                  <p className={`text-[10px] font-medium ${isToday ? 'text-sky-600' : 'text-slate-400'}`}>
                    {weekDates[i]?.slice(8)}
                  </p>
                </div>
              );
            })}
          </div>

          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-50">
              <div className="p-2 text-[11px] font-bold text-slate-400 text-center border-r border-slate-100 flex items-start justify-center pt-3">
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
              </div>
              {days.map((day, i) => {
                const dateKey = weekDates[i];
                const cellKey = `${dateKey}-${hour}`;
                const job = jobsByDateAndHour[cellKey]?.[0];
                const isBlocked = blockedSlots[cellKey];
                const isToday = weekOffset === 0 && i === todayDayIndex;

                let cellBg = isToday ? 'bg-sky-50/30' : '';
                let cellContent = null;

                if (isBlocked) {
                  cellBg = 'bg-slate-100';
                  cellContent = <span className="text-[9px] font-bold text-slate-400">BLOCKED</span>;
                } else if (job) {
                  const jColor = job.status === 'completed' || job.status === 'reviewed'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : job.status === 'ongoing' || job.status === 'in_progress'
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-sky-100 border-sky-300 text-sky-800';
                  cellBg = '';
                  cellContent = (
                    <div className={`w-full h-full p-1 rounded border text-[9px] font-bold ${jColor} truncate`}>
                      {job.customerName || 'Job'}
                    </div>
                  );
                }

                return (
                  <div
                    key={cellKey}
                    className={`h-14 border-l border-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-50/50 transition-colors ${cellBg}`}
                    onClick={() => !job && toggleBlock(dateKey, hour)}
                  >
                    {cellContent}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EarningsTab({ completedJobs, provider }) {
  const [payoutMethod, setPayoutMethod] = useState('upi');
  const [editingPayout, setEditingPayout] = useState(false);

  const todayEarnings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return completedJobs.filter(b => b.bookingDate === today).reduce((s, b) => s + (b.price || b.amount || 0), 0);
  }, [completedJobs]);

  const weekEarnings = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return completedJobs.filter(b => b.bookingDate && new Date(b.bookingDate) >= weekStart).reduce((s, b) => s + (b.price || b.amount || 0), 0);
  }, [completedJobs]);

  const monthEarnings = useMemo(() => {
    const now = new Date();
    return completedJobs.filter(b => {
      if (!b.bookingDate) return false;
      const d = new Date(b.bookingDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, b) => s + (b.price || b.amount || 0), 0);
  }, [completedJobs]);

  const lifetimeEarnings = useMemo(
    () => completedJobs.reduce((s, b) => s + (b.price || b.amount || 0), 0),
    [completedJobs]
  );

  const last7Days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const amt = completedJobs.filter(b => b.bookingDate === dateStr).reduce((s, b) => s + (b.price || b.amount || 0), 0);
      result.push({ day: dayName, amount: amt });
    }
    return result;
  }, [completedJobs]);

  const maxBar = Math.max(...last7Days.map(d => d.amount), 1);

  const payoutHistory = useMemo(() => {
    return completedJobs.slice(0, 8).map(b => ({
      id: b.id,
      date: b.bookingDate || '—',
      amount: b.price || b.amount || 0,
      status: Math.random() > 0.3 ? 'Paid' : 'Processing',
      method: 'UPI',
    }));
  }, [completedJobs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="enterprise-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">₹{todayEarnings.toLocaleString()}</p>
        </div>
        <div className="enterprise-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-sky-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">This Week</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">₹{weekEarnings.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1 text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[11px] font-bold">+12%</span>
          </div>
        </div>
        <div className="enterprise-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-teal-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">This Month</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">₹{monthEarnings.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1 text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[11px] font-bold">+8%</span>
          </div>
        </div>
        <div className="enterprise-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lifetime</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">₹{lifetimeEarnings.toLocaleString()}</p>
        </div>
      </div>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Earnings Last 7 Days</h3>
        <div className="flex items-end gap-2 h-40">
          {last7Days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-600">₹{d.amount}</span>
              <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-400 to-sky-300 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(d.amount / maxBar) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Payout Method</h3>
          <button onClick={() => setEditingPayout(!editingPayout)} className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            <Edit3 className="w-3.5 h-3.5" />
            {editingPayout ? 'Save' : 'Edit'}
          </button>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">UPI &middot; provider@upi</p>
            <p className="text-xs text-slate-500 font-medium">Instant settlements</p>
          </div>
          <span className="enterprise-badge enterprise-badge-success">Active</span>
        </div>
      </div>

      <div className="enterprise-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Method</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-slate-600">{p.date}</td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-900">₹{p.amount.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      p.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600 font-medium">{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReviewsTab({ provider }) {
  const reviews = provider?.reviews || [];
  const rating = provider?.rating || 4.8;
  const totalReviews = reviews.length || 24;

  const breakdown = [
    { stars: 5, pct: 60 },
    { stars: 4, pct: 25 },
    { stars: 3, pct: 10 },
    { stars: 2, pct: 3 },
    { stars: 1, pct: 2 },
  ];

  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="enterprise-card p-6 flex flex-col items-center justify-center">
          <p className="text-5xl font-extrabold text-slate-900">{rating.toFixed(1)}</p>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-5 h-5 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
          <p className="text-sm font-medium text-slate-500 mt-2">{totalReviews} reviews</p>
        </div>

        <div className="enterprise-card p-6 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Rating Breakdown</h3>
          <div className="space-y-2.5">
            {breakdown.map(b => (
              <div key={b.stars} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 w-8">{b.stars} ★</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 w-10 text-right">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <EmptyState icon={Star} title="No Reviews Yet" description="Customer reviews will appear here." />
        ) : (
          reviews.map(review => (
            <div key={review.id} className="enterprise-card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{review.reviewerName || 'Customer'}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{review.serviceCategory || 'Service'} &middot; {review.date || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{review.comment || 'No comment'}</p>

              <div className="mt-3 pt-3 border-t border-slate-50">
                {replyTo === review.id ? (
                  <div className="flex gap-2">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="enterprise-input text-sm flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => { setReplyTo(null); setReplyText(''); }}
                      className="enterprise-btn-primary !px-3 text-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setReplyTo(null); setReplyText(''); }}
                      className="enterprise-btn-secondary !px-3 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyTo(review.id)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Reply
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ServicesTab({ provider, services }) {
  const [serviceList, setServiceList] = useState(() => {
    const base = [
      { id: 's1', name: 'Electrical Repair', price: 500, active: true, category: 'Electrician' },
      { id: 's2', name: 'Wiring Installation', price: 1500, active: true, category: 'Electrician' },
      { id: 's3', name: 'Switch Board Repair', price: 350, active: true, category: 'Electrician' },
      { id: 's4', name: 'Fan Installation', price: 400, active: false, category: 'Electrician' },
      { id: 's5', name: 'Inverter Setup', price: 2000, active: true, category: 'Electrician' },
    ];
    return base;
  });

  const [serviceRadius, setServiceRadius] = useState(15);
  const [skills, setSkills] = useState(['Smart Switches', 'Inverter Repair', '3-Phase Wiring']);

  const toggleService = (id) => {
    setServiceList(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const updatePrice = (id, price) => {
    setServiceList(prev => prev.map(s => s.id === id ? { ...s, price: Number(price) || 0 } : s));
  };

  return (
    <div className="space-y-6">
      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Services Offered</h3>
          <span className="text-xs text-slate-500 font-medium">{serviceList.filter(s => s.active).length} of {serviceList.length} active</span>
        </div>
        <div className="space-y-3">
          {serviceList.map(s => (
            <div key={s.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              s.active ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100 opacity-60'
            }`}>
              <button onClick={() => toggleService(s.id)} className="shrink-0">
                {s.active ? (
                  <ToggleRight className="w-8 h-8 text-sky-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-300" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{s.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">{s.category}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-600">₹</span>
                <input
                  type="number"
                  value={s.price}
                  onChange={e => updatePrice(s.id, e.target.value)}
                  className="w-24 enterprise-input text-sm text-right !py-1.5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Service Area Radius</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="5"
            max="50"
            value={serviceRadius}
            onChange={e => setServiceRadius(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-sky-400"
          />
          <div className="w-20 enterprise-input text-center text-sm font-bold !py-1.5">{serviceRadius} km</div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1.5 px-1">
          <span>5 km</span>
          <span>50 km</span>
        </div>
      </div>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Skills & Certifications</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, i) => (
            <span key={i} className="enterprise-badge enterprise-badge-info flex items-center gap-1.5">
              {skill}
              <button onClick={() => setSkills(prev => prev.filter((_, j) => j !== i))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Add a skill or certification..."
            className="enterprise-input text-sm flex-1"
            onKeyDown={e => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                setSkills(prev => [...prev, e.target.value.trim()]);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Upload Documents</h3>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-sky-300 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Click to upload or drag files here</p>
          <p className="text-xs text-slate-400 font-medium mt-1">PDF, JPG, PNG up to 5MB</p>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ provider, currentUser, updateProviderProfile }) {
  const [bio, setBio] = useState(provider?.bio || 'Professional service provider with years of experience.');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const documents = [
    { id: 'd1', name: 'Aadhaar Card', type: 'ID Proof', status: 'verified' },
    { id: 'd2', name: 'Electrical License', type: 'Certification', status: 'verified' },
    { id: 'd3', name: 'PAN Card', type: 'ID Proof', status: 'pending' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProviderProfile(provider?.id, { bio });
    } catch (err) {
      // silent
    }
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="enterprise-card p-6">
        <div className="flex items-start gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700 font-extrabold text-2xl">
              {provider?.name?.charAt(0) || currentUser?.name?.charAt(0) || 'P'}
            </div>
            <button className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">{provider?.name || currentUser?.name}</h3>
            <p className="text-sm text-slate-500 font-medium">{currentUser?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {provider?.isVerified ? (
                <span className="enterprise-badge enterprise-badge-success flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="enterprise-badge enterprise-badge-warning flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Bio</h3>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            {editing ? <><Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
          </button>
        </div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          disabled={!editing}
          rows={4}
          className={`enterprise-input text-sm resize-none ${!editing ? 'bg-slate-50 cursor-default' : ''}`}
        />
      </div>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Documents</h3>
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">{doc.type}</p>
              </div>
              <span className={`enterprise-badge ${
                doc.status === 'verified' ? 'enterprise-badge-success' :
                doc.status === 'pending' ? 'enterprise-badge-warning' :
                'enterprise-badge-danger'
              } flex items-center gap-1`}>
                {doc.status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                {doc.status === 'pending' && <Clock className="w-3 h-3" />}
                {doc.status === 'rejected' && <X className="w-3 h-3" />}
                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 transition-colors cursor-pointer">
          <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
          <p className="text-sm font-semibold text-slate-600">Upload New Document</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">ID Proof, Certifications, License</p>
        </div>
      </div>

      <div className="enterprise-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Background Check</p>
            <p className="text-xs text-slate-500 font-medium">Last verified: Jan 2026</p>
          </div>
          <span className="enterprise-badge enterprise-badge-success">Passed</span>
        </div>
      </div>
    </div>
  );
}

function HelpTab({ tickets, currentUser, submitSupportTicket }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [showFaq, setShowFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) return;
    submitSupportTicket({ name: currentUser?.name, email: currentUser?.email, subject, message });
    setSubject('');
    setMessage('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const faqs = [
    {
      q: 'How do I accept or decline a job request?',
      a: 'When a new job request comes in, you\'ll see it on your Dashboard or under Job Requests > New Requests. You have 60 seconds to accept or decline before it auto-declines. Click "Accept" to take the job or "Decline" to pass.',
    },
    {
      q: 'When do I get paid after completing a job?',
      a: 'Payments are processed within 24 hours of job completion. The amount is transferred to your registered UPI or bank account. You can track all payouts under Earnings & Payouts.',
    },
    {
      q: 'How do I update my availability and service areas?',
      a: 'Go to My Schedule to block off unavailable times. You can also set your Online/Offline status from the top bar toggle. Service area radius can be adjusted under My Services & Pricing.',
    },
    {
      q: 'What happens if a customer leaves a bad review?',
      a: 'You can reply to any review from the Reviews & Ratings tab. If you believe a review violates our policies, contact support with the review details and we\'ll investigate.',
    },
  ];

  const userTickets = useMemo(
    () => tickets.filter(t => t.requesterEmail === currentUser?.email || t.email === currentUser?.email),
    [tickets, currentUser]
  );

  return (
    <div className="space-y-6">
      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFaq(showFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-800 pr-4">{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${showFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {showFaq === i && (
                <div className="px-4 pb-4 text-sm text-slate-600 font-medium leading-relaxed enterprise-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Contact Support</h3>
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 enterprise-scale-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-bold text-emerald-700">Support ticket submitted successfully!</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="enterprise-label">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="enterprise-input"
              required
            />
          </div>
          <div>
            <label className="enterprise-label">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={4}
              className="enterprise-input resize-none"
              required
            />
          </div>
          <button type="submit" className="enterprise-btn-primary">
            <Send className="w-4 h-4" />
            Submit Ticket
          </button>
        </form>
      </div>

      {userTickets.length > 0 && (
        <div className="enterprise-card overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Your Support Tickets</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {userTickets.map(ticket => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-slate-900">{ticket.subject || 'Support Request'}</p>
                  <span className={`enterprise-badge ${
                    ticket.status === 'resolved' ? 'enterprise-badge-success' :
                    ticket.status === 'open' ? 'enterprise-badge-info' :
                    'enterprise-badge-warning'
                  }`}>
                    {ticket.status || 'Open'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">{ticket.message}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderDashboard;
