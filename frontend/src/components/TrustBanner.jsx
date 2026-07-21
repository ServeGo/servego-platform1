import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    rating: 5,
    service: 'Deep Cleaning',
    review:
      'Absolutely thorough cleaning! The professional arrived on time and left my home spotless. Will definitely book again.',
  },
  {
    name: 'Rahul Mehta',
    rating: 5,
    service: 'Plumbing',
    review:
      'Quick diagnosis and fair pricing. Fixed my leaky faucet in under an hour. Great experience overall.',
  },
  {
    name: 'Anita Desai',
    rating: 4,
    service: 'AC Repair',
    review:
      'Very knowledgeable technician who explained the issue before starting repairs. Honest pricing and quality work.',
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function TrustBanner({ promo }) {
  return (
    <section className="py-16 md:py-20 bg-[#f4f8fb]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Thousands
          </h2>
          <p className="mt-3 text-slate-500 text-lg">
            Real reviews from real customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, idx) => (
            <div key={idx} className="enterprise-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                  <span className="text-xs text-sky-600 font-semibold">
                    {testimonial.service}
                  </span>
                </div>
                <StarRating rating={testimonial.rating} />
              </div>
              <p className="text-sm text-slate-500 italic leading-relaxed">
                &ldquo;{testimonial.review}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
