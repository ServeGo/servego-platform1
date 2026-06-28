import React from 'react';
import { Check, Info } from 'lucide-react';

export default function AdminSettingsPanel({
  platformCommission,
  setPlatformCommission,
  taxPercent,
  setTaxPercent,
  activeRegionHQ,
  setActiveRegionHQ,
  isSavedSettings,
  saveCommissionSettings,
  CITIES,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Financial settings</h2>
        <p className="text-slate-500 text-xs">Configure base commission cuts, tax values, launch territories, and expansion parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={saveCommissionSettings}
          className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6"
        >
          <div>
            <h4 className="font-extrabold text-slate-950 text-sm">Regulatory commission splits</h4>
            <p className="text-slate-400 text-xs">Configure how escrow volume is automatically split upon completions.</p>
          </div>

          {isSavedSettings && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">
              ✔ Platform financial parameters saved successfully in parameters cash store
            </div>
          )}

          <div className="space-y-4 text-xs font-bold text-slate-600">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Administrative commission rate (%)</label>
              <input
                type="number"
                value={platformCommission}
                onChange={(e) => setPlatformCommission(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none outline-none border border-slate-300 focus:border-teal-600 transition-all font-semibold font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">CGST / SGST Integrated Rate (%)</label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none outline-none border border-slate-300 focus:border-teal-600 transition-all font-semibold font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Headquarters Anchor launch city</label>
              <select
                value={activeRegionHQ}
                onChange={(e) => setActiveRegionHQ(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 cursor-pointer focus:bg-white focus:outline-none outline-none border border-slate-300 focus:border-teal-600 transition-all"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button type="submit" className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors">
              Apply Preset Parameters
            </button>
          </div>
        </form>

        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 font-semibold text-xs text-slate-500">
          <h4 className="font-extrabold text-slate-950 text-sm">Expansion SLA Milestones</h4>
          <p className="text-slate-450 text-xs">Verify expansion SLA compliance anchors list for rollout activation.</p>

          <div className="space-y-3 pt-2 text-slate-650">
            <div className="flex gap-2 items-center text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Active coverage core launched in Hyderabad</span>
            </div>

            <div className="flex gap-2 items-center text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>200+ background-verified partners successfully onboarded</span>
            </div>

            <div className="flex gap-2 items-center text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-150">
              <Info className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Launch territory expansion)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

