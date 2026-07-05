import React from 'react';

export default function ActionSpinnerOverlay({ isOpen, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-slate-200 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-t-4 border-indigo-600 animate-spin mb-6" />
        <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
          {message || 'Processing...'}
        </h4>
        <p className="text-slate-500 text-xs mt-2 font-medium">Please wait while we complete the action.</p>
      </div>
    </div>
  );
}

