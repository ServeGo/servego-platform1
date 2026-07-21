import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Calendar, Search, CreditCard, MapPin, MessageSquare,
  Settings, HelpCircle, LogOut, Bell, ChevronDown, User, Star, Clock,
  TrendingUp, Heart, Phone, Send, ArrowLeft, Download, FileText, X,
  Plus, Edit3, Trash2, Home, Building, Copy, Check, Zap, Droplet,
  Wind, Sparkles, Paintbrush, Tv, Hammer, Wrench, ChevronRight,
  CircleCheck, Navigation, CircleDot, CheckCircle2, AlertCircle, Inbox
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES } from '../data';
import BookingCard from '../components/BookingCard';
import ReviewModal from '../components/ReviewModal';
import InvoiceModal from '../components/InvoiceModal';
import ChatPanel from '../components/ChatPanel';
import ProfileView from '../components/ProfileView';
import NotificationsView from '../components/NotificationsView';
import TicketsView from '../components/TicketsView';
import SettingsView from '../components/SettingsView';
import ReferralsView from '../components/ReferralsView';
import FavoritesView from '../components/FavoritesView';
import { StatusPill } from '../components/ui';

const CATEGORY_ICONS = {
  'Electrician': Zap,
  'Plumber': Droplet,
  'AC Repair': Wind,
  'Home Cleaning': Sparkles,
  'Deep Cleaning': Sparkles,
  'Painting': Paintbrush,
  'Appliance Repair': Tv,
  'Carpentry': Hammer,
  'Home Maintenance': Wrench,
};

const SIDEBAR_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'bookings', label: 'My Bookings', icon: Calendar },
  { key: 'browse-services', label: 'Browse Services', icon: Search },
  { key: 'payments', label: 'Payments & Invoices', icon: CreditCard },
  { key: 'addresses', label: 'Addresses', icon: MapPin },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'profile', label: 'Profile Settings', icon: Settings },
  { key: 'help', label: 'Help & Support', icon: HelpCircle },
];

const MOCK_ADDRESSES = [
  { id: 'a1', label: 'Home', address: '42, Hitech City Rd, Madhapur, Hyderabad 500081', type: 'home' },
  { id: 'a2', label: 'Office', address: '15th Floor, DLF Cyber City, Gachibowli, Hyderabad 500032', type: 'office' },
];

const MOCK_PAYMENTS = [
  { id: 'pm1', type: 'card', brand: 'Visa', last4: '4242', expiry: '12/27' },
  { id: 'pm2', type: 'upi', upiId: 'user@paytm', provider: 'Paytm' },
];

const MOCK_TRANSACTIONS = [
  { id: 't1', service: 'AC Repair', provider: 'Apex Aircon', date: '2026-07-15', amount: 1200, status: 'paid' },
  { id: 't2', service: 'Home Cleaning', provider: 'Sparkle Cleaners', date: '2026-07-10', amount: 2500, status: 'paid' },
  { id: 't3', service: 'Plumbing', provider: 'Super Leak-Fix', date: '2026-07-05', amount: 800, status: 'refunded' },
];

