import { useState } from 'react';
import { Search, MapPin, Shield, Star, Users } from 'lucide-react';

export default function Hero({ onNavigate }) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onNavigate) onNavigate('services');
  };

  return (
    <section className="relative overflow-hidden bg-[#f4f8fb]">
      {/* Radial gradient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-sky-400/20 via-teal-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-radial from-teal-300/15 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-sky-300/15 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="text-center">
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Expert Home Services,
            <br />
            <span className="bg-gradient-to-r from-sky-500 to-teal-400 bg-clip-text text-transparent">
              On Demand
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Book verified professionals for cleaning, repairs, maintenance and more.
            Transparent pricing, guaranteed quality.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-10 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl shadow-lg border border-slate-100 p-2">
              {/* Location select */}
              <div className="flex items-center gap-2 px-4 py-2.5 sm:border-r border-slate-200 flex-shrink-0">
                <MapPin className="w-5 h-5 text-sky-500" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-transparent text-slate-700 font-medium outline-none cursor-pointer text-sm appearance-none pr-2"
                >
                  <option value="">All Areas</option>
                  <option value="downtown">Downtown</option>
                  <option value="suburbs">Suburbs</option>
                  <option value="uptown">Uptown</option>
                  <option value="midtown">Midtown</option>
                </select>
              </div>

              {/* Search input */}
              <div className="flex items-center gap-2 px-4 py-2.5 flex-1">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="What service do you need?"
                  className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 font-medium"
                />
              </div>

              {/* Search button */}
              <button
                type="submit"
                className="bg-sky-400 hover:bg-sky-500 text-slate-900 font-semibold rounded-xl px-8 py-3 transition-colors duration-200 shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">10,000+</div>
                <div className="text-xs text-slate-500">Bookings</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">4.8</div>
                <div className="text-xs text-slate-500">Average Rating</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Verified</div>
                <div className="text-xs text-slate-500">Professionals</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
