import React, { useState } from 'react';
import { Shield, Bell, Moon, Globe, Smartphone, Lock } from 'lucide-react';

export default function SettingsView({ settings: settingsProp, onUpdate }) {
  const [prefs, setPrefs] = useState({
    smsDispatch: true,
    insuranceCover: true,
    waypointMasking: true,
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    darkMode: false,
    language: 'en',
  });

  const togglePref = (key) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      onUpdate?.(next);
      return next;
    });
  };

  const settingsGroups = [
    {
      title: 'Safety & Notifications',
      items: [
        { key: 'smsDispatch', label: 'Instant Dispatch SMS', desc: 'Real-time technician movement status via SMS', icon: Smartphone },
        { key: 'insuranceCover', label: 'Insurance Cover Auto-opt', desc: 'Complimentary cover for home services', icon: Shield },
        { key: 'waypointMasking', label: 'Address Masking', desc: 'Conceal address until active work window', icon: Lock },
      ]
    },
    {
      title: 'Notification Channels',
      items: [
        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Booking confirmations and updates', icon: Bell },
        { key: 'smsNotifications', label: 'SMS Alerts', desc: 'Important booking alerts via SMS', icon: Smartphone },
        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications', icon: Bell },
      ]
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto enterprise-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Settings</h2>

      {settingsGroups.map(group => (
        <div key={group.title} className="enterprise-card p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">{group.title}</h3>
          <div className="divide-y divide-slate-100">
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{item.desc}</span>
                    </div>
                  </div>
                  <button onClick={() => togglePref(item.key)}
                    className={`w-10 rounded-full transition-colors relative ${prefs[item.key] ? 'bg-sky-400' : 'bg-slate-200'}`}
                    style={{ height: '22px' }}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-[3px] transition-transform ${
                      prefs[item.key] ? 'translate-x-[22px]' : 'translate-x-[3px]'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Appearance</h3>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
              <Moon className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Dark Mode</span>
              <span className="text-[11px] text-slate-500 font-medium">Coming soon</span>
            </div>
          </div>
          <button disabled className="w-10 rounded-full bg-slate-200 opacity-50" style={{ height: '22px' }}>
            <div className="w-4 h-4 rounded-full bg-white shadow-sm absolute top-[3px] translate-x-[3px]" style={{ position: 'relative' }} />
          </button>
        </div>
      </div>

      <div className="enterprise-card p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Account Security</h3>
        <p className="text-xs text-slate-500 font-medium mb-4">Manage your account security settings</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">Two-Factor Authentication</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Disabled</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">Active Sessions</span>
            <span className="text-[10px] font-bold text-sky-600">1 device</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-semibold text-slate-700">Login History</span>
            <button className="text-[10px] font-bold text-sky-600 hover:text-sky-700">View</button>
          </div>
        </div>
      </div>
    </div>
  );
}
