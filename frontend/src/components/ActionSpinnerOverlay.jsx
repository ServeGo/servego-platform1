import React from 'react';

export default function ActionSpinnerOverlay({ isOpen, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] enterprise-backdrop flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-surface-200 enterprise-scale-in">
        <div className="relative w-12 h-12 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-[3px] border-surface-200" />
          <div className="absolute inset-0 rounded-full border-[3px] border-teal-500 border-t-transparent animate-spin" />
        </div>
        <h4 className="text-[14px] font-bold text-surface-900">
          {message || 'Processing...'}
        </h4>
        <p className="text-surface-400 text-[12px] mt-1.5 font-medium">Please wait while we complete this action.</p>
      </div>
    </div>
  );
}
