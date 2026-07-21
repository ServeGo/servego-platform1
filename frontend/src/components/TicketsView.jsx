import React from 'react';
import { Send, LifeBuoy, MessageSquare, AlertCircle } from 'lucide-react';

export default function TicketsView({ tickets, onSubmit, subject, setSubject, message, setMessage, success }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left enterprise-fade-in">
      <div className="lg:col-span-5 enterprise-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <LifeBuoy className="w-4 h-4 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-sm">Raise a New Ticket</h4>
        </div>
        <p className="text-slate-500 text-xs mt-1 mb-4 font-medium">Contact support for billing, refunds, or complaints.</p>

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs font-bold">
            Ticket successfully submitted. We'll get back to you soon.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="enterprise-label">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="enterprise-input">
              <option value="Payment Refund Support">Payment Refund Support</option>
              <option value="Accidental Damage Claim">Accidental Damage Claim</option>
              <option value="Specialist Behavior Complaint">Behavior Complaint</option>
              <option value="Account & Profile Settings">Account Settings</option>
            </select>
          </div>

          <div>
            <label className="enterprise-label">Details *</label>
            <textarea rows={4} required placeholder="Describe your issue clearly..."
              value={message} onChange={(e) => setMessage(e.target.value)}
              className="enterprise-input resize-none" />
          </div>

          <button type="submit" className="enterprise-btn-primary w-full text-xs">
            <Send className="w-3.5 h-3.5" />
            Submit Ticket
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <h4 className="font-bold text-slate-900 text-sm">Ticket History</h4>

        {tickets.length === 0 ? (
          <div className="text-center py-12 enterprise-card">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900 mb-1">No support tickets</p>
            <p className="text-xs text-slate-500 font-medium">You haven't submitted any tickets yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="enterprise-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t.id}</span>
                    <h5 className="font-bold text-slate-900 text-sm mt-1">{t.subject}</h5>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    t.status === 'open'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">"{t.message}"</p>
                {t.response && (
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-lg text-xs text-slate-700 font-medium">
                    <span className="font-bold text-sky-600 block mb-1">Support Response:</span>
                    "{t.response}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
