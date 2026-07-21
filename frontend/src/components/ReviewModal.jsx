import React from 'react';
import { Star, X } from 'lucide-react';

export default function ReviewModal({
  providerName,
  onSubmit,
  onClose
}) {
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(rating, comment);
  };

  const ratingLabels = {
    5: 'Perfect work',
    4: 'Great job',
    3: 'Satisfactory',
    2: 'Needs improvement',
    1: 'Frustrating',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 enterprise-backdrop" onClick={onClose} />
      <div className="bg-white rounded-xl border border-slate-100 p-6 max-w-md w-full relative shadow-2xl enterprise-scale-in z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Rate Provider</h3>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Share your experience with {providerName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="enterprise-label text-center block">Your Rating</label>
            <div className="flex justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)}
                  className={`text-3xl transition-all ${
                    rating >= star ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'
                  }`}>
                  <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
            <span className="block text-center text-xs font-bold text-slate-600 mt-1">
              {ratingLabels[rating]}
            </span>
          </div>

          <div>
            <label className="enterprise-label">Your Review *</label>
            <textarea rows={4} required placeholder="Describe punctuality, quality, professionalism..."
              value={comment} onChange={(e) => setComment(e.target.value)}
              className="enterprise-input resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="enterprise-btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="enterprise-btn-primary flex-1">
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
