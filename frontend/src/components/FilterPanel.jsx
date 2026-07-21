import { MapPin, ArrowUpDown } from 'lucide-react';

export default function FilterPanel({
  filterArea,
  setFilterArea,
  sortBy,
  setSortBy,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Area input */}
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          placeholder="Filter by area..."
          className="enterprise-input w-full pl-9 pr-4 py-2.5 text-sm"
        />
      </div>

      {/* Sort dropdown */}
      <div className="relative sm:w-56">
        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="enterprise-input w-full pl-9 pr-4 py-2.5 text-sm appearance-none cursor-pointer"
        >
          <option value="rating">Sort by: Rating</option>
          <option value="price-low">Sort by: Price Low → High</option>
          <option value="price-high">Sort by: Price High → Low</option>
        </select>
      </div>
    </div>
  );
}
