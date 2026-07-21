import { ArrowRight } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function ServiceCard({ category, providers, onSelect, onIssueClick }) {
  const providerCount = (providers || []).filter(
    (p) => p.category && p.category.toLowerCase() === (category.name || '').toLowerCase()
  ).length;

  return (
    <div className="enterprise-card p-6 flex flex-col gap-4 group hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
          <CategoryIcon category={category.name} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-lg">{category.name}</h3>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mt-1">
            {category.description}
          </p>
        </div>
      </div>

      {/* Popular issues */}
      {category.popularIssues && category.popularIssues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {category.popularIssues.slice(0, 4).map((issue, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onIssueClick && onIssueClick(issue);
              }}
              className="rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 hover:bg-sky-50 hover:text-sky-600 transition-colors"
            >
              {issue}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400 font-medium">
          {providerCount} provider{providerCount !== 1 ? 's' : ''} available
        </span>
        <button
          onClick={onSelect}
          className="flex items-center gap-1 text-sm font-semibold text-sky-500 hover:text-sky-600 transition-colors group-hover:gap-2"
        >
          View Providers
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