export const CustomerDashboard = ({ onNavigate, activeTab: activeTabProp, setActiveTabExternal }) => {
  const {
    currentUser, bookings, updateBookingStatus, submitReview,
    providers, favoriteProviders, toggleFavoriteProvider, tickets, submitSupportTicket,
    notifications, markNotificationAsRead, applyReferralCode, getCustomerLoyaltyTier,
    sendChatMessage, updateUserProfile, savedProsData, logout
  } = useApp();

  const [internalActiveTab, setInternalActiveTab] = useState('dashboard');
  const activeTab = activeTabProp || internalActiveTab;
  const setActiveTab = setActiveTabExternal || setInternalActiveTab;

  const [subTab, setSubTab] = useState('dashboard');
  const [bookingSubTab, setBookingSubTab] = useState('pending');
  const [bookingDetail, setBookingDetail] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [invoiceBooking, setInvoiceBooking] = useState(null);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ticketSubject, setTicketSubject] = useState('Payment Refund Support');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [addresses, setAddresses] = useState(MOCK_ADDRESSES);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: '', address: '', type: 'home' });
  const [paymentMethods] = useState(MOCK_PAYMENTS);
  const [openFaq, setOpenFaq] = useState(null);
  const [referralInput, setReferralInput] = useState('');
  const [refError, setRefError] = useState('');
  const [refSuccess, setRefSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);

  const userBookings = useMemo(
    () => bookings.filter(b => b.customerId === currentUser?.id),
    [bookings, currentUser]
  );

  const upcomingBookings = useMemo(
    () => userBookings.filter(b => ['pending', 'confirmed', 'in_progress', 'ongoing', 'en_route'].includes(b.status?.toLowerCase())),
    [userBookings]
  );

  const completedBookings = useMemo(
    () => userBookings.filter(b => ['completed', 'reviewed'].includes(b.status?.toLowerCase())),
    [userBookings]
  );

  const cancelledBookings = useMemo(
    () => userBookings.filter(b => ['cancelled', 'rejected'].includes(b.status?.toLowerCase())),
    [userBookings]
  );

  const userFavorites = useMemo(() => {
    if (Array.isArray(savedProsData) && savedProsData.length > 0) {
      return savedProsData.map(sp => sp.provider || providers.find(p => p.id === (sp.providerId || sp.provider?.id))).filter(Boolean);
    }
    return providers.filter(p => favoriteProviders.includes(p.id));
  }, [savedProsData, providers, favoriteProviders]);

  const userTickets = useMemo(() => tickets.filter(t => t.email === currentUser?.email), [tickets, currentUser]);
  const userNotifications = useMemo(() => notifications.filter(n => n.userId === currentUser?.id), [notifications, currentUser]);
  const unreadCount = useMemo(() => userNotifications.filter(n => !n.read).length, [userNotifications]);
  const completedCount = completedBookings.length;
  const totalSpent = useMemo(() => MOCK_TRANSACTIONS.reduce((sum, t) => sum + (t.status === 'paid' ? t.amount : 0), 0), []);

  const loyaltyTier = getCustomerLoyaltyTier(completedCount);
  const nextBooking = upcomingBookings[0];

  const handleNavigate = (tab) => {
    setBookingDetail(null);
    setSelectedBooking(null);
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  const handlePublishReview = (e) => {
    e.preventDefault();
    if (!reviewBooking) return;
    submitReview(reviewBooking.id, reviewBooking.providerId, reviewRating, reviewComment);
    setReviewBooking(null);
    setReviewComment('');
    setReviewRating(5);
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketMsg.trim()) return;
    submitSupportTicket({ name: currentUser?.name, email: currentUser?.email, subject: ticketSubject, message: ticketMsg });
    setTicketSuccess(true);
    setTicketMsg('');
    setTimeout(() => setTicketSuccess(false), 3000);
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!addressForm.label.trim() || !addressForm.address.trim()) return;
    setAddresses(prev => [...prev, { ...addressForm, id: `a${Date.now()}` }]);
    setAddressForm({ label: '', address: '', type: 'home' });
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const handleCopyCode = () => {
    const code = currentUser?.referralCode || 'SERVEGO-CUST-NEW';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyReferral = async (e) => {
    e.preventDefault();
    const res = await applyReferralCode(referralInput);
    if (res?.success) {
      setRefSuccess(res.message);
      setRefError('');
      setReferralInput('');
    } else {
      setRefError(res?.message || 'Failed.');
      setRefSuccess('');
    }
  };

  const handleSendMessage = (bookingId, text) => {
    sendChatMessage(bookingId, text, 'customer');
  };

  const filteredServices = useMemo(() => {
    const cats = selectedCategory === 'all'
      ? SERVICE_CATEGORIES
      : SERVICE_CATEGORIES.filter(c => c.id === selectedCategory);
    return cats;
  }, [selectedCategory]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getCountdown = (dateStr) => {
    if (!dateStr) return '';
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return 'Past';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const statusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (['completed', 'reviewed'].includes(s)) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (['cancelled', 'rejected'].includes(s)) return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (['pending'].includes(s)) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-sky-50 text-sky-700 border border-sky-200';
  };

  const bookingSteps = [
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'en_route', label: 'On the Way', icon: Navigation },
    { key: 'in_progress', label: 'In Progress', icon: CircleDot },
    { key: 'completed', label: 'Completed', icon: CircleCheck },
  ];

  const getStepIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (['pending'].includes(s)) return -1;
    if (['confirmed'].includes(s)) return 0;
    if (['en_route'].includes(s)) return 1;
    if (['ongoing', 'in_progress'].includes(s)) return 2;
    if (['completed', 'reviewed'].includes(s)) return 3;
    return -1;
  };

  return (
    <div className="flex min-h-screen bg-[#F4F8FB]">
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          rating={reviewRating} setRating={setReviewRating}
          comment={reviewComment} setComment={setReviewComment}
          onClose={() => setReviewBooking(null)}
          onSubmit={handlePublishReview}
        />
      )}
      {invoiceBooking && <InvoiceModal booking={invoiceBooking} onClose={() => setInvoiceBooking(null)} />}

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl enterprise-slide-up">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-400 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">ServeGo</span>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {SIDEBAR_NAV.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button key={item.key} onClick={() => handleNavigate(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-400/10 text-sky-600 border-l-2 border-sky-400 rounded-r-lg'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-100">
              <button onClick={() => { logout(); onNavigate('login'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col shrink-0 fixed top-0 left-0 bottom-0 z-30">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sky-400 flex items-center justify-center">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block leading-none">ServeGo</span>
              <span className="text-[10px] text-slate-400 font-medium">Customer Portal</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {SIDEBAR_NAV.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button key={item.key} onClick={() => handleNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-400/10 text-sky-600 border-l-2 border-sky-400 rounded-r-lg'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={() => { logout(); onNavigate('login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 h-16 flex items-center px-4 lg:px-6 gap-4">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
            <LayoutDashboard className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search services, bookings..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setShowProfileDropdown(false); }}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-100 shadow-lg z-50 enterprise-scale-in">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No notifications</p>
                      </div>
                    ) : (
                      userNotifications.slice(0, 5).map(n => (
                        <div key={n.id} onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-sky-50/50' : ''}`}>
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.message}</p>
                              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                                {new Date(n.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {userNotifications.length > 0 && (
                    <div className="p-2 border-t border-slate-100">
                      <button onClick={() => { handleNavigate('profile'); setShowNotifications(false); }}
                        className="w-full text-center text-xs font-bold text-sky-600 hover:text-sky-700 py-1.5 rounded-lg hover:bg-sky-50 transition-colors">
                        View All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifications(false); }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-sky-400 text-[#0F172A] flex items-center justify-center text-xs font-bold">
                  {currentUser?.name?.substring(0, 2).toUpperCase() || 'CU'}
                </div>
                <span className="hidden md:block text-sm font-semibold text-slate-700 max-w-[100px] truncate">
                  {currentUser?.name?.split(' ')[0] || 'Customer'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-100 shadow-lg z-50 enterprise-scale-in">
                  <div className="p-2">
                    <button onClick={() => { handleNavigate('profile'); setShowProfileDropdown(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <User className="w-4 h-4 text-slate-400" />
                      Profile Settings
                    </button>
                    <button onClick={() => { handleNavigate('help'); setShowProfileDropdown(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      Help & Support
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button onClick={() => { logout(); onNavigate('login'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto" onClick={() => { setShowNotifications(false); setShowProfileDropdown(false); }}>

          {activeTab === 'dashboard' && (
            <DashboardTab
              user={currentUser}
              upcomingBookings={upcomingBookings}
              completedBookings={completedBookings}
              userBookings={userBookings}
              userFavorites={userFavorites}
              totalSpent={totalSpent}
              completedCount={completedCount}
              onNavigate={handleNavigate}
              setBookingDetail={setBookingDetail}
              formatDate={formatDate}
              getCountdown={getCountdown}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsTab
              userBookings={userBookings}
              upcomingBookings={upcomingBookings}
              completedBookings={completedBookings}
              cancelledBookings={cancelledBookings}
              bookingSubTab={bookingSubTab}
              setBookingSubTab={setBookingSubTab}
              setBookingDetail={setBookingDetail}
              updateBookingStatus={updateBookingStatus}
              setReviewBooking={setReviewBooking}
              setInvoiceBooking={setInvoiceBooking}
              chatBookingId={chatBookingId}
              setChatBookingId={setChatBookingId}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSendMessage={handleSendMessage}
              onNavigate={onNavigate}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'booking-detail' && bookingDetail && (
            <BookingDetailTab
              booking={bookingDetail}
              onBack={() => handleNavigate('bookings')}
              setReviewBooking={setReviewBooking}
              setInvoiceBooking={setInvoiceBooking}
              updateBookingStatus={updateBookingStatus}
              bookingSteps={bookingSteps}
              getStepIndex={getStepIndex}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'browse-services' && (
            <BrowseServicesTab
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filteredServices={filteredServices}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsTab
              paymentMethods={paymentMethods}
              transactions={MOCK_TRANSACTIONS}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'addresses' && (
            <AddressesTab
              addresses={addresses}
              showAddressForm={showAddressForm}
              setShowAddressForm={setShowAddressForm}
              addressForm={addressForm}
              setAddressForm={setAddressForm}
              onAddAddress={handleAddAddress}
              onDeleteAddress={handleDeleteAddress}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesTab
              userBookings={userBookings}
              chatBooking={chatBooking}
              setChatBooking={setChatBooking}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSendMessage={handleSendMessage}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView user={currentUser} onSave={(form) => updateUserProfile(currentUser?.id, form)} />
          )}

          {activeTab === 'help' && (
            <HelpTab
              tickets={userTickets}
              ticketSubject={ticketSubject}
              setTicketSubject={setTicketSubject}
              ticketMsg={ticketMsg}
              setTicketMsg={setTicketMsg}
              ticketSuccess={ticketSuccess}
              onSubmitTicket={handleTicketSubmit}
              openFaq={openFaq}
              setOpenFaq={setOpenFaq}
            />
          )}

          {activeTab === 'referrals' && (
            <ReferralsView
              user={currentUser}
              loyaltyTier={loyaltyTier}
              completedCount={completedCount}
              bookingsNeeded={Math.max(0, 2 - completedCount)}
              progressPercent={Math.min(100, (completedCount / 2) * 100)}
              nextTierName={completedCount < 2 ? 'Silver Care' : completedCount < 5 ? 'Gold Shield' : 'Platinum Star'}
              referralCode={currentUser?.referralCode || 'SERVEGO-CUST-NEW'}
              referralInput={referralInput}
              setReferralInput={setReferralInput}
              onApplyCode={handleApplyReferral}
              onCopyCode={handleCopyCode}
              copied={copied}
              refError={refError}
              refSuccess={refSuccess}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritesView
              favorites={userFavorites}
              onToggleFavorite={toggleFavoriteProvider}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

function DashboardTab({ user, upcomingBookings, completedBookings, userBookings, userFavorites, totalSpent, completedCount, onNavigate, setBookingDetail, formatDate, getCountdown }) {
  const nextBooking = upcomingBookings[0];

  const stats = [
    { label: 'Active Bookings', value: upcomingBookings.length, icon: Calendar, bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
    { label: 'Completed Services', value: completedCount, icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: TrendingUp, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    { label: 'Saved Providers', value: userFavorites.length, icon: Heart, bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100' },
  ];

  const recentBookings = userBookings.slice(0, 5);

  return (
    <div className="space-y-6 enterprise-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0] || 'Customer'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => onNavigate('browse-services')}
          className="enterprise-btn-primary text-sm">
          <Search className="w-4 h-4" />
          Book a Service
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`enterprise-card p-4 border ${stat.border}`}>
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.text}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {nextBooking && (
        <div className="enterprise-card p-5 border border-sky-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-sky-500" />
            <span className="text-sm font-bold text-slate-900">Upcoming Booking</span>
            <span className="enterprise-badge-info text-[10px]">{getCountdown(nextBooking.bookingDate)} away</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={nextBooking.providerAvatar} alt={nextBooking.providerName}
                className="w-11 h-11 rounded-full object-cover border border-slate-200" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{nextBooking.serviceCategory}</h4>
                <p className="text-xs text-slate-500">{nextBooking.providerName}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDate(nextBooking.bookingDate)} • {nextBooking.bookingTimeSlot}
                </p>
              </div>
            </div>
            <button onClick={() => { setBookingDetail(nextBooking); onNavigate('booking-detail'); }}
              className="enterprise-btn-secondary text-xs !py-2">
              View Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-900">Recent Activity</span>
            <button onClick={() => onNavigate('bookings')} className="text-xs font-bold text-sky-600 hover:text-sky-700">
              View All
            </button>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map(bk => (
                <div key={bk.id} onClick={() => { setBookingDetail(bk); onNavigate('booking-detail'); }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                    {(() => { const CatIcon = CATEGORY_ICONS[bk.serviceCategory] || Wrench; return <CatIcon className="w-4 h-4 text-sky-600" />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{bk.serviceCategory}</p>
                    <p className="text-[11px] text-slate-500 truncate">{bk.providerName}</p>
                  </div>
                  <StatusPill status={bk.status} size="xs" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-900">Quick Book</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SERVICE_CATEGORIES.slice(0, 6).map(cat => {
              const CatIcon = CATEGORY_ICONS[cat.name] || Wrench;
              return (
                <button key={cat.id} onClick={() => onNavigate('services')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-sky-100 flex items-center justify-center transition-colors">
                    <CatIcon className="w-5 h-5 text-slate-500 group-hover:text-sky-600 transition-colors" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-sky-700 text-center leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingsTab({
  userBookings, upcomingBookings, completedBookings, cancelledBookings,
  bookingSubTab, setBookingSubTab, setBookingDetail,
  updateBookingStatus, setReviewBooking, setInvoiceBooking,
  chatBookingId, setChatBookingId, chatInput, setChatInput,
  onSendMessage, onNavigate, formatDate
}) {
  const tabs = [
    { key: 'pending', label: 'Upcoming', count: upcomingBookings.length },
    { key: 'past', label: 'Completed', count: completedBookings.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelledBookings.length },
  ];

  const filtered = useMemo(() => {
    switch (bookingSubTab) {
      case 'pending': return upcomingBookings;
      case 'past': return completedBookings;
      case 'cancelled': return cancelledBookings;
      default: return userBookings;
    }
  }, [bookingSubTab, upcomingBookings, completedBookings, cancelledBookings, userBookings]);

  return (
    <div className="space-y-6 enterprise-fade-in">
      <h2 className="text-xl font-bold text-slate-900">My Bookings</h2>

      <div className="flex flex-wrap gap-1 bg-white border border-slate-100 p-1 rounded-xl w-full sm:w-fit shadow-sm">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setBookingSubTab(t.key)}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              bookingSubTab === t.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}>
            {t.label}
            {t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 enterprise-card max-w-sm mx-auto">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-900 mb-1">No {bookingSubTab === 'pending' ? 'upcoming' : bookingSubTab} bookings</p>
          <p className="text-xs text-slate-500 font-medium mb-4">
            {bookingSubTab === 'pending' ? 'Book a service to get started.' : 'No bookings in this category.'}
          </p>
          {bookingSubTab === 'pending' && (
            <button onClick={() => onNavigate('services')} className="enterprise-btn-primary text-xs">
              Browse Services
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(bk => (
            <BookingCard
              key={bk.id}
              booking={bk}
              onDownloadReceipt={setInvoiceBooking}
              onCancel={updateBookingStatus}
              onReview={setReviewBooking}
              chatOpen={chatBookingId === bk.id}
              onToggleChat={() => setChatBookingId(chatBookingId === bk.id ? null : bk.id)}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSendMessage={onSendMessage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingDetailTab({ booking, onBack, setReviewBooking, setInvoiceBooking, updateBookingStatus, bookingSteps, getStepIndex, formatDate }) {
  const currentStep = getStepIndex(booking.status);

  return (
    <div className="space-y-6 enterprise-fade-in max-w-4xl">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </button>

      <div className="enterprise-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Booking ID</span>
            <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded ml-2 text-xs font-bold">{booking.id}</span>
          </div>
          <StatusPill status={booking.status} size="md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center gap-3">
            <img src={booking.providerAvatar} alt={booking.providerName}
              className="w-12 h-12 rounded-full object-cover border border-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Provider</span>
              <h4 className="font-bold text-slate-900 text-sm">{booking.providerName}</h4>
              <span className="text-xs text-slate-500">{booking.serviceCategory}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold">{formatDate(booking.bookingDate)} • {booking.bookingTimeSlot}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">{booking.locationAddress}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment</span>
            <span className="text-sm font-bold text-slate-800 capitalize">{booking.paymentMethod || 'On Completion'}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 mb-6">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-4">Live Status</span>
          <div className="flex items-center justify-between overflow-x-auto">
            {bookingSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? isCurrent ? 'bg-sky-400 text-white ring-4 ring-sky-100' : 'bg-sky-400 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                  </div>
                  {idx < bookingSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${idx < currentStep ? 'bg-sky-400' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-3">Price Breakdown</span>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Service Fee ({booking.serviceCategory})</span>
              <span className="font-bold text-slate-800">₹{booking.estimatedCost || '---'}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Platform Fee</span>
              <span className="font-bold text-slate-800">₹0</span>
            </div>
            <hr className="border-slate-200" />
            <div className="flex justify-between text-sm font-bold text-slate-900">
              <span>Total</span>
              <span>₹{booking.estimatedCost || '---'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Provider Contact</h4>
        <div className="flex items-center gap-4">
          <img src={booking.providerAvatar} alt={booking.providerName}
            className="w-12 h-12 rounded-full object-cover border border-slate-200" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">{booking.providerName}</p>
            <p className="text-xs text-slate-500">{booking.serviceCategory}</p>
          </div>
          <div className="flex gap-2">
            <button className="enterprise-btn-secondary !py-2 !px-3 text-xs">
              <Phone className="w-3.5 h-3.5" /> Call
            </button>
            <button className="enterprise-btn-primary !py-2 !px-3 text-xs">
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {['completed', 'reviewed'].includes(booking.status) && !booking.reviewed && (
          <button onClick={() => setReviewBooking(booking)} className="enterprise-btn-primary">
            <Star className="w-4 h-4" /> Rate Provider
          </button>
        )}
        {['completed', 'reviewed'].includes(booking.status) && (
          <button onClick={() => setInvoiceBooking(booking)} className="enterprise-btn-secondary">
            <Download className="w-4 h-4" /> Download Invoice
          </button>
        )}
        {['pending', 'confirmed'].includes(booking.status) && (
          <button onClick={() => { if (window.confirm('Cancel this booking?')) updateBookingStatus(booking.id, 'cancelled', 'Cancelled by customer'); }}
            className="enterprise-btn-danger">
            Cancel Booking
          </button>
        )}
      </div>
    </div>
  );
}

function BrowseServicesTab({ selectedCategory, setSelectedCategory, filteredServices, onNavigate }) {
  return (
    <div className="space-y-6 enterprise-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Browse Services</h2>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-sky-400 text-[#0F172A] shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600'
          }`}>
          All Services
        </button>
        {SERVICE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCategory === cat.id
                ? 'bg-sky-400 text-[#0F172A] shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600'
            }`}>
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(cat => {
          const CatIcon = CATEGORY_ICONS[cat.name] || Wrench;
          return (
            <div key={cat.id} className="enterprise-card p-5 flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <CatIcon className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{cat.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Starting ₹499</span>
                <button onClick={() => onNavigate('services')}
                  className="enterprise-btn-primary !text-xs !py-2 !px-4">
                  Book Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentsTab({ paymentMethods, transactions, formatDate }) {
  return (
    <div className="space-y-8 enterprise-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Payments & Invoices</h2>

      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Payment Methods</h3>
          <button className="enterprise-btn-secondary !text-xs !py-1.5">
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No payment methods saved</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map(pm => (
              <div key={pm.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    {pm.type === 'card' ? `${pm.brand} •••• ${pm.last4}` : `${pm.provider} - ${pm.id}`}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {pm.type === 'card' ? `Expires ${pm.expiry}` : 'UPI'}
                  </p>
                </div>
                <span className="enterprise-badge-success text-[10px]">Default</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[10px] font-bold text-slate-400 uppercase">Date</th>
                  <th className="text-left py-2 text-[10px] font-bold text-slate-400 uppercase">Service</th>
                  <th className="text-left py-2 text-[10px] font-bold text-slate-400 uppercase">Provider</th>
                  <th className="text-right py-2 text-[10px] font-bold text-slate-400 uppercase">Amount</th>
                  <th className="text-right py-2 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  <th className="text-right py-2 text-[10px] font-bold text-slate-400 uppercase">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-600">{formatDate(t.date)}</td>
                    <td className="py-3 font-semibold text-slate-800">{t.service}</td>
                    <td className="py-3 text-slate-600">{t.provider}</td>
                    <td className="py-3 text-right font-bold text-slate-800">₹{t.amount.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-sky-600 hover:text-sky-700 font-bold">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AddressesTab({ addresses, showAddressForm, setShowAddressForm, addressForm, setAddressForm, onAddAddress, onDeleteAddress }) {
  const ADDRESS_ICONS = { home: Home, office: Building };
  return (
    <div className="space-y-6 enterprise-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Saved Addresses</h2>
        <button onClick={() => setShowAddressForm(!showAddressForm)} className="enterprise-btn-primary !text-xs !py-2">
          <Plus className="w-3.5 h-3.5" /> Add Address
        </button>
      </div>

      {showAddressForm && (
        <form onSubmit={onAddAddress} className="enterprise-card p-5 space-y-4 enterprise-scale-in">
          <div>
            <label className="enterprise-label">Label</label>
            <input type="text" placeholder="e.g., Home, Office" required
              value={addressForm.label} onChange={e => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
              className="enterprise-input" />
          </div>
          <div>
            <label className="enterprise-label">Full Address</label>
            <input type="text" placeholder="Enter complete address" required
              value={addressForm.address} onChange={e => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
              className="enterprise-input" />
          </div>
          <div>
            <label className="enterprise-label">Type</label>
            <select value={addressForm.type} onChange={e => setAddressForm(prev => ({ ...prev, type: e.target.value }))}
              className="enterprise-input">
              <option value="home">Home</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="enterprise-btn-primary text-xs">Save Address</button>
            <button type="button" onClick={() => setShowAddressForm(false)} className="enterprise-btn-secondary text-xs">Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-16 enterprise-card">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-900 mb-1">No saved addresses</p>
          <p className="text-xs text-slate-500 font-medium">Add your addresses for faster booking.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => {
            const AddrIcon = ADDRESS_ICONS[addr.type] || MapPin;
            return (
              <div key={addr.id} className="enterprise-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                  <AddrIcon className="w-5 h-5 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{addr.label}</p>
                  <p className="text-xs text-slate-500 truncate">{addr.address}</p>
                </div>
                <div className="flex gap-1.5">
                  <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeleteAddress(addr.id)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MessagesTab({ userBookings, chatBooking, setChatBooking, chatInput, setChatInput, onSendMessage, currentUser }) {
  const chatBookings = userBookings.filter(b => ['pending', 'confirmed', 'in_progress', 'ongoing', 'en_route'].includes(b.status?.toLowerCase()));

  return (
    <div className="enterprise-fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Messages</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '500px' }}>
        <div className="enterprise-card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Conversations</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatBookings.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No active conversations</p>
              </div>
            ) : (
              chatBookings.map(bk => (
                <button key={bk.id} onClick={() => setChatBooking(bk)}
                  className={`w-full flex items-center gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${
                    chatBooking?.id === bk.id ? 'bg-sky-50 border-l-2 border-sky-400' : ''
                  }`}>
                  <img src={bk.providerAvatar} alt={bk.providerName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{bk.providerName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{bk.serviceCategory}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`w-2 h-2 rounded-full block ${bk.messages?.length ? 'bg-sky-400' : 'bg-slate-300'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 enterprise-card overflow-hidden flex flex-col">
          {!chatBooking ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">Select a conversation</h3>
              <p className="text-xs text-slate-500 font-medium">Choose a booking from the left to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <img src={chatBooking.providerAvatar} alt={chatBooking.providerName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{chatBooking.providerName}</p>
                  <p className="text-[10px] text-slate-500">{chatBooking.serviceCategory} • {chatBooking.id}</p>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white min-h-0">
                {(!chatBooking.messages || chatBooking.messages.length === 0) ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <p className="text-xs text-slate-400 font-medium">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  chatBooking.messages.map((m, i) => {
                    const isSelf = m.senderRole === 'customer';
                    return (
                      <div key={i} className={`flex flex-col max-w-[80%] ${isSelf ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                          isSelf
                            ? 'bg-sky-400 text-[#0F172A] rounded-br-none'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                        }`}>
                          {m.text}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-1">
                          {m.senderName?.split(' ')[0]} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) {
                  onSendMessage(chatBooking.id, chatInput);
                  setChatInput('');
                }
              }} className="p-3 border-t border-slate-100 bg-white flex gap-2">
                <input type="text" placeholder="Type a message..."
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  className="flex-1 enterprise-input !py-2.5" />
                <button type="submit" className="enterprise-btn-primary !py-2.5 !px-4">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HelpTab({ tickets, ticketSubject, setTicketSubject, ticketMsg, setTicketMsg, ticketSuccess, onSubmitTicket, openFaq, setOpenFaq }) {
  const faqs = [
    {
      q: 'How do I reschedule a booking?',
      a: 'You can cancel your current booking and create a new one with your preferred date and time. Go to My Bookings, select the booking, and click Cancel, then browse services to rebook.'
    },
    {
      q: 'What is the cancellation policy?',
      a: 'Cancellations made at least 2 hours before the scheduled time are fully refunded. Late cancellations may incur a nominal fee.'
    },
    {
      q: 'How do I get a refund?',
      a: 'Refunds are processed automatically for cancelled bookings. For any issues, raise a support ticket and our team will process it within 24-48 hours.'
    },
    {
      q: 'How does the referral program work?',
      a: 'Share your referral code with friends. When they complete their first booking, both of you receive ₹150 credit. Check the Referrals tab for your code.'
    },
  ];

  return (
    <div className="space-y-8 enterprise-fade-in max-w-4xl">
      <h2 className="text-xl font-bold text-slate-900">Help & Support</h2>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
                <span className="text-sm font-semibold text-slate-800">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-slate-600 font-medium leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <TicketsView
        tickets={tickets}
        onSubmit={onSubmitTicket}
        subject={ticketSubject}
        setSubject={setTicketSubject}
        message={ticketMsg}
        setMessage={setTicketMsg}
        success={ticketSuccess}
      />
    </div>
  );
}

function statusColor(status) {
  return <StatusPill status={status} size="xs" />;
}

export default CustomerDashboard;
