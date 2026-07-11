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
  Menu,
} from 'lucide-react';


const RESTRICTED_ROUTES = ['dashboard-customer', 'dashboard-provider', 'admin'];

const getAdminTabFromRoute = (routeValue) => {
  const tab = routeValue || 'dashboard';
  if (tab === 'dashboard') return 'dashboard';
  if (tab === 'customers') return 'customers';
  if (tab === 'providers') return 'providers';
  if (tab === 'service-requests' || tab === 'providerServiceRequests') return 'providerServiceRequests';
  if (tab === 'services') return 'services';
  if (tab === 'bookings') return 'bookings';
  if (tab === 'payments') return 'payments';
  if (tab === 'reviews') return 'reviews';
  if (tab === 'tickets') return 'tickets';
  if (tab === 'analytics') return 'analytics';
  if (tab === 'reports') return 'reports';
  if (tab === 'settings') return 'settings';
  return 'dashboard';
};

const getRoutePath = (page, categoryId = null, tab = null) => {
  switch (page) {
    case 'home':
      return '/';
    case 'about':
      return '/about';
    case 'services':
      return '/services';
    case 'service-details':
      return categoryId ? `/service-details/${encodeURIComponent(categoryId)}` : '/services';
    case 'partner':
      return '/partner';
    case 'contact':
      return '/contact';
    case 'faq':
      return '/faq';
    case 'login':
      return '/login';
    case 'signup':
      return '/signup';
    case 'dashboard-customer':
      return '/dashboard-customer';
    case 'dashboard-provider':
      return '/dashboard-provider';
    case 'admin':
      return tab && tab !== 'dashboard' ? `/admin/${tab}` : '/admin/dashboard';
    default:
      return '/';
  }
};

