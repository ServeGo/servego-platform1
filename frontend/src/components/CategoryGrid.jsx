import { useApp } from '../context/AppContext';
import CategoryIcon from './CategoryIcon';

const CATEGORIES = [
  { id: 'cleaning', name: 'Cleaning', color: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
  { id: 'plumbing', name: 'Plumbing', color: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { id: 'electrical', name: 'Electrical', color: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { id: 'painting', name: 'Painting', color: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { id: 'ac-repair', name: 'AC Repair', color: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200' },
  { id: 'carpentry', name: 'Carpentry', color: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
  { id: 'pest-control', name: 'Pest Control', color: 'bg-red-50 hover:bg-red-100 border-red-200' },
  { id: 'appliance-repair', name: 'Appliance Repair', color: 'bg-teal-50 hover:bg-teal-100 border-teal-200' },
];

export default function CategoryGrid({ onNavigate }) {
  return (
    <section className="py-16 md:py-20 bg-[#f4f8fb]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Browse Services
          </h2>
          <p className="mt-3 text-slate-500 text-lg">
            Find the right professional for every home need
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate && onNavigate('services')}
              className={`enterprise-card group flex flex-col items-center gap-3 p-6 border ${cat.color} cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <CategoryIcon category={cat.name} size="lg" />
              </div>
              <span className="font-semibold text-slate-900 text-sm md:text-base">
                {cat.name}
              </span>
              <span className="text-xs text-sky-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                View Services →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
