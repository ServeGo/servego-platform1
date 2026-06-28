## Per-action Architecture Map

This document maps common UI actions to the frontend files/components that trigger them, the client API functions, the backend endpoints/controllers, and the Prisma models involved. Use it as a quick reference — it omits implementation details.

Core note: most frontend API calls are centralized in the App context at [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1). Pages/components call `useApp()` helpers which in turn call these functions.

---

**Login (customer or provider)**
- UI: `frontend/src/pages/Login.jsx` calls `useApp().login()`
- Client function: `login(email,password)` in [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1)
- API: POST `/auth/login` -> defined in [backend/routes/api.js](backend/routes/api.js#L1)
- Backend controller: `UserController.login` in [backend/controllers/userController.js](backend/controllers/userController.js#L1)
- DB/models (Prisma): `User` and `AuthEvent` via [backend/prisma/client.js](backend/prisma/client.js#L1) and [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L1)

**Signup (customer/provider)**
- UI: `frontend/src/pages/Signup.jsx` (or provider flow in `BecomePartner.jsx`) -> calls `useApp().registerUser()`
- Client function: `registerUser()` in [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1)
- API: POST `/auth/register` -> [backend/routes/api.js](backend/routes/api.js#L1)
- Backend controller: `UserController.register` -> [backend/controllers/userController.js](backend/controllers/userController.js#L1)
- DB/models: `User`, plus `Customer` or `Provider` (provider profile created on signup)

**View Service Details / Provider list for a service**
- UI: `frontend/src/pages/ServiceDetails.jsx` and components like `ProviderListItem.jsx`, `ServiceDetailHeader.jsx` call context helpers or read `services` state from `useApp()`
- Client calls: `fetchServices()`, `fetchProviders()` or `fetchProvidersByApprovedServiceName()` in [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1)
- API: GET `/services` or GET `/providers/by-approved-service?serviceName=...` -> [backend/routes/api.js](backend/routes/api.js#L1)
- Backend controller: `ServiceController.getAll` and `ProviderServiceDiscoveryController.getApprovedProvidersByServiceName` -> [backend/controllers/serviceController.js](backend/controllers/serviceController.js#L1), [backend/controllers/providerServiceDiscoveryController.js](backend/controllers/providerServiceDiscoveryController.js#L1)
- DB/models: `Service`, `Provider`, `ProviderService` (links)

**Create Booking (customer books a provider)**
- UI: Booking modal component `frontend/src/components/BookingModal.jsx` (opened from `ServiceDetails.jsx` / `ProviderListItem.jsx`) -> calls `useApp().createBooking()`
- Client function: `createBooking()` in [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1)
- API: POST `/bookings` -> [backend/routes/api.js](backend/routes/api.js#L1)
- Backend controller: `BookingController.create` -> [backend/controllers/bookingController.js](backend/controllers/bookingController.js#L1)
- DB/models: `Booking`, `Notification` (a notification is created for provider), optionally `Payment` if payment fields used

**Provider views and manages bookings (provider dashboard)**
- UI: `frontend/src/pages/ProviderDashboard.jsx` and components `ProviderHeader.jsx`, `ProviderServicesPanel.jsx`, `LeadCard.jsx` use `useApp()` to load bookings and provider-specific data
- Client calls: `fetchBookings()` and `fetchProviderServices()` via [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1) and some components call provider-specific endpoints directly (e.g., `ProviderServicesPanel`)
- API: GET `/bookings`, GET `/providers/:id/services`, PATCH `/bookings/:id/status` -> [backend/routes/api.js](backend/routes/api.js#L1)
- Backend controllers: `BookingController.getAll`, `BookingController.updateStatus`, `ProviderController.getProviderServices` -> backend controllers files
- DB/models: `Booking`, `Provider`, `ProviderService`, `ProviderServiceRequest` (for pending requests)

**Provider updates availability or profile**
- UI: `frontend/src/components/ProviderAvailability.jsx` and `ProviderHeader.jsx` call `useApp().updateProviderAvailability()` or call endpoints directly
- Client calls: `updateProviderAvailability()` and `updateProviderProfile()` in [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1) or `ProviderController` usage in components
- API: PATCH `/providers/:id/availability`, PATCH `/providers/:id/profile` -> [backend/routes/api.js](backend/routes/api.js#L1)
- Backend controller: `ProviderController.updateAvailability`, `ProviderController.updateProfile` -> [backend/controllers/providerController.js](backend/controllers/providerController.js#L1)
- DB/models: `Provider` model fields `availableDays`, `timeSlots`, `bio`, `specialties`

**Provider registers a new service (request for approval)**
- UI: `frontend/src/components/ProviderServicesPanel.jsx` -> form triggers POST to register service
- Client calls: `providers/:id/services/register` via `fetch` inside component or `useApp()` wrapper
- API: POST `/providers/:id/services/register` -> [backend/routes/api.js](backend/routes/api.js#L1)
- Backend controller: `ProviderController.registerProviderService` -> creates `ProviderServiceRequest` (pending approval) -> [backend/controllers/providerController.js](backend/controllers/providerController.js#L1)
- DB/models: `ProviderServiceRequest`, optionally `ProviderService` after admin approval

**Leave a review**
- UI: `frontend/src/components/ReviewModal.jsx` or `ProviderProfileView.jsx` -> calls `useApp().submitReview()`
- Client calls: POST `/reviews` via [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1)
- Backend controller: `ReviewController.create` -> [backend/controllers/reviewController.js](backend/controllers/reviewController.js#L1)
- DB/models: `Review`, affects provider reputation (service `Provider.reviews` and `backend/services/providerReputationService.js`)

**Support tickets & notifications**
- UI: `frontend/src/components/ProviderSupport.jsx`, `TicketsView.jsx`, `NotificationsView.jsx` use `useApp()` helpers
- Client calls: POST `/tickets`, PATCH `/tickets/:id/resolve`, GET/POST/PATCH `/notifications` -> [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1)
- Backend controllers: `TicketController`, `NotificationController` -> [backend/controllers/ticketController.js](backend/controllers/ticketController.js#L1), [backend/controllers/notificationController.js](backend/controllers/notificationController.js#L1)
- DB/models: `Ticket`, `Notification`

**Admin approves/denies provider service requests**
- UI: `frontend/src/pages/AdminPanel.jsx` and `AdminOtherServicesRequestsPanel.jsx` call admin actions
- Client calls: PATCH `/admin/provider-service-requests/:id/approve` or `/deny` -> [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L1) or admin components
- Backend controllers: `AdminProviderServiceController.approveService` / `denyService` -> [backend/controllers/adminProviderServiceController.js](backend/controllers/adminProviderServiceController.js#L1)
- DB/models: `ProviderServiceRequest`, `ProviderService` (on approve)

---

If you want, I can:
- generate a downloadable CSV mapping (UI file -> client function -> endpoint -> controller -> model), or
- produce a visual diagram (GraphViz SVG) showing these per-action chains, or
- expand this doc to include every single component and the exact function it calls.
