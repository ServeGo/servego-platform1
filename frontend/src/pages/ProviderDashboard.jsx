import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ListOrdered } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Components
import ProviderHeader from '../components/ProviderHeader';
import LeadCard from '../components/LeadCard';
import EarningsChart from '../components/EarningsChart';
import ProviderServicesPanel from '../components/ProviderServicesPanel';
import ProviderReviews from '../components/ProviderReviews';
import ProviderSupport from '../components/ProviderSupport';
import ProviderReferrals from '../components/ProviderReferrals';

export const ProviderDashboard = ({ onNavigate, activeTab: activeTabProp, setActiveTabExternal }) => {
  const { 
    currentUser, providers, bookings, 
    updateBookingStatus, updateProviderAvailability, updateProviderProfile, submitSupportTicket, tickets,
    applyReferralCode, sendChatMessage
  } = useApp();

  const activeProvider = useMemo(() => {
    // currentUser.providerId (from backend) might represent either User.id or Provider.id
    // Prefer matching by Provider.id; if missing, fall back to matching by userId.
    const providerIdCandidate = currentUser?.providerId;
    const providerUserIdCandidate = currentUser?.id;

    const byProviderId = providerIdCandidate ? providers.find(p => p.id === providerIdCandidate) : null;
    const byUserId = providerUserIdCandidate ? providers.find(p => p.userId === providerUserIdCandidate) : null;

    return byProviderId || byUserId || providers[0];
  }, [providers, currentUser]);

  const [internalActiveTab, setInternalActiveTab] = useState('leads');
  const activeTab = activeTabProp || internalActiveTab;
  const setActiveTab = setActiveTabExternal || setInternalActiveTab;

  // Local UI States
  const [profileBio, setProfileBio] = useState(activeProvider?.bio || '');
  const [workingDays, setWorkingDays] = useState(activeProvider?.availableDays || []);
  const [workingHours, setWorkingHours] = useState(activeProvider?.timeSlots || []);
  const [profileHourlyRate, setProfileHourlyRate] = useState(activeProvider?.hourlyRate || 350);
  const [profileExperience, setProfileExperience] = useState(activeProvider?.experienceYears || 3);
  const [profilePhone, setProfilePhone] = useState(activeProvider?.phone || '');
  const [isSavedText, setIsSavedText] = useState(false);
  const [openChatBookingId, setOpenChatBookingId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [refSuccess, setRefSuccess] = useState('');
  const [refError, setRefError] = useState('');

  useEffect(() => {
    if (activeProvider) {
      setProfileBio(activeProvider.bio || '');
      setWorkingDays(activeProvider.availableDays || []);
      setWorkingHours(activeProvider.timeSlots || []);
      setProfileHourlyRate(activeProvider.hourlyRate || 350);
      setProfileExperience(activeProvider.experienceYears || 3);
      setProfilePhone(activeProvider.phone || '');
    }
  }, [activeProvider]);

  const allocatedBookings = useMemo(() => bookings.filter(b => b.providerId === activeProvider?.id), [bookings, activeProvider]);
  const activeLeads = useMemo(() => allocatedBookings.filter(b => ['pending', 'confirmed', 'en_route', 'ongoing'].includes(b.status)), [allocatedBookings]);
  const completedJobs = useMemo(() => allocatedBookings.filter(b => b.status === 'completed'), [allocatedBookings]);
  const lifetimeEarnings = useMemo(() => completedJobs.reduce((sum, j) => sum + (j.totalAmount - j.serviceFee - j.tax), 0), [completedJobs]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateProviderAvailability(activeProvider.id, workingDays, workingHours);
    updateProviderProfile(activeProvider.id, { bio: profileBio, hourlyRate: Number(profileHourlyRate), experienceYears: Number(profileExperience), phone: profilePhone });
    setIsSavedText(true);
    setTimeout(() => setIsSavedText(false), 3000);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    submitSupportTicket({ name: activeProvider?.name, email: currentUser?.email, subject: supportSubject, message: supportMsg });
    setSupportSubject(''); setSupportMsg(''); setTicketSuccess(true);
    setTimeout(() => setTicketSuccess(false), 4000);
  };

  const handleApplyReferral = (e) => {
    e.preventDefault();
    const res = applyReferralCode(referralInput);
    if (res.success) { setRefSuccess(res.message); setRefError(''); setReferralInput(''); }
    else { setRefError(res.message); setRefSuccess(''); }
  };

  const isPending = currentUser?.status === 'pending' || !activeProvider?.isVerified;

  return (
    <div id="provider-dashboard-page" className="bg-slate-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {isPending && <PendingBanner />}

        {!isPending && activeProvider && (
          <ProviderHeader provider={activeProvider} earnings={lifetimeEarnings} />
        )}

        <TabList activeTab={activeTab} setActiveTab={setActiveTab} leadsCount={activeLeads.length} reviewsCount={activeProvider?.reviews?.length || 0} />

        {activeTab === 'leads' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight text-left">Leads Queue</h3>
            {activeLeads.length === 0 ? (
              <EmptyLeads />
            ) : (
              <div className="space-y-4">
                {activeLeads.map(bk => (
                  <LeadCard 
                    key={bk.id}
                    lead={bk}
                    onAccept={(id) => updateBookingStatus(id, 'confirmed', 'Accepted.')}
                    onReject={(id) => updateBookingStatus(id, 'cancelled', 'Rejected.')}
                    onTravel={(id) => updateBookingStatus(id, 'en_route', 'En-route.')}
                    onStartWork={(id) => updateBookingStatus(id, 'ongoing', 'Work started.')}
                    onFinishWork={(id) => updateBookingStatus(id, 'completed', 'Completed.')}
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

        {activeTab === 'earnings' && <EarningsChart completedJobs={completedJobs} />}

        {activeTab === 'services' && activeProvider && (
          <ProviderServicesPanel
            provider={activeProvider}
          />
        )}

        {activeTab === 'reviews' && <ProviderReviews rating={activeProvider?.rating} reviews={activeProvider?.reviews} />}

        {activeTab === 'support' && (
          <ProviderSupport 
            tickets={tickets.filter(t => t.email === currentUser?.email)}
            onSubmit={handleSupportSubmit}
            subject={supportSubject} setSubject={setSupportSubject}
            message={supportMsg} setMessage={setSupportMsg}
            success={ticketSuccess}
          />
        )}

        {activeTab === 'referrals' && (
          <ProviderReferrals 
            provider={activeProvider}
            referralInput={referralInput} setReferralInput={setReferralInput}
            onApply={handleApplyReferral}
            onCopy={() => { navigator.clipboard.writeText(activeProvider?.referralCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            copied={copied}
            refError={refError}
            refSuccess={refSuccess}
            referredBy={currentUser?.referredBy}
          />
        )}

      </div>
    </div>
  );
};

function PendingBanner() {
  return (
    <div className="mb-8 bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:row items-center gap-6 justify-between text-slate-800">
      <div className="flex gap-4 items-start text-xs sm:text-sm text-left">
        <ShieldAlert className="w-8 h-8 text-amber-600 shrink-0" />
        <div>
          <h4 className="font-bold text-slate-900 text-base uppercase">Profile Awaiting Authorization</h4>
          <p className="text-slate-600 mt-1 font-medium">Your registration is currently under review. verified soon.</p>
        </div>
      </div>
      <span className="bg-amber-100 text-amber-800 font-black text-[10px] uppercase px-3 py-1.5 rounded-full border border-amber-200">Status: Pending Approval</span>
    </div>
  );
}

function TabList({ activeTab, setActiveTab, leadsCount, reviewsCount }) {
  const tabs = [
    { id: 'leads', label: `Leads (${leadsCount})` },
    { id: 'earnings', label: 'Earnings' },
    { id: 'services', label: 'My Services' },
    { id: 'reviews', label: `Reviews (${reviewsCount})` },
    { id: 'support', label: 'Support' },
    { id: 'referrals', label: '🤝 Ambassador' }
  ];
  return (
    <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1.5 rounded-2xl mb-8 w-full sm:w-fit">
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{t.label}</button>
      ))}
    </div>
  );
}

function EmptyLeads() {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-2xs max-w-md mx-auto">
      <ListOrdered className="w-10 h-10 text-slate-300 mx-auto mb-4" />
      <h4 className="text-base font-bold text-slate-900">No Pending Lead Proposals</h4>
      <p className="text-slate-500 text-xs mt-1 font-medium">When customers choose you in your zones, new orders will appear here.</p>
    </div>
  );
}
