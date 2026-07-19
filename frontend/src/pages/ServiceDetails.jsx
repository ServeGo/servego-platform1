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
    providersByApprovedService,
    fetchProvidersByApprovedServiceName,
    currentUser,
    createBooking,
    toggleFavoriteProvider,
    favoriteProviders,
    selectedArea,
    bookings,
    getCustomerLoyaltyTier,
    fetchProviderAvailability
  } = useApp();


  const [applyReferralCredit, setApplyReferralCredit] = useState(true);

  // Metadata — try static lookup first, fall back to a synthetic entry built
  // from the catId itself (for DB-driven services like 'dhobi', 'cook', etc.)
  const categoryMeta = useMemo(() => {
    const found = SERVICE_CATEGORIES.find(
      c => c.name.toLowerCase() === String(catId).toLowerCase()
    );
    if (found) return found;
    // Build a minimal meta object from the service name
    const displayName = catId
      ? String(catId).charAt(0).toUpperCase() + String(catId).slice(1)
      : 'Service';
    return { id: catId, name: displayName, description: '', popularIssues: [] };
  }, [catId]);

  // UI state
  const [filterArea, setFilterArea] = useState(selectedArea || '');
  const [sortBy, setSortBy] = useState('rating');
  const [bookingStep, setBookingStep] = useState(0); // 0: Browse, 1: Checkout, 2: Loading, 3: Success
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Form fields
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [bookingType, setBookingType] = useState('contract');
  const [availabilityBusyError, setAvailabilityBusyError] = useState('');

  const [bookingEndDate, setBookingEndDate] = useState('');
  const [contractYears, setContractYears] = useState('0');
  const [contractDays, setContractDays] = useState('1');
  const [contractHours, setContractHours] = useState('0');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [errorText, setErrorText] = useState('');
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState(null);

  // (auto-booking via hash is currently unused; keeper removed to avoid unused state warning)

  useEffect(() => {
    if (categoryMeta?.name) {
      fetchProvidersByApprovedServiceName(categoryMeta.name, { location: filterArea, sort: sortBy });
    }
  }, [categoryMeta.name, filterArea, sortBy, fetchProvidersByApprovedServiceName]);

  // Filtering and sorting are performed by the discovery API so results remain
  // correct when a category has more providers than a single client payload.
  const categoryProviders = useMemo(() => {
    return Array.isArray(providersByApprovedService) ? providersByApprovedService : [];
  }, [providersByApprovedService]);

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
      // Store booking intent so we can resume after login
      sessionStorage.setItem('servego_booking_intent', JSON.stringify({
        providerId: prov.id,
        categoryName: categoryMeta.name,
        catId
      }));
      onNavigate('login');
      return;
    }
    setSelectedProvider(prov);
    setBookingStep(1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    setBookingDate(defaultDate);
    setBookingTimeSlot('');
    setAvailableSlots([]);

    setBookingType('contract');
    setBookingEndDate('');
    setContractYears('0');
    setContractDays('1');
    setContractHours('0');
    setPaymentMethod('UPI');
    setAddress('');
    setErrorText('');
  };

  // Resume booking intent after login
  useEffect(() => {
    if (!currentUser) return;
    const raw = sessionStorage.getItem('servego_booking_intent');
    if (!raw) return;
    try {
      const intent = JSON.parse(raw);
      if (intent.catId === catId && intent.providerId) {
        const prov = categoryProviders.find(p => p.id === intent.providerId);
        if (prov) {
          sessionStorage.removeItem('servego_booking_intent');
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setBookingDate(tomorrow.toISOString().split('T')[0]);
          setBookingTimeSlot('');
          setAvailableSlots([]);
          setBookingType('contract');
          setBookingEndDate('');
          setContractYears('0');
          setContractDays('1');
          setContractHours('0');
          setPaymentMethod('UPI');
          setAddress('');
          setErrorText('');
          setSelectedProvider(prov);
          setBookingStep(1);
        }
      }
    } catch {
      sessionStorage.removeItem('servego_booking_intent');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, categoryProviders]);

  useEffect(() => {
    if (bookingStep !== 1 || !selectedProvider?.id || !bookingDate) return;
    let cancelled = false;
    setAvailabilityLoading(true);
    setAvailabilityBusyError('');
    setBookingTimeSlot('');
    fetchProviderAvailability(selectedProvider.id, bookingDate).then((availability) => {
      if (cancelled) return;
      if (availability?.error) {
        setAvailableSlots([]);
        setAvailabilityBusyError('Unable to load provider availability. Please try again.');
        return;
      }
      if (!availability?.isWorkingDay) {
        setAvailableSlots([]);
        setAvailabilityBusyError('Provider is not available on selected day.');
        return;
      }
      setAvailableSlots((availability.slots || []).filter((slot) => !slot.busy).map((slot) => slot.slot));
    }).finally(() => {
      if (!cancelled) setAvailabilityLoading(false);
    });
    return () => { cancelled = true; };
  }, [bookingStep, selectedProvider?.id, bookingDate, fetchProviderAvailability]);

  const handleCompleteCheckout = async (e) => {
    
    // booking spinner is already rendered by the existing UI step-2 overlay.

    e.preventDefault();
    setAvailabilityBusyError('');
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

    const desiredSlotLabel = bookingTimeSlot;
    if (!desiredSlotLabel) {
      setErrorText('Please choose an available appointment window.');
      return;
    }

    setBookingStep(2); // still keep UI step for continuity

    // Show correct global action spinner while we validate + create booking
    // (We keep the step-2 UI too, but the message comes from the overlay.)
    // Note: AppContext provides runWithActionSpinner.

    try {
      // If availability endpoint fails, do not block booking creation.
      const avail = await fetchProviderAvailability(selectedProvider.id, bookingDate);

      if (avail?.error) {
        setAvailabilityBusyError('Unable to verify availability. Please try again.');
        setBookingStep(1);
        return;
      }

      // If provider is not working that day, show busy-like error.
      if (!avail?.isWorkingDay) {
        setAvailabilityBusyError('Provider is not available on selected day.');
        setBookingStep(1);
        return;
      }

      const slotInfo = Array.isArray(avail?.slots)
        ? avail.slots.find(s => String(s.slot).toLowerCase() === String(desiredSlotLabel).toLowerCase())
        : null;
      if (slotInfo?.busy) {
        setAvailabilityBusyError('Provider is busy for that day/slot. Please pick another date.');
        setBookingStep(1);
        return;
      }
    } catch (err) {
      // ignore
    }

    // If backend rejects due to slot/service already pending, show it immediately.
    // This prevents UI from allowing duplicate bookings when status is PENDING/CONFIRMED/ONGOING.
    let created;
    created = await createBooking({
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      providerAvatar: selectedProvider.avatar,
      serviceCategory: categoryMeta.name,
      bookingDate,
      bookingEndDate: null,
      bookingTimeSlot: desiredSlotLabel,
      bookingDuration: billMetrics.durationLabel,
      serviceDurationType: bookingType,
      locationAddress: address,
      city: 'Hyderabad',
      instructions,
      paymentMethod
    });

      // If createBooking fails, it returns an error object.

      if (!created || created.error) {
        setErrorText(created?.error || 'Could not complete the booking. Please try again.');

        setBookingStep(1);
        return;
      }

      // Only proceed to success if we have a real booking id
      if (!created.id) {
        setErrorText('Could not complete the booking. Please try again.');
        setBookingStep(1);
        return;
      }

    setConfirmedBookingDetails(created);
    setBookingStep(3);
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
              availabilityBusyError={availabilityBusyError}

            errorText={errorText}
            bookingDate={bookingDate} setBookingDate={setBookingDate}
            bookingTimeSlot={bookingTimeSlot} setBookingTimeSlot={setBookingTimeSlot}
            availableSlots={availableSlots} availabilityLoading={availabilityLoading}
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
