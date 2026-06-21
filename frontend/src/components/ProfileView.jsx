import React from 'react';

export default function ProfileView({ user }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6 text-left">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Your Resident Profile</h3>
        <p className="text-slate-500 text-xs mt-1 font-medium">Security identity markers verified under Hyderabad Operations.</p>
      </div>
      
      <div className="space-y-4 text-xs font-bold text-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProfileField label="Full Name" value={user?.name} />
          <ProfileField label="Email Address" value={user?.email} isMono />
          <ProfileField label="Contact Phone" value={user?.phone} />
          <ProfileField label="Account Role" value={user?.role?.toUpperCase()} />
          {user?.role === 'customer' && (
            <>
              <ProfileField label="Address" value={user?.address || user?.customerProfile?.address} />
              <ProfileField label="Pincode" value={user?.pincode || user?.customerProfile?.pincode} />
            </>
          )}
          {user?.role === 'provider' && (
            <ProfileField label="Provider ID" value={user?.providerId || 'Not linked'} isMono />
          )}
        </div>

        <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl text-teal-800 leading-relaxed font-semibold text-[11px]">
          🔒 Your resident address coordinates are protected. Specialists only access dispatch waypoints within 60 minutes of scheduled windows.
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, isMono }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{label}</span>
      <div className={`bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 ${isMono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}