const updateBrowserRoute = (page, categoryId = null, tab = null) => {
  const nextPath = getRoutePath(page, categoryId, tab);
  if (window.location.pathname !== nextPath) {
    window.history.pushState({}, '', nextPath);
  }
};

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

  const getDefaultDashboardForRole = (user) => {
    if (!user) return 'login';
    if (user.role === 'admin') return 'admin';
    if (user.role === 'provider') return 'dashboard-provider';
    return 'dashboard-customer';
  };
  const isAllowedForCurrentUser = (page, user) => {
    if (!RESTRICTED_ROUTES.includes(page)) return true;
    if (!user) return false;
    if (page === 'dashboard-customer') return user.role === 'customer';
    if (page === 'dashboard-provider') return user.role === 'provider';
    if (page === 'admin') return user.role === 'admin';
    return false;
  };

  useEffect(() => {
    const handleRouteChange = () => {
      const rawPath = window.location.pathname || '/';
      const path = rawPath.split('?')[0].replace(/^\/+|\/+$/g, '');
      const segments = path ? path.split('/') : [];

      if (!segments.length) {
        setCurrentPage('home');
        return;
      }

      if (segments[0] === 'service-details' && segments[1]) {
        setSelectedCategoryDetail(decodeURIComponent(segments[1]));
        setCurrentPage('service-details');
        return;
      }

      if (segments[0] === 'admin') {
        setCurrentPage('admin');
        setAdminActiveTabExternal(getAdminTabFromRoute(segments[1] || 'dashboard'));
        return;
      }

      const nextPage = segments[0];
      setCurrentPage(nextPage);
    };

    if (!currentUser) {
      window.history.replaceState({}, '', '/');
      setCurrentPage('home');
    }

    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange();
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [currentUser]);


  // Ensure we don't render anything based on a previous restricted hash.
  // (hash parsing remains supported after login via hashchange listener)


  useEffect(() => {
    if (!currentUser && RESTRICTED_ROUTES.includes(currentPage)) {
      setCurrentPage('login');
      updateBrowserRoute('login');
      return;
    }

    if (currentUser && !isAllowedForCurrentUser(currentPage, currentUser)) {
      const redirectPage = getDefaultDashboardForRole(currentUser);
      setCurrentPage(redirectPage);
      updateBrowserRoute(redirectPage);
      return;
    }

    if (currentUser && currentPage === 'login') {
      const redirectPage = getDefaultDashboardForRole(currentUser);
      setCurrentPage(redirectPage);
      updateBrowserRoute(redirectPage);
    }
  }, [currentUser, currentPage]);

  const handlePageTransition = (page, categoryId) => {
    if (RESTRICTED_ROUTES.includes(page) && !currentUser) {
      setCurrentPage('login');
      updateBrowserRoute('login');
      window.scrollTo(0, 0);
      return;
    }

    if (RESTRICTED_ROUTES.includes(page) && currentUser && !isAllowedForCurrentUser(page, currentUser)) {
      const redirectPage = getDefaultDashboardForRole(currentUser);
      setCurrentPage(redirectPage);
      updateBrowserRoute(redirectPage);
      window.scrollTo(0, 0);
      return;
    }

    if (categoryId) {
      setSelectedCategoryDetail(categoryId);
      updateBrowserRoute('service-details', categoryId);
    } else if (page === 'admin') {
      updateBrowserRoute('admin', null, adminActiveTabExternal);
    } else {
      updateBrowserRoute(page);
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
            <div className="hidden md:block space-y-1.5">
              <span className="hidden md:block text-[9px] uppercase font-bold text-slate-500 tracking-wider px-2 mb-2">
                Operations ledger
              </span>
              <button
                onClick={() => {
                  setAdminActiveTabExternal('dashboard');
                  updateBrowserRoute('admin', null, 'dashboard');
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
                  updateBrowserRoute('admin', null, 'customers');
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
                  updateBrowserRoute('admin', null, 'providers');
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
                  updateBrowserRoute('admin', null, 'services');
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
                  updateBrowserRoute('admin', null, 'providerServiceRequests');
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
                  updateBrowserRoute('admin', null, 'bookings');
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
                  updateBrowserRoute('admin', null, 'payments');
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
                  updateBrowserRoute('admin', null, 'reviews');
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
                  updateBrowserRoute('admin', null, 'tickets');
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
                  updateBrowserRoute('admin', null, 'analytics');
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
                  updateBrowserRoute('admin', null, 'reports');
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
                  updateBrowserRoute('admin', null, 'settings');
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
              className="hidden md:flex w-full py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-rose-950 text-rose-500 bg-rose-500/5 transition-all items-center gap-2"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Logout Admin Console</span>
            </button>
          </aside>

          <main className="flex-grow min-w-0 pb-24 md:pb-0">{renderContent()}</main>

          <div className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.10)]">
            <div className="flex items-center justify-between gap-1">
              {[
                { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { key: 'services', label: 'Services', icon: Activity },
                { key: 'providerServiceRequests', label: 'Requests', icon: ShieldCheck },
                { key: 'bookings', label: 'Bookings', icon: History },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = adminActiveTabExternal === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setAdminActiveTabExternal(item.key);
                      updateBrowserRoute('admin', null, item.key);
                    }}
                    className={`flex-1 flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black transition-all ${
                      isActive ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  const menu = document.getElementById('admin-mobile-more-menu');
                  if (menu) {
                    menu.classList.toggle('hidden');
                  }
                }}
                className="flex-1 flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <Menu className="w-4 h-4 mb-1" />
                <span>More</span>
              </button>
            </div>
          </div>

          <div id="admin-mobile-more-menu" className="md:hidden fixed inset-x-0 bottom-20 z-40 mx-2 hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {[
                { key: 'customers', label: 'Customers', icon: Users },
                { key: 'providers', label: 'Providers', icon: Briefcase },
                { key: 'tickets', label: 'Tickets', icon: MessageSquare },
                { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                { key: 'reports', label: 'Reports', icon: FileText },
                { key: 'settings', label: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setAdminActiveTabExternal(item.key);
                      updateBrowserRoute('admin', null, item.key);
                      document.getElementById('admin-mobile-more-menu')?.classList.add('hidden');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
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

