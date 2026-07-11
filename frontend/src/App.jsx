import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './cursor.css';

import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { ServiceDetails } from './pages/ServiceDetails';
import { BecomePartner } from './pages/BecomePartner';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CustomerBottomNav from './components/CustomerBottomNav';
import ActionSpinnerOverlay from './components/ActionSpinnerOverlay';


import {
  LayoutDashboard,
  History,
  Settings,
  Star,
  BarChart3,
  FileText,
  MessageSquare,
  CreditCard,
  Users,
  Activity,
  LogOut,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';


export function MainLayout() {
  const { currentUser, logout, notifications, actionSpinner } = useApp();


  const unreadNotifications = (notifications || []).filter(
    (n) => n.userId === currentUser?.id && !n.read
  ).length;

  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState('electrician');

  const [customerActiveTabExternal, setCustomerActiveTabExternal] = useState('bookings');
  const [providerActiveTabExternal, setProviderActiveTabExternal] = useState('leads');
  const [adminActiveTabExternal, setAdminActiveTabExternal] = useState('dashboard');

  const restrictedRoutes = ['dashboard-customer', 'dashboard-provider', 'admin'];

  const getDefaultDashboardForRole = (user) => {
    if (!user) return 'login';
    if (user.role === 'admin') return 'admin';
    if (user.role === 'provider') return 'dashboard-provider';
    return 'dashboard-customer';
  };

  const isAllowedForCurrentUser = (page, user) => {
    if (!restrictedRoutes.includes(page)) return true;
    if (!user) return false;
    if (page === 'dashboard-customer') return user.role === 'customer';
    if (page === 'dashboard-provider') return user.role === 'provider';
    if (page === 'admin') return user.role === 'admin';
    return false;
  };

  useEffect(() => {
    // On initial load, ignore any stale hash from a previous session.
    // Only force Home when user is logged out.
    if (!currentUser) {
      if (window.location.hash) window.location.hash = '';
      setCurrentPage('home');
    }

    const getAdminTabFromHash = (hashValue) => {
      // Expected: admin/<tab>
      const parts = hashValue.split('/');
      if (parts.length < 2) return 'dashboard';
      const tab = parts[1];

      // Map optional/legacy sidebar items to actual tab keys used by AdminPanelTabsRouter
      // (AdminPanelTabsRouter supports dashboard/customers/providers/providerServiceRequests/services/bookings/tickets/analytics/settings)
      if (tab === 'dashboard') return 'dashboard';
      if (tab === 'customers') return 'customers';
      if (tab === 'providers') return 'providers';
      if (tab === 'service-requests' || tab === 'providerServiceRequests') return 'providerServiceRequests';
      if (tab === 'services') return 'services';
      if (tab === 'bookings') return 'bookings';
      if (tab === 'payments') return 'payments'; // will fallback inside router
      if (tab === 'reviews') return 'reviews'; // will fallback inside router
      if (tab === 'tickets') return 'tickets';
      if (tab === 'analytics') return 'analytics';
      if (tab === 'reports') return 'reports'; // will fallback inside router
      if (tab === 'settings') return 'settings';

      return 'dashboard';
    };

    const handleHash = () => {
      const rawHash = window.location.hash.replace('#', '');
      const hash = rawHash.split('?')[0];

      if (hash) {
        if (hash.startsWith('service-details/')) {
          const catId = hash.split('/')[1];
          setSelectedCategoryDetail(catId);
          setCurrentPage('service-details');
          return;
        }

        if (hash === 'admin') {
          setCurrentPage('admin');
          setAdminActiveTabExternal('dashboard');
          return;
        }

        if (hash.startsWith('admin/')) {
          setCurrentPage('admin');
          setAdminActiveTabExternal(getAdminTabFromHash(hash));
          return;
        }

        setCurrentPage(hash);
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);


  // Ensure we don't render anything based on a previous restricted hash.
  // (hash parsing remains supported after login via hashchange listener)


  useEffect(() => {
    if (!currentUser && restrictedRoutes.includes(currentPage)) {
      setCurrentPage('login');
      window.location.hash = 'login';
      return;
    }

    if (currentUser && !isAllowedForCurrentUser(currentPage, currentUser)) {
      const redirectPage = getDefaultDashboardForRole(currentUser);
      setCurrentPage(redirectPage);
      window.location.hash = redirectPage;
      return;
    }

    if (currentUser && currentPage === 'login') {
      const redirectPage = getDefaultDashboardForRole(currentUser);
      setCurrentPage(redirectPage);
      window.location.hash = redirectPage;
    }
  }, [currentUser, currentPage]);

  const handlePageTransition = (page, categoryId) => {
    if (restrictedRoutes.includes(page) && !currentUser) {
      setCurrentPage('login');
      window.location.hash = 'login';
      window.scrollTo(0, 0);
      return;
    }

    if (restrictedRoutes.includes(page) && currentUser && !isAllowedForCurrentUser(page, currentUser)) {
      const redirectPage = getDefaultDashboardForRole(currentUser);
      setCurrentPage(redirectPage);
      window.location.hash = redirectPage;
      window.scrollTo(0, 0);
      return;
    }

    if (categoryId) {
      setSelectedCategoryDetail(categoryId);
      window.location.hash = `service-details/${categoryId}`;
    } else {
      window.location.hash = page;
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSignOutAction = () => {
    logout();
    handlePageTransition('login');
  };

  const renderContent = () => {
    if (!isAllowedForCurrentUser(currentPage, currentUser)) {
      return <Login onNavigate={handlePageTransition} />;
    }

    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handlePageTransition} />;
      case 'about':
        return <About />;
      case 'services':
        return <Services onNavigate={handlePageTransition} />;
      case 'service-details':
        return (
          <ServiceDetails catId={selectedCategoryDetail} onNavigate={handlePageTransition} />
        );
      case 'partner':
        return <BecomePartner />;
      case 'contact':
        return <Contact />;
      case 'faq':
        return <FAQ />;
      case 'login':
        return <Login onNavigate={handlePageTransition} />;
      case 'signup':
        return <Signup onNavigate={handlePageTransition} />;
      case 'dashboard-customer':
        return (
          <CustomerDashboard
            onNavigate={handlePageTransition}
            activeTab={customerActiveTabExternal}
            setActiveTabExternal={setCustomerActiveTabExternal}
          />
        );
      case 'dashboard-provider':
        return (
          <ProviderDashboard
            activeTab={providerActiveTabExternal}
            setActiveTabExternal={setProviderActiveTabExternal}
          />
        );
      case 'admin':
        return (
          <AdminPanel
            activeTab={adminActiveTabExternal}
            setActiveTabExternal={setAdminActiveTabExternal}
          />
        );
      default:
        return <Home onNavigate={handlePageTransition} />;
    }
  };

  // Admin layout has a sidebar, others don't
  if (currentUser?.role === 'admin' && currentPage === 'admin') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar
          onNavigate={handlePageTransition}
          currentPage={currentPage}
          adminActiveTab={adminActiveTabExternal}
          setAdminActiveTab={setAdminActiveTabExternal}
        />

        <div className="flex-1 flex flex-col md:flex-row">
          <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 text-slate-300 py-3 md:py-6 px-3 md:px-4 flex flex-col md:justify-between shrink-0 gap-4 md:gap-0 md:space-y-6 md:min-h-0">
            <div className="flex md:block gap-1.5 md:gap-0 md:space-y-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
              <span className="hidden md:block text-[9px] uppercase font-bold text-slate-500 tracking-wider px-2 mb-2">
                Operations ledger
              </span>
              <button
                onClick={() => {
                  setAdminActiveTabExternal('dashboard');
                  window.location.hash = 'admin/dashboard';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'dashboard'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('customers');
                  window.location.hash = 'admin/customers';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'customers'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <Users className="w-4 h-4 shrink-0" />
                <span>Customers</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('providers');
                  window.location.hash = 'admin/providers';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'providers'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <Briefcase className="w-4 h-4 shrink-0" />
                <span>Providers</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('services');
                  window.location.hash = 'admin/services';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'services'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <Activity className="w-4 h-4 shrink-0" />
                <span>Services</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('providerServiceRequests');
                  window.location.hash = 'admin/providerServiceRequests';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'providerServiceRequests'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Service Requests</span>
              </button>


              <button
                onClick={() => {
                  setAdminActiveTabExternal('bookings');
                  window.location.hash = 'admin/bookings';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'bookings'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <History className="w-4 h-4 shrink-0" />
                <span>Bookings</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('payments');
                  window.location.hash = 'admin/payments';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'payments'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Payments</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('reviews');
                  window.location.hash = 'admin/reviews';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'reviews'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <Star className="w-4 h-4 shrink-0" />
                <span>Reviews</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('tickets');
                  window.location.hash = 'admin/tickets';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'tickets'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Support Tickets</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('analytics');
                  window.location.hash = 'admin/analytics';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'analytics'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('reports');
                  window.location.hash = 'admin/reports';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'reports'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <FileText className="w-4 h-4 shrink-0" />
                <span>Reports</span>
              </button>

              <button
                onClick={() => {
                  setAdminActiveTabExternal('settings');
                  window.location.hash = 'admin/settings';
                }}
                className={`shrink-0 md:w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                  adminActiveTabExternal === 'settings'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >

                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </button>
            </div>

            <button
              onClick={handleSignOutAction}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-rose-950 text-rose-500 bg-rose-500/5 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Logout Admin Console</span>
            </button>
          </aside>

          <main className="flex-grow min-w-0">{renderContent()}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ActionSpinnerOverlay isOpen={!!actionSpinner?.isOpen} message={actionSpinner?.message} />
      <Navbar

        onNavigate={handlePageTransition}
        currentPage={currentPage}
        setSelectedCategoryDetail={setSelectedCategoryDetail}
        customerActiveTab={customerActiveTabExternal}
        setCustomerActiveTab={setCustomerActiveTabExternal}
        providerActiveTab={providerActiveTabExternal}
        setProviderActiveTab={setProviderActiveTabExternal}
      />

      <main className="flex-1">{renderContent()}</main>

      {/* Footer only for public pages and customer dashboard (usually) */}
      {(!currentUser || currentUser.role === 'customer') && (
        <div className={currentUser?.role === 'customer' ? 'pb-16 md:pb-0' : ''}>
          <Footer onNavigate={handlePageTransition} />
        </div>
      )}

      {/* Mobile sticky bottom navigation for the customer role (native-app feel) */}
      {currentUser?.role === 'customer' && (
        <CustomerBottomNav
          currentPage={currentPage}
          activeTab={customerActiveTabExternal}
          onNavigate={handlePageTransition}
          setCustomerActiveTab={setCustomerActiveTabExternal}
          notificationsCount={unreadNotifications}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

