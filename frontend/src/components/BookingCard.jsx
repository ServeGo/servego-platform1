import React from 'react';
import { Calendar, MapPin, FileText, MessageSquare, Clock, Star, Phone, ChevronRight } from 'lucide-react';
import { LiveTrackingMap } from './LiveTrackingMap';
import ChatPanel from './ChatPanel';

export default function BookingCard({
  booking,
  onDownloadReceipt,
  onCancel,
  onReview,
  chatOpen,
  onToggleChat,
  chatInput,
  setChatInput,
  onSendMessage
}) {
  return (
    <div className="enterprise-card overflow-hidden p-5 sm:p-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4 mb-5">
        <div className="flex items-center gap-3">
          <img
            className="w-12 h-12 rounded-full object-cover border border-slate-200"
            src={booking.providerAvatar}
            alt={booking.providerName || 'Provider'}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" rx="40" fill="%23e2e8f0"/%3E%3Ctext x="40" y="45" text-anchor="middle" fill="%2364748b" font-size="24" font-family="sans-serif"%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E';
            }}
          />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Assigned Expert</span>
            <h4 className="font-bold text-slate-900 text-sm">{booking.providerName}</h4>
            <span className="text-xs text-slate-500 font-medium">{booking.serviceCategory}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={booking.status} />
          <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded hidden sm:inline">
            {booking.id}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-5 mb-5 border-b border-slate-100">
        <div className="md:col-span-7 space-y-2 text-xs font-medium text-slate-500">
          <div className="flex gap-2 items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-800 font-semibold">{booking.bookingDateLabel || booking.bookingDate} • {booking.bookingTimeSlot}</span>
          </div>
          <div className="flex gap-2 items-center">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600 leading-tight">{booking.locationAddress}</span>
          </div>
          {booking.instructions && (
            <div className="flex gap-2 items-start">
              <span className="bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase border border-sky-100 shrink-0 mt-0.5">Note</span>
              <span className="italic text-slate-500">"{booking.instructions}"</span>
            </div>
          )}
        </div>
        <div className="md:col-span-5 flex flex-row justify-between md:justify-end items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment</span>
            <span className="text-sm font-bold text-slate-800 capitalize">{booking.paymentMethod || 'On Completion'}</span>
          </div>
          {booking.status === 'completed' && (
            <button onClick={() => onDownloadReceipt(booking)}
              className="enterprise-btn-secondary !text-xs !py-2 !px-3">
              <FileText className="w-3.5 h-3.5" />
              <span>Receipt</span>
            </button>
          )}
        </div>
      </div>

      {['ongoing', 'in_progress', 'en_route'].includes(booking.status) && (
        <div className="mb-5 rounded-xl overflow-hidden border border-slate-200">
          <LiveTrackingMap booking={booking} />
        </div>
      )}

      {booking.statusHistory && booking.statusHistory.length > 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3 block">Tracking Timeline</span>
          <div className="flex flex-col sm:flex-row gap-4">
            {booking.statusHistory.map((hist, idx) => (
              <div key={idx} className="flex-1 flex sm:flex-col gap-2 items-start">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] shrink-0 border border-sky-200">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-slate-800 uppercase tracking-tight text-[10px]">{hist.status}</span>
                </div>
                <div className="pl-8 sm:pl-0 sm:mt-1 font-medium">
                  <p className="text-slate-600 text-[10px] leading-tight">{hist.note}</p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {['pending', 'confirmed', 'in_progress', 'en_route', 'ongoing'].includes(booking.status) && (
          <button type="button" onClick={onToggleChat}
            className={`enterprise-btn-secondary !text-xs !py-2 !px-3 ${
              chatOpen ? '!bg-sky-50 !text-sky-700 !border-sky-200' : ''
            }`}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{chatOpen ? 'Hide Chat' : 'Chat'}</span>
          </button>
        )}

        {['pending', 'confirmed'].includes(booking.status) && (
          <button onClick={() => {
            if (window.confirm('Cancel this booking?')) {
              onCancel(booking.id, 'cancelled', 'Cancelled by customer');
            }
          }} className="enterprise-btn-secondary !text-xs !py-2 !px-3 !text-rose-600 !border-rose-200 hover:!bg-rose-50">
            Cancel
          </button>
        )}

        {['completed', 'reviewed'].includes(booking.status) && !booking.reviewed && (
          <button onClick={() => onReview(booking)}
            className="enterprise-btn-primary !text-xs !py-2 !px-3">
            <Star className="w-3.5 h-3.5" />
            Review & Rate
          </button>
        )}

        {['completed', 'reviewed'].includes(booking.status) && booking.reviewed && (
          <span className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase px-4 py-2 rounded-lg border border-slate-200 tracking-wide inline-flex items-center gap-1">
            Review Submitted
          </span>
        )}
      </div>

      {chatOpen && (
        <ChatPanel booking={booking} input={chatInput} setInput={setChatInput} onSend={onSendMessage} />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let className = 'bg-slate-100 text-slate-600 border-slate-200';
  if (['pending'].includes(s)) className = 'bg-amber-50 text-amber-700 border-amber-200';
  else if (['confirmed'].includes(s)) className = 'bg-sky-50 text-sky-700 border-sky-200';
  else if (['en_route', 'in_progress', 'ongoing'].includes(s)) className = 'bg-sky-100 text-sky-700 border-sky-200';
  else if (['completed', 'reviewed'].includes(s)) className = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  else if (['cancelled', 'rejected'].includes(s)) className = 'bg-rose-50 text-rose-700 border-rose-200';

  const labels = {
    pending: 'Pending', confirmed: 'Confirmed', en_route: 'En Route',
    in_progress: 'In Progress', ongoing: 'Ongoing', completed: 'Completed',
    reviewed: 'Reviewed', cancelled: 'Cancelled', rejected: 'Rejected'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${className}`}>
      {labels[s] || status}
    </span>
  );
}
