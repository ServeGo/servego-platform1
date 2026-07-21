import React, { useState, useEffect, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CustomerBottomNav from './components/CustomerBottomNav';
import ActionSpinnerOverlay from './components/ActionSpinnerOverlay';
import ErrorBoundary from './components/ui/ErrorBoundary';

const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Services = React.lazy(() => import('./pages/Services'));
const ServiceDetails = React.lazy(() => import('./pages/ServiceDetails'));
const BecomePartner = React.lazy(() => import('./pages/BecomePartner'));
const Contact = React.lazy(() => import('./pages/Contact'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Signup = React.lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const CustomerDashboard = React.lazy(() => import('./pages/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const ProviderDashboard = React.lazy(() => import('./pages/ProviderDashboard').then(m => ({ default: m.ProviderDashboard })));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));

const RESTRICTED_ROUTES = ['dashboard-customer', 'dashboard-provider', 'admin'];

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <span className="text-sm text-slate-500 font-semibold">Loading...</span>
      </div>
    </div>
  );
}

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
    case 'home': return '/';
    case 'about': return '/about';
    case 'services': return '/services';
    case 'service-details': return categoryId ? `/service-details/${encodeURIComponent(categoryId)}` : '/services';
    case 'partner': return '/partner';
    case 'contact': return '/contact';
    case 'faq': return '/faq';
    case 'login': return '/login';
    case 'forgot-password': return '/forgot-password';
    case 'signup': return '/signup';
    case 'dashboard-customer': return '/dashboard-customer';
    case 'dashboard-provider': return '/dashboard-provider';
    case 'admin': return tab && tab !== 'dashboard' ? `/admin/${tab}` : '/admin/dashboard';
    default: return '/';
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

      setCurrentPage(segments[0]);
    };

    if (!currentUser) {
      window.history.replaceState({}, '', '/');
      setCurrentPage('home');
    }

    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange();
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [currentUser]);

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
        return <ServiceDetails catId={selectedCategoryDetail} onNavigate={handlePageTransition} />;
      case 'partner':
        return <BecomePartner onNavigate={handlePageTransition} />;
      case 'contact':
        return <Contact onNavigate={handlePageTransition} />;
      case 'faq':
        return <FAQ onNavigate={handlePageTransition} />;
      case 'login':
        return <Login onNavigate={handlePageTransition} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={handlePageTransition} />;
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
            onNavigate={handlePageTransition}
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

  // Admin layout - AdminPanel owns its own full layout (sidebar + topbar)
  if (currentUser?.role === 'admin' && currentPage === 'admin') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <AdminPanel
            activeTab={adminActiveTabExternal}
            setActiveTabExternal={setAdminActiveTabExternal}
          />
        </Suspense>
      </ErrorBoundary>
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
      <main className="flex-1 enterprise-fade-in">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            {renderContent()}
          </Suspense>
        </ErrorBoundary>
      </main>
      {(!currentUser || currentUser.role === 'customer') && (
        <div className={currentUser?.role === 'customer' ? 'pb-20 md:pb-0' : ''}>
          <Footer onNavigate={handlePageTransition} />
        </div>
      )}
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
