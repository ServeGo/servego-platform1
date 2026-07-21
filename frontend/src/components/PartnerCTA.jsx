import { TrendingUp, Users, Award } from 'lucide-react';

export default function PartnerCTA({ onNavigate }) {
  const stats = [
    { icon: Users, label: 'Active Providers', value: '200+' },
    { icon: TrendingUp, label: 'Jobs Completed', value: '4,500+' },
    { icon: Award, label: 'Avg Rating', value: '4.85' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-sky-500 to-teal-400 py-16 md:py-20">
      {/* Glow overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Become a ServeGo Partner
        </h2>
        <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto leading-relaxed">
          Join our growing network of professionals. Earn more, grow your
          business, and access thousands of customers in your area.
        </p>

        {/* Stats */}
        <div className="mt-10 flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-white">{stat.value}</span>
              <span className="text-sm text-white/70 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onNavigate && onNavigate('become-partner')}
          className="mt-10 bg-white text-slate-900 font-semibold rounded-lg px-8 py-3.5 hover:bg-slate-50 transition-colors shadow-lg"
        >
          Join as Provider
        </button>
      </div>
    </section>
  );
}
