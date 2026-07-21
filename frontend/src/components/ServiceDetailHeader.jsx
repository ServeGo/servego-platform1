import CategoryIcon from './CategoryIcon';

export default function ServiceDetailHeader({ categoryMeta }) {
  if (!categoryMeta) return null;

  return (
    <div className="bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0">
            <CategoryIcon category={categoryMeta.name} size="lg" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {categoryMeta.name}
            </h1>
            {categoryMeta.description && (
              <p className="mt-2 text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl">
                {categoryMeta.description}
              </p>
            )}
            {categoryMeta.popularIssues && categoryMeta.popularIssues.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryMeta.popularIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="enterprise-badge-info text-xs"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
