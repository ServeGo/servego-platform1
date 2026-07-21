import React, { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { normalizeProviderIsVerified } from '../../utils/normalizeAdminData';
import { api } from '../../utils/apiClient';

const ACCOUNT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', cls: 'enterprise-btn-primary !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-[10px]' },
  { value: 'ON_HOLD', label: 'On Hold', cls: 'enterprise-btn-primary !bg-amber-500 hover:!bg-amber-600 !border-amber-500 !text-[10px]' },
  { value: 'BLOCKED', label: 'Block', cls: 'enterprise-btn-primary !bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-[10px]' },
];

const ACCOUNT_STATUS_BADGE = {
  ACTIVE: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  ON_HOLD: 'bg-amber-50 border-amber-200 text-amber-800',
  BLOCKED: 'bg-rose-50 border-rose-200 text-rose-800',
};

function AccountStatusControls({ provider, onStatusChanged }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const current = provider.accountStatus || 'ACTIVE';

  const handleSet = async (nextStatus) => {
    if (nextStatus === current) return;
    const reason = window.prompt(`Reason for setting provider to ${nextStatus}:`);
    if (!reason || !reason.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await api.patch(`/admin/providers/${provider.id}/status`, { status: nextStatus, reason: reason.trim() });
      if (res.ok) onStatusChanged(provider.id, nextStatus);
      else setError(res.data?.message || 'Failed.');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[9px] uppercase font-bold text-surface-400 tracking-wider">Account Status:</span>
        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black border ${ACCOUNT_STATUS_BADGE[current] || ACCOUNT_STATUS_BADGE.ACTIVE}`}>
          {current.replace('_', ' ')}
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {ACCOUNT_STATUS_OPTIONS.filter(o => o.value !== current).map(opt => (
          <button key={opt.value} onClick={() => handleSet(opt.value)} disabled={loading}
            className={`${opt.cls} disabled:opacity-50`}>{opt.label}</button>
        ))}
      </div>
      {error && <p className="text-red-600 text-[10px] font-semibold">{error}</p>}
    </div>
  );
}

export default function AdminProvidersPanel({ providersList, handlePartnerApproval }) {
  const [localStatuses, setLocalStatuses] = useState({});
  const handleStatusChanged = (providerId, newStatus) => setLocalStatuses(prev => ({ ...prev, [providerId]: newStatus }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Vetted Provider Pool</h2>
        <p className="text-surface-500 text-xs">Verify credentials, review catalogs, and manage expert visibilities.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providersList.map((p) => {
          const effectiveStatus = localStatuses[p.id] || p.accountStatus || 'ACTIVE';
          const pWithStatus = { ...p, accountStatus: effectiveStatus };
          return (
            <div key={p.id} className={`enterprise-card p-5 space-y-4 flex flex-col justify-between ${!normalizeProviderIsVerified(p) ? 'border-amber-300 bg-gradient-to-br from-white to-amber-50/10' : ''}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <img className="w-10 h-10 rounded-xl object-cover border border-surface-200" src={p.avatar} alt={p.name} referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-extrabold text-surface-900 text-sm">{p.name}</h4>
                      <span className="text-[10px] bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wide mt-1 inline-block">{p.category} Division</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black border ${normalizeProviderIsVerified(p) ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    {normalizeProviderIsVerified(p) ? 'Live Approved' : 'Under Vetting'}
                  </span>
                </div>
                <p className="text-surface-500 text-xs line-clamp-2 leading-relaxed font-medium italic">"{p.bio}"</p>
                <div className="bg-surface-50 p-3 rounded-xl border border-surface-100 text-[11px] font-semibold text-surface-500 grid grid-cols-2 gap-2">
                  <div><span className="text-surface-400 uppercase text-[9px] block">Phone</span><span className="text-surface-800 block">{p.phone}</span></div>
                  <div><span className="text-surface-400 uppercase text-[9px] block">Rate</span><span className="text-surface-800 block">₹{p.hourlyRate}/hr</span></div>
                  <div><span className="text-surface-400 uppercase text-[9px] block">Experience</span><span className="text-surface-800 block">{p.experienceYears} Years</span></div>
                  <div><span className="text-surface-400 uppercase text-[9px] block">Rating</span><span className="text-amber-600 block font-bold">⭐ {p.rating} / 5.0</span></div>
                  <div className="col-span-2"><span className="text-surface-400 uppercase text-[9px] block">Sectors</span><span className="text-surface-800 block truncate">{Array.isArray(p.serviceAreas) ? p.serviceAreas.join(', ') : p.serviceAreas}</span></div>
                </div>
                <AccountStatusControls provider={pWithStatus} onStatusChanged={handleStatusChanged} />
              </div>
              <div className="pt-3 border-t border-surface-100 flex justify-end gap-2 text-xs">
                {!normalizeProviderIsVerified(p) ? (
                  <button onClick={() => handlePartnerApproval(p.id)} className="enterprise-btn-primary w-full !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
                    <Check className="w-4 h-4" />
                    <span>Approve Partner</span>
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5 py-1 text-xs mx-auto">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Certified & Active</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
