import { Headphones } from 'lucide-react';

export default function SupportBanner({ onContact }) {
  return (
    <div className="bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm">Need help?</span>
            <p className="text-xs text-slate-500">Our support team is available 24/7</p>
          </div>
        </div>
        <button
          onClick={onContact}
          className="enterprise-btn-secondary px-5 py-2 text-sm"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}
