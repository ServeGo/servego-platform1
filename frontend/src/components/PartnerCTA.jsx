import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function PartnerCTA({ onApply }) {
  return (
    <section className="bg-slate-100 border-y border-slate-200 py-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
        <div className="max-w-xl text-left">
          <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs">For Skilled Professionals</span>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">Become a Certified Service Partner on ServeGo</h3>
          <p className="text-slate-500 text-sm sm:text-base mt-2 font-medium">
            Deliver top home services, manage your slots, grow your client base in Hyderabad, and enjoy weekly prompt payouts. Join over 200+ active partners.
          </p>
          
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
            <PartnerPerk label="Weekly Direct Payouts" />
            <PartnerPerk label="Zero App Listing Fees" />
            <PartnerPerk label="Complete Flexi Hours" />
          </div>
        </div>
        <button 
          onClick={onApply}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-4 rounded-xl text-sm transition-all shadow-md shrink-0 whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-2 cursor-pointer" 
        >
          <span>Apply Now</span>
          <ArrowRight className="w-4 h-4 animate-pulse" />
        </button>
      </div>
    </section>
  );
}

function PartnerPerk({ label }) {
  return (
    <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1">
      ✔ {label}
    </span>
  );
}
