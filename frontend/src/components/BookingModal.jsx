import React from 'react';
import { Calendar, CreditCard, DollarSign, AlertCircle } from 'lucide-react';

export default function BookingModal({ 
  provider, 
  onClose, 
  errorText, 
  bookingDate, setBookingDate, 
  bookingSlot, setBookingSlot, 
  address, setAddress, 
  instructions, setInstructions, 
  paymentMethod, setPaymentMethod,
  applyReferralCredit, setApplyReferralCredit,
  billMetrics,
  loyaltyTier,
  currentUser,
  onSubmit
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full relative shadow-2xl animate-fade-in my-8 text-left">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Configure Your Service</h3>
            <p className="text-slate-500 text-xs font-medium">Secure booking with {provider.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold"
          >
            Exit
          </button>
        </div>

        {errorText && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form area */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold text-slate-800 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 font-sans">Available Dispatch Shifts</label>
              <div className="grid grid-cols-2 gap-2">
                {provider.timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setBookingSlot(slot)}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                      bookingSlot === slot 
                        ? 'bg-indigo-600 border-indigo-650 text-white shadow-sm' 
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Service Delivery Address</label>
              <textarea
                placeholder="Flat No, Apartment, Street name, Landmark, Pin"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Optional Access Instructions</label>
              <input 
                type="text"
                placeholder="e.g. Ring secondary bell, gate PIN is 4455"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 font-sans">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <PaymentButton active={paymentMethod === 'UPI'} onClick={() => setPaymentMethod('UPI')} icon={<CreditCard className="w-4 h-4" />} label="UPI Apps" />
                <PaymentButton active={paymentMethod === 'Card'} onClick={() => setPaymentMethod('Card')} icon={<CreditCard className="w-4 h-4" />} label="Cards" />
                <PaymentButton active={paymentMethod === 'Cash'} onClick={() => setPaymentMethod('Cash')} icon={<DollarSign className="w-4 h-4" />} label="Cash After Job" />
              </div>
            </div>
          </div>

          {/* Billing Summary */}
          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 self-start shadow-xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-3">Itemized Bill</span>
            
            <div className="space-y-2 pb-3 border-b border-slate-100 text-xs font-bold">
              <BillRow label="Base Labor Fees" value={`₹${billMetrics.base}`} />
              <BillRow label="Trust Insurance" value={`₹${billMetrics.fee}`} />
              <BillRow label="GST (18%)" value={`₹${billMetrics.tax}`} />

              {billMetrics.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-extrabold pt-1 border-t border-dashed border-slate-100">
                  <span>👑 Loyalty ({loyaltyTier.tier})</span>
                  <span>-₹{billMetrics.loyaltyDiscount}</span>
                </div>
              )}

              {billMetrics.referralDiscount > 0 && (
                <div className="flex justify-between text-indigo-600 font-extrabold">
                  <span>🤝 Referral Wallet</span>
                  <span>-₹{billMetrics.referralDiscount}</span>
                </div>
              )}
            </div>

            {currentUser?.referralDiscountBalance > 0 && (
              <div className="my-3 bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={applyReferralCredit}
                    onChange={(e) => setApplyReferralCredit(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Redeem Credits</span>
                </label>
                <div className="text-[11px] text-slate-500 mt-1 ml-6 flex justify-between">
                  <span>Balance: ₹{currentUser.referralDiscountBalance}</span>
                  {applyReferralCredit && <span className="text-indigo-650 font-bold">-₹{billMetrics.referralDiscount}</span>}
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-between font-extrabold text-slate-900 text-sm mb-6">
              <span>Payable Total</span>
              <span className="text-lg text-indigo-600">₹{billMetrics.total}</span>
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg text-center text-sm transition-all shadow-md focus:outline-none"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2.5 rounded-xl border flex items-center gap-2 justify-center transition-all ${
        active ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 text-xs hover:bg-slate-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function BillRow({ label, value }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
