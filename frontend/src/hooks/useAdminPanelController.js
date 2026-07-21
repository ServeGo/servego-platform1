import { useMemo, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { CITIES } from '../data';
import { isOpenTicket } from '../utils/normalizeAdminData';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

export function useAdminPanelController() {
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
    hideService,
    providerServiceRequests,
    fetchProviderServiceRequests,
    approveProviderServiceRequest,
    denyProviderServiceRequest,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  const [activeTicketId, setActiveTicketId] = useState(null);
  const [ticketResponse, setTicketResponse] = useState('');

  const [platformCommission, setPlatformCommission] = useState('20');
  const [taxPercent, setTaxPercent] = useState('18');
  const [activeRegionHQ, setActiveRegionHQ] = useState('Hyderabad');
  const [isSavedSettings, setIsSavedSettings] = useState(false);

  // SERVICES admin form
  const [isAddingService, setIsAddingService] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [editServiceId, setEditServiceId] = useState(null);

  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    description: '',
    popularIssuesText: '',
  });

  const [editServiceForm, setEditServiceForm] = useState({
    name: '',
    description: '',
    popularIssuesText: '',
  });

  const [serviceAddError, setServiceAddError] = useState('');
  const [serviceAddSuccess, setServiceAddSuccess] = useState('');
  const [serviceEditError, setServiceEditError] = useState('');
  const [serviceEditSuccess, setServiceEditSuccess] = useState('');

  const customersList = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return list.filter((u) => u?.role === 'customer');
  }, [users]);

  const providersList = useMemo(() => {
    return providers || [];
  }, [providers]);

  const totalVolume = useMemo(() => {
    const bookingList = Array.isArray(bookings) ? bookings : [];
    return bookingList.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  }, [bookings]);

  const administrativeEarnings = useMemo(() => {
    const bookingList = Array.isArray(bookings) ? bookings : [];
    const factor = parseFloat(platformCommission) / 100;
    return Math.round(
      bookingList
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0) * factor, 0)
    );
  }, [bookings, platformCommission]);

  const pendingPartnersCount = useMemo(() => {
    return (Array.isArray(providerServiceRequests) ? providerServiceRequests : []).filter(r => r.status === 'PENDING').length;
  }, [providerServiceRequests]);

  const activeTicketsCount = useMemo(() => {
    return (Array.isArray(tickets) ? tickets : []).filter((t) => isOpenTicket(t)).length;
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

  const partnerCountForService = (serviceName) => {
    const sn = normalize(serviceName);
    const svc = (Array.isArray(services) ? services : []).find(s => normalize(s.name) === sn);
    if (svc && typeof svc.activeSpecialistCount === 'number') return svc.activeSpecialistCount;
    return (providers || []).filter((p) => normalize(p.category) === sn).length;
  };

  const openAddService = () => {
    setServiceAddError('');
    setServiceAddSuccess('');
    setNewServiceForm({ name: '', description: '', popularIssuesText: '' });
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
      name: cat.name || '',
      description: cat.description || '',
      popularIssuesText: Array.isArray(cat.popularIssues) ? cat.popularIssues.join(', ') : '',
    });
    setIsEditingService(true);
  };

  const closeEditService = () => {
    setIsEditingService(false);
    setEditServiceId(null);
    setServiceEditError('');
    setServiceEditSuccess('');
    setEditServiceForm({ name: '', description: '', popularIssuesText: '' });
  };

  const submitNewService = async (e) => {
    e.preventDefault();
    setServiceAddError('');
    setServiceAddSuccess('');

    const { name, description, popularIssuesText } = newServiceForm;

    if (!name.trim()) {
      setServiceAddError('Service name is required.');
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
      popularIssues,
    };

    const resp = await createService(payload);

    if (!resp?.id && !resp?.createdAt) {
      setServiceAddError(resp?.error || 'Failed to create service.');
      return;
    }

    setServiceAddSuccess('Service added successfully.');
    setIsAddingService(false);
    setNewServiceForm({ name: '', description: '', popularIssuesText: '' });
  };

  // Enhanced filtering functions
  const filterBookings = useCallback(({ status, search, dateFrom, dateTo, category } = {}) => {
    let arr = Array.isArray(bookings) ? bookings : [];
    if (status && status !== 'all') {
      arr = arr.filter(b => (b.status || '').toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(b =>
        (b.id || '').toLowerCase().includes(q) ||
        (b.customerName || '').toLowerCase().includes(q) ||
        (b.providerName || '').toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      arr = arr.filter(b => b.bookingDate >= dateFrom);
    }
    if (dateTo) {
      arr = arr.filter(b => b.bookingDate <= dateTo);
    }
    if (category && category !== 'all') {
      arr = arr.filter(b => (b.serviceCategory || '').toLowerCase() === category.toLowerCase());
    }
    return arr;
  }, [bookings]);

  const filterCustomers = useCallback(({ search, status } = {}) => {
    let arr = customersList;
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    if (status && status !== 'all') {
      arr = arr.filter(u => (u.status || '').toLowerCase() === status.toLowerCase());
    }
    return arr;
  }, [customersList]);

  const filterProviders = useCallback(({ search, verificationStatus } = {}) => {
    let arr = providersList;
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      );
    }
    if (verificationStatus && verificationStatus !== 'all') {
      arr = arr.filter(p => {
        const v = p.isVerified ? 'verified' : 'pending';
        return v === verificationStatus;
      });
    }
    return arr;
  }, [providersList]);

  const getMetrics = useCallback(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayBookings = (Array.isArray(bookings) ? bookings : []).filter(b => b.bookingDate === todayStr);
    const activeProviders = (Array.isArray(providers) ? providers : []).filter(p => p.isVerified).length;
    const newCustomers = customersList.filter(u => {
      const d = u.createdAt || u.joinDate;
      if (!d) return false;
      return d >= todayStr;
    });
    const avgRating = (() => {
      const rated = (Array.isArray(providers) ? providers : []).filter(p => p.rating);
      if (!rated.length) return 0;
      return rated.reduce((s, p) => s + (p.rating || 0), 0) / rated.length;
    })();
    return {
      totalBookingsToday: todayBookings.length,
      gmv: totalVolume,
      activeProviders,
      newCustomers: newCustomers.length,
      avgRating: avgRating.toFixed(1),
      todayRevenue: todayBookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0),
    };
  }, [bookings, providers, customersList, totalVolume]);

  const approveProvider = useCallback(async (serviceRequestId) => {
    return await approveProviderServiceRequest(serviceRequestId);
  }, [approveProviderServiceRequest]);

  const rejectProvider = useCallback(async (serviceRequestId, reason) => {
    return await denyProviderServiceRequest(serviceRequestId, reason);
  }, [denyProviderServiceRequest]);

  return {
    // data
    isAdmin,
    currentUser,
    users,
    providers,
    providersList,
    services,
    bookings: Array.isArray(bookings) ? bookings : [],
    tickets: Array.isArray(tickets) ? tickets : [],
    customersList,

    // dashboard stats
    totalVolume,
    administrativeEarnings,
    pendingPartnersCount,
    activeTicketsCount,

    // tickets
    activeTicketId,
    ticketResponse,
    setTicketResponse,
    setActiveTicketId,
    handleTicketResolveSubmit,

    // providers
    handlePartnerApproval,

    // services
    isAddingService,
    isEditingService,
    editServiceId,

    newServiceForm,
    editServiceForm,
    serviceAddError,
    serviceAddSuccess,
    serviceEditError,
    serviceEditSuccess,

    openAddService,
    closeAddService,
    openEditService,
    closeEditService,
    setNewServiceForm,
    setEditServiceForm,
    submitNewService,

    partnerCountForService,

    deleteService,
    hideService,
    updateService,
    createService,

    // settings
    platformCommission,
    setPlatformCommission,
    taxPercent,
    setTaxPercent,
    activeRegionHQ,
    setActiveRegionHQ,
    isSavedSettings,
    saveCommissionSettings,
    CITIES,

    // misc admin
    fetchProviderServiceRequests,
    providerServiceRequests,
    approveProviderServiceRequest,
    denyProviderServiceRequest,
    updateBookingStatus,

    // enhanced filtering
    filterBookings,
    filterCustomers,
    filterProviders,
    getMetrics,
    approveProvider,
    rejectProvider,
  };
}
