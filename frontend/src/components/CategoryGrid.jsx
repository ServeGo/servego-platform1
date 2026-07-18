import React from 'react';
import { ChevronRight } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function CategoryGrid({ categories, providers, onCategoryClick, onSeeAll }) {
  // `categories` may come from static data.js (home page) or live API services.
  // Live API services include `activeSpecialistCount` derived server-side.
  // Static entries fall back to counting from the providers list.
  const safeProviders = Array.isArray(providers) ? providers : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  return (

    <section className="py-12 px-4 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
        <div>
          <span className="text-teal-700 font-bold uppercase tracking-wider text-xs">Categories</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-slate-900 mt-1 leading-none">What can we help you solve?</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium">Pick from our list of high-quality home services</p>
        </div>
        <button 
          onClick={onSeeAll}
          className="mt-4 md:mt-0 inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold group transition-all text-xs focus:outline-none"
        >
          <span>See All Services</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeCategories.map((cat) => {
          // Prefer server-derived count; fall back to client-side count for static entries
          const activeCount = typeof cat.activeSpecialistCount === 'number'
            ? cat.activeSpecialistCount
            : safeProviders.filter(
                (p) => (p.category || '').toLowerCase() === (cat.name || '').toLowerCase() && p.isVerified
              ).length;
          
          return (
            <div 
              key={cat.id}
              onClick={() => onCategoryClick(cat.name || cat.id)}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 group-hover:bg-teal-700 group-hover:text-white transition-all border border-teal-500/10">
                  <CategoryIcon name={cat.name} className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors uppercase tracking-tight">{cat.name}</h3>
                <p className="text-slate-500 text-sm mt-2 line-clamp-2">{cat.description}</p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                <span className="text-slate-500 font-medium">{activeCount} Active Specialists</span>
                {cat.basePrice && <span className="text-teal-700 font-extrabold">Starts from ₹{cat.basePrice}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
