import React from 'react';

export default function ProviderReferrals({ 
  provider, 
  referralInput, setReferralInput, 
  onApply, 
  onCopy, 
  copied, 
  refError, 
  refSuccess,
  referredBy
}) {
  return (
    <div className="space-y-8 text-left">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute right-6 top-6 bg-indigo-500 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-md">Partner Growth Engine</div>
        <h3 className="text-2xl font-black text-white mt-1">Earn ₹500 Bonus Per Signup</h3>
        <p className="text-slate-300 text-xs mt-3 max-w-xl font-semibold">Invite fellow professionals to register. Get ₹500 bonus on their first completed job. No ceilings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <h4 className="text-lg font-black text-slate-900 leading-none">Ambassador Credentials</h4>
          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
            <span className="text-[9px] text-slate-400 font-black uppercase block mb-2">My Referral Code</span>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-center">
              <div className="bg-indigo-50 border border-dashed border-indigo-300 rounded-xl px-4 py-3 font-mono font-black text-lg text-indigo-700 select-all">{provider?.referralCode || 'PRO-CODE'}</div>
              <button onClick={onCopy} className="bg-slate-900 hover:bg-slate-800 text-xs font-black text-white px-5 rounded-xl transition-colors py-3 sm:py-0 outline-none">{copied ? 'Copied' : 'Copy Code'}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
              <span className="text-[10px] text-emerald-800 font-black uppercase block">Earnings Bonus</span>
              <span className="text-2xl font-black text-emerald-800 mt-2 block">₹{provider?.referralsEarningsBonus || 0}</span>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
              <span className="text-[10px] text-indigo-800 font-black uppercase block">Signups Count</span>
              <span className="text-2xl font-black text-indigo-900 mt-2 block">{provider?.referralsCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <h4 className="text-lg font-black text-slate-900 leading-none">Claim Welcome Bonus</h4>
          <form onSubmit={onApply} className="my-5 space-y-3">
            <input type="text" placeholder="Enter sponsor code..." value={referralInput} onChange={(e) => setReferralInput(e.target.value)} disabled={!!referredBy} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 font-mono text-xs font-black px-4 py-3 rounded-xl outline-none transition-all uppercase" />
            {refError && <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 font-black p-2 rounded-lg">⚠ {refError}</div>}
            {refSuccess && <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 font-black p-2 rounded-lg">🎉 {refSuccess}</div>}
            {referredBy ? (
              <div className="text-xs text-slate-600 font-black text-center bg-slate-100 rounded-xl p-3 border border-slate-200">✔ Sponsor: <span className="text-indigo-600 font-mono">{referredBy}</span></div>
            ) : (
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black p-3 rounded-xl shadow-sm outline-none transition-all">Claim ₹250 Credit</button>
            )}
          </form>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] text-slate-400 font-bold leading-relaxed italic">🔒 verification audit passes within 24 hours.</div>
        </div>
      </div>
    </div>
  );
}
