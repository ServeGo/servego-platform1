import { Search, MapPin } from 'lucide-react';
import { CITIES } from '../data';

export default function ServiceHeader({
  selectedArea,
  inputSearch,
  setInputSearch,
  onSearchSubmit,
  onSearchChange,
}) {
  return (
    <div className="bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
          Our Services
        </h1>

        <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          {/* Location */}
          <div className="relative flex-shrink-0 sm:w-48">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedArea || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="enterprise-input w-full pl-9 pr-4 py-2.5 text-sm appearance-none cursor-pointer"
            >
              <option value="">All Areas</option>
              {(CITIES || []).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              placeholder="Search services..."
              className="enterprise-input w-full pl-9 pr-4 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            className="enterprise-btn-primary px-6 py-2.5 text-sm"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
