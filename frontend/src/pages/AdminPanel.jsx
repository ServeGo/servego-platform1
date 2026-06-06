import React, { useState, useMemo } from 'react';
import {
  Users, Calendar, Landmark, MessageSquare, Check, X, ShieldAlert, BookOpen,
  Settings, DollarSign, Sliders, AlertCircle, RefreshCw, Star, Info, CreditCard,
  TrendingUp, BarChart3, FileText, CheckCircle2, Activity, UserCheck, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CITIES } from '../data';

export const AdminPanel = ({ activeTab: activeTabProp, setActiveTabExternal }) => {
  const {
    providers,
    bookings,
    tickets,
    respondToTicket,
    verifyProvider,
    updateBookingStatus,
    users,
    currentUser,
    services,
    createService,
    updateService,
    deleteService,
    hideService
  } = useApp();



  const [internalActiveTab, setInternalActiveTab] = useState('dashboard');

  const activeTab = activeTabProp || internalActiveTab;
  const setActiveTab = setActiveTabExternal || setInternalActiveTab;

  // Response form states
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [ticketResponse, setTicketResponse] = useState('');

  // Platform configuration fields
  const [platformCommission, setPlatformCommission] = useState('20');
  const [taxPercent, setTaxPercent] = useState('18');
  const [activeRegionHQ, setActiveRegionHQ] = useState('Hyderabad');
  const [isSavedSettings, setIsSavedSettings] = useState(false);

  // SERVICES admin form
  const isAdmin = currentUser?.role === 'admin';
  const [isAddingService, setIsAddingService] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [editServiceId, setEditServiceId] = useState(null);
  const [newServiceForm, setNewServiceForm] = useState({
    id: '',
    name: '',
    description: '',
    basePrice: '',
    popularIssuesText: ''
  });
  const [editServiceForm, setEditServiceForm] = useState({
    id: '',
    name: '',
    description: '',
    basePrice: '',
    popularIssuesText: ''
  });
  const [serviceAddError, setServiceAddError] = useState('');
  const [serviceAddSuccess, setServiceAddSuccess] = useState('');
  const [serviceEditError, setServiceEditError] = useState('');
  const [serviceEditSuccess, setServiceEditSuccess] = useState('');


  // Filter lists
  const customersList = useMemo(() => {
    return users.filter(u => u.role === 'customer');
  }, [users]);

  const providersList = useMemo(() => {
    return providers;
  }, [providers]);

  // Aggregate stats calculate
  const totalVolume = useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  }, [bookings]);

  const administrativeEarnings = useMemo(() => {
    const factor = parseFloat(platformCommission) / 100;
    return Math.round(bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.totalAmount * factor), 0));
  }, [bookings, platformCommission]);

  const pendingPartnersCount = useMemo(() => {
    return providers.filter(p => !p.isVerified).length;
  }, [providers]);

  const activeTicketsCount = useMemo(() => {
    return tickets.filter(t => t.status === 'open').length;
  }, [tickets]);

  const handleTicketResolveSubmit = (tId) => {
    if (!ticketResponse.trim()) return;
    respondToTicket(tId, ticketResponse);
    setActiveTicketId(null);
    setTicketResponse('');
  };

  const handlePartnerApproval = (pId) => {
    verifyProvider(pId);
  };

  const saveCommissionSettings = (e) => {
    e.preventDefault();
    setIsSavedSettings(true);
    setTimeout(() => setIsSavedSettings(false), 3000);
  };

  const normalize = (s) => (s || '').toString().trim().toLowerCase();

  const partnerCountForService = (serviceName) => {
    const sn = normalize(serviceName);
    return providers.filter(p => normalize(p.category) === sn).length;
  };

  const openAddService = () => {
    setServiceAddError('');
    setServiceAddSuccess('');
    setNewServiceForm({
      id: '',
      name: '',
      description: '',
      basePrice: '',
      popularIssuesText: ''
    });
    setIsAddingService(true);
  };

  const closeAddService = () => {
    setIsAddingService(false);
    setServiceAddError('');
    setServiceAddSuccess('');
  };

  const openEditService = (cat) => {
    setServiceEditError('');
    setServiceEditSuccess('');
    setEditServiceId(cat.id);
    setEditServiceForm({
      id: cat.id || '',
      name: cat.name || '',
      description: cat.description || '',
      basePrice: cat.basePrice === undefined || cat.basePrice === null ? '' : String(cat.basePrice),
      popularIssuesText: Array.isArray(cat.popularIssues) ? cat.popularIssues.join(', ') : ''
    });
    setIsEditingService(true);
  };

  const closeEditService = () => {
    setIsEditingService(false);
    setEditServiceId(null);
    setServiceEditError('');
    setServiceEditSuccess('');
    setEditServiceForm({
      id: '',
      name: '',
      description: '',
      basePrice: '',
      popularIssuesText: ''
    });
  };

  const submitNewService = async (e) => {
    e.preventDefault();
    setServiceAddError('');
    setServiceAddSuccess('');

    const { id, name, description, basePrice, popularIssuesText } = newServiceForm;


    if (!id.trim() || !name.trim()) {
      setServiceAddError('Service id and name are required.');
      return;
    }

    const popularIssues = popularIssuesText
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    const payload = {
      role: 'admin',
      id: id.trim(),
      name: name.trim(),
      description: description.trim(),
      basePrice: basePrice === '' ? 0 : Number(basePrice),
      popularIssues
    };

    const resp = await createService(payload);

    if (!resp?.id && !resp?.createdAt) {
      setServiceAddError(resp?.error || 'Failed to create service.');
      return;
    }

    setServiceAddSuccess('Service added successfully.');
    setIsAddingService(false);
    setNewServiceForm({
      id: '',
      name: '',
      description: '',
      basePrice: '',
      popularIssuesText: ''
    });
  };

  return (
    <div id="admin-panel-page" className="bg-slate-50 min-h-screen py-8 px-4 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System Administrator Console</h2>
                <p className="text-slate-500 text-xs">Real-time status monitoring, escrow checks, and service dispatch operations.</p>
              </div>
              <div className="bg-emerald-50 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border border-emerald-250 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse block" />
                <span>Central Core Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">Gross Escrow Vol.</span>
                  <span className="text-lg sm:text-2xl font-black text-slate-950 block">₹{totalVolume}</span>
                  <span className="text-[10px] text-teal-600 font-bold block mt-1">Platform comm{platformCommission}%</span>
                </div>
                <div className="p-3 bg-teal-50 text-teal-700 rounded-xl shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">Admin Net Payout</span>
                  <span className="text-lg sm:text-2xl font-black text-teal-700 block">₹{administrativeEarnings}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Accumulated commission settings</span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">Vetting Backlog</span>
                  <span className="text-lg sm:text-2xl font-black text-amber-600 block">{pendingPartnersCount} applicants</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Direct partner registration queue</span>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">Dispute Tickets</span>
                  <span className="text-lg sm:text-2xl font-black text-rose-600 block">{activeTicketsCount} open</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Customer & Partner complaints</span>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-700" />
                    <span>Recent dispatch book ledger</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-teal-700 font-extrabold text-xs hover:underline uppercase tracking-wide"
                  >
                    View all ({bookings.length})
                  </button>
                </div>

                <div className="space-y-3.5">
                  {bookings.slice(0, 4).map((bk) => (
                    <div
                      key={bk.id}
                      className="p-3.5 rounded-xl border border-slate-150 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">{bk.id}</span>
                          <span className="text-slate-850 font-extrabold text-sm">{bk.serviceCategory}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          To Resident: <span className="text-slate-700 font-bold">{bk.customerName}</span> • Specialist: <span className="text-slate-700 font-bold">{bk.providerName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                        <div className="font-mono text-slate-500 text-[10px]">
                          {bk.bookingDate} • {bk.bookingTimeSlot}
                        </div>
                        <div>
                          {bk.status === 'pending' && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Pending</span>}
                          {bk.status === 'confirmed' && <span className="bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Confirmed</span>}
                          {bk.status === 'ongoing' && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Ongoing</span>}
                          {bk.status === 'completed' && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Completed</span>}
                          {bk.status === 'cancelled' && <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Cancelled</span>}
                        </div>
                        <span className="text-slate-900 font-black">₹{bk.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span>Awaiting Vetting Audit</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('providers')}
                    className="text-teal-700 font-extrabold text-xs hover:underline uppercase tracking-wide"
                  >
                    Queue
                  </button>
                </div>

                {providers.filter(p => !p.isVerified).length === 0 ? (
                  <p className="text-slate-400 italic text-center py-10 text-xs font-semibold">All specialists are vetted & verified successfully.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {providers
                      .filter(p => !p.isVerified)
                      .slice(0, 3)
                      .map((p) => (
                        <div key={p.id} className="py-3 first:pt-0 last:pb-0 font-semibold text-xs">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="font-bold text-slate-900 block">{p.name}</span>
                              <span className="text-[10px] text-indigo-600 font-bold block uppercase mt-0.5">{p.category} Specialist</span>
                              <span className="text-[9px] text-slate-400 block mt-1 font-mono">Exp{p.experienceYears} Years • Payout/hr{p.hourlyRate}</span>
                            </div>
                            <button
                              onClick={() => handlePartnerApproval(p.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-2.5 py-1 text-[10px] font-extrabold font-sans transition-colors shrink-0"
                            >
                              Approve Now
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Customer Portals</h2>
              <p className="text-slate-500 text-xs">Registered residents across Hyderabad operational core sectors.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                      <th className="py-3 px-6">Customer Representative</th>
                      <th className="py-3 px-6">Email Address</th>
                      <th className="py-3 px-6">Phone line</th>
                      <th className="py-3 px-6">Joined Date</th>
                      <th className="py-3 px-6">Identity Vetting</th>
                      <th className="py-3 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    {customersList.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 flex items-center gap-3">
                          <img className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-205" src={cust.avatar} referrerPolicy="no-referrer" />
                          <div>
                            <span className="text-slate-900 block font-black text-sm">{cust.name}</span>
                            <span className="text-[10px] text-slate-400 block font-normal font-mono">Resident Code{cust.id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-800">{cust.email}</td>
                        <td className="py-4 px-6">{cust.phone}</td>
                        <td className="py-4 px-6">{cust.joinedDate}</td>
                        <td className="py-4 px-6">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase">OTP Verified</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase">{cust.status || 'Active'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'providers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Vetted Provider Pool</h2>
              <p className="text-slate-500 text-xs">Verify applicant credentials, review professional catalogs, and change expert visibilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providersList.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-5 space-y-4 flex flex-col justify-between ${!p.isVerified ? 'border-amber-300 shadow-sm bg-gradient-to-br from-white to-amber-50/10 animate-pulse' : 'border-slate-200'}`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 items-center">
                        <img className="w-10 h-10 rounded-xl object-cover border border-slate-200" src={p.avatar} referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{p.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wide mt-1 inline-block">
                            {p.category} Division
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black border ${p.isVerified ? 'bg-emerald-50 border-emerald-250 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                        {p.isVerified ? 'Live Approved' : 'Under Vetting Audit'}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-semibold italic">"{p.bio}"</p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[11px] font-semibold text-slate-500 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 uppercase text-[9px] block">Contact phone</span>
                        <span className="text-slate-800 block">{p.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[9px] block">Specialist Rate</span>
                        <span className="text-slate-805 block">₹{p.hourlyRate}/hr</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[9px] block">Service Experience</span>
                        <span className="text-slate-800 block">{p.experienceYears} Years</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase text-[9px] block">Average Feedback</span>
                        <span className="text-amber-550 block font-bold">⭐ {p.rating} / 5.0</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 uppercase text-[9px] block">Sectors active</span>
                        <span className="text-slate-800 block truncate">{p.serviceAreas.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                    {!p.isVerified ? (
                      <button
                        onClick={() => handlePartnerApproval(p.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl text-center shadow-2xs focus:outline-none flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm Vetting Requirements & Approve</span>
                      </button>
                    ) : (
                      <span className="text-emerald-850 font-bold flex items-center gap-1.5 py-1 text-xs mx-auto">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Background checks & secondary SLA certified</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES CATEGORIES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Services & Hourly Rates</h2>
                <p className="text-slate-500 text-xs">Configure base cost index listings, commissions, and regional specialist capacities.</p>
              </div>

              {isAdmin && (
                <button
                  onClick={openAddService}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-xs"
                >
                  <span>+ Add Service</span>
                </button>
              )}
            </div>

            {isAdmin && isAddingService && (
              <form onSubmit={submitNewService} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add new service category</h3>
                  <p className="text-slate-500 text-xs mt-1">Providers will show under the matching service name (case-insensitive).</p>
                </div>

                {serviceAddError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold">{serviceAddError}</div>
                )}
                {serviceAddSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">{serviceAddSuccess}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Service ID</label>
                    <input
                      value={newServiceForm.id}
                      onChange={(e) => setNewServiceForm(prev => ({ ...prev, id: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="e.g. electrician, plumber, ac-repair"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Service Name</label>
                    <input
                      value={newServiceForm.name}
                      onChange={(e) => setNewServiceForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="e.g. Electrician"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea
                      value={newServiceForm.description}
                      onChange={(e) => setNewServiceForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="Short description for the service category"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Base Price (₹)</label>
                    <input
                      type="number"
                      value={newServiceForm.basePrice}
                      onChange={(e) => setNewServiceForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="249"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Popular Issues</label>
                    <input
                      value={newServiceForm.popularIssuesText}
                      onChange={(e) => setNewServiceForm(prev => ({ ...prev, popularIssuesText: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="Comma-separated, e.g. Short circuit fixing, Fan installation"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeAddService} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 text-xs font-bold rounded-lg transition-colors border border-slate-200">
                    Cancel
                  </button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold rounded-lg transition-colors shadow-2xs">
                    Save Service
                  </button>
                </div>
              </form>
            )}

            {isAdmin && isEditingService && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setServiceEditError('');
                  setServiceEditSuccess('');

                  const { name, description, basePrice, popularIssuesText } = editServiceForm;

                  if (!name.trim()) {
                    setServiceEditError('Service name is required.');
                    return;
                  }

                  const popularIssues = popularIssuesText
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean);

                  const payload = {
                    role: 'admin',
                    name: name.trim(),
                    description: (description || '').trim(),
                    basePrice: basePrice === '' ? 0 : Number(basePrice),
                    popularIssues
                  };

                  const resp = await updateService(editServiceId, payload);
                  if (resp?.error) {
                    setServiceEditError(resp.error);
                    return;
                  }

                  setServiceEditSuccess('Service updated successfully.');
                  setTimeout(() => {
                    closeEditService();
                  }, 800);
                }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5"
              >
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Update service category</h3>
                  <p className="text-slate-500 text-xs mt-1">Make changes to the listing details. ID stays the same.</p>
                </div>

                {serviceEditError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold">{serviceEditError}</div>
                )}
                {serviceEditSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">{serviceEditSuccess}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Service ID</label>
                    <input
                      value={editServiceForm.id}
                      readOnly
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Service Name</label>
                    <input
                      value={editServiceForm.name}
                      onChange={(e) => setEditServiceForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="e.g. Electrician"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea
                      value={editServiceForm.description}
                      onChange={(e) => setEditServiceForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="Short description for the service category"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Base Price (₹)</label>
                    <input
                      type="number"
                      value={editServiceForm.basePrice}
                      onChange={(e) => setEditServiceForm(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="249"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Popular Issues</label>
                    <input
                      value={editServiceForm.popularIssuesText}
                      onChange={(e) => setEditServiceForm(prev => ({ ...prev, popularIssuesText: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none border border-slate-300 focus:border-indigo-600 transition-all"
                      placeholder="Comma-separated, e.g. Short circuit fixing, Fan installation"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeEditService} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 text-xs font-bold rounded-lg transition-colors border border-slate-200">
                    Cancel
                  </button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold rounded-lg transition-colors shadow-2xs">
                    Update Service
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {(Array.isArray(services) ? services : []).map((cat) => {
                const partnerCount = partnerCountForService(cat.name);
                return (
                  <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between gap-4">
                    <div className="space-y-2 font-semibold">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-extrabold text-base">
                        {(cat.name || '?').charAt(0)}
                      </div>
                      <h4 className="text-slate-900 font-extrabold text-sm">{cat.name}</h4>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">{cat.description}</p>
                    </div>

                    {isAdmin && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditService(cat)}
                          className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-extrabold px-2.5 py-1 text-[10px] rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = window.confirm(`Delete service "${cat.name}"?`);
                            if (!ok) return;
                            const resp = await deleteService(cat.id, { role: 'admin' });
                            if (resp?.error) {
                              alert(resp.error);
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-extrabold px-2.5 py-1 text-[10px] rounded-lg transition-colors"
                        >
                          Delete
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const currentlyHidden = cat.isHidden === true;
                            const nextHidden = !currentlyHidden;
                            const actionLabel = nextHidden ? 'Hide' : 'Unhide';

                            const ok = window.confirm(`${actionLabel} service "${cat.name}"?`);
                            if (!ok) return;

                            const resp = await hideService(cat.id, nextHidden);
                            if (resp?.error) {
                              alert(resp.error);
                              return;
                            }

                            alert(`${actionLabel} successful.`);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold px-2.5 py-1 text-[10px] rounded-lg transition-colors"
                        >
                          {cat.isHidden ? 'Unhide' : 'Hide'}
                        </button>

                      </div>

                    )}

                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 text-[11px] font-bold text-slate-500">
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase font-bold">Listed Experts</span>
                        <span className="block text-slate-950 font-black mt-1 text-xs">{partnerCount} live partners</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase font-bold">Base Commission</span>
                        <span className="block text-teal-700 font-black mt-1 text-xs">{platformCommission}% per job</span>
                      </div>
                    </div>
                  </div>

                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Global Transaction Escrows list</h2>
              <p className="text-slate-500 text-xs">Live dispatch tracker, schedule audits, security escrow validations, and order cancellations.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                      <th className="py-3 px-6">Code ID</th>
                      <th className="py-3 px-6">Customer Representative</th>
                      <th className="py-3 px-6">Allocated Specialist</th>
                      <th className="py-3 px-6">Schedule detail</th>
                      <th className="py-3 px-6">Safety status</th>
                      <th className="py-3 px-6 text-right">Escrow gross</th>
                      <th className="py-3 px-6 text-center">Operational action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    {bookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">{bk.id}</td>
                        <td className="py-4 px-6">
                          <span className="text-slate-950 block font-extrabold text-sm leading-tight">{bk.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-normal font-mono">{bk.customerPhone}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-900 block font-extrabold leading-tight">{bk.providerName}</span>
                          <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">{bk.serviceCategory} Division</span>
                        </td>
                        <td className="py-4 px-6">{bk.bookingDate} • {bk.bookingTimeSlot}</td>
                        <td className="py-4 px-6">
                          {bk.status === 'pending' && <span className="bg-amber-150 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Awaiting partner</span>}
                          {bk.status === 'confirmed' && <span className="bg-indigo-50 text-indigo-850 border border-indigo-200 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Dispatch set</span>}
                          {bk.status === 'ongoing' && <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Transit diagnostics</span>}
                          {bk.status === 'completed' && <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Settled</span>}
                          {bk.status === 'cancelled' && <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">Cancelled</span>}
                        </td>
                        <td className="py-4 px-6 text-right text-indigo-750 font-black text-sm">₹{bk.totalAmount}</td>
                        <td className="py-4 px-6 text-center">
                          {bk.status !== 'completed' && bk.status !== 'cancelled' ? (
                            <button
                              onClick={() => updateBookingStatus(bk.id, 'cancelled', 'Cancelled by administrator override.')}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-fbold p-1 px-3 text-[10px] rounded-lg transition-colors cursor-pointer"
                            >
                              Overrule Cancel
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">No active override</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Escrow Settlements & Commission Ledger</h2>
              <p className="text-slate-500 text-xs">Verify financial split commissions, GST withholdings, and specialist weekly settlements logs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Unsettled Escrow Balance</span>
                <span className="text-3xl font-black text-indigo-400 block leading-none">₹{bookings.filter(b => ['confirmed', 'ongoing'].includes(b.status)).reduce((sum, b) => sum + b.totalAmount, 0)}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Active jobs in progress awaiting clearance</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Total Commission Net</span>
                <span className="text-3xl font-black text-teal-700 block leading-none">₹{administrativeEarnings}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Gross commissions earned at {platformCommission}%</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                <span className="text-[10px] text-slate-550 uppercase font-bold tracking-widest block">GST Collected (18% Cumulative)</span>
                <span className="text-3xl font-black text-slate-850 block leading-none">₹{bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.tax, 0)}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Withheld tax payments queue</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                      <th className="py-3 px-6">Booking Code</th>
                      <th className="py-3 px-6">Settlement Date</th>
                      <th className="py-3 px-6">Partner</th>
                      <th className="py-3 px-6">Payment Way</th>
                      <th className="py-3 px-6 text-right">Escrow gross</th>
                      <th className="py-3 px-6 text-right">Admin commission ({platformCommission}%)</th>
                      <th className="py-3 px-6 text-right">Partner Disbursed Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    {bookings.filter(b => b.status === 'completed').map((bk) => {
                      const commFactor = parseFloat(platformCommission) / 100;
                      const adminComm = Math.round(bk.totalAmount * commFactor);
                      const partnerDisbursed = bk.totalAmount - bk.serviceFee - bk.tax;
                      return (
                        <tr key={bk.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-slate-900">{bk.id}</td>
                          <td className="py-4 px-6">{bk.bookingDate}</td>
                          <td className="py-4 px-6 truncate font-extrabold max-w-[150px]">{bk.providerName}</td>
                          <td className="py-4 px-6 font-semibold">{bk.paymentMethod}</td>
                          <td className="py-4 px-6 text-right font-semibold text-slate-950">₹{bk.totalAmount}</td>
                          <td className="py-4 px-6 text-right font-extrabold text-teal-700">₹{adminComm}</td>
                          <td className="py-4 px-6 text-right font-extrabold text-emerald-800">₹{partnerDisbursed}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Reviews & Feedback audits</h2>
              <p className="text-slate-500 text-xs">Verify customer satisfaction indexes, check complaints comments, and monitor specialist ratings.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {providers.flatMap(p => (p.reviews || []).map(r => ({ ...r, providerColor: p.color, providerName: p.name, providerId: p.id, category: p.category }))).length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                  <Star className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-450 italic text-xs font-semibold">No platform ratings reviewed yet by customers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {providers.flatMap(p => (p.reviews || []).map(r => ({ ...r, providerColor: p.color, providerName: p.name, providerId: p.id, category: p.category }))).map((rev, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-2xs transition-all space-y-3 font-semibold text-xs text-slate-500">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Rating for expert</span>
                          <span className="text-slate-900 font-extrabold block text-sm mt-0.5">{rev.providerName}</span>
                          <span className="text-[9px] text-teal-700 font-bold block">{rev.category} division</span>
                        </div>
                        <span className="text-amber-550 font-black text-xs shrink-0 flex items-center gap-0.5">★ {rev.rating} / 5.0</span>
                      </div>
                      <p className="text-slate-800 italic leading-relaxed text-xs">"{rev.comment}"</p>
                      <div className="flex justify-between items-center text-[10px] pt-1 font-mono text-slate-400">
                        <span>Reviewed by{rev.reviewerName}</span>
                        <span>{rev.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Disputes Resolvers & Escalation Desk</h2>
              <p className="text-slate-500 text-xs">Respond to complaints, authorize refunds, edit credentials, and modify ticket properties.</p>
            </div>

            {tickets.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <Info className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 italic text-xs">No active help tickets raised by residents or partners.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((t) => {
                  const isReplying = activeTicketId === t.id;
                  return (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-650 px-2 py-0.5 rounded block w-fit mb-1">{t.id}</span>
                          <h4 className="font-extrabold text-slate-950 text-sm">{t.subject}</h4>
                          <span className="text-xs text-slate-400 mt-1 block">From Representative: <span className="font-bold text-slate-700">{t.name}</span> ({t.email})</span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${t.status === 'open' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <p className="text-slate-705 text-xs italic font-semibold leading-relaxed">"{t.message}"</p>

                      {t.response && (
                        <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl text-xs font-semibold leading-relaxed">
                          <span className="text-teal-700 font-extrabold block mb-1">Response Resolution:</span>
                          "{t.response}"
                        </div>
                      )}

                      {t.status === 'open' && (
                        <div className="pt-2">
                          {!isReplying ? (
                            <button
                              onClick={() => {
                                setActiveTicketId(t.id);
                                setTicketResponse('');
                              }}
                              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-extrabold p-2 px-4 rounded-lg text-xs tracking-tight transition-colors focus:outline-none"
                            >
                              Write Resolution Response
                            </button>
                          ) : (
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                              <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wide">Write response *</label>
                              <textarea
                                value={ticketResponse}
                                onChange={(e) => setTicketResponse(e.target.value)}
                                rows={2}
                                placeholder="Greetings We completed escrow checkouts analysis and approved refund credit parameters..."
                                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-850 focus:bg-white focus:outline-none outline-none border border-slate-300 focus:border-teal-600 transition-all"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setActiveTicketId(null)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleTicketResolveSubmit(t.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-2xs border border-emerald-500/10"
                                >
                                  Authorize Settlement
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Analytics & Metrics Charts</h2>
              <p className="text-slate-500 text-xs">Track active booking distributions, revenue progressions, and service division performances.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">Regional Booking Distribution</h3>
                <p className="text-slate-400 text-xs">Booking densities per neighborhood hub in Hyderabad active zone.</p>

                <div className="space-y-4 font-bold text-slate-600 text-xs pt-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Jubilee Hills Hub</span>
                      <span>44% (High demand density)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: '44%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Gachibowli Hub</span>
                      <span>32% (Regular)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 rounded-full" style={{ width: '32%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Madhapur division</span>
                      <span>16%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: '16%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Kondapur residential core</span>
                      <span>8%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: '8%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-slate-950 text-white rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-100">SLA Dispatch Performance</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Average compliance rate towards 60 minutes verified arrival guarantee.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Average Transit Latency</span>
                  <span className="text-4xl font-black text-teal-400 block mt-2">42 mins</span>
                  <span className="text-[10px] text-emerald-100 font-bold block mt-1.5 font-sans">✔ Guarantee compliance</span>
                  <p className="text-[11px] leading-relaxed text-slate-400 mt-2">
                    Performance evaluations is performed daily through integrated GPS signals tracking transit status coordinates when specialists trigger Arrived checklists on-site.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Reports & Data compilation</h2>
              <p className="text-slate-500 text-xs">Simulate spreadsheet exports for financial audits, payouts scheduling, and compliance evaluations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4">
                <div className="space-y-1.5 font-semibold text-xs text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h5 className="font-extrabold text-slate-900 block pt-1.5 text-sm">Disbursed net payout logs</h5>
                  <p className="font-medium text-slate-400">Weekly settled payments history to bank terminals for accounts scheduling.</p>
                </div>
                <button
                  onClick={() => alert('SLA CSV files compile is simulated successfully inside client buffers. Download initiated.')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <span>Export settlement report</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4">
                <div className="space-y-1.5 font-semibold text-xs text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-755">
                    <Users className="w-4 h-4" />
                  </div>
                  <h5 className="font-extrabold text-slate-900 block pt-1.5 text-sm">Partner audit schedules</h5>
                  <p className="font-medium text-slate-400">Aadhaar verifications status check list of provider applicants pool.</p>
                </div>
                <button
                  onClick={() => alert('Compliance roster spreadsheet compilation simulated.')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <span>Export screening rosters</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4">
                <div className="space-y-1.5 font-semibold text-xs text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-800">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h5 className="font-extrabold text-slate-900 block pt-1.5 text-sm">GST withholds withhold ledger</h5>
                  <p className="font-medium text-slate-400">Accounting sheets of 18% Central and State GST tax values withholdings.</p>
                </div>
                <button
                  onClick={() => alert('Tax ledgers spreadsheets export initialized.')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <span>Export taxes sheets</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Financial settings</h2>
              <p className="text-slate-500 text-xs">Configure base commission cuts, tax values, launch territories, and expansion parameters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <form onSubmit={saveCommissionSettings} className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
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
                      {CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
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
        )}
      </div>
    </div>
  );
};

