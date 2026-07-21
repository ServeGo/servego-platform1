import { CheckCircle, ArrowRight, LayoutDashboard } from 'lucide-react';

export default function BookingSuccess({ details, onDashboard, onBrowse }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center enterprise-slide-up">
        {/* Checkmark */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Your service has been booked successfully
        </p>

        {/* Details */}
        {details && (
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 mb-8">
            {details.providerName && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Provider</span>
                <span className="font-semibold text-slate-900">{details.providerName}</span>
              </div>
            )}
            {details.service && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service</span>
                <span className="font-semibold text-slate-900">{details.service}</span>
              </div>
            )}
            {details.date && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="font-semibold text-slate-900">{details.date}</span>
              </div>
            )}
            {details.time && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Time</span>
                <span className="font-semibold text-slate-900">{details.time}</span>
              </div>
            )}
            {details.total != null && (
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                <span className="text-slate-900 font-bold">Total</span>
                <span className="font-bold text-teal-600">₹{details.total}</span>
              </div>
            )}
            {details.bookingId && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Booking ID</span>
                <span className="font-mono text-xs text-slate-600">{details.bookingId}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDashboard}
            className="flex-1 enterprise-btn-secondary py-3 flex items-center justify-center gap-2 text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </button>
          <button
            onClick={onBrowse}
            className="flex-1 enterprise-btn-primary py-3 flex items-center justify-center gap-2 text-sm"
          >
            Book Another
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
