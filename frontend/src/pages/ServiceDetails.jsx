import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES } from '../data';
import { ArrowLeft, Search, MapPin, AlertCircle } from 'lucide-react';
import ServiceDetailHeader from '../components/ServiceDetailHeader';
import FilterPanel from '../components/FilterPanel';
import ProviderListItem from '../components/ProviderListItem';
import BookingModal from '../components/BookingModal';
import BookingSuccess from '../components/BookingSuccess';

export default function ServiceDetails({ catId, onNavigate }) {
  const {
    providers,
    bookings,
    createBooking,
    currentUser,
    getAvailability,
    applyLoyaltyDiscount,
    applyReferralDiscount,
    favorites,
    toggleFavorite,
  } = useApp();

  const [filterArea, setFilterArea] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Booking form state
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityBusyError, setAvailabilityBusyError] = useState('');
  const [bookingType, setBookingType] = useState('ongoing');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [errorText, setErrorText] = useState('');
  const [contractYears, setContractYears] = useState(0);
  const [contractDays, setContractDays] = useState(0);
  const [contractHours, setContractHours] = useState(0);
  const [applyReferralCredit, setApplyReferralCredit] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const categoryMeta = SERVICE_CATEGORIES.find(
    (c) => c.id === catId || c.name?.toLowerCase().replace(/\s+/g, '-') === catId
  );

  const filteredProviders = useMemo(() => {
    let list = (providers || []).filter(
      (p) =>
        categoryMeta &&
        p.category &&
        p.category.toLowerCase() === categoryMeta.name.toLowerCase()
    );

    if (filterArea.trim()) {
      const q = filterArea.toLowerCase();
      list = list.filter(
        (p) => p.area && p.area.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-low') {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [providers, categoryMeta, filterArea, sortBy]);

  const billMetrics = useMemo(() => {
    if (!selectedProvider) return null;
    const basePrice = selectedProvider.price || 500;
    let discount = 0;
    let loyaltyDiscount = 0;

    if (applyReferralCredit && currentUser?.referralCredit) {
      discount = currentUser.referralCredit;
    }
    if (currentUser?.loyaltyTier === 'gold') loyaltyDiscount = basePrice * 0.05;
    if (currentUser?.loyaltyTier === 'platinum') loyaltyDiscount = basePrice * 0.1;

    return {
      basePrice,
      discount,
      loyaltyDiscount,
      total: Math.max(0, basePrice - discount - loyaltyDiscount),
    };
  }, [selectedProvider, applyReferralCredit, currentUser]);

  const handleBook = (provider) => {
    if (!currentUser) {
      onNavigate && onNavigate('login');
      return;
    }
    setSelectedProvider(provider);
    setBookingStep(1);
    setErrorText('');
  };

  const handleDateChange = async (date) => {
    setBookingDate(date);
    if (!date || !selectedProvider) return;
    setAvailabilityLoading(true);
    setAvailabilityBusyError('');
    try {
      const slots = await getAvailability(selectedProvider.id, date);
      setAvailableSlots(slots || []);
      if (!slots || slots.length === 0) {
        setAvailabilityBusyError('No available slots for this date. Try another date.');
      }
    } catch {
      setAvailabilityBusyError('Could not load availability. Please try again.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!bookingDate || !bookingTimeSlot || !address) {
      setErrorText('Please fill in all required fields.');
      return;
    }
    setBookingStep(2);
    setErrorText('');
    try {
      const result = await createBooking({
        providerId: selectedProvider.id,
        category: categoryMeta?.name,
        date: bookingDate,
        timeSlot: bookingTimeSlot,
        type: bookingType,
        address,
        instructions,
        paymentMethod,
        contractYears: bookingType === 'contract' ? contractYears : 0,
        contractDays: bookingType === 'contract' ? contractDays : 0,
        contractHours: bookingType === 'contract' ? contractHours : 0,
        total: billMetrics?.total || selectedProvider.price,
      });
      setBookingResult({
        providerName: selectedProvider.name,
        service: categoryMeta?.name,
        date: bookingDate,
        time: bookingTimeSlot,
        total: billMetrics?.total || selectedProvider.price,
        bookingId: result?.id || `BK${Date.now()}`,
      });
      setBookingStep(3);
    } catch (err) {
      setBookingStep(1);
      setErrorText(err?.message || 'Booking failed. Please try again.');
    }
  };

  const resetBooking = () => {
    setBookingStep(0);
    setSelectedProvider(null);
    setBookingDate('');
    setBookingTimeSlot('');
    setAvailableSlots([]);
    setInstructions('');
    setErrorText('');
    setBookingType('ongoing');
    setContractYears(0);
    setContractDays(0);
    setContractHours(0);
    setApplyReferralCredit(false);
    setBookingResult(null);
  };

  if (!categoryMeta) {
    return (
      <div className="bg-[#f4f8fb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Category not found</h3>
          <button
            onClick={() => onNavigate && onNavigate('services')}
            className="enterprise-btn-primary mt-4"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f8fb] min-h-screen">
      {/* Back button */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <button
          onClick={() => onNavigate && onNavigate('services')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </button>
      </div>

      {/* Category header */}
      <ServiceDetailHeader categoryMeta={categoryMeta} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <FilterPanel
          filterArea={filterArea}
          setFilterArea={setFilterArea}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* Provider list */}
        <div className="mt-6 space-y-4">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No providers found</h3>
              <p className="text-sm text-slate-500">
                No providers are currently available in this category.
              </p>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <ProviderListItem
                key={provider.id}
                provider={provider}
                isFavorite={favorites?.includes(provider.id)}
                onToggleFavorite={toggleFavorite}
                onBook={handleBook}
              />
            ))
          )}
        </div>
      </div>

      {/* Booking modal */}
      {bookingStep === 1 && (
        <BookingModal
          provider={selectedProvider}
          onClose={resetBooking}
          bookingDate={bookingDate}
          setBookingDate={handleDateChange}
          bookingTimeSlot={bookingTimeSlot}
          setBookingTimeSlot={setBookingTimeSlot}
          availableSlots={availableSlots}
          availabilityLoading={availabilityLoading}
          bookingType={bookingType}
          setBookingType={setBookingType}
          address={address}
          setAddress={setAddress}
          instructions={instructions}
          setInstructions={setInstructions}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          billMetrics={billMetrics}
          loyaltyTier={currentUser?.loyaltyTier}
          currentUser={currentUser}
          onSubmit={handleSubmitBooking}
          errorText={errorText}
          availabilityBusyError={availabilityBusyError}
          contractYears={contractYears}
          setContractYears={setContractYears}
          contractDays={contractDays}
          setContractDays={setContractDays}
          contractHours={contractHours}
          setContractHours={setContractHours}
          applyReferralCredit={applyReferralCredit}
          setApplyReferralCredit={setApplyReferralCredit}
        />
      )}

      {/* Processing */}
      {bookingStep === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center enterprise-slide-up">
            <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Processing your booking...</h3>
            <p className="text-sm text-slate-500 mt-1">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* Success */}
      {bookingStep === 3 && (
        <BookingSuccess
          details={bookingResult}
          onDashboard={() => {
            resetBooking();
            onNavigate && onNavigate('dashboard');
          }}
          onBrowse={() => {
            resetBooking();
            onNavigate && onNavigate('services');
          }}
        />
      )}
    </div>
  );
}
