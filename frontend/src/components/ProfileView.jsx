import React, { useState } from 'react';
import { Camera, User, Mail, Phone, Lock, Save } from 'lucide-react';

export default function ProfileView({ user, onSave }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || user?.customerProfile?.address || '',
    pincode: user?.pincode || user?.customerProfile?.pincode || '',
  });
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    sms: true,
    push: false,
    promotions: false,
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const startEditing = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      address: user?.address || user?.customerProfile?.address || '',
      pincode: user?.pincode || user?.customerProfile?.pincode || '',
    });
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    const res = await onSave?.(form);
    setSaving(false);
    if (res?.success) {
      setSuccess('Profile updated successfully.');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res?.error || 'Could not update your profile. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto enterprise-fade-in">
      <div className="enterprise-card p-6">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Profile Settings</h3>
          {!editing && (
            <button onClick={startEditing} className="enterprise-btn-primary !text-xs !py-2">
              Edit Profile
            </button>
          )}
        </div>

        {success && (
          <div className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 p-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-sky-400 text-[#0F172A] flex items-center justify-center text-2xl font-bold">
              {user?.name?.substring(0, 2).toUpperCase() || 'CU'}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-100 uppercase">
              {user?.role || 'Customer'}
            </span>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput icon={User} label="Full Name" value={form.name} onChange={setField('name')} required />
              <FieldInput icon={Phone} label="Phone" value={form.phone} onChange={setField('phone')} />
              <FieldInput icon={Mail} label="Email" value={form.email} onChange={setField('email')} disabled />
              {user?.role === 'customer' && (
                <>
                  <FieldInput label="Address" value={form.address} onChange={setField('address')} />
                  <FieldInput label="Pincode" value={form.pincode} onChange={setField('pincode')} />
                </>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="enterprise-btn-primary !text-xs">
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="enterprise-btn-secondary !text-xs">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldDisplay label="Full Name" value={user?.name} />
            <FieldDisplay label="Phone" value={user?.phone} />
            <FieldDisplay label="Email" value={user?.email} mono />
            <FieldDisplay label="Role" value={user?.role?.toUpperCase()} />
            {user?.role === 'customer' && (
              <>
                <FieldDisplay label="Address" value={user?.address || user?.customerProfile?.address} />
                <FieldDisplay label="Pincode" value={user?.pincode || user?.customerProfile?.pincode} />
              </>
            )}
          </div>
        )}
      </div>

      <div className="enterprise-card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive booking updates via email' },
            { key: 'sms', label: 'SMS Alerts', desc: 'Get SMS for provider arrival updates' },
            { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
            { key: 'promotions', label: 'Promotions & Offers', desc: 'Discount codes and seasonal deals' },
          ].map(pref => (
            <div key={pref.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-slate-800">{pref.label}</p>
                <p className="text-[11px] text-slate-500">{pref.desc}</p>
              </div>
              <button onClick={() => setNotifPrefs(prev => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                className={`w-10 h-5.5 rounded-full transition-colors relative ${notifPrefs[pref.key] ? 'bg-sky-400' : 'bg-slate-200'}`}
                style={{ height: '22px' }}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-[3px] transition-transform ${
                  notifPrefs[pref.key] ? 'translate-x-[22px]' : 'translate-x-[3px]'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="enterprise-btn-secondary !text-xs !py-1.5">
            <Lock className="w-3.5 h-3.5" />
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </button>
        </div>
        {showPasswordChange && (
          <div className="space-y-3 enterprise-scale-in">
            <FieldInput icon={Lock} label="Current Password" type="password"
              value={passwords.current} onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))} />
            <FieldInput icon={Lock} label="New Password" type="password"
              value={passwords.new} onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))} />
            <FieldInput icon={Lock} label="Confirm New Password" type="password"
              value={passwords.confirm} onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))} />
            <button className="enterprise-btn-primary !text-xs">
              <Save className="w-3.5 h-3.5" /> Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldDisplay({ label, value, mono }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{label}</span>
      <div className={`bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-semibold text-slate-700 ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}

function FieldInput({ icon: Icon, label, value, onChange, required, disabled, type = 'text' }) {
  return (
    <div>
      <label className="enterprise-label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />}
        <input type={type} value={value} onChange={onChange} required={required} disabled={disabled}
          className={`enterprise-input ${Icon ? 'pl-9' : ''} ${disabled ? 'bg-slate-50 text-slate-500' : ''}`} />
      </div>
    </div>
  );
}
