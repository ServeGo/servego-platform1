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
  const { currentUser, logout } = useApp();

  const [currentPage, setCurrentPage] = useState(() => {
    const rawHash = window.location.hash.replace('#', '');
    const hash = rawHash.split('?')[0];
    return hash || 'home';
  });
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
    const handleHash = () => {
      const rawHash = window.location.hash.replace('#', '');
      const hash = rawHash.split('?')[0];

      if (hash) {
        if (hash.startsWith('service-details/')) {
          const catId = hash.split('/')[1];
          setSelectedCategoryDetail(catId);
          setCurrentPage('service-details');
        } else {
          setCurrentPage(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

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
          <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 py-6 px-4 flex flex-col justify-between shrink-0 space-y-6">
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block px-2 mb-2">
                Operations ledger
              </span>
              <button
                onClick={() => setAdminActiveTabExternal('dashboard')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'dashboard'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('customers')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'customers'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Customers</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('providers')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'providers'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <span>Providers</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('services')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'services'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span>Services</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('providerServiceRequests')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'providerServiceRequests'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Service Requests</span>
              </button>


              <button
                onClick={() => setAdminActiveTabExternal('bookings')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'bookings'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <History className="w-4 h-4 shrink-0" />
                <span>Bookings</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('payments')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'payments'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Payments</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('reviews')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'reviews'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <Star className="w-4 h-4 shrink-0" />
                <span>Reviews</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('tickets')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'tickets'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Support Tickets</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('analytics')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'analytics'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('reports')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
                  adminActiveTabExternal === 'reports'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'hover:bg-white/5 text-slate-305'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Reports</span>
              </button>

              <button
                onClick={() => setAdminActiveTabExternal('settings')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center gap-2.5 transition-all text-left ${
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
        <Footer onNavigate={handlePageTransition} />
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

