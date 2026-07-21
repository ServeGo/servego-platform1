export default function SidebarNavItem({ icon: Icon, label, isActive, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
        isActive
          ? 'bg-sky-400/10 text-sky-600 border-l-2 border-sky-400'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-2 border-transparent'
      } ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
      <span>{label}</span>
    </button>
  );
}
