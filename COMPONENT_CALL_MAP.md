# Component Call Map

Files that call `useApp()` or make direct `fetch` calls:

- **frontend/src/App.jsx**
  - useApp(): currentUser, logout
- **frontend/src/components/AdminOtherServicesRequestsPanel.jsx**
  - useApp(): providerServiceItems, fetchProviderServiceItems, approveProviderServiceRequest, denyProviderServiceRequest
- **frontend/src/components/Navbar.jsx**
  - useApp(): currentUser, notifications, markNotificationAsRead, clearNotifications, logout
- **frontend/src/components/ProviderAvailability.jsx**
  - useApp(): currentUser, providers, updateProviderAvailability
- **frontend/src/components/ProviderHeader.jsx**
  - useApp(): currentUser
- **frontend/src/components/ProviderProfileView.jsx**
  - useApp(): currentUser, providers, logout, updateProviderAvailability, updateProviderProfile
- **frontend/src/pages/AdminPanel.jsx**
  - useApp(): providers, bookings, tickets, respondToTicket, verifyProvider, updateBookingStatus, users, currentUser, services, createService, updateService, deleteService, hideService, providerServiceRequests, fetchProviderServiceRequests, approveProviderServiceRequest, denyProviderServiceRequest
- **frontend/src/pages/BecomePartner.jsx**
  - useApp(): currentUser
- **frontend/src/pages/Contact.jsx**
  - useApp(): submitSupportTicket, currentUser
- **frontend/src/pages/CustomerDashboard.jsx**
  - useApp(): currentUser, bookings, updateBookingStatus, submitReview, providers, favoriteProviders, toggleFavoriteProvider, tickets, submitSupportTicket, notifications, markNotificationAsRead, applyReferralCode, getCustomerLoyaltyTier, sendChatMessage
- **frontend/src/pages/Home.jsx**
  - useApp(): selectedArea, setArea, searchQuery, setSearchQuery, setCategory, providers
- **frontend/src/pages/Login.jsx**
  - useApp(): login
- **frontend/src/pages/ProviderDashboard.jsx**
  - useApp(): currentUser, providers, bookings, updateBookingStatus, updateProviderAvailability, updateProviderProfile, submitSupportTicket, tickets, applyReferralCode, sendChatMessage
- **frontend/src/pages/ServiceDetails.jsx**
  - useApp(): providers, providersByApprovedService, fetchProvidersByApprovedServiceName, currentUser, createBooking, toggleFavoriteProvider, favoriteProviders, selectedArea, bookings, getCustomerLoyaltyTier
- **frontend/src/pages/Services.jsx**
  - useApp(): searchQuery, setSearchQuery, setCategory, providers, providersByApprovedService, fetchProvidersByApprovedServiceName, selectedArea, services
- **frontend/src/pages/Signup.jsx**
  - useApp(): registerUser, services