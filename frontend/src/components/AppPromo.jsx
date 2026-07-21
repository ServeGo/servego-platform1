import { Download, Star, Smartphone } from 'lucide-react';

export default function AppPromo() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-16 md:py-20">
      {/* Teal accent glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-teal-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-sky-500/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Text content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Get the ServeGo App
            </h2>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed max-w-md">
              Book services on the go, track your bookings in real-time, manage
              appointments, and get exclusive app-only discounts.
            </p>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap items-center gap-6 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <span className="text-white font-semibold text-sm">4.8 ★ Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Download className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-white font-semibold text-sm">1M+ Downloads</span>
              </div>
            </div>

            {/* Store badges */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-5 py-3 transition-colors">
                <Smartphone className="w-5 h-5 text-white" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase">Download on</div>
                  <div className="text-sm font-semibold text-white">App Store</div>
                </div>
              </button>
              <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-5 py-3 transition-colors">
                <Smartphone className="w-5 h-5 text-white" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase">Get it on</div>
                  <div className="text-sm font-semibold text-white">Google Play</div>
                </div>
              </button>
            </div>
          </div>

          {/* Phone mockup placeholder */}
          <div className="flex-shrink-0">
            <div className="w-64 h-[480px] bg-gradient-to-br from-slate-700 to-slate-800 rounded-[3rem] border-4 border-slate-600 shadow-2xl flex items-center justify-center">
              <div className="text-center">
                <Smartphone className="w-16 h-16 text-sky-400 mx-auto mb-4" />
                <span className="text-slate-400 text-sm font-medium">ServeGo App</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
