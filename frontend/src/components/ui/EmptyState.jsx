export default function EmptyState({ icon: Icon, title, description, action, actionLabel, onAction, className = '' }) {
  return (
    <div className={`text-center py-12 enterprise-card max-w-sm mx-auto ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-slate-300" />
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 font-medium mb-4 max-w-xs mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="enterprise-btn-primary text-xs">
          {actionLabel}
        </button>
      )}
      {action}
    </div>
  );
}
