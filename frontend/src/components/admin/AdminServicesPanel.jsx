import React from 'react';

export default function AdminServicesPanel({
  isAdmin, isAddingService, isEditingService,
  newServiceForm, editServiceForm,
  serviceAddError, serviceAddSuccess, serviceEditError, serviceEditSuccess,
  submitNewService, openAddService, closeAddService, openEditService, closeEditService,
  setNewServiceForm, setEditServiceForm,
  services, platformCommission, hideService, deleteService, updateService,
  editServiceId, partnerCountForService,
}) {
  const canManage = isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-surface-900 tracking-tight">Active Services & Rates</h2>
          <p className="text-surface-500 text-xs">Configure base cost listings, commissions, and specialist capacities.</p>
        </div>
        {canManage && (
          <button onClick={openAddService} className="enterprise-btn-primary">
            <span>+ Add Service</span>
          </button>
        )}
      </div>

      {canManage && isAddingService && (
        <form onSubmit={submitNewService} className="enterprise-card p-6 space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-surface-900">Add New Service Category</h3>
            <p className="text-surface-500 text-xs mt-1">Providers will show under matching service name.</p>
          </div>
          {serviceAddError && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold">{serviceAddError}</div>}
          {serviceAddSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">{serviceAddSuccess}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="enterprise-label">Service Name</label><input value={newServiceForm.name} onChange={(e) => setNewServiceForm((prev) => ({ ...prev, name: e.target.value }))} className="enterprise-input" placeholder="e.g. Electrician" required /></div>
            <div><label className="enterprise-label">Popular Issues</label><input value={newServiceForm.popularIssuesText} onChange={(e) => setNewServiceForm((prev) => ({ ...prev, popularIssuesText: e.target.value }))} className="enterprise-input" placeholder="Comma-separated" /></div>
            <div className="md:col-span-2"><label className="enterprise-label">Description</label><textarea value={newServiceForm.description} onChange={(e) => setNewServiceForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="enterprise-input resize-none" placeholder="Short description" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeAddService} className="enterprise-btn-secondary">Cancel</button>
            <button type="submit" className="enterprise-btn-primary">Save Service</button>
          </div>
        </form>
      )}

      {canManage && isEditingService && (
        <form onSubmit={async (e) => {
          e.preventDefault();
          const { name, description, popularIssuesText } = editServiceForm;
          if (!name.trim()) return;
          const popularIssues = popularIssuesText.split(',').map(x => x.trim()).filter(Boolean);
          const resp = await updateService(editServiceId, { name: name.trim(), description: description.trim(), popularIssues });
          if (resp?.error) { setEditServiceForm(prev => ({ ...prev, _error: resp.error })); return; }
          closeEditService();
        }} className="enterprise-card p-6 space-y-5">
          <div><h3 className="text-base font-extrabold text-surface-900">Update Service Category</h3><p className="text-surface-500 text-xs mt-1">Make changes to listing details.</p></div>
          {serviceEditError && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold">{serviceEditError}</div>}
          {serviceEditSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">{serviceEditSuccess}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="enterprise-label">Service Name</label><input value={editServiceForm.name} onChange={(e) => setEditServiceForm((prev) => ({ ...prev, name: e.target.value }))} className="enterprise-input" required /></div>
            <div><label className="enterprise-label">Popular Issues</label><input value={editServiceForm.popularIssuesText} onChange={(e) => setEditServiceForm((prev) => ({ ...prev, popularIssuesText: e.target.value }))} className="enterprise-input" /></div>
            <div className="md:col-span-2"><label className="enterprise-label">Description</label><textarea value={editServiceForm.description} onChange={(e) => setEditServiceForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="enterprise-input resize-none" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeEditService} className="enterprise-btn-secondary">Cancel</button>
            <button type="submit" className="enterprise-btn-primary">Update Service</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Array.isArray(services) ? services : []).map((cat) => {
          const partnerCount = partnerCountForService(cat.name);
          return (
            <div key={cat.id} className="enterprise-card p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2 font-semibold">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-extrabold text-base">{(cat.name || '?').charAt(0)}</div>
                <h4 className="text-surface-900 font-extrabold text-sm">{cat.name}</h4>
                <p className="text-surface-500 text-xs font-medium leading-relaxed">{cat.description}</p>
              </div>
              {canManage && (
                <div className="pt-3 border-t border-surface-100 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => openEditService(cat)} className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5 !border-brand-200 !text-brand-700 hover:!bg-brand-50">Edit</button>
                  <button type="button" onClick={async () => { if (!window.confirm(`Delete "${cat.name}"?`)) return; const resp = await deleteService(cat.id, { role: 'admin' }); if (resp?.error) alert(resp.error); }} className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5 !border-red-200 !text-red-700 hover:!bg-red-50">Delete</button>
                  <button type="button" onClick={async () => { const nextHidden = !cat.isHidden; if (!window.confirm(`${nextHidden ? 'Hide' : 'Unhide'} "${cat.name}"?`)) return; const resp = await hideService(cat.id, nextHidden); if (resp?.error) { alert(resp.error); return; } alert(`${nextHidden ? 'Hidden' : 'Unhidden'}.`); }} className="enterprise-btn-secondary !text-[10px] !py-1 !px-2.5">{cat.isHidden ? 'Unhide' : 'Hide'}</button>
                </div>
              )}
              <div className="pt-3 border-t border-surface-100 grid grid-cols-2 text-[11px] font-bold text-surface-500">
                <div><span className="block text-surface-400 text-[9px] uppercase font-bold">Partners</span><span className="block text-surface-900 font-black mt-1 text-xs">{partnerCount} live</span></div>
                <div><span className="block text-surface-400 text-[9px] uppercase font-bold">Commission</span><span className="block text-teal-700 font-black mt-1 text-xs">{platformCommission}%</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
