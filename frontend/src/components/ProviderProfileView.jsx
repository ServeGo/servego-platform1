import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AchievementList, VerificationLevelPill } from './ProviderReputation';
import { api } from '../utils/apiClient';

export default function ProviderProfileView() {
  const { currentUser, providers, logout, updateProviderAvailability, updateProviderProfile } = useApp();

  // Resolve active provider from context users/providers.
  const activeProvider = useMemo(() => {
    const providerIdCandidate = currentUser?.providerId;
    const providerUserIdCandidate = currentUser?.id;

    const byProviderId = providerIdCandidate ? providers.find(p => p.id === providerIdCandidate) : null;
    const byUserId = providerUserIdCandidate ? providers.find(p => p.userId === providerUserIdCandidate) : null;

    return byProviderId || byUserId || null;
  }, [currentUser, providers]);

  const [provider, setProvider] = useState(activeProvider);
  const [loading, setLoading] = useState(!activeProvider);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  // Form fields
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [serviceAreasText, setServiceAreasText] = useState('');

  const [availableDaysText, setAvailableDaysText] = useState('');
  const [timeSlotsText, setTimeSlotsText] = useState('');

  useEffect(() => {
    let alive = true;
    setProvider(activeProvider);
    setLoading(!activeProvider);
    setSaveMsg('');
    setSaveErr('');

    const fetchLatest = async () => {
      if (!activeProvider?.id) return;
      try {
        const res = await api.get(`/providers/${activeProvider.id}`);
        const data = res.data;
        if (alive && res.ok) setProvider(data);
      } catch {
        // keep cached
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchLatest();

    return () => {
      alive = false;
    };
  }, [activeProvider]);

  // When provider loads/changes, populate form state
  useEffect(() => {
    if (!provider) return;

    setBio(provider.bio || '');
    setPhone(provider.phone || provider.user?.phone || '');
    setExperienceYears(provider.experienceYears !== undefined && provider.experienceYears !== null ? String(provider.experienceYears) : '');

    setSpecialtiesText(
      Array.isArray(provider.specialties) ? provider.specialties.join(', ') : provider.specialties || ''
    );
    setServiceAreasText(
      Array.isArray(provider.serviceAreas) ? provider.serviceAreas.join(', ') : provider.serviceAreas || ''
    );

    setAvailableDaysText(Array.isArray(provider.availableDays) ? provider.availableDays.join(', ') : provider.availableDays || '');
    setTimeSlotsText(Array.isArray(provider.timeSlots) ? provider.timeSlots.join(', ') : provider.timeSlots || '');
  }, [provider]);

  const user = provider?.user || {};
  const reviewsCount = provider?.reviews?.length ?? provider?.reviewsCount ?? 0;
  const rating = provider?.rating ?? provider?.avgRating ?? '—';

  const parseCommaList = (text) => {
    if (!text) return [];
    return text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  };

  const validate = () => {
    const errors = [];

    const expNum = experienceYears === '' ? NaN : Number(experienceYears);
    if (!Number.isFinite(expNum) || expNum < 0) errors.push('Experience must be a number >= 0');

    if (phone && phone.length < 7) errors.push('Phone looks too short');

    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMsg('');
    setSaveErr('');

    if (!provider?.id) {
      setSaveErr('Provider not available');
      return;
    }

    const errors = validate();
    if (errors.length) {
      setSaveErr(errors.join('. '));
      return;
    }

    setSaving(true);
    try {
      const nextSpecialties = parseCommaList(specialtiesText);
      const nextAreas = parseCommaList(serviceAreasText);
      const nextDays = parseCommaList(availableDaysText);
      const nextSlots = parseCommaList(timeSlotsText);

      await updateProviderAvailability(provider.id, nextDays, nextSlots);
      await updateProviderProfile(provider.id, {
        bio: bio || '',
        phone: phone || '',
        experienceYears: Number(experienceYears),
        specialties: nextSpecialties,
        serviceAreas: nextAreas
      });

      setSaveMsg('Profile saved successfully');
      setEditMode(false);
    } catch (err) {
      setSaveErr(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
        <div className="text-sm font-bold text-slate-900">Loading partner profile...</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
        <div className="text-sm font-bold text-rose-700">Partner profile not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex gap-4 items-center">
            {user.avatar || provider.photo ? (
              <img
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                src={user.avatar || provider.photo}
                alt="Partner avatar"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                {String(user?.name || provider?.name || 'P').substring(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <div className="text-[11px] uppercase font-black tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-100 inline-flex px-2.5 py-1 rounded-full">
                Partner Profile
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{provider.name || user.name || '—'}</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                ID: <span className="font-mono text-slate-700">{provider.id}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex gap-2">
              <VerificationLevelPill provider={provider} />
              <StatPill label="Rating" value={rating} />
              <StatPill label="Reviews" value={reviewsCount} />
            </div>

            <div className="flex gap-2">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditMode(false);
                    setSaveMsg('');
                    setSaveErr('');
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-black px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={() => logout()}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <Section title="Partner (Provider) details">
        {editMode ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Provider ID" value={provider.id} mono />
              <Field label="Category / Sector" value={provider.category} />

              <InputField label="Phone" value={phone} onChange={setPhone} placeholder="e.g. 9876543210" />
              <TextAreaField label="Bio" value={bio} onChange={setBio} placeholder="Write a short bio about your services..." />
              <InputField label="Experience (Years)" value={experienceYears} onChange={setExperienceYears} placeholder="e.g. 3" />
              <InputField label="Specialties" value={specialtiesText} onChange={setSpecialtiesText} placeholder="Comma separated: Plumbing, AC repair" />
              <InputField label="Service Areas" value={serviceAreasText} onChange={setServiceAreasText} placeholder="Comma separated: Hyderabad, Secunderabad" />
              <Field label="Featured" value={String(!!provider.isFeatured)} />
              <Field label="Verified" value={String(!!provider.isVerified)} />
            </div>

            {saveErr ? <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-3">{saveErr}</div> : null}
            {saveMsg ? <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">{saveMsg}</div> : null}

            <div className="flex gap-3 justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-black px-5 py-2 rounded-xl transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Provider ID" value={provider.id} mono />
            <Field label="Category / Sector" value={provider.category} />
            <Field label="Phone" value={provider.phone || user.phone} />
            <Field label="Bio" value={provider.bio} />
            <Field label="Experience (Years)" value={provider.experienceYears} />
            <Field
              label="Specialties"
              value={Array.isArray(provider.specialties) ? provider.specialties.join(', ') : provider.specialties}
            />
            <Field
              label="Service Areas"
              value={Array.isArray(provider.serviceAreas) ? provider.serviceAreas.join(', ') : provider.serviceAreas}
            />
            <Field label="Featured" value={String(!!provider.isFeatured)} />
            <Field label="Verified" value={String(!!provider.isVerified)} />
            <Field label="Verification Level" value={provider.verificationLevel || 'BRONZE'} />
          </div>
        )}
      </Section>

      <Section title="Badges">
        <AchievementList badges={provider.badges} />
      </Section>

      <Section title="User details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="User ID" value={user.id} mono />
          <Field label="Full Name" value={user.name} />
          <Field label="Email" value={user.email} mono />
          <Field label="Role" value={user.role} />
          <Field label="Status" value={user.status} />
          <Field label="Referral Code" value={provider.referralCode || user.referralCode || '—'} mono />
          <Field label="Joined Date" value={user.joinedDate || provider.createdAt || '—'} mono />
        </div>
      </Section>

      <Section title="Availability">
        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Available Days" value={availableDaysText} onChange={setAvailableDaysText} placeholder="Comma separated: Mon, Tue, Sat" />
              <InputField label="Time Slots" value={timeSlotsText} onChange={setTimeSlotsText} placeholder="Comma separated: 9:00-12:00, 4:00-8:00" />
            </div>
            <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 rounded-2xl p-3">
              Tip: Use comma-separated values.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Available Days" value={Array.isArray(provider.availableDays) ? provider.availableDays.join(', ') : provider.availableDays} />
            <Field label="Time Slots" value={Array.isArray(provider.timeSlots) ? provider.timeSlots.join(', ') : provider.timeSlots} />
          </div>
        )}
      </Section>

      <Section title="Account / Security">
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 leading-relaxed">
            🔒 Partner profile details are shown to you only. Verification status controls lead visibility.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Provider Visible" value={provider.isVerified ? 'YES (Verified)' : 'NO (Pending/Not verified)'} />
            <Field label="Featured Badge" value={provider.isFeatured ? 'YES' : 'NO'} />
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-3xl mx-auto">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">{label}</span>
      <div
        className={`bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value === undefined || value === null || value === '' ? '—' : value}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs font-bold outline-none text-slate-800"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <div className="sm:col-span-2">
      <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs font-bold outline-none text-slate-800 resize-none"
      />
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-left">
      <div className="text-[10px] uppercase font-black text-slate-400">{label}</div>
      <div className="text-sm font-black text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}


