import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const TOAST_STYLES = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertCircle },
  info: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', icon: Info },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertCircle },
};

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(true);
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm w-full ${visible ? 'enterprise-slide-up' : 'opacity-0 translate-y-2 transition-all duration-300'}`}>
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${style.bg} ${style.border}`}>
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.text}`} />
        <p className={`text-sm font-semibold flex-1 ${style.text}`}>{message}</p>
        <button onClick={() => { setVisible(false); setTimeout(() => onClose?.(), 300); }} className="shrink-0 p-0.5 hover:opacity-70">
          <X className={`w-4 h-4 ${style.text}`} />
        </button>
      </div>
    </div>
  );
}
