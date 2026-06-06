import React from 'react';

export default function NotificationsView({ notifications, onMarkRead, onMarkAllRead }) {
  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Communication Inbox</h3>
        <button 
          onClick={onMarkAllRead}
          className="text-xs text-indigo-600 hover:underline font-bold"
        >
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-xs text-slate-400 font-medium italic">No alerts found.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => onMarkRead(notif.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${notif.read ? 'bg-white border-slate-200 opacity-60' : 'bg-indigo-50/30 border-indigo-200 shadow-3xs'}`}
            >
              <div className="flex justify-between items-start gap-4 text-xs">
                <h4 className={`text-slate-900 ${!notif.read ? 'font-extrabold' : 'font-semibold'}`}>{notif.title}</h4>
                <span className="text-[9px] font-mono text-slate-400 font-normal">{new Date(notif.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-500 text-xs mt-1 font-medium">{notif.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
