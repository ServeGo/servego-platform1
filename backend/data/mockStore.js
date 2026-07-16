/**
 * ServeGo — In-memory mock data store
 * Used when DATABASE_URL is not set or DB is unreachable.
 * Mirrors the Prisma schema shape so controllers work unchanged.
 */
import bcrypt from 'bcryptjs';

// Sync hash at module load — one-time cost, only in mock mode
const DEMO_HASH = bcrypt.hashSync('Demo@1234', 10);
const ADMIN_HASH = bcrypt.hashSync('Admin@1234', 10);

let _counter = 9000;
export const genId = () => `mock-${++_counter}`;
export const ts = (offset = 0) => new Date(Date.now() + offset).toISOString();

// ── SERVICES ─────────────────────────────────────────────────────────────────
export const services = [
  { id: 'svc-1', name: 'Electrician', nameNormalized: 'electrician', description: 'Certified electricians for wiring, fixtures, switchboards, and power failures.', popularIssues: ['Short circuit fixing', 'Fan installation', 'Switchboard repair', 'Complete home rewiring', 'Inverter setup'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'svc-2', name: 'Plumber', nameNormalized: 'plumber', description: 'Expert plumbing for leakages, pipe blockages, taps, basin installs, and pumps.', popularIssues: ['Tap leakage repair', 'Drain blockage removal', 'Water meter install', 'Bathroom fittings', 'Water tank repair'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'svc-3', name: 'AC Repair', nameNormalized: 'ac-repair', description: 'Deep AC filter clean, gas charging, cooling restoration, and system installations.', popularIssues: ['AC deep servicing', 'Gas leakage refill', 'Cooling troubleshooting', 'AC uninstallation', 'Noise correction'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'svc-4', name: 'Home Cleaning', nameNormalized: 'home-cleaning', description: 'Dusting, mopping, bathroom scrubbing, kitchen cleaning & trash handling.', popularIssues: ['Regular 2BHK cleaning', 'Regular 3BHK cleaning', 'Kitchen deep scrubbing', 'Bathroom disinfection'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'svc-5', name: 'Deep Cleaning', nameNormalized: 'deep-cleaning', description: 'Thorough sanitation, steam vacuuming, hard water stain removal, and sofa shampooing.', popularIssues: ['Full villa deep cleaning', 'Sofa & carpet shampoo', 'Balcony pressure wash', 'Move-out thorough cleaning'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'svc-6', name: 'Painting', nameNormalized: 'painting', description: 'Premium wall texture, wall putty, interior/exterior painting with free masking service.', popularIssues: ['Single accent wall design', 'Full apartment painting', 'Waterproofing & crack filling', 'Wall stencil art'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'svc-7', name: 'Appliance Repair', nameNormalized: 'appliance-repair', description: 'Quick diagnostics and genuine spare parts for washing machines, TVs, and refrigerators.', popularIssues: ['Washing machine spin issue', 'Refrigerator not-cooling', 'Microwave oven healing', 'Chimney filter cleanup'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'svc-8', name: 'Carpentry', nameNormalized: 'carpentry', description: 'Woodwork repairs, hinge replacement, custom wardrobe design, and alignment fixes.', popularIssues: ['Door hinge replacement', 'Wardrobe latch repair', 'Custom shelves installation', 'Bed assembly / alignment'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'svc-9', name: 'Home Maintenance', nameNormalized: 'home-maintenance', description: 'General handyman tasks, wall mounting, lock replacements, and minor repairs.', popularIssues: ['TV wall mounting', 'Curtain rod installation', 'Door lock replacement', 'Mirror / painting hanging'], isHidden: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

// ── USERS ─────────────────────────────────────────────────────────────────────
export const users = [
  { id: 'admin-1', name: 'Admin ServeGo', email: 'admin@servego.com', phone: '9999000001', role: 'admin', password: ADMIN_HASH, avatar: 'https://ui-avatars.com/api/?name=Admin+ServeGo&background=0F172A&color=fff&size=150', status: 'ACTIVE', address: null, pincode: null, referralCode: 'SERVEGO-ADMIN', referredBy: null, referralsCount: 0, referralDiscountBalance: 0, referralBonusEarned: 0, providerId: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cust-1', name: 'Priya Sharma', email: 'priya@example.com', phone: '9876543210', role: 'customer', password: DEMO_HASH, avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=7C3AED&color=fff&size=150', status: 'ACTIVE', address: '12 MG Road, Gachibowli', pincode: '500032', referralCode: 'SERVEGO-CUST-PRI42', referredBy: null, referralsCount: 2, referralDiscountBalance: 100, referralBonusEarned: 150, providerId: null, createdAt: '2026-02-10T00:00:00.000Z', updatedAt: '2026-02-10T00:00:00.000Z' },
  { id: 'cust-2', name: 'Rajan Mehta', email: 'rajan@example.com', phone: '9123456780', role: 'customer', password: DEMO_HASH, avatar: 'https://ui-avatars.com/api/?name=Rajan+Mehta&background=059669&color=fff&size=150', status: 'ACTIVE', address: '45 Kondapur Main Road', pincode: '500084', referralCode: 'SERVEGO-CUST-RAJ55', referredBy: null, referralsCount: 0, referralDiscountBalance: 0, referralBonusEarned: 0, providerId: null, createdAt: '2026-03-05T00:00:00.000Z', updatedAt: '2026-03-05T00:00:00.000Z' },
  { id: 'prov-user-1', name: 'Srinivas Rao', email: 'srinivas.ksr@servego.com', phone: '9848022311', role: 'provider', password: DEMO_HASH, avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150', status: 'ACTIVE', address: 'Madhapur, Hyderabad', pincode: '500081', referralCode: 'SERVEGO-PRO-SRI77', referredBy: null, referralsCount: 3, referralDiscountBalance: 0, referralBonusEarned: 200, providerId: 'prov-1', createdAt: '2026-01-15T00:00:00.000Z', updatedAt: '2026-01-15T00:00:00.000Z' },
  { id: 'prov-user-2', name: 'Ravi Kumar Plumbing', email: 'ravi.plumber@servego.com', phone: '9876501234', role: 'provider', password: DEMO_HASH, avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150', status: 'ACTIVE', address: 'Kukatpally, Hyderabad', pincode: '500072', referralCode: 'SERVEGO-PRO-RAV88', referredBy: null, referralsCount: 1, referralDiscountBalance: 0, referralBonusEarned: 100, providerId: 'prov-2', createdAt: '2026-01-20T00:00:00.000Z', updatedAt: '2026-01-20T00:00:00.000Z' },
  { id: 'prov-user-3', name: 'Arjun AC Services', email: 'arjun.ac@servego.com', phone: '9848033422', role: 'provider', password: DEMO_HASH, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'ACTIVE', address: 'Jubilee Hills, Hyderabad', pincode: '500033', referralCode: 'SERVEGO-PRO-ARJ99', referredBy: null, referralsCount: 0, referralDiscountBalance: 0, referralBonusEarned: 50, providerId: 'prov-3', createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'prov-user-4', name: 'Preethi Home Cleaners', email: 'preethi.clean@servego.com', phone: '9000112233', role: 'provider', password: DEMO_HASH, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', status: 'ACTIVE', address: 'Banjara Hills, Hyderabad', pincode: '500034', referralCode: 'SERVEGO-PRO-PRE66', referredBy: null, referralsCount: 0, referralDiscountBalance: 0, referralBonusEarned: 0, providerId: 'prov-4', createdAt: '2026-02-15T00:00:00.000Z', updatedAt: '2026-02-15T00:00:00.000Z' },
];

// ── CUSTOMER PROFILES ─────────────────────────────────────────────────────────
export const customerProfiles = [
  { id: 'cp-1', userId: 'cust-1', totalBookings: 5, completedBookings: 4, cancelledBookings: 1, totalSpent: 8500, loyaltyPoints: 850, tier: 'SILVER', preferredAreas: ['Gachibowli', 'Madhapur'], savedAddresses: [{ label: 'Home', address: '12 MG Road, Gachibowli', pincode: '500032' }], createdAt: '2026-02-10T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
  { id: 'cp-2', userId: 'cust-2', totalBookings: 2, completedBookings: 1, cancelledBookings: 0, totalSpent: 2200, loyaltyPoints: 220, tier: 'BRONZE', preferredAreas: ['Kondapur'], savedAddresses: [], createdAt: '2026-03-05T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
];

// ── PROVIDERS ─────────────────────────────────────────────────────────────────
export const providers = [
  {
    id: 'prov-1', userId: 'prov-user-1', bio: 'Professional licensed electrician trained under industrial standards. Specializes in residential troubleshooting, smart home switch conversions, and complex electrical diagnostics.', specialties: ['Smart Switches Setup', 'Inverter Repairs', 'Short Circuit Detection', '3-Phase Panel Wiring'], serviceAreas: ['Gachibowli', 'Madhapur', 'Jubilee Hills', 'Kondapur', 'Kukatpally'], isVerified: true, isFeatured: true, rating: 4.8, reviewCount: 24, experienceYears: 6, jobsCompleted: 142, availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], availableTimeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'], earnings: 52000, status: 'ACTIVE', createdAt: '2026-01-15T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'prov-2', userId: 'prov-user-2', bio: 'Expert plumber with 8 years experience. Handles leakages, pipe blockages, taps, basin installs, and water pumps with precision.', specialties: ['Pipe Leak Detection', 'Drain Unblocking', 'Bathroom Fittings', 'Water Pump Repair'], serviceAreas: ['Kukatpally', 'Kondapur', 'Miyapur', 'Bachupally'], isVerified: true, isFeatured: true, rating: 4.6, reviewCount: 18, experienceYears: 8, jobsCompleted: 210, availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], availableTimeSlots: ['08:00 AM', '10:00 AM', '12:00 PM', '03:00 PM', '05:00 PM'], earnings: 47000, status: 'ACTIVE', createdAt: '2026-01-20T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'prov-3', userId: 'prov-user-3', bio: 'AC specialist for all brands. Deep service, gas charging, cooling restoration, and new installations. 100+ satisfied customers.', specialties: ['AC Deep Servicing', 'Gas Refilling', 'AC Installation', 'Cooling Optimization'], serviceAreas: ['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli'], isVerified: true, isFeatured: false, rating: 4.7, reviewCount: 31, experienceYears: 5, jobsCompleted: 98, availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], availableTimeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'], earnings: 38000, status: 'ACTIVE', createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'prov-4', userId: 'prov-user-4', bio: 'Professional home cleaning service for 2BHK/3BHK/villas. Eco-friendly products, trained staff, and 100% satisfaction guarantee.', specialties: ['Regular Cleaning', 'Deep Cleaning', 'Kitchen Scrubbing', 'Bathroom Disinfection'], serviceAreas: ['Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Kondapur', 'Gachibowli'], isVerified: false, isFeatured: false, rating: 4.5, reviewCount: 12, experienceYears: 3, jobsCompleted: 67, availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], availableTimeSlots: ['09:00 AM', '11:00 AM', '02:00 PM'], earnings: 21000, status: 'ACTIVE', createdAt: '2026-02-15T00:00:00.000Z', updatedAt: '2026-05-15T00:00:00.000Z',
  },
];

// ── PROVIDER SERVICES (approved) ──────────────────────────────────────────────
export const providerServices = [
  { id: 'ps-1', providerId: 'prov-1', serviceId: 'svc-1', serviceName: 'Electrician', createdAt: '2026-01-20T00:00:00.000Z' },
  { id: 'ps-2', providerId: 'prov-2', serviceId: 'svc-2', serviceName: 'Plumber', createdAt: '2026-01-25T00:00:00.000Z' },
  { id: 'ps-3', providerId: 'prov-3', serviceId: 'svc-3', serviceName: 'AC Repair', createdAt: '2026-02-05T00:00:00.000Z' },
  { id: 'ps-4', providerId: 'prov-4', serviceId: 'svc-4', serviceName: 'Home Cleaning', createdAt: '2026-02-20T00:00:00.000Z' },
];

// ── PROVIDER SERVICE REQUESTS ─────────────────────────────────────────────────
export const providerServiceRequests = [
  { id: 'psr-1', providerId: 'prov-4', requestedServiceName: 'Deep Cleaning', description: 'I have 3 years experience in deep cleaning services.', popularIssues: [], experienceYears: 3, status: 'PENDING', denialReason: null, createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
];

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
export const bookings = [
  {
    id: 'bk-1', customerId: 'cust-1', providerId: 'prov-1', serviceId: 'svc-1', serviceCategory: 'Electrician', status: 'COMPLETED', bookingDate: '2026-06-15T09:00:00.000Z', bookingTimeSlot: '09:00 AM', bookingType: 'one-time', address: '12 MG Road, Gachibowli', notes: 'Fan installation and switchboard repair needed.', paymentStatus: 'PAID', totalAmount: 1200, messages: [], statusHistory: [{ status: 'PENDING', timestamp: '2026-06-14T10:00:00.000Z', note: 'Booking created' }, { status: 'CONFIRMED', timestamp: '2026-06-14T11:00:00.000Z', note: 'Provider confirmed' }, { status: 'COMPLETED', timestamp: '2026-06-15T12:00:00.000Z', note: 'Service completed' }], createdAt: '2026-06-14T10:00:00.000Z', updatedAt: '2026-06-15T12:00:00.000Z',
  },
  {
    id: 'bk-2', customerId: 'cust-1', providerId: 'prov-2', serviceId: 'svc-2', serviceCategory: 'Plumber', status: 'CONFIRMED', bookingDate: '2026-07-18T10:00:00.000Z', bookingTimeSlot: '10:00 AM', bookingType: 'one-time', address: '12 MG Road, Gachibowli', notes: 'Kitchen tap leaking.', paymentStatus: 'PENDING', totalAmount: 800, messages: [], statusHistory: [{ status: 'PENDING', timestamp: '2026-07-16T09:00:00.000Z', note: 'Booking created' }, { status: 'CONFIRMED', timestamp: '2026-07-16T10:30:00.000Z', note: 'Provider confirmed' }], createdAt: '2026-07-16T09:00:00.000Z', updatedAt: '2026-07-16T10:30:00.000Z',
  },
  {
    id: 'bk-3', customerId: 'cust-2', providerId: 'prov-3', serviceId: 'svc-3', serviceCategory: 'AC Repair', status: 'PENDING', bookingDate: '2026-07-20T11:00:00.000Z', bookingTimeSlot: '11:00 AM', bookingType: 'one-time', address: '45 Kondapur Main Road', notes: 'AC not cooling properly.', paymentStatus: 'PENDING', totalAmount: 1500, messages: [], statusHistory: [{ status: 'PENDING', timestamp: '2026-07-16T08:00:00.000Z', note: 'Booking created' }], createdAt: '2026-07-16T08:00:00.000Z', updatedAt: '2026-07-16T08:00:00.000Z',
  },
];

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
export const payments = [
  { id: 'pay-1', bookingId: 'bk-1', customerId: 'cust-1', providerId: 'prov-1', amount: 1200, status: 'PAID', method: 'UPI', transactionId: 'TXN-MOCK-001', createdAt: '2026-06-15T12:30:00.000Z', updatedAt: '2026-06-15T12:30:00.000Z' },
];

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export const notifications = [
  { id: 'notif-1', userId: 'cust-1', title: 'Booking Confirmed', message: 'Your Electrician booking on 15 Jun has been confirmed by Srinivas Rao.', type: 'BOOKING', isRead: true, createdAt: '2026-06-14T11:00:00.000Z', updatedAt: '2026-06-14T11:00:00.000Z' },
  { id: 'notif-2', userId: 'cust-1', title: 'Service Completed', message: 'Your Electrician service is completed. Rate your experience!', type: 'BOOKING', isRead: false, createdAt: '2026-06-15T12:00:00.000Z', updatedAt: '2026-06-15T12:00:00.000Z' },
  { id: 'notif-3', userId: 'cust-1', title: 'Plumber Booking Confirmed', message: 'Your Plumber booking for 18 Jul is confirmed.', type: 'BOOKING', isRead: false, createdAt: '2026-07-16T10:30:00.000Z', updatedAt: '2026-07-16T10:30:00.000Z' },
  { id: 'notif-4', userId: 'prov-user-1', title: 'New Booking Request', message: 'Priya Sharma has booked your Electrician service for 15 Jun.', type: 'BOOKING', isRead: true, createdAt: '2026-06-14T10:00:00.000Z', updatedAt: '2026-06-14T10:00:00.000Z' },
  { id: 'notif-5', userId: 'admin-1', title: 'New Provider Registration', message: 'Preethi Home Cleaners has submitted a new service request for review.', type: 'SYSTEM', isRead: false, createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
];

// ── TICKETS ───────────────────────────────────────────────────────────────────
export const tickets = [
  { id: 'tkt-1', requesterName: 'Priya Sharma', requesterEmail: 'priya@example.com', subject: 'Provider did not show up', message: 'The provider was scheduled for 10 AM but did not arrive or call. Please help.', status: 'RESOLVED', adminResponse: 'We apologize for the inconvenience. The provider has been penalized and a refund has been processed.', resolvedAt: '2026-06-10T14:00:00.000Z', createdAt: '2026-06-09T11:00:00.000Z', updatedAt: '2026-06-10T14:00:00.000Z' },
  { id: 'tkt-2', requesterName: 'Rajan Mehta', requesterEmail: 'rajan@example.com', subject: 'App not showing my booking history', message: 'I completed a booking last week but it does not appear in my history.', status: 'OPEN', adminResponse: null, resolvedAt: null, createdAt: '2026-07-14T09:00:00.000Z', updatedAt: '2026-07-14T09:00:00.000Z' },
];

// ── REVIEWS ───────────────────────────────────────────────────────────────────
export const reviews = [
  { id: 'rev-1', bookingId: 'bk-1', customerId: 'cust-1', providerId: 'prov-1', rating: 5, comment: 'Excellent work! Fixed all electrical issues quickly. Very professional.', serviceCategory: 'Electrician', createdAt: '2026-06-15T14:00:00.000Z', updatedAt: '2026-06-15T14:00:00.000Z' },
];

// ── AUTH EVENTS ───────────────────────────────────────────────────────────────
export const authEvents = [];

// ── MASTER STORE OBJECT ───────────────────────────────────────────────────────
// All collections are mutable arrays (push/splice in mockClient)
export const store = {
  users,
  customerProfiles,
  providers,
  providerServices,
  providerServiceRequests,
  services,
  bookings,
  payments,
  notifications,
  tickets,
  reviews,
  authEvents,
};
