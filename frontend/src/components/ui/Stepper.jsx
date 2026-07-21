import { Check } from 'lucide-react';

export default function Stepper({ steps, currentStep, variant = 'horizontal' }) {
  const currentIndex = typeof currentStep === 'number'
    ? currentStep
    : steps.findIndex(s => s.key === currentStep);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1 overflow-x-auto">
        {steps.map((step, i) => {
          const done = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.key || i} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                done ? 'bg-sky-400 text-white' : 'bg-slate-100 text-slate-400'
              } ${isCurrent ? 'ring-2 ring-sky-100' : ''}`}>
                {done && i < currentIndex ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 ${i < currentIndex ? 'bg-sky-400' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const StepIcon = step.icon;
        const isActive = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <div key={step.key || idx} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? isCurrent ? 'bg-sky-400 text-white ring-4 ring-sky-100' : 'bg-sky-400 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {StepIcon ? <StepIcon className="w-4 h-4" /> : (idx <= currentIndex && idx < currentIndex ? <Check className="w-4 h-4" /> : idx + 1)}
              </div>
              <span className={`text-[10px] font-bold text-center ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 mt-[-20px] ${idx < currentIndex ? 'bg-sky-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
