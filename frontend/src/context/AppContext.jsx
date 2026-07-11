import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  normalizeBooking,
  normalizeBookings,
  normalizeProviders,
  normalizeTicket,
  normalizeTickets,
  normalizeNotification,
  normalizeNotifications,
} from '../utils/normalizeCustomerData';

const AppContext = createContext(undefined);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://servego-backend.onrender.com/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_SOCKET || 'https://servego-backend.onrender.com';
const baseFetch = typeof window !== 'undefined' && typeof window.fetch === 'function'
  ? window.fetch.bind(window)
  : fetch;

const getStoredAuthToken = () => {
  try {
    return localStorage.getItem('servego_token');
  } catch {
    return null;
  }
};

const apiFetch = async (url, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getStoredAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData) && !['GET', 'HEAD'].includes(String(options.method || 'GET').toUpperCase())) {
    headers.set('Content-Type', 'application/json');
  }

  return baseFetch(url, { ...options, headers });
};

// Use `api` as a small wrapper to avoid shadowing global `fetch`.
const api = (url, options) => apiFetch(url, options);

export const AppProvider = ({ children }) => {
  const fetchProviderAvailability = async (providerId, dateYYYYMMDD) => {
    try {
      const res = await api(`${API_BASE_URL}/providers/${providerId}/availability?date=${encodeURIComponent(dateYYYYMMDD)}`);
      const data = await res.json();
      if (!res.ok) return { error: data?.error || data?.message || 'Failed to fetch availability' };
      return data;
    } catch (err) {
      return { error: 'Network error' };
    }
  };

  // Database of users - purely for local dev fallback or admin view if needed
  const [users, setUsers] = useState([]);

  // Restore a previously authenticated session on refresh, but clear it on explicit logout.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('servego_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('servego_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('servego_user');
    }
  }, [currentUser]);


  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [providersByApprovedService, setProvidersByApprovedService] = useState([]);

  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [favoriteProviders, setFavoriteProviders] = useState(() => {
    const saved = localStorage.getItem('servego_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // UI state filters
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [selectedArea, setSelectedArea] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const socketRef = useRef(null);

  const fetchProvidersByApprovedServiceName = useCallback(async (serviceName) => {
    if (!serviceName) return [];
    try {
      const res = await api(`${API_BASE_URL}/providers/by-approved-service?serviceName=${encodeURIComponent(serviceName)}`);
      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to fetch providers by approved service:', data);
        return [];
      }
      const arr = Array.isArray(data) ? data : [];
      setProvidersByApprovedService(arr);
      return arr;
    } catch (err) {
      console.error('Failed to fetch providers by approved service:', err);
      setProvidersByApprovedService([]);
      return [];
    }
  }, []);


  // Sync favorites to local storage
  useEffect(() => {
    localStorage.setItem('servego_favorites', JSON.stringify(favoriteProviders));
  }, [favoriteProviders]);

  const fetchProviders = async () => {
    try {
      const res = await api(`${API_BASE_URL}/providers`);
      const data = await res.json();
      setProviders(normalizeProviders(data));
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api(`${API_BASE_URL}/services`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };


  const fetchBookings = useCallback(async () => {
    if (!currentUser?.id) {
      setBookings([]);
      return;
    }

    try {
      const res = await api(`${API_BASE_URL}/bookings`);
      const data = await res.json();
      const bookingsArray = normalizeBookings(data);

      if (currentUser?.role === 'admin') {
        setBookings(bookingsArray);
        return;
      }

      if (currentUser?.role === 'provider') {
        const providerIds = [currentUser?.providerId, currentUser?.id].filter(Boolean);
        const providerMatch = providers.find((p) => providerIds.includes(p.id) || providerIds.includes(p.userId));
        const providerId = providerMatch?.id || currentUser?.providerId || currentUser?.id;
        const matchedIds = [providerId, currentUser?.providerId, currentUser?.id].filter(Boolean);

        setBookings(
          bookingsArray.filter((b) => {
            const bookingProviderId = b.providerId || b.provider?.id || b.provider?.userId;
            return matchedIds.includes(bookingProviderId);
          })
        );
        return;
      }

      setBookings(bookingsArray.filter((b) => b.customerId === currentUser.id));
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setBookings([]);
    }
  }, [currentUser?.id, currentUser?.providerId, currentUser?.role, providers]);

  const fetchNotifications = async () => {
    try {
      const res = await api(`${API_BASE_URL}/notifications`);
      const data = await res.json();
      setNotifications(normalizeNotifications(data));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const fetchTickets = useCallback(async () => {
    try {
      const url = currentUser?.role === 'admin'
        ? `${API_BASE_URL}/admin/tickets`
        : `${API_BASE_URL}/tickets`;
      const res = await api(url);
      const data = await res.json();
      setTickets(normalizeTickets(data));
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setTickets([]);
    }
  }, [currentUser?.role]);


  const fetchUsers = async () => {
    try {
      const res = await api(`${API_BASE_URL}/users`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const createService = async (payload) => {
    try {
      const res = await api(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data?.id) {
        await fetchServices();
        return data;
      }
      return data;
    } catch (err) {
      console.error('Failed to create service:', err);
      return { error: 'Network error' };
    }
  };

  const updateService = async (id, payload) => {
    try {
      const res = await api(`${API_BASE_URL}/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        await fetchServices();
        return data;
      }
      return data;
    } catch (err) {
      console.error('Failed to update service:', err);
      return { error: 'Network error' };
    }
  };

  const deleteService = async (id) => {
    try {
      const res = await api(`${API_BASE_URL}/services/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchServices();
        return data;
      }
      return data;
    } catch (err) {
      console.error('Failed to delete service:', err);
      return { error: 'Network error' };
    }
  };

  const hideService = async (id, isHidden) => {
    try {
      const res = await api(`${API_BASE_URL}/services/${id}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchServices();
        return data;
      }
      return data;
    } catch (err) {
      console.error('Failed to hide service:', err);
      return { error: 'Network error' };
    }
  };


  // Actions



  const login = async (email, password) => {
    try {
      localStorage.removeItem('servego_user');
      localStorage.removeItem('servego_token');
      const res = await api(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem('servego_token', data.token);
        }
        setCurrentUser(data.user);
        return { success: true, role: data.user.role };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed',
          blockedReason: data.blockedReason,
          needsReview: data.needsReview
        };
      }

    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const registerUser = async (payload) => {
    try {
      localStorage.removeItem('servego_user');
      localStorage.removeItem('servego_token');
      const res = await api(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        const text = await res.text();
        console.error('Signup response not JSON:', text);
        return { success: false, error: `Unexpected server response: ${text}` };
      }

      if (data.success) {
        if (data.token) {
          localStorage.setItem('servego_token', data.token);
        }
        setCurrentUser(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'Registration failed' };
    } catch (err) {
      console.error('Signup network error:', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('servego_user');
      localStorage.removeItem('servego_token');
    } catch {
      // Ignore storage errors.
    }
    // Fail-fast: clear protected state immediately.
    setBookings([]);
    setNotifications([]);
    setTickets([]);
    setCurrentUser(null);
  };

  const setCity = (city) => {
    setSelectedCity(city);
    setSelectedArea(''); 
  };

  const setArea = (area) => {
    setSelectedArea(area);
  };


  const setCategory = (cat) => {
    setSelectedCategory(cat);
  };

  useEffect(() => {
    // Never expose provider/service catalog details unless authenticated.
    if (currentUser?.id) {
      fetchProviders();
      fetchServices();

      fetchNotifications();
      fetchBookings();
      fetchTickets();
    } else {
      setNotifications([]);
      setBookings([]);
      setTickets([]);

      // Optional privacy: clear any previously loaded catalog data.
      setProviders([]);
      setServices([]);
      setProvidersByApprovedService([]);
    }

    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
    // Intentionally omit `fetchBookings`/`fetchTickets` from deps to avoid
    // re-creating these effects when their identity changes due to provider/service
    // updates (which caused reconnect loops). The functions themselves read
    // latest state when invoked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);


  useEffect(() => {
    if (!currentUser?.id) return undefined;

    // Connect socket once per session. Provide auth token if available.
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { token: getStoredAuthToken() },
      autoConnect: true,
    });
    socketRef.current = socket;

      // Real-time booking + notification updates
      socket.on('newJobLead', () => fetchBookings());
      socket.on('bookingUpdated', () => fetchBookings());
      socket.on('bookingStatusChanged', () => fetchBookings());

    socket.on('notification', (notif) => {
      if (notif.userId === currentUser.id) {
        setNotifications(prev => [normalizeNotification(notif), ...prev]);
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err?.message || err);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.info('Socket reconnect attempt', attempt);
    });

    socket.on('reconnect_failed', () => {
      console.warn('Socket failed to reconnect after attempts');
    });

    // Poll bookings every 30s (reduced from 10s), no notification polling
    fetchBookings();
    const intervalId = window.setInterval(() => {
      if (currentUser?.id) fetchBookings();
    }, 30000);

    if (currentUser?.role === 'admin') fetchUsers();

    return () => {
      window.clearInterval(intervalId);
      socket.disconnect();
      socketRef.current = null;
    };
    // Socket should only reconnect when user identity/role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  const createBooking = async (bookingData) => {
    try {
      const res = await api(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          ...bookingData,
          // Prisma Booking does not store customerName/customerEmail/customerPhone.
          // Keep request payload aligned with backend/DB contract.
          customerId: currentUser?.id,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.message || data.error || 'Booking failed.' };
      }
      if (data.id) {
        const normalized = normalizeBooking(data);
        setBookings(prev => [normalized, ...prev]);
        fetchBookings();
        return normalized;
      }
      return { error: 'Booking failed.' };
    } catch (err) {
      console.error('Failed to create booking:', err);
      return { error: 'Network error' };
    }
  };

  const updateBookingStatus = async (bookingId, status, note) => {
    try {
      const res = await api(`${API_BASE_URL}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      const data = await res.json();
      if (data.id) {
        const normalized = normalizeBooking(data);
        setBookings(prev => prev.map(bk => bk.id === bookingId ? normalized : bk));
        return normalized;
      }
      if (data.error) {
        return { error: data.error };
      }
      return data;
    } catch (err) {
      console.error('Failed to update booking status:', err);
      return { error: 'Network error' };
    }
  };

  const submitReview = async (bookingId, providerId, rating, comment) => {
    try {
      const res = await api(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          providerId,
          reviewerId: currentUser?.id,
          reviewerName: currentUser?.name || 'Anonymous',
          rating,
          comment
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchProviders(); // Refresh providers to show new rating
        fetchBookings(); // Refresh bookings to show reviewed status
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  const verifyProvider = async (providerId) => {
    try {
      const provider = providers.find(p => p.id === providerId);
      const res = await api(`${API_BASE_URL}/providers/${providerId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !provider.isVerified })
      });
      const data = await res.json();
      if (data.id) {
        setProviders(prev => prev.map(p => p.id === providerId ? data : p));
      }
    } catch (err) {
      console.error('Failed to verify provider:', err);
    }
  };

  const updateProviderAvailability = async (providerId, availableDays, timeSlots) => {
    try {
      const res = await api(`${API_BASE_URL}/providers/${providerId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableDays, timeSlots })
      });
      const data = await res.json();
      if (data.id) {
        setProviders(prev => prev.map(p => p.id === providerId ? data : p));
      }
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  const updateProviderProfile = async (providerId, profileData) => {
    try {
      const res = await api(`${API_BASE_URL}/providers/${providerId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.id) {
        setProviders(prev => prev.map(p => p.id === providerId ? data : p));
      }
      return data;
    } catch (err) {
      console.error('Failed to update provider profile:', err);
      return { error: 'Network error' };
    }
  };

  const updateUserProfile = async (userId, profileData) => {
    try {
      const res = await api(`${API_BASE_URL}/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setCurrentUser(data.user);
      }
      return data;
    } catch (err) {
      console.error('Failed to update user profile:', err);
      return { error: 'Network error' };
    }
  };

  const toggleFavoriteProvider = (providerId) => {
    setFavoriteProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  };

  const submitSupportTicket = async (ticketData) => {
    try {
      const res = await api(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      const data = await res.json();
      if (data.id) {
        setTickets(prev => [normalizeTicket(data), ...prev]);
      }
      return data;
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      return { error: 'Network error' };
    }
  };

  const respondToTicket = async (ticketId, responseText) => {
    try {
      const res = await api(`${API_BASE_URL}/admin/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText })
      });
      const data = await res.json();
      if (data.id) {
        setTickets(prev => prev.map(tk => tk.id === ticketId ? data : tk));
      }
    } catch (err) {
      console.error('Failed to respond to ticket:', err);
    }
  };


  const markNotificationAsRead = async (id) => {
    try {
      const res = await api(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.id) {
        setNotifications(prev => prev.map(n => n.id === id ? normalizeNotification(data) : n));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const clearNotifications = async () => {
    try {
      await api(`${API_BASE_URL}/notifications`, { method: 'DELETE' });
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const addSystemNotification = async (title, message, type, userId, role) => {
    try {
      const res = await api(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type, userId, role })
      });
      const data = await res.json();
      if (data.id) {
        setNotifications(prev => [normalizeNotification(data), ...prev]);
      }
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const applyReferralCode = async (code) => {
    try {
      if (!currentUser?.id) return { success: false, message: 'Please login to apply a referral code.' };

      const res = await api(`${API_BASE_URL}/referrals/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, code })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data?.error || 'Failed to apply referral code.' };
      }

      // Refresh currentUser so referredBy/earnings reflect immediately.
      // (Backend returns success payload; local user object is updated from existing app only via setCurrentUser.)
      setCurrentUser(prev => (prev ? { ...prev, referredBy: data.referredBy } : prev));

      return {
        success: true,
        message: `Referral applied! You referred by ${data.referredBy}. Bonus: ₹${data.bonusEarned}`,
        referredBy: data.referredBy,
        referredCount: data.referredCount,
        bonusEarned: data.bonusEarned
      };
    } catch (err) {
      return { success: false, message: 'Network error while applying referral code.' };
    }
  };


  const getCustomerLoyaltyTier = (completedCount) => {
    if (completedCount >= 10) {
      return { tier: 'Platinum Star', discountPercent: 12, color: 'text-purple-600 bg-purple-100 border-purple-200', desc: '12% premium automated discount on checkout' };
    } else if (completedCount >= 5) {
      return { tier: 'Gold Shield', discountPercent: 8, color: 'text-amber-600 bg-amber-50 border-amber-200', desc: '8% gold standard discount on checkout' };
    } else if (completedCount >= 2) {
      return { tier: 'Silver Care', discountPercent: 5, color: 'text-slate-600 bg-slate-100 border-slate-200', desc: '5% silver starter discount on checkout' };
    }
    return { tier: 'Bronze Member', discountPercent: 0, color: 'text-teal-700 bg-teal-50 border-teal-100', desc: 'Book more to unlock automatic savings' };
  };

  const sendChatMessage = async (bookingId, text, senderRole) => {
    try {
      const res = await api(`${API_BASE_URL}/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser?.id,
          senderName: currentUser?.name,
          senderRole,
          text,
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (data.id) {
        const normalized = normalizeBooking(data);
        setBookings(prev => prev.map(bk => bk.id === bookingId ? normalized : bk));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // --- Admin: provider service request approvals ---
  const [providerServiceRequests, setProviderServiceRequests] = useState([]);
  const [providerServiceItems, setProviderServiceItems] = useState([]);

  // Global async action spinner (for booking/admin/provider actions)
  const [actionSpinner, setActionSpinner] = useState({ isOpen: false, message: '' });
  const runWithActionSpinner = async (asyncFn, { message = 'Processing...' } = {}) => {
    setActionSpinner({ isOpen: true, message });
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setActionSpinner({ isOpen: false, message: '' });
    }
  };


  const fetchProviderAnalytics = async (providerId, range = '90d') => {
    if (!providerId) return null;
    try {
      const res = await api(`${API_BASE_URL}/providers/${providerId}/analytics?range=${encodeURIComponent(range)}`);
      const data = await res.json();
      if (!res.ok) return null;
      return data;
    } catch {
      return null;
    }
  };


  const fetchProviderServiceRequests = async () => {
    if (currentUser?.role !== 'admin') return;
    try {
      const res = await api(`${API_BASE_URL}/admin/provider-service-requests`);

      const data = await res.json();
      if (res.ok) {
        setProviderServiceRequests(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch provider service requests:', data);
      }
    } catch (err) {
      console.error('Failed to fetch provider service requests:', err);
    }
  };

  const fetchProviderServiceItems = async () => {
    if (currentUser?.role !== 'admin') return;
    try {
      const res = await api(`${API_BASE_URL}/admin/provider-service-items`);
      const data = await res.json();
      if (res.ok) {
        setProviderServiceItems(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch provider service items:', data);
      }
    } catch (err) {
      console.error('Failed to fetch provider service items:', err);
    }
  };


  // Ensure admin can see service requests without clicking Refresh
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchProviderServiceRequests();
      fetchProviderServiceItems();
    } else {
      setProviderServiceRequests([]);
      setProviderServiceItems([]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);


  const approveProviderServiceRequest = async (serviceRequestId) => {
    if (currentUser?.role !== 'admin') return { error: 'Admin access required' };
    try {
      const res = await api(`${API_BASE_URL}/admin/provider-service-requests/${serviceRequestId}/approve`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (res.ok) {
        await fetchProviderServiceRequests();
        await fetchProviderServiceItems();
        await fetchProviders();
        return data;
      }
      return data;
    } catch (err) {
      console.error('Failed to approve provider service request:', err);
      return { error: 'Network error' };
    }
  };

  const denyProviderServiceRequest = async (serviceRequestId, reason) => {
    if (currentUser?.role !== 'admin') return { error: 'Admin access required' };
    try {
      const res = await api(`${API_BASE_URL}/admin/provider-service-requests/${serviceRequestId}/deny`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchProviderServiceRequests();
        return data;
      }
      return data;
    } catch (err) {
      console.error('Failed to deny provider service request:', err);
      return { error: 'Network error' };
    }
  };


  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      providers,
      providersByApprovedService,

      bookings,
      notifications,
      tickets,
      selectedCity,
      selectedArea,
      searchQuery,
      selectedCategory,
      login,
      registerUser,
      logout,
      setCity,
      setArea,
      setSearchQuery,
      setCategory,
      createBooking,
      updateBookingStatus,
      submitReview,
      verifyProvider,
      updateProviderAvailability,
      updateProviderProfile,
      updateUserProfile,
      toggleFavoriteProvider,
      favoriteProviders,
      // fetchProviderServices: not implemented yet in this context
      // registerProviderService: not implemented yet in this context
      submitSupportTicket,
      respondToTicket,
      markNotificationAsRead,
      clearNotifications,
      addSystemNotification,
      applyReferralCode,
      getCustomerLoyaltyTier,
      sendChatMessage,
      services,
      createService,
      updateService,
      deleteService,
      hideService,
      fetchProviderAnalytics,

      // admin provider service request approvals
      providerServiceRequests,
      providerServiceItems,
      fetchProviderServiceRequests,
      fetchProviderServiceItems,
      approveProviderServiceRequest,
      denyProviderServiceRequest,
      fetchProvidersByApprovedServiceName,
      fetchProviderAvailability,

      // global async action spinner
      actionSpinner,
      runWithActionSpinner
    }}>






      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
};
