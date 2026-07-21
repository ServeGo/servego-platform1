import React from 'react';
import { Copy, Gift, Users, Star, TrendingUp, Check } from 'lucide-react';

export default function ReferralsView({
  user,
  loyaltyTier,
  completedCount,
  bookingsNeeded,
  progressPercent,
  nextTierName,
  referralCode,
  referralInput,
  setReferralInput,
  onApplyCode,
  onCopyCode,
  copied,
  refError,
  refSuccess
}) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 text-left enterprise-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Referrals & Loyalty</h2>

      <div className="enterprise-card overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative">
          <div className="absolute right-6 top-6 bg-sky-400 text-[#0F172A] text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider">
            Loyalty Program
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Partnership Status</span>
          <div className="flex items-center gap-3 mt-2">
            <h3 className="text-2xl font-bold text-white">{loyaltyTier.tier}</h3>
          </div>
          <p className="text-slate-400 text-xs mt-3 max-w-xl font-medium leading-relaxed">
            {loyaltyTier.desc}. Complete more jobs to level up automatically.
          </p>

          {nextTierName && (
            <div className="mt-6 pt-4 border-t border-white/10 text-xs">
              <div className="flex justify-between font-bold text-slate-400 mb-2">
                <span>Next Tier: {nextTierName}</span>
                <span className="text-white">{completedCount} / {completedCount + bookingsNeeded} Jobs</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, progressPercent)}%` }} />
              </div>
              {bookingsNeeded > 0 && (
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Complete <span className="text-sky-400 font-bold">{bookingsNeeded} more jobs</span> to unlock higher savings.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {[
              { tier: 'Bronze', active: loyaltyTier.tier.includes('Bronze'), desc: 'Standard pricing & support' },
              { tier: 'Silver', active: loyaltyTier.tier.includes('Silver'), desc: '5% off & priority dispatch' },
              { tier: 'Gold', active: loyaltyTier.tier.includes('Gold'), desc: '8% off & free consults' },
              { tier: 'Platinum', active: loyaltyTier.tier.includes('Platinum'), desc: '12% off & damage cover' },
            ].map(item => (
              <div key={item.tier} className={`bg-white border p-3 rounded-xl relative ${item.active ? 'border-sky-400 bg-sky-50/30' : 'border-slate-100'}`}>
                {item.active && <span className="absolute -top-2 right-3 bg-sky-400 text-[#0F172A] px-2 py-0.5 rounded text-[9px] font-bold">CURRENT</span>}
                <span className="font-bold text-slate-800 text-[11px] uppercase block">{item.tier}</span>
                <p className="text-slate-500 font-medium text-[10px] mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 enterprise-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Your Referral Code</h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">
              Share your code with friends. Both of you get ₹150 credit when they complete a booking.
            </p>
          </div>

          <div className="my-5 p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2">My Code</span>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-center">
              <div className="bg-sky-50 border border-dashed border-sky-200 rounded-lg px-4 py-3 font-mono font-bold text-lg text-sky-700 tracking-wider flex-1">
                {referralCode}
              </div>
              <button onClick={onCopyCode}
                className="enterprise-btn-primary !py-3 !px-5 !text-xs">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Wallet Balance</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">₹{user?.referralDiscountBalance || 0}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Referrals</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{user?.referralsCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 enterprise-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Claim Gift Code</h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">
              Redeem a friend's referral code to get ₹150 credit.
            </p>
          </div>

          <form onSubmit={onApplyCode} className="my-5 space-y-3">
            <input type="text" placeholder="Enter friend's code..."
              value={referralInput} onChange={(e) => setReferralInput(e.target.value)}
              disabled={!!user?.referredBy}
              className="enterprise-input font-mono font-bold text-center" />
            {refError && <div className="text-[11px] text-rose-700 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{refError}</div>}
            {refSuccess && <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">{refSuccess}</div>}

            {user?.referredBy ? (
              <div className="text-[11px] text-slate-500 font-bold text-center bg-slate-50 rounded-lg p-3 border border-slate-100">
                Applied: <span className="text-sky-600 font-mono">{user.referredBy}</span>
              </div>
            ) : (
              <button type="submit" className="enterprise-btn-primary w-full text-xs">
                <Gift className="w-3.5 h-3.5" /> Claim Credit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
