import React from 'react';

export default function ProviderReviews({ rating, reviews }) {
  return (
    <div className="space-y-6 text-left">
      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Client Review Audit</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="bg-slate-900 text-white p-6 rounded-2xl text-center space-y-2 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Feedback Score</span>
          <span className="text-3xl font-black text-amber-400 block">⭐ {(typeof rating === 'number' ? rating : 0).toFixed(1)}</span>

          <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-tight">{reviews?.length || 0} Customer Audits</span>
        </div>

        <div className="md:col-span-3 space-y-4">
          {(!reviews || reviews.length === 0) ? (
            <div className="bg-white p-10 rounded-2xl border text-center text-xs text-slate-400 italic font-semibold">No feedback found.</div>

          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((rev, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 text-xs shadow-3xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-900 font-black block uppercase tracking-tight">{rev.reviewerName}</span>
                    <span className="text-amber-500 font-black">★ {rev.rating}</span>
                  </div>
                  <p className="text-slate-600 italic font-medium leading-relaxed">"{rev.comment}"</p>
                  <span className="text-[9px] text-slate-400 font-mono block text-right">{rev.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
