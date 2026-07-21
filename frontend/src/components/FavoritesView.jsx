import React from 'react';
import { Heart, Star, Trash2 } from 'lucide-react';

export default function FavoritesView({ favorites, onToggleFavorite, onNavigate }) {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-20 enterprise-card max-w-md mx-auto enterprise-fade-in">
        <Heart className="w-10 h-10 text-slate-300 mx-auto mb-4" />
        <h4 className="text-base font-bold text-slate-900">No Saved Providers</h4>
        <p className="text-slate-500 text-xs mt-2 font-medium max-w-xs mx-auto">
          Save providers to quickly book them again in the future.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 enterprise-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Saved Providers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {favorites.map((prov) => (
          <div key={prov.id} className="enterprise-card p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  src={prov.avatar || prov.photo || ''}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" rx="40" fill="%23e2e8f0"/%3E%3Ctext x="40" y="45" text-anchor="middle" fill="%2364748b" font-size="24" font-family="sans-serif"%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E';
                  }}
                  alt={prov.name || 'Provider'}
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{prov.name}</h4>
                  <span className="text-xs text-sky-600 font-bold block">{prov.category}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-slate-700">{prov.rating}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({prov.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-medium">{prov.bio}</p>

            <div className="flex gap-2">
              <button onClick={() => onToggleFavorite(prov.id)}
                className="enterprise-btn-secondary !text-xs !py-2 flex-1 !text-rose-600 !border-rose-200 hover:!bg-rose-50">
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
              <button onClick={() => onNavigate('services')}
                className="enterprise-btn-primary !text-xs !py-2 flex-1">
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
