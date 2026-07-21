import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  LayoutDashboard, History, Users, ShieldCheck, Activity, CreditCard,
  Star, BarChart3, Settings, LogOut, Menu, X, Bell, ChevronDown,
  Search, ChevronLeft, ChevronRight, Download, RefreshCw, CheckCircle,
  AlertTriangle, ArrowUpRight, ArrowDownRight, DollarSign, Briefcase,
  UserPlus, TrendingUp, Eye, Ban, UserCheck, Check, PenSquare,
  Plus, Trash2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  Clock, FileText, Flag, MessageSquare, ExternalLink, Filter,
  MoreHorizontal, Mail, Phone, MapPin, Calendar, Circle
} from 'lucide-react';
import { useAdminPanelController } from '../hooks/useAdminPanelController';
import { StatusPill, Pagination, Drawer } from '../components/ui';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: History },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'providers', label: 'Providers', icon: ShieldCheck },
  { id: 'services', label: 'Services & Categories', icon: Activity },
  { id: 'payments', label: 'Payments & Payouts', icon: CreditCard },
  { id: 'reviews', label: 'Reviews & Disputes', icon: Star },
  { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function KPICard({ icon: Icon, value, label, trend, trendUp, color }) {
  return (
    <div className="enterprise-card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${color || 'bg-brand-50'}`}>
        <Icon className="w-5 h-5 text-brand-600" />
      </div>
      <div className="min-w-0">
        <span className="block text-2xl font-black text-slate-900 truncate">{value}</span>
        <span className="block text-[11px] text-slate-500 font-semibold mt-0.5">{label}</span>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-1 ${trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

const LABEL_CLS = 'block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1';
const VALUE_CLS = 'text-sm font-semibold text-slate-900';

export const AdminPanel = ({ activeTab: activeTabProp, setActiveTabExternal }) => {
  const ctrl = useAdminPanelController();

  const [internalActiveTab, setInternalActiveTab] = useState('dashboard');
  const isControlledTabs = activeTabProp !== undefined && activeTabProp !== null;
  const activeTab = isControlledTabs ? activeTabProp : internalActiveTab;
  const setActiveTab = isControlledTabs
    ? (typeof setActiveTabExternal === 'function' ? setActiveTabExternal : setInternalActiveTab)
    : setInternalActiveTab;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  // Dashboard state
  const [alertsDismissed, setAlertsDismissed] = useState([]);

  // Bookings state
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingDateFrom, setBookingDateFrom] = useState('');
  const [bookingDateTo, setBookingDateTo] = useState('');
  const [bookingCategory, setBookingCategory] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const perPage = 10;

  const bookingCategories = useMemo(() => {
    const cats = new Set();
    (ctrl.bookings || []).forEach(b => cats.add(b.serviceCategory));
    return Array.from(cats).filter(Boolean);
  }, [ctrl.bookings]);

  const filteredBookings = useMemo(() => {
    return ctrl.filterBookings({
      status: bookingStatusFilter,
      search: bookingSearch,
      dateFrom: bookingDateFrom || undefined,
      dateTo: bookingDateTo || undefined,
      category: bookingCategory,
    });
  }, [ctrl, bookingStatusFilter, bookingSearch, bookingDateFrom, bookingDateTo, bookingCategory]);

  const paginatedBookings = useMemo(() => {
    const start = (bookingPage - 1) * perPage;
    return filteredBookings.slice(start, start + perPage);
  }, [filteredBookings, bookingPage]);

  const totalBookingPages = Math.ceil(filteredBookings.length / perPage) || 1;

  // Customers state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = useMemo(() => {
    return ctrl.filterCustomers({ search: customerSearch });
  }, [ctrl, customerSearch]);

  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * perPage;
    return filteredCustomers.slice(start, start + perPage);
  }, [filteredCustomers, customerPage]);

  const totalCustomerPages = Math.ceil(filteredCustomers.length / perPage) || 1;

  // Providers state
  const [providerSearch, setProviderSearch] = useState('');
  const [providerVFilter, setProviderVFilter] = useState('all');
  const [providerPage, setProviderPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  const pendingProviders = useMemo(() => {
    return (ctrl.providerServiceRequests || []).filter(r => r.status === 'PENDING');
  }, [ctrl.providerServiceRequests]);

  const filteredProviders = useMemo(() => {
    return ctrl.filterProviders({ search: providerSearch, verificationStatus: providerVFilter });
  }, [ctrl, providerSearch, providerVFilter]);

  const paginatedProviders = useMemo(() => {
    const start = (providerPage - 1) * perPage;
    return filteredProviders.slice(start, start + perPage);
  }, [filteredProviders, providerPage]);

  const totalProviderPages = Math.ceil(filteredProviders.length / perPage) || 1;

  // Services state
  const [serviceSearch, setServiceSearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Payments state
  const [paymentTab, setPaymentTab] = useState('overview');

  // Reviews state
  const [reviewTab, setReviewTab] = useState('reviews');

  // Analytics state
  const [analyticsDateRange, setAnalyticsDateRange] = useState('30d');

  // Settings state
  const [settingsCities, setSettingsCities] = useState(['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi NCR']);
  const [newCity, setNewCity] = useState('');
  const [cancelPolicy, setCancelPolicy] = useState('Free cancellation up to 24 hours before the scheduled service. Late cancellations may incur a 50% charge.');
  const [notifTemplates, setNotifTemplates] = useState({
    bookingConfirm: 'Your booking has been confirmed! We\'ll notify you when the provider is on the way.',
    reminder: 'Reminder: You have a service scheduled tomorrow at {time}.',
    postService: 'How was your service? Rate your experience now.',
  });
  const [adminUsers] = useState([
    { id: 1, name: 'Admin User', email: 'admin@servego.com', role: 'Super Admin' },
  ]);

  const metrics = ctrl.getMetrics();

  // Overview chart data
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((d, i) => ({
      day: d,
      value: Math.floor(Math.random() * 80) + 20 + (i === 6 ? 15 : 0),
    }));
  }, []);

  const categoryChartData = useMemo(() => {
    const cats = {};
    (ctrl.bookings || []).forEach(b => {
      const cat = b.serviceCategory || 'Other';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return Object.entries(cats).map(([name, count]) => ({ name, count }));
  }, [ctrl.bookings]);

  const recentActivity = useMemo(() => {
    const items = [];
    (ctrl.bookings || []).slice(0, 3).forEach(b => {
      items.push({ type: 'booking', text: `Booking ${b.id} ${b.status}`, time: b.bookingDate, icon: History, color: 'text-brand-600' });
    });
    (ctrl.providerServiceRequests || []).slice(0, 2).forEach(r => {
      items.push({ type: 'verification', text: `Provider verification ${r.status}`, time: r.createdAt, icon: ShieldCheck, color: 'text-amber-600' });
    });
    if (items.length === 0) {
      items.push({ type: 'info', text: 'No recent activity', time: '', icon: Activity, color: 'text-slate-400' });
    }
    return items;
  }, [ctrl.bookings, ctrl.providerServiceRequests]);

  useEffect(() => { setBookingPage(1); }, [bookingStatusFilter, bookingSearch, bookingDateFrom, bookingDateTo, bookingCategory]);
  useEffect(() => { setCustomerPage(1); }, [customerSearch]);
  useEffect(() => { setProviderPage(1); }, [providerSearch, providerVFilter]);

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (['pending', 'open'].includes(s)) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (['confirmed', 'in-progress', 'ongoing'].includes(s)) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (['completed', 'verified', 'active', 'resolved'].includes(s)) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (['cancelled', 'declined', 'rejected', 'suspended'].includes(s)) return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-slate-900 flex items-center justify-between px-4 py-3 lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-white font-extrabold text-sm">ServeGo Admin</span>
        <button className="text-white/70 p-1 relative">
          <Bell className="w-5 h-5" />
          {ctrl.notifications?.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">{ctrl.notifications.length}</span>
          )}
        </button>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-white font-extrabold text-lg tracking-tight block">ServeGo</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white lg:hidden"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Operations Center</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive ? 'bg-sky-400/10 text-sky-400 shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={() => ctrl.logout?.()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all">
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:pt-0 pt-14">
        {/* Top bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900 capitalize">{NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}</span>
            <span className="text-[10px] text-slate-400 ml-2 font-medium">Admin Console</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              {(ctrl.notifications?.length || 0) > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">{ctrl.notifications?.length}</span>
              )}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-extrabold">
                {ctrl.currentUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="text-xs">
                <span className="block font-extrabold text-slate-900 leading-tight">{ctrl.currentUser?.name || 'Admin'}</span>
                <span className="block text-[10px] text-slate-500 font-medium">{ctrl.currentUser?.email || ''}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* ===================== DASHBOARD ===================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 enterprise-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time platform overview</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                <KPICard icon={History} value={metrics.totalBookingsToday} label="Bookings Today" color="bg-sky-50" />
                <KPICard icon={DollarSign} value={formatCurrency(metrics.todayRevenue)} label="Revenue Today" color="bg-emerald-50" />
                <KPICard icon={Briefcase} value={metrics.activeProviders} label="Active Providers" color="bg-teal-50" />
                <KPICard icon={UserPlus} value={metrics.newCustomers} label="New Customers" color="bg-amber-50" />
                <KPICard icon={Star} value={metrics.avgRating} label="Avg Rating" color="bg-purple-50" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 enterprise-card p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4">Bookings Over Time (7 days)</h3>
                  <div className="flex items-end gap-2 h-40">
                    {chartData.map((d) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-sky-100 rounded-t-md relative" style={{ height: `${d.value}%` }}>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] font-bold text-slate-600">{d.value}</div>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-500">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="enterprise-card p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4">Bookings by Category</h3>
                  <div className="space-y-3">
                    {categoryChartData.slice(0, 6).map((cat) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{cat.name}</span>
                        <span className="text-xs font-bold text-slate-900">{cat.count}</span>
                      </div>
                    ))}
                    {categoryChartData.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No data yet</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="enterprise-card p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50">
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${a.color}`} />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{a.text}</p>
                            {a.time && <span className="text-[10px] text-slate-400 font-medium">{formatDate(a.time)}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="enterprise-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-slate-900">Alerts</h3>
                    <button onClick={() => setAlertsDismissed([])} className="text-[10px] font-bold text-sky-500 hover:underline">Reset</button>
                  </div>
                  <div className="space-y-2">
                    {ctrl.pendingPartnersCount > 0 && !alertsDismissed.includes('pending') && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-amber-800">{ctrl.pendingPartnersCount} provider(s) awaiting verification</p>
                          <button onClick={() => setActiveTab('providers')} className="text-[10px] font-bold text-amber-700 hover:underline mt-1">Review queue</button>
                        </div>
                        <button onClick={() => setAlertsDismissed(prev => [...prev, 'pending'])} className="text-amber-400 hover:text-amber-600"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                    {ctrl.activeTicketsCount > 0 && !alertsDismissed.includes('tickets') && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200">
                        <MessageSquare className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-rose-800">{ctrl.activeTicketsCount} open support ticket(s)</p>
                          <button onClick={() => setActiveTab('bookings')} className="text-[10px] font-bold text-rose-700 hover:underline mt-1">View tickets</button>
                        </div>
                        <button onClick={() => setAlertsDismissed(prev => [...prev, 'tickets'])} className="text-rose-400 hover:text-rose-600"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                    {alertsDismissed.includes('pending') && alertsDismissed.includes('tickets') && (
                      <p className="text-xs text-slate-400 italic text-center py-6">All clear!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== BOOKINGS ===================== */}
          {activeTab === 'bookings' && (
            <div className="space-y-5 enterprise-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">All Bookings</h2>
                  <p className="text-xs text-slate-500">{filteredBookings.length} total bookings</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const csv = [['ID','Customer','Provider','Service','Date','Amount','Status']].concat(
                      filteredBookings.map(b => [b.id, b.customerName, b.providerName, b.serviceCategory, b.bookingDate, b.totalAmount, b.status])
                    ).map(r => r.join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'bookings.csv'; a.click();
                    URL.revokeObjectURL(url);
                  }} className="enterprise-btn-secondary !text-xs !py-2 !px-4">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                  <button onClick={() => setSelectedBookingIds(prev => prev.length === filteredBookings.length ? [] : filteredBookings.map(b => b.id))}
                    className="enterprise-btn-secondary !text-xs !py-2 !px-4">
                    <Filter className="w-3.5 h-3.5" /> {selectedBookingIds.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row flex-wrap gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} placeholder="Search by ID, customer, provider..."
                    className="enterprise-input !pl-9 w-full" />
                </div>
                <select value={bookingStatusFilter} onChange={e => setBookingStatusFilter(e.target.value)}
                  className="enterprise-input max-w-[140px]">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select value={bookingCategory} onChange={e => setBookingCategory(e.target.value)}
                  className="enterprise-input max-w-[160px]">
                  <option value="all">All Categories</option>
                  {bookingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" value={bookingDateFrom} onChange={e => setBookingDateFrom(e.target.value)}
                  className="enterprise-input max-w-[150px]" />
                <input type="date" value={bookingDateTo} onChange={e => setBookingDateTo(e.target.value)}
                  className="enterprise-input max-w-[150px]" />
              </div>

              <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3 px-4 w-8"><input type="checkbox" className="rounded" onChange={e => {
                          if (e.target.checked) setSelectedBookingIds(paginatedBookings.map(b => b.id));
                          else setSelectedBookingIds([]);
                        }} checked={paginatedBookings.length > 0 && selectedBookingIds.length === paginatedBookings.length} /></th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">ID</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Customer</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Provider</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Service</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Date</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Amount</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedBookings.length === 0 && (
                        <tr><td colSpan={8} className="py-12 text-center text-xs text-slate-400 italic">No bookings found.</td></tr>
                      )}
                      {paginatedBookings.map(b => (
                        <tr key={b.id} onClick={() => setSelectedBooking(b)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="py-3 px-4"><input type="checkbox" className="rounded"
                            checked={selectedBookingIds.includes(b.id)} onChange={e => { e.stopPropagation();
                              setSelectedBookingIds(prev => prev.includes(b.id) ? prev.filter(x => x !== b.id) : [...prev, b.id]); }} /></td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[10px]">{b.id}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{b.customerName}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{b.providerName}</td>
                          <td className="py-3 px-4 text-slate-600">{b.serviceCategory}</td>
                          <td className="py-3 px-4 text-slate-500 text-[10px]">{b.bookingDate}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(b.totalAmount)}</td>
                          <td className="py-3 px-4"><StatusPill status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-100">
                  <Pagination page={bookingPage} totalPages={totalBookingPages} onPageChange={setBookingPage} />
                </div>
              </div>

              <Drawer isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title={`Booking ${selectedBooking?.id}`}>
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className={LABEL_CLS}>Customer</span><span className={VALUE_CLS}>{selectedBooking?.customerName}</span></div>
                      <div><span className={LABEL_CLS}>Provider</span><span className={VALUE_CLS}>{selectedBooking?.providerName}</span></div>
                      <div><span className={LABEL_CLS}>Service</span><span className={VALUE_CLS}>{selectedBooking?.serviceCategory}</span></div>
                      <div><span className={LABEL_CLS}>Status</span><StatusPill status={selectedBooking?.status} /></div>
                      <div><span className={LABEL_CLS}>Date</span><span className={VALUE_CLS}>{selectedBooking?.bookingDate}</span></div>
                      <div><span className={LABEL_CLS}>Amount</span><span className={VALUE_CLS}>{formatCurrency(selectedBooking?.totalAmount)}</span></div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex gap-2">
                      {selectedBooking?.status !== 'completed' && selectedBooking?.status !== 'cancelled' && (
                        <button onClick={() => {
                          ctrl.updateBookingStatus(selectedBooking.id, 'cancelled', 'Admin override cancellation.');
                          setSelectedBooking(null);
                        }} className="enterprise-btn-danger !text-xs !py-2 !px-4">
                          Cancel Booking
                        </button>
                      )}
                      <button onClick={() => setSelectedBooking(null)} className="enterprise-btn-secondary !text-xs !py-2 !px-4">Close</button>
                    </div>
                  </div>
              </Drawer>

            </div>
          )}

          {/* ===================== CUSTOMERS ===================== */}
          {activeTab === 'customers' && (
            <div className="space-y-5 enterprise-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Customer Management</h2>
                  <p className="text-xs text-slate-500">{filteredCustomers.length} customers</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search by name or email..."
                    className="enterprise-input !pl-9 w-full" />
                </div>
              </div>

              <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Name</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Email</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Joined</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Bookings</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Spent</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedCustomers.length === 0 && (
                        <tr><td colSpan={7} className="py-12 text-center text-xs text-slate-400 italic">No customers found.</td></tr>
                      )}
                      {paginatedCustomers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[9px] font-extrabold">{u.name?.charAt(0) || '?'}</div>
                            {u.name}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{u.email}</td>
                          <td className="py-3 px-4 text-slate-500 text-[10px]">{formatDate(u.createdAt || u.joinDate)}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{u.totalBookings || (ctrl.bookings || []).filter(b => b.customerId === u.id).length || '—'}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(u.totalSpent)}</td>
                          <td className="py-3 px-4"><StatusPill status={u.status || 'active'} /></td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1.5">
                              <button onClick={() => setSelectedCustomer(u)} className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5"><Eye className="w-3 h-3" /></button>
                              <button className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5 !text-amber-600 !border-amber-200"><Ban className="w-3 h-3" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-100">
                  <Pagination page={customerPage} totalPages={totalCustomerPages} onPageChange={setCustomerPage} />
                </div>
              </div>

              <Drawer isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={`Customer: ${selectedCustomer?.name}`}>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-lg font-extrabold">{selectedCustomer?.name?.charAt(0) || '?'}</div>
                      <div>
                        <h4 className="font-extrabold text-slate-900">{selectedCustomer?.name}</h4>
                        <span className="text-xs text-slate-500">{selectedCustomer?.email}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><span className={LABEL_CLS}>Phone</span><span className={VALUE_CLS}>{selectedCustomer?.phone || '—'}</span></div>
                      <div><span className={LABEL_CLS}>Joined</span><span className={VALUE_CLS}>{formatDate(selectedCustomer?.createdAt || selectedCustomer?.joinDate)}</span></div>
                      <div><span className={LABEL_CLS}>Status</span><StatusPill status={selectedCustomer?.status || 'active'} /></div>
                      <div><span className={LABEL_CLS}>Role</span><span className={VALUE_CLS}>{selectedCustomer?.role || 'customer'}</span></div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex gap-2">
                      <button className="enterprise-btn-primary !text-xs !py-2 !px-4">Send Email</button>
                      <button className="enterprise-btn-secondary !text-xs !py-2 !px-4 !text-rose-600 !border-rose-200">Suspend</button>
                    </div>
                  </div>
              </Drawer>

            </div>
          )}

          {/* ===================== PROVIDERS ===================== */}
          {activeTab === 'providers' && (
            <div className="space-y-6 enterprise-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Provider Management</h2>
                <p className="text-xs text-slate-500">{filteredProviders.length} providers</p>
              </div>

              {pendingProviders.length > 0 && (
                <div className="enterprise-card p-5 border-l-4 border-l-amber-400">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Verification Queue ({pendingProviders.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-4">Providers awaiting document verification and approval</p>
                  <div className="space-y-3">
                    {pendingProviders.map(r => (
                      <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-slate-900 block">{r.providerName || r.name || 'Unknown'}</span>
                            <span className="text-[10px] text-slate-500">Submitted {formatDate(r.createdAt)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              await ctrl.approveProvider(r.id);
                            }} className="enterprise-btn-primary !py-1.5 !px-4 !text-xs !bg-emerald-500 hover:!bg-emerald-600">
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => setRejectingId(r.id === rejectingId ? null : r.id)}
                              className="enterprise-btn-secondary !py-1.5 !px-4 !text-xs !text-rose-600 !border-rose-200">
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </div>
                        {rejectingId === r.id && (
                          <div className="mt-3 flex gap-2 items-start">
                            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..."
                              className="enterprise-input flex-1 !py-1.5 !text-xs" />
                            <button onClick={async () => {
                              if (!rejectReason.trim()) return;
                              await ctrl.rejectProvider(r.id, rejectReason);
                              setRejectingId(null);
                              setRejectReason('');
                            }} className="enterprise-btn-danger !py-1.5 !px-3 !text-xs">Submit</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input value={providerSearch} onChange={e => setProviderSearch(e.target.value)} placeholder="Search providers..."
                    className="enterprise-input !pl-9 w-full" />
                </div>
                <select value={providerVFilter} onChange={e => setProviderVFilter(e.target.value)}
                  className="enterprise-input max-w-[160px]">
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Name</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Category</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Rating</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Jobs</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Earnings</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedProviders.length === 0 && (
                        <tr><td colSpan={7} className="py-12 text-center text-xs text-slate-400 italic">No providers found.</td></tr>
                      )}
                      {paginatedProviders.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedProvider(p)}>
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[9px] font-extrabold">{p.name?.charAt(0) || '?'}</div>
                            {p.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{p.category}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.rating || '—'}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{p.jobsCompleted || '—'}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.earnings)}</td>
                          <td className="py-3 px-4"><StatusPill status={p.isVerified ? 'verified' : 'pending'} /></td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setSelectedProvider(p)} className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5"><Eye className="w-3 h-3" /></button>
                              <button className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5 !text-rose-600 !border-rose-200"><Ban className="w-3 h-3" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-100">
                  <Pagination page={providerPage} totalPages={totalProviderPages} onPageChange={setProviderPage} />
                </div>
              </div>

              <Drawer isOpen={!!selectedProvider} onClose={() => setSelectedProvider(null)} title={`Provider: ${selectedProvider?.name}`}>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-extrabold">{selectedProvider?.name?.charAt(0) || '?'}</div>
                      <div>
                        <h4 className="font-extrabold text-slate-900">{selectedProvider?.name}</h4>
                        <span className="text-xs text-slate-500">{selectedProvider?.email}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><span className={LABEL_CLS}>Category</span><span className={VALUE_CLS}>{selectedProvider?.category}</span></div>
                      <div><span className={LABEL_CLS}>Rating</span><span className={VALUE_CLS}>{selectedProvider?.rating || '—'} / 5</span></div>
                      <div><span className={LABEL_CLS}>Jobs</span><span className={VALUE_CLS}>{selectedProvider?.jobsCompleted || 0}</span></div>
                      <div><span className={LABEL_CLS}>Earnings</span><span className={VALUE_CLS}>{formatCurrency(selectedProvider?.earnings)}</span></div>
                      <div><span className={LABEL_CLS}>Phone</span><span className={VALUE_CLS}>{selectedProvider?.phone || '—'}</span></div>
                      <div><span className={LABEL_CLS}>Status</span><StatusPill status={selectedProvider?.isVerified ? 'verified' : 'pending'} /></div>
                    </div>
                    {selectedProvider?.serviceAreas && (
                      <div>
                        <span className={LABEL_CLS}>Service Areas</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedProvider.serviceAreas.map(a => (
                            <span key={a} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-4 border-t border-slate-100 flex gap-2">
                      <button onClick={() => ctrl.handlePartnerApproval(selectedProvider.id)}
                        className="enterprise-btn-primary !text-xs !py-2 !px-4">
                        {selectedProvider?.isVerified ? 'Revoke Verification' : 'Verify Provider'}
                      </button>
                      <button className="enterprise-btn-secondary !text-xs !py-2 !px-4 !text-rose-600 !border-rose-200">Deactivate</button>
                    </div>
                  </div>
              </Drawer>

            </div>
          )}

          {/* ===================== SERVICES ===================== */}
          {activeTab === 'services' && (
            <div className="space-y-5 enterprise-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Service Catalog</h2>
                  <p className="text-xs text-slate-500">Manage service categories</p>
                </div>
                <button onClick={() => setShowAddCategory(!showAddCategory)}
                  className="enterprise-btn-primary !text-xs !py-2 !px-4">
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>

              {showAddCategory && (
                <div className="enterprise-card p-5 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900">New Category</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Name</label>
                      <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Electrician"
                        className="enterprise-input" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Description</label>
                      <input value={newCategoryDesc} onChange={e => setNewCategoryDesc(e.target.value)} placeholder="Brief description"
                        className="enterprise-input" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      ctrl.createService({ role: 'admin', name: newCategoryName.trim(), description: newCategoryDesc.trim() });
                      setNewCategoryName(''); setNewCategoryDesc(''); setShowAddCategory(false);
                    }} className="enterprise-btn-primary !text-xs !py-2 !px-4">Create</button>
                    <button onClick={() => setShowAddCategory(false)} className="enterprise-btn-secondary !text-xs !py-2 !px-4">Cancel</button>
                  </div>
                </div>
              )}

              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} placeholder="Search services..."
                  className="enterprise-input !pl-9 w-full" />
              </div>

              <div className="space-y-3">
                {(Array.isArray(ctrl.services) ? ctrl.services : [])
                  .filter(s => !serviceSearch || s.name?.toLowerCase().includes(serviceSearch.toLowerCase()))
                  .map(cat => (
                    <div key={cat.id} className="enterprise-card p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {editingCatId === cat.id ? (
                            <div className="space-y-2">
                              <input value={editCatName} onChange={e => setEditCatName(e.target.value)}
                                className="enterprise-input !py-1 !text-sm font-bold" />
                              <input value={editCatDesc} onChange={e => setEditCatDesc(e.target.value)}
                                className="enterprise-input !py-1 !text-xs" />
                            </div>
                          ) : (
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm">{cat.name}</h3>
                              {cat.description && <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingCatId === cat.id ? (
                            <>
                              <button onClick={() => {
                                ctrl.updateService(cat.id, { name: editCatName, description: editCatDesc });
                                setEditingCatId(null);
                              }} className="enterprise-btn-primary !text-[10px] !py-1 !px-3">Save</button>
                              <button onClick={() => setEditingCatId(null)} className="enterprise-btn-secondary !text-[10px] !py-1 !px-3">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatDesc(cat.description || ''); }}
                                className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5"><PenSquare className="w-3 h-3" /></button>
                              <button onClick={() => ctrl.hideService(cat.id, !cat.isHidden)}
                                className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5"
                                title={cat.isHidden ? 'Show' : 'Hide'}>
                                {cat.isHidden ? <ToggleLeft className="w-3 h-3 text-rose-500" /> : <ToggleRight className="w-3 h-3 text-emerald-500" />}
                              </button>
                              <button onClick={() => ctrl.deleteService(cat.id)}
                                className="enterprise-btn-danger !text-[10px] !py-1 !px-2.5"><Trash2 className="w-3 h-3" /></button>
                            </>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 px-2">{cat.popularIssues?.length || 0} issues</span>
                        </div>
                      </div>
                      {cat.popularIssues && cat.popularIssues.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {cat.popularIssues.map((issue, i) => (
                            <span key={i} className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-semibold">{issue}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ===================== PAYMENTS ===================== */}
          {activeTab === 'payments' && (
            <div className="space-y-5 enterprise-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Payments & Payouts</h2>
                <p className="text-xs text-slate-500">Platform revenue, provider payouts, and refunds</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="enterprise-card p-5">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Total Revenue</span>
                  <span className="block text-2xl font-black text-slate-900 mt-1">{formatCurrency(ctrl.totalVolume)}</span>
                </div>
                <div className="enterprise-card p-5">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Admin Commission</span>
                  <span className="block text-2xl font-black text-slate-900 mt-1">{formatCurrency(ctrl.administrativeEarnings)}</span>
                </div>
                <div className="enterprise-card p-5">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Pending Payouts</span>
                  <span className="block text-2xl font-black text-slate-900 mt-1">₹0</span>
                </div>
              </div>

              <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
                {['overview', 'queue', 'transactions', 'refunds', 'commission'].map(tab => (
                  <button key={tab} onClick={() => setPaymentTab(tab)}
                    className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${paymentTab === tab ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-800'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div>
                {paymentTab === 'commission' && (
                  <div className="enterprise-card p-5 max-w-md">
                    <h3 className="text-sm font-extrabold text-slate-900 mb-4">Commission Rate Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className={LABEL_CLS}>Platform Commission (%)</label>
                        <input type="number" value={ctrl.platformCommission} onChange={e => ctrl.setPlatformCommission(e.target.value)}
                          className="enterprise-input" step="0.5" min="0" max="100" />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Tax (%)</label>
                        <input type="number" value={ctrl.taxPercent} onChange={e => ctrl.setTaxPercent(e.target.value)}
                          className="enterprise-input" step="0.5" min="0" max="100" />
                      </div>
                      <button onClick={ctrl.saveCommissionSettings} className="enterprise-btn-primary !text-xs">
                        {ctrl.isSavedSettings ? 'Saved!' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {paymentTab === 'overview' && (
                  <div className="enterprise-card p-8 text-center">
                    <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Payment data will appear here as transactions are processed.</p>
                  </div>
                )}

                {(paymentTab === 'queue' || paymentTab === 'transactions') && (
                  <div className="enterprise-card">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">ID</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Provider</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Amount</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Date</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td colSpan={6} className="py-12 text-center text-xs text-slate-400 italic">No payment records yet.</td></tr>
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}

                {paymentTab === 'refunds' && (
                  <div className="enterprise-card p-8 text-center">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No refund requests pending.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== REVIEWS & DISPUTES ===================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-5 enterprise-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reviews & Disputes</h2>
                <p className="text-xs text-slate-500">Moderate flagged reviews and resolve disputes</p>
              </div>

              <div className="flex gap-2 border-b border-slate-200 pb-3">
                {['reviews', 'disputes'].map(tab => (
                  <button key={tab} onClick={() => setReviewTab(tab)}
                    className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${reviewTab === tab ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-800'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {reviewTab === 'reviews' && (
                <div className="enterprise-card p-8 text-center">
                  <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No flagged reviews requiring moderation.</p>
                </div>
              )}

              {reviewTab === 'disputes' && (
                <div className="enterprise-card p-8 text-center">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No active disputes.</p>
                </div>
              )}
            </div>
          )}

          {/* ===================== ANALYTICS ===================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-5 enterprise-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h2>
                  <p className="text-xs text-slate-500">Platform performance metrics</p>
                </div>
                <div className="flex gap-2">
                  <select value={analyticsDateRange} onChange={e => setAnalyticsDateRange(e.target.value)}
                    className="enterprise-input max-w-[120px]">
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="90d">90 days</option>
                    <option value="1y">1 year</option>
                  </select>
                  <button className="enterprise-btn-secondary !text-xs !py-2 !px-4">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="enterprise-card p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4">Revenue Trend</h3>
                  <div className="flex items-end gap-2 h-40">
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => {
                      const val = Math.floor(Math.random() * 80) + 20;
                      return (
                        <div key={m} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-brand-200 rounded-t-md" style={{ height: `${val}%` }} />
                          <span className="text-[7px] font-bold text-slate-500">{m.slice(0,3)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="enterprise-card p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4">Booking Volume by City</h3>
                  <div className="space-y-3">
                    {['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi NCR'].map(city => {
                      const val = Math.floor(Math.random() * 100);
                      return (
                        <div key={city}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-700">{city}</span>
                            <span className="font-bold text-slate-900">{val}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="enterprise-card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900">Provider Performance Leaderboard</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">#</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Provider</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Category</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Rating</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Jobs</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(ctrl.providersList || []).slice(0, 10).map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-400">{i + 1}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 text-slate-600">{p.category}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.rating || '—'}</td>
                          <td className="py-3 px-4">{p.jobsCompleted || 0}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.earnings)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="enterprise-card p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3">Customer Retention</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-emerald-600">68%</span>
                    <span className="text-xs text-slate-500">Repeat booking rate</span>
                  </div>
                </div>
                <div className="enterprise-card p-5">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3">Churn Rate</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-rose-500">12%</span>
                    <span className="text-xs text-slate-500">Monthly customer churn</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== SETTINGS ===================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 enterprise-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Settings</h2>
                <p className="text-xs text-slate-500">Configure platform-wide settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="enterprise-card p-5 space-y-5">
                  <h3 className="text-sm font-extrabold text-slate-900">Commission</h3>
                  <div>
                    <label className={LABEL_CLS}>Commission Rate (%)</label>
                    <input type="number" value={ctrl.platformCommission} onChange={e => ctrl.setPlatformCommission(e.target.value)}
                      className="enterprise-input" step="0.5" min="0" max="100" />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Tax (%)</label>
                    <input type="number" value={ctrl.taxPercent} onChange={e => ctrl.setTaxPercent(e.target.value)}
                      className="enterprise-input" step="0.5" min="0" max="100" />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Active Region</label>
                    <select value={ctrl.activeRegionHQ} onChange={e => ctrl.setActiveRegionHQ(e.target.value)}
                      className="enterprise-input">
                      {ctrl.CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button onClick={ctrl.saveCommissionSettings} className="enterprise-btn-primary !text-xs">
                    {ctrl.isSavedSettings ? 'Saved!' : 'Save'}
                  </button>
                </div>

                <div className="enterprise-card p-5 space-y-5">
                  <h3 className="text-sm font-extrabold text-slate-900">Service Areas</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {settingsCities.map(city => (
                      <span key={city} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {city}
                        <button onClick={() => setSettingsCities(prev => prev.filter(c => c !== city))} className="text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Add a city..."
                      className="enterprise-input flex-1" />
                    <button onClick={() => { if (newCity.trim() && !settingsCities.includes(newCity.trim())) { setSettingsCities(prev => [...prev, newCity.trim()]); setNewCity(''); } }}
                      className="enterprise-btn-primary !py-2 !px-4 !text-xs">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="enterprise-card p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Cancellation Policy</h3>
                <textarea value={cancelPolicy} onChange={e => setCancelPolicy(e.target.value)} rows={3}
                  className="enterprise-input" />
                <button className="enterprise-btn-primary !text-xs">Update Policy</button>
              </div>

              <div className="enterprise-card p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Notification Templates</h3>
                {Object.entries(notifTemplates).map(([key, val]) => (
                  <div key={key}>
                    <label className={LABEL_CLS}>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <textarea value={val} onChange={e => setNotifTemplates(prev => ({ ...prev, [key]: e.target.value }))} rows={2}
                      className="enterprise-input" />
                  </div>
                ))}
                <button className="enterprise-btn-primary !text-xs">Save Templates</button>
              </div>

              <div className="enterprise-card p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Admin Team</h3>
                <div className="space-y-3">
                  {adminUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-extrabold">{u.name.charAt(0)}</div>
                        <div>
                          <span className="block text-sm font-semibold text-slate-900">{u.name}</span>
                          <span className="text-[10px] text-slate-500">{u.email} · {u.role}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'Super Admin' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 lg:hidden z-30 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'services', icon: Activity, label: 'Services' },
            { id: 'providers', icon: ShieldCheck, label: 'Providers' },
            { id: 'bookings', icon: History, label: 'Bookings' },
            { id: 'more', icon: MoreHorizontal, label: 'More' },
          ].map(item => {
            const Icon = item.icon;
            const isActive = item.id === 'more' ? mobileMoreOpen : activeTab === item.id;
            return (
              <button key={item.id} onClick={() => {
                if (item.id === 'more') setMobileMoreOpen(!mobileMoreOpen);
                else { setActiveTab(item.id); setMobileMoreOpen(false); }
              }} className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-sky-500' : 'text-slate-400'}`}>
                <Icon className="w-4.5 h-4.5" />
                <span className="text-[9px] font-bold uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>
        {mobileMoreOpen && (
          <div className="bg-white border-t border-slate-100 px-3 py-2 space-y-0.5">
            {NAV_ITEMS.filter(n => !['dashboard', 'services', 'providers', 'bookings'].includes(n.id)).map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMoreOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${activeTab === item.id ? 'bg-sky-50 text-sky-700' : 'text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {ctrl.isAddingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto enterprise-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Add Service</h3>
              <button onClick={ctrl.closeAddService} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={ctrl.submitNewService} className="p-5 space-y-4">
              {ctrl.serviceAddError && <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg">{ctrl.serviceAddError}</p>}
              {ctrl.serviceAddSuccess && <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 p-2 rounded-lg">{ctrl.serviceAddSuccess}</p>}
              <div>
                <label className={LABEL_CLS}>Service Name</label>
                <input value={ctrl.newServiceForm.name} onChange={e => ctrl.setNewServiceForm(prev => ({ ...prev, name: e.target.value }))}
                  className="enterprise-input" placeholder="e.g. Electrician" />
              </div>
              <div>
                <label className={LABEL_CLS}>Description</label>
                <textarea value={ctrl.newServiceForm.description} onChange={e => ctrl.setNewServiceForm(prev => ({ ...prev, description: e.target.value }))}
                  className="enterprise-input" rows={2} />
              </div>
              <div>
                <label className={LABEL_CLS}>Popular Issues (comma separated)</label>
                <input value={ctrl.newServiceForm.popularIssuesText} onChange={e => ctrl.setNewServiceForm(prev => ({ ...prev, popularIssuesText: e.target.value }))}
                  className="enterprise-input" placeholder="Short circuit, Fan installation" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="enterprise-btn-primary">Add Service</button>
                <button type="button" onClick={ctrl.closeAddService} className="enterprise-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ctrl.isEditingService && ctrl.editServiceId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto enterprise-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Edit Service</h3>
              <button onClick={ctrl.closeEditService} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={LABEL_CLS}>Name</label>
                <input value={ctrl.editServiceForm.name} onChange={e => ctrl.setEditServiceForm(prev => ({ ...prev, name: e.target.value }))}
                  className="enterprise-input" />
              </div>
              <div>
                <label className={LABEL_CLS}>Description</label>
                <textarea value={ctrl.editServiceForm.description} onChange={e => ctrl.setEditServiceForm(prev => ({ ...prev, description: e.target.value }))}
                  className="enterprise-input" rows={2} />
              </div>
              <div>
                <label className={LABEL_CLS}>Popular Issues</label>
                <input value={ctrl.editServiceForm.popularIssuesText} onChange={e => ctrl.setEditServiceForm(prev => ({ ...prev, popularIssuesText: e.target.value }))}
                  className="enterprise-input" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={async () => {
                  const payload = { name: ctrl.editServiceForm.name, description: ctrl.editServiceForm.description };
                  await ctrl.updateService(ctrl.editServiceId, payload);
                  ctrl.closeEditService();
                }} className="enterprise-btn-primary">Save Changes</button>
                <button onClick={ctrl.closeEditService} className="enterprise-btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
