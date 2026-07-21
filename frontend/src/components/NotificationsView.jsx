import React from 'react';
import { Bell, Check, CheckCheck, Inbox, Clock } from 'lucide-react';

export default function NotificationsView({ notifications, onMarkRead, onMarkAllRead }) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4 text-left enterprise-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead}
            className="enterprise-btn-secondary !text-xs !py-1.5">
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 enterprise-card max-w-sm mx-auto">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-900 mb-1">No notifications</p>
          <p className="text-xs text-slate-500 font-medium">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div key={notif.id} onClick={() => onMarkRead(notif.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                notif.read
                  ? 'bg-white border-slate-100 hover:border-slate-200'
                  : 'bg-sky-50/50 border-sky-200 shadow-sm hover:shadow-md'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  notif.read ? 'bg-slate-100' : 'bg-sky-100'
                }`}>
                  <Bell className={`w-4 h-4 ${notif.read ? 'text-slate-400' : 'text-sky-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className={`text-xs ${!notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {notif.title}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-sky-400" />}
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">{notif.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
