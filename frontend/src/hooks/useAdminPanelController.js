import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CITIES } from '../data';
import { normalizeProviderIsVerified, isOpenTicket } from '../utils/normalizeAdminData';


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
    id: '',
    name: '',
    description: '',
    basePrice: '',
    popularIssuesText: '',
  });

  const [editServiceForm, setEditServiceForm] = useState({
    id: '',
    name: '',
    description: '',
    basePrice: '',
    popularIssuesText: '',
  });

  const [serviceAddError, setServiceAddError] = useState('');
  const [serviceAddSuccess, setServiceAddSuccess] = useState('');
  const [serviceEditError, setServiceEditError] = useState('');
  const [serviceEditSuccess, setServiceEditSuccess] = useState('');

  const customersList = useMemo(() => {
    return (users || []).filter((u) => u.role === 'customer');
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
    return (providers || []).filter((p) => !normalizeProviderIsVerified(p)).length;
  }, [providers]);

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
    return (providers || []).filter((p) => normalize(p.category) === sn).length;
  };

  const openAddService = () => {
    setServiceAddError('');
    setServiceAddSuccess('');
    setNewServiceForm({ id: '', name: '', description: '', basePrice: '', popularIssuesText: '' });
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
      popularIssuesText: Array.isArray(cat.popularIssues) ? cat.popularIssues.join(', ') : '',
    });
    setIsEditingService(true);
  };

  const closeEditService = () => {
    setIsEditingService(false);
    setEditServiceId(null);
    setServiceEditError('');
    setServiceEditSuccess('');
    setEditServiceForm({ id: '', name: '', description: '', basePrice: '', popularIssuesText: '' });
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
      description: (description || '').trim(),
      basePrice: basePrice === '' ? 0 : Number(basePrice),
      popularIssues,
    };

    const resp = await createService(payload);

    if (!resp?.id && !resp?.createdAt) {
      setServiceAddError(resp?.error || 'Failed to create service.');
      return;
    }

    setServiceAddSuccess('Service added successfully.');
    setIsAddingService(false);
    setNewServiceForm({ id: '', name: '', description: '', basePrice: '', popularIssuesText: '' });
  };

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
  };
}

