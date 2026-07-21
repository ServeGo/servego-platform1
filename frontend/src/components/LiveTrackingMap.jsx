import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Clock, Truck } from 'lucide-react';

export const LiveTrackingMap = ({ provider, status, eta, booking }) => {
  const prov = provider || booking;
  const [progress, setProgress] = useState(0.2);
  const [currentEta, setCurrentEta] = useState(eta || 12);

  useEffect(() => {
    const isEnRoute = (status || booking?.status) === 'en_route';
    if (isEnRoute) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 0.95) return 0.1;
          const next = prev + 0.05;
          setCurrentEta(Math.max(1, Math.round(12 * (1 - next))));
          return next;
        });
      }, 4000);
      return () => clearInterval(interval);
    } else if ((status || booking?.status) === 'ongoing') {
      setProgress(1.0);
      setCurrentEta(0);
    }
  }, [status, booking?.status]);

  const pathCoordinates = [
    { x: 60, y: 180 },
    { x: 150, y: 150 },
    { x: 280, y: 120 },
    { x: 400, y: 100 },
    { x: 500, y: 70 },
  ];

  const getInterpolatedPoint = (t) => {
    const segments = pathCoordinates.length - 1;
    const scaledT = t * segments;
    const index = Math.min(Math.floor(scaledT), segments - 1);
    const fraction = scaledT - index;
    const p1 = pathCoordinates[index];
    const p2 = pathCoordinates[Math.min(index + 1, segments)];
    return {
      x: p1.x + (p2.x - p1.x) * fraction,
      y: p1.y + (p2.y - p1.y) * fraction,
    };
  };

  const point = getInterpolatedPoint(progress);

  return (
    <div className="bg-slate-900 rounded-xl text-white overflow-hidden">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Tracking</span>
        </div>
        <span className="text-[10px] font-bold text-sky-400">{currentEta > 0 ? `${currentEta} min ETA` : 'Arrived'}</span>
      </div>

      <div className="relative bg-slate-800 h-44">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 560 220">
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(51,65,85,0.2)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path d="M 60 180 Q 105 160 150 150 T 280 120 T 400 100 T 500 70"
            fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          <path d="M 60 180 Q 105 160 150 150 T 280 120 T 400 100 T 500 70"
            fill="none" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="420" strokeDashoffset={420 * (1 - progress)}
            className="transition-all duration-1000" />
          <circle cx="60" cy="180" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="500" cy="70" r="12" fill="rgba(56,189,248,0.2)" className="animate-pulse" />
          <circle cx="500" cy="70" r="8" fill="#38BDF8" stroke="#7dd3fc" strokeWidth="2" />
          <circle cx={point.x} cy={point.y} r="14" fill="rgba(251,191,36,0.2)" className="animate-ping" />
          <circle cx={point.x} cy={point.y} r="8" fill="#F59E0B" stroke="#FCD34D" strokeWidth="2" />
        </svg>

        <div className="absolute left-3 bottom-3 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1 text-[9px] text-slate-400 font-bold flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Provider Hub
        </div>
        <div className="absolute right-3 top-3 bg-sky-900/90 border border-sky-600 rounded-lg px-2 py-1 text-[9px] font-bold text-sky-100 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Your Location
        </div>

        <div style={{ left: `${Math.min(85, Math.max(10, (point.x / 5.6)))}%`, top: `${point.y - 35}px` }}
          className="absolute -translate-x-1/2 bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[9px] shadow-lg flex items-center gap-1.5 leading-none transition-all duration-300">
          {prov?.avatar && <img src={prov.avatar} className="w-4 h-4 rounded-full object-cover border border-slate-950" alt="" />}
          <Truck className="w-3 h-3 shrink-0" />
          <span>{(prov?.name || 'Provider').split(' ')[0]}</span>
        </div>
      </div>

      <div className="p-3 grid grid-cols-3 gap-3 text-xs border-t border-slate-800">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Status</span>
            <span className="text-[10px] text-slate-200 font-bold capitalize">{(status || booking?.status || 'unknown').replace('_', ' ')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold block">ETA</span>
            <span className="text-[10px] text-slate-200 font-bold">{currentEta > 0 ? `${currentEta} min` : 'Arrived'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Provider</span>
            <span className="text-[10px] text-slate-200 font-bold">{(prov?.name || 'N/A').split(' ')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
