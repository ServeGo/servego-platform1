import React from 'react';
import { Heart } from 'lucide-react';

export default function FavoritesView({ favorites, onToggleFavorite, onNavigate }) {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-2xs max-w-md mx-auto">
        <Heart className="w-10 h-10 text-slate-300 mx-auto mb-4" />
        <h4 className="text-base font-bold text-slate-900">No Saved Pros</h4>
        <p className="text-slate-500 text-xs mt-1 font-medium">Save providers to quickly book them again in the future.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
      {favorites.map((prov) => (
        <div key={prov.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4 shadow-3xs">
          <div className="flex gap-4 items-center">
            <img className="w-12 h-12 rounded-xl object-cover border border-slate-200" src={prov.avatar} />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{prov.name}</h4>
              <span className="text-xs text-indigo-600 font-bold block">{prov.category}</span>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
                <span>★ {prov.rating}</span>
                <span className="text-slate-400 font-medium">({prov.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-medium">{prov.bio}</p>

          <div className="flex gap-2 text-xs font-bold pt-3 border-t border-slate-100 items-center justify-between">
            <span className="text-slate-900">₹{prov.hourlyRate}/hr</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => onToggleFavorite(prov.id)}
                className="p-1 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs rounded-lg transition-colors"
              >
                Remove
              </button>
              <button 
                onClick={() => onNavigate('service-details', prov.category.toLowerCase().replace(' ', '-'))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 px-3 text-xs rounded-lg shadow-sm border border-indigo-500/10"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
