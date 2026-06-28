import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES } from '../data';

// Components
import ServiceDetailHeader from '../components/ServiceDetailHeader';
import FilterPanel from '../components/FilterPanel';
import ProviderListItem from '../components/ProviderListItem';
import BookingModal from '../components/BookingModal';
import BookingSuccess from '../components/BookingSuccess';

export const ServiceDetails = ({ catId, onNavigate }) => {
  const {
    providers,
    providersByApprovedService,
    fetchProvidersByApprovedServiceName,
    currentUser,
    createBooking,
    toggleFavoriteProvider,
    favoriteProviders,
    selectedArea,
    bookings,
    getCustomerLoyaltyTier
  } = useApp();

  const [applyReferralCredit, setApplyReferralCredit] = useState(true);

  // Metadata
  const categoryMeta = useMemo(() => {
    return SERVICE_CATEGORIES.find(c => c.id === catId) || SERVICE_CATEGORIES[0];
  }, [catId]);

  // UI state
  const [filterArea, setFilterArea] = useState(selectedArea || '');
  const [sortBy, setSortBy] = useState('rating');
  const [bookingStep, setBookingStep] = useState(0); // 0: Browse, 1: Checkout, 2: Loading, 3: Success
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Form fields
  const [bookingDate, setBookingDate] = useState('');
  const [bookingType, setBookingType] = useState('contract');
  const [bookingEndDate, setBookingEndDate] = useState('');
  const [contractYears, setContractYears] = useState('0');
  const [contractDays, setContractDays] = useState('1');
  const [contractHours, setContractHours] = useState('0');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [errorText, setErrorText] = useState('');
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState(null);

  const [autoBookingProviderId, setAutoBookingProviderId] = useState(null);

  useEffect(() => {
    const hash = window.location.hash || '';
    // expected formats:
    // 1) #service-details/<catOrProviderId>
    // 2) if Favorites passes providerId, catId may become providerId; we treat it as providerId only when booking popup is desired.
    const parts = hash.replace('#', '').split('/');
    const last = parts[2] || parts[1];
    if (last && last !== catId) {
      setAutoBookingProviderId(last);
    }
  }, [catId]);

  useEffect(() => {
    if (categoryMeta?.name) {
      fetchProvidersByApprovedServiceName(categoryMeta.name);
    }
  }, [categoryMeta.name, fetchProvidersByApprovedServiceName]);

  // Filter & Sort logic
  const categoryProviders = useMemo(() => {
    let list = Array.isArray(providersByApprovedService) ? providersByApprovedService : [];

    if (filterArea) {
      list = list.filter(p => Array.isArray(p.serviceAreas) && p.serviceAreas.includes(filterArea));
    }

    switch (sortBy) {
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'experience': list.sort((a, b) => b.experienceYears - a.experienceYears); break;
      case 'priceAsc': list.sort((a, b) => a.hourlyRate - b.hourlyRate); break;
      case 'priceDesc': list.sort((a, b) => b.hourlyRate - a.hourlyRate); break;
      default: break;
    }

    return list;
  }, [providersByApprovedService, filterArea, sortBy]);

  // Loyalty calculation
  const customerCompletedBookingsCount = useMemo(() => {
    if (!currentUser) return 0;
    return bookings.filter(b => b.customerId === currentUser.id && b.status === "completed").length;
  }, [bookings, currentUser]);

  const loyaltyTier = useMemo(() => getCustomerLoyaltyTier(customerCompletedBookingsCount), [customerCompletedBookingsCount, getCustomerLoyaltyTier]);

  // Booking summary (pricing is handled offline between customer and provider).
  const billMetrics = useMemo(() => {
    const durationLabel = bookingType === 'contract'
      ? `${contractYears}y ${contractDays}d ${contractHours}h`
      : 'Ongoing';
    return { durationLabel };
  }, [bookingType, contractYears, contractDays, contractHours]);

  const handleStartBooking = (prov) => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }
    setSelectedProvider(prov);
    setBookingStep(1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    setBookingDate(defaultDate);
    setBookingType('contract');
    setBookingEndDate('');
    setContractYears('0');
    setContractDays('1');
    setContractHours('0');
    setPaymentMethod('UPI');
    setAddress('');
    setErrorText('');
  };

  const handleCompleteCheckout = async (e) => {
    e.preventDefault();
    if (!bookingDate || !address.trim()) {
      setErrorText('Please complete all required fields');
      return;
    }

    if (bookingType === 'contract') {
      const durationTotal = Number(contractYears) * 8760 + Number(contractDays) * 24 + Number(contractHours);
      if (!durationTotal) {
        setErrorText('Please select a contract duration');
        return;
      }
    }

    setBookingStep(2); // Loading simulation
    
    setTimeout(async () => {
      const created = await createBooking({
        providerId: selectedProvider.id,
        providerName: selectedProvider.name,
        providerAvatar: selectedProvider.avatar,
        serviceCategory: categoryMeta.name,
        bookingDate,
        bookingEndDate: null,
        bookingTimeSlot: bookingType === 'permanent' ? 'Permanent' : 'Contract',
        bookingDuration: billMetrics.durationLabel,
        serviceDurationType: bookingType,
        locationAddress: address,
        city: 'Hyderabad',
        instructions,
        paymentMethod
      });
      if (!created || created.error) {
        setErrorText(created?.error || 'Could not complete the booking. Please try again.');
        setBookingStep(1);
        return;
      }
      setConfirmedBookingDetails(created);
      setBookingStep(3);
    }, 1500);
  };

  return (
    <div id="service-details-page" className="bg-slate-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        <button 
          onClick={() => onNavigate('services')}
          className="flex items-center gap-1.5 text-xs text-slate-550 hover:text-indigo-600 font-bold uppercase tracking-wider mb-6 group focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Checklists</span>
        </button>

        {bookingStep === 1 && selectedProvider && (
          <BookingModal 
            provider={selectedProvider}
            onClose={() => setBookingStep(0)}
            errorText={errorText}
            bookingDate={bookingDate} setBookingDate={setBookingDate}
            bookingType={bookingType} setBookingType={setBookingType}
            bookingEndDate={bookingEndDate} setBookingEndDate={setBookingEndDate}
            contractYears={contractYears} setContractYears={setContractYears}
            contractDays={contractDays} setContractDays={setContractDays}
            contractHours={contractHours} setContractHours={setContractHours}
            address={address} setAddress={setAddress}
            instructions={instructions} setInstructions={setInstructions}
            paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
            applyReferralCredit={applyReferralCredit} setApplyReferralCredit={setApplyReferralCredit}
            billMetrics={billMetrics}
            loyaltyTier={loyaltyTier}
            currentUser={currentUser}
            onSubmit={handleCompleteCheckout}
          />
        )}

        {bookingStep === 2 && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-slate-200 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-t-4 border-indigo-600 animate-spin mb-6" />
              <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Processing Secure Booking</h4>
              <p className="text-slate-500 text-xs mt-2 font-medium">Validating schedule and escrow credentials. Please wait...</p>
            </div>
          </div>
        )}

        {bookingStep === 3 && confirmedBookingDetails && (
          <BookingSuccess 
            details={confirmedBookingDetails}
            onDashboard={() => onNavigate('dashboard-customer')}
            onBrowse={() => onNavigate('services')}
          />
        )}

        <ServiceDetailHeader categoryMeta={categoryMeta} />

        <FilterPanel 
          filterArea={filterArea} 
          setFilterArea={setFilterArea} 
          sortBy={sortBy} 
          setSortBy={setSortBy} 
        />

        {categoryProviders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-2xs max-w-xl mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Vetted Experts Found</h3>
            <p className="text-slate-500 text-xs mt-1 font-medium">There are no specialists registered in "{filterArea || 'this zone'}" yet.</p>
            <button 
              onClick={() => setFilterArea('')}
              className="mt-6 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
            >
              Show all Hyderabad experts
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {categoryProviders.map((prov) => (
              <ProviderListItem 
                key={prov.id}
                provider={prov}
                isFavorite={favoriteProviders.includes(prov.id)}
                onToggleFavorite={toggleFavoriteProvider}
                onBook={handleStartBooking}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
