import { Star, Heart } from 'lucide-react';

export default function ProviderListItem({
  provider,
  isFavorite,
  onToggleFavorite,
  onBook,
}) {
  const initials = (provider.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="enterprise-card p-5 flex flex-col sm:flex-row gap-5 group hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {initials}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{provider.name}</h3>
            {provider.area && (
              <p className="text-xs text-slate-400 mt-0.5">{provider.area}</p>
            )}
          </div>
          <button
            onClick={() => onToggleFavorite && onToggleFavorite(provider.id)}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite
                  ? 'text-red-500 fill-red-500'
                  : 'text-slate-300'
              }`}
            />
          </button>
        </div>

        {/* Rating + Price */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-slate-900">
              {provider.rating || '4.8'}
            </span>
            <span className="text-xs text-slate-400">
              ({provider.reviewCount || 0})
            </span>
          </div>
          {provider.price != null && (
            <span className="text-sm font-bold text-teal-600">
              ₹{provider.price}
              <span className="text-xs font-normal text-slate-400">/visit</span>
            </span>
          )}
        </div>

        {/* Skills */}
        {provider.skills && provider.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {provider.skills.slice(0, 5).map((skill, idx) => (
              <span
                key={idx}
                className="rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Book button */}
      <div className="flex-shrink-0 flex items-center sm:items-end">
        <button
          onClick={() => onBook && onBook(provider)}
          className="enterprise-btn-primary px-5 py-2.5 text-sm w-full sm:w-auto"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
