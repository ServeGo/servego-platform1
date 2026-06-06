import React from 'react';
import { HYDERABAD_NEIGHBORHOODS } from '../data';

export default function FilterPanel({ filterArea, setFilterArea, sortBy, setSortBy }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
      
      {/* Neighborhood filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto text-xs">
        <span className="font-extrabold text-slate-700 shrink-0 uppercase tracking-wider">Neighborhood filter:</span>
        <select 
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none text-xs w-full sm:w-48 cursor-pointer"
        >
          <option value="">All Hyderabad Areas</option>
          {HYDERABAD_NEIGHBORHOODS.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {/* Sorter Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto text-xs">
        <span className="font-extrabold text-slate-700 shrink-0 uppercase tracking-wider">Sort Specialists by:</span>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200">
          <SortButton active={sortBy === 'rating'} onClick={() => setSortBy('rating')} label="Top Ratings" />
          <SortButton active={sortBy === 'experience'} onClick={() => setSortBy('experience')} label="Experience" />
          <SortButton active={sortBy === 'priceAsc'} onClick={() => setSortBy('priceAsc')} label="Price: Low to High" />
        </div>
      </div>
    </div>
  );
}

function SortButton({ active, onClick, label }) {
  return (
    <button 
      onClick={onClick} 
      className={`px-3 py-1.5 font-bold rounded-lg text-xs transition-colors flex-1 ${active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
    >
      {label}
    </button>
  );
}
