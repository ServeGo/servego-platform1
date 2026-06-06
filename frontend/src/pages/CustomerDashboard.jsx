import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

// Components
import DashboardHeader from '../components/DashboardHeader';
import BookingCard from '../components/BookingCard';
import FavoritesView from '../components/FavoritesView';
import TicketsView from '../components/TicketsView';
import NotificationsView from '../components/NotificationsView';
import ProfileView from '../components/ProfileView';
import ReferralsView from '../components/ReferralsView';
import SettingsView from '../components/SettingsView';
import ReviewModal from '../components/ReviewModal';
import InvoiceModal from '../components/InvoiceModal';

export const CustomerDashboard = ({ onNavigate, activeTab: activeTabProp, setActiveTabExternal }) => {
  const { 
    currentUser, bookings, updateBookingStatus, submitReview, 
    providers, favoriteProviders, toggleFavoriteProvider, tickets, submitSupportTicket, 
    notifications, markNotificationAsRead, applyReferralCode, getCustomerLoyaltyTier, sendChatMessage
  } = useApp();

  const [internalActiveTab, setInternalActiveTab] = useState('bookings');
  const activeTab = activeTabProp || internalActiveTab;
  const setActiveTab = setActiveTabExternal || setInternalActiveTab;

  // Referral states
  const [referralInput, setReferralInput] = useState('');
  const [refError, setRefError] = useState('');
  const [refSuccess, setRefSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Modal states
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [invoiceBooking, setInvoiceBooking] = useState(null);

  // Ticket state
  const [ticketSubject, setTicketSubject] = useState('Payment Refund Support');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Chat states
  const [openChatBookingId, setOpenChatBookingId] = useState(null);
  const [chatInput, setChatInput] = useState('');

  // Memoized data
  const userBookings = useMemo(() => bookings.filter(b => b.customerId === currentUser?.id), [bookings, currentUser]);
  const userFavorites = useMemo(() => providers.filter(p => favoriteProviders.includes(p.id)), [providers, favoriteProviders]);
  const userTickets = useMemo(() => tickets.filter(t => t.email === currentUser?.email), [tickets, currentUser]);
  const userNotifications = useMemo(() => notifications.filter(n => n.userId === currentUser?.id || n.role === 'customer'), [notifications, currentUser]);

  // Actions
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
    submitSupportTicket({
      name: currentUser?.name,
      email: currentUser?.email,
      subject: ticketSubject,
      message: ticketMsg
    });
    setTicketSuccess(true);
    setTicketMsg('');
    setTimeout(() => setTicketSuccess(false), 3000);
  };

  const handleApplyReferral = (e) => {
    e.preventDefault();
    const res = applyReferralCode(referralInput);
    if (res.success) {
      setRefSuccess(res.message);
      setRefError('');
      setReferralInput('');
    } else {
      setRefError(res.message);
      setRefSuccess('');
    }
  };

  const handleCopyCode = () => {
    const code = currentUser?.referralCode || `SERVEGO-CUST-${currentUser?.id.substring(currentUser?.id.length - 3).toUpperCase()}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="customer-dashboard-page" className="bg-slate-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {reviewBooking && (
          <ReviewModal 
            booking={reviewBooking}
            rating={reviewRating} setRating={setReviewRating}
            comment={reviewComment} setComment={setReviewComment}
            onClose={() => setReviewBooking(null)}
            onSubmit={handlePublishReview}
          />
        )}

        {invoiceBooking && (
          <InvoiceModal booking={invoiceBooking} onClose={() => setInvoiceBooking(null)} />
        )}

        <DashboardHeader 
          user={currentUser} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          counts={{
            bookings: userBookings.length,
            favorites: userFavorites.length,
            tickets: userTickets.length,
            notifications: userNotifications.length
          }}
        />

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 text-left">Your Booking Orders</h3>
            {userBookings.length === 0 ? (
              <EmptyBookings onNavigate={onNavigate} />
            ) : (
              <div className="space-y-6">
                {userBookings.map(bk => (
                  <BookingCard 
                    key={bk.id}
                    booking={bk}
                    onDownloadReceipt={setInvoiceBooking}
                    onCancel={updateBookingStatus}
                    onReview={setReviewBooking}
                    chatOpen={openChatBookingId === bk.id}
                    onToggleChat={() => setOpenChatBookingId(openChatBookingId === bk.id ? null : bk.id)}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    onSendMessage={sendChatMessage}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <FavoritesView 
            favorites={userFavorites} 
            onToggleFavorite={toggleFavoriteProvider} 
            onNavigate={onNavigate} 
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsView 
            tickets={userTickets}
            onSubmit={handleTicketSubmit}
            subject={ticketSubject} setSubject={setTicketSubject}
            message={ticketMsg} setMessage={setTicketMsg}
            success={ticketSuccess}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsView 
            notifications={userNotifications}
            onMarkRead={markNotificationAsRead}
            onMarkAllRead={() => alert('All notifications marked as read.')}
          />
        )}

        {activeTab === 'profile' && <ProfileView user={currentUser} />}

        {activeTab === 'referrals' && (
          <ReferralsView 
            user={currentUser}
            loyaltyTier={getCustomerLoyaltyTier(userBookings.filter(b => b.status === 'completed').length)}
            completedCount={userBookings.filter(b => b.status === 'completed').length}
            bookingsNeeded={2} // Mock logic for simplicity
            progressPercent={50} // Mock
            nextTierName="Silver" // Mock
            referralCode={currentUser?.referralCode || `SERVEGO-CUST-NEW`}
            referralInput={referralInput}
            setReferralInput={setReferralInput}
            onApplyCode={handleApplyReferral}
            onCopyCode={handleCopyCode}
            copied={copied}
            refError={refError}
            refSuccess={refSuccess}
          />
        )}

        {activeTab === 'settings' && <SettingsView />}

      </div>
    </div>
  );
};

function EmptyBookings({ onNavigate }) {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-2xs max-w-sm mx-auto">
      <h4 className="text-base font-bold text-slate-900">No Orders Found</h4>
      <p className="text-slate-500 text-xs mt-1 font-medium">Book a service to get started.</p>
      <button 
        onClick={() => onNavigate('services')} 
        className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
      >
        Browse Services
      </button>
    </div>
  );
}
