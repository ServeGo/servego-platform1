import React from 'react';
import { Info } from 'lucide-react';
import { TICKET_STATUS, normalizeTicketStatus } from '../../utils/normalizeAdminData';

export default function AdminTicketsPanel({ tickets, activeTicketId, ticketResponse, setTicketResponse, setActiveTicketId, handleTicketResolveSubmit }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Disputes & Escalation Desk</h2>
        <p className="text-surface-500 text-xs">Respond to complaints, authorize refunds, and modify ticket properties.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="enterprise-card p-12 text-center">
          <Info className="w-8 h-8 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-400 italic text-xs">No active help tickets.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => {
            const isReplying = activeTicketId === t.id;
            return (
              <div key={t.id} className="enterprise-card p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-surface-100 text-surface-600 px-2 py-0.5 rounded block w-fit mb-1">{t.id}</span>
                    <h4 className="font-extrabold text-surface-900 text-sm">{t.subject}</h4>
                    <span className="text-xs text-surface-400 mt-1 block">
                      From: <span className="font-bold text-surface-700">{t.name}</span> ({t.email})
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                    normalizeTicketStatus(t.status) === TICKET_STATUS.OPEN
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>{normalizeTicketStatus(t.status)}</span>
                </div>

                <p className="text-surface-600 text-xs italic font-semibold leading-relaxed">"{t.message}"</p>

                {t.response && (
                  <div className="bg-surface-50 p-4 border border-surface-100 rounded-xl text-xs font-semibold leading-relaxed">
                    <span className="text-teal-700 font-extrabold block mb-1">Response:</span>
                    "{t.response}"
                  </div>
                )}

                {normalizeTicketStatus(t.status) === TICKET_STATUS.OPEN && (
                  <div className="pt-2">
                    {!isReplying ? (
                      <button onClick={() => { setActiveTicketId(t.id); setTicketResponse(''); }} className="enterprise-btn-primary !text-xs">
                        Write Response
                      </button>
                    ) : (
                      <div className="space-y-3 pt-3 border-t border-surface-100">
                        <label className="enterprise-label">Response *</label>
                        <textarea value={ticketResponse} onChange={(e) => setTicketResponse(e.target.value)} rows={2} placeholder="Write your response..." className="enterprise-input resize-none" />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setActiveTicketId(null)} className="enterprise-btn-secondary">Cancel</button>
                          <button onClick={() => handleTicketResolveSubmit(t.id)} className="enterprise-btn-primary !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">Submit Resolution</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
