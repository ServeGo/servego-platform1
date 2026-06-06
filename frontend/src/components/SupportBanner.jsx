import React from 'react';

export default function SupportBanner({ onContact }) {
  return (
    <div className="mt-16 bg-slate-950 border border-indigo-500/10 text-white rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-md text-left">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,transparent_50%)] opacity-55" />
      <div className="relative z-10 max-w-xl">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Need a custom enterprise maintenance contract?</h3>
        <p className="text-slate-400 text-xs mt-2 leading-relaxed font-medium">
          We provide deep sanitation, lighting layout inspections, and structural water damage proofing contracts for schools, office blocks, and residential housing societies across Hyderabad.
        </p>
      </div>
      <button 
        onClick={onContact}
        className="relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-lg text-xs transition-colors shadow-sm whitespace-nowrap self-stretch md:self-auto text-center"
      >
        Contact Premium Support
      </button>
    </div>
  );
}
