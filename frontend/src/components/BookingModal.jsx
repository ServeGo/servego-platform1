import { useState } from 'react';
import { X, Calendar, Clock, MapPin, CreditCard, FileText, Check } from 'lucide-react';

export default function BookingModal({
  provider,
  onClose,
  bookingDate,
  setBookingDate,
  bookingTimeSlot,
  setBookingTimeSlot,
  availableSlots,
  availabilityLoading,
  bookingType,
  setBookingType,
  address,
  setAddress,
  instructions,
  setInstructions,
  paymentMethod,
  setPaymentMethod,
  billMetrics,
  loyaltyTier,
  currentUser,
  onSubmit,
  errorText,
  availabilityBusyError,
  contractYears,
  setContractYears,
  contractDays,
  setContractDays,
  contractHours,
  setContractHours,
  applyReferralCredit,
  setApplyReferralCredit,
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit && onSubmit();
    } finally {
      setLoading(false);
    }
  };

  if (!provider) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto enterprise-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Book Service</h2>
            <p className="text-sm text-slate-500">{provider.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error */}
          {errorText && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 border border-red-100">
              {errorText}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="enterprise-label flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              Select Date
            </label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="enterprise-input w-full"
              required
            />
          </div>

          {/* Time slots */}
          <div>
            <label className="enterprise-label flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-sky-500" />
              Select Time
            </label>
            {availabilityLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                Loading available slots...
              </div>
            ) : availabilityBusyError ? (
              <p className="text-sm text-amber-600 py-2">{availabilityBusyError}</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(availableSlots || []).map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBookingTimeSlot(slot)}
                    className={`text-sm font-medium py-2 px-3 rounded-lg border transition-colors ${
                      bookingTimeSlot === slot
                        ? 'bg-sky-400 text-slate-900 border-sky-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Booking type */}
          <div>
            <label className="enterprise-label mb-2 block">Booking Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBookingType('contract')}
                className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                  bookingType === 'contract'
                    ? 'bg-sky-400 text-slate-900 border-sky-400'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                }`}
              >
                Contract
              </button>
              <button
                type="button"
                onClick={() => setBookingType('ongoing')}
                className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                  bookingType === 'ongoing'
                    ? 'bg-sky-400 text-slate-900 border-sky-400'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                }`}
              >
                One-time
              </button>
            </div>
          </div>

          {/* Contract options */}
          {bookingType === 'contract' && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">Years</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={contractYears}
                    onChange={(e) => setContractYears(Number(e.target.value))}
                    className="enterprise-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">Days</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={contractDays}
                    onChange={(e) => setContractDays(Number(e.target.value))}
                    className="enterprise-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={contractHours}
                    onChange={(e) => setContractHours(Number(e.target.value))}
                    className="enterprise-input w-full text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          <div>
            <label className="enterprise-label flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              Service Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full address"
              className="enterprise-input w-full"
              required
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="enterprise-label flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-sky-500" />
              Special Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Any specific instructions for the provider..."
              rows={3}
              className="enterprise-input w-full resize-none"
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="enterprise-label flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-sky-500" />
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="enterprise-input w-full"
            >
              <option value="cash">Cash on Delivery</option>
              <option value="upi">UPI</option>
              <option value="card">Credit/Debit Card</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>

          {/* Referral credit */}
          {currentUser && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={applyReferralCredit}
                onChange={(e) => setApplyReferralCredit(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
              />
              <span className="text-sm text-slate-600">Apply referral credit</span>
            </label>
          )}

          {/* Price summary */}
          {billMetrics && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Price Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Base Price</span>
                <span className="font-medium text-slate-900">₹{billMetrics.basePrice || provider.price || 0}</span>
              </div>
              {billMetrics.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-teal-600">-₹{billMetrics.discount}</span>
                </div>
              )}
              {billMetrics.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Loyalty ({loyaltyTier})</span>
                  <span className="font-medium text-teal-600">-₹{billMetrics.loyaltyDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">₹{billMetrics.total || provider.price || 0}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !bookingDate || !bookingTimeSlot || !address}
            className="enterprise-btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirm Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
