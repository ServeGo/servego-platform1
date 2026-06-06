import React from 'react';

export default function HowItWorks() {
  return (
    <section className="py-12 px-4 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-teal-700 font-bold uppercase tracking-wider text-xs">Simple Booking Flow</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Book a service in 3 simple steps</h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-semibold">Easy, fast, and completely stress-free booking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        <Step number="1" title="Select Service" desc="Choose from listed items, pick a preferred professional, and schedule a convenient time." />
        <Step number="2" title="Secure Payment" desc="Choose secure online options like UPI and cards, or simply pay cash after completion." />
        <Step number="3" title="Relax & Track" desc="Watch technician progress with secure link updates, and rate your expert after service." />
      </div>
    </section>
  );
}

function Step({ number, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center relative z-10 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
      <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-extrabold text-sm mb-3">
        {number}
      </div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="text-slate-500 text-xs mt-2 leading-relaxed font-semibold">{desc}</p>
    </div>
  );
}
