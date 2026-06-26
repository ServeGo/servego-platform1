import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

// Components
import ServiceHeader from '../components/ServiceHeader';
import ServiceCard from '../components/ServiceCard';
import SupportBanner from '../components/SupportBanner';


export const Services = ({ onNavigate }) => {
  const {
    searchQuery,
    setSearchQuery,
    setCategory,
    providers,
    providersByApprovedService,
    fetchProvidersByApprovedServiceName,
    selectedArea,
    services
  } = useApp();

  const [inputSearch, setInputSearch] = useState(searchQuery);

  // Live filtering: every keystroke updates the searchQuery
  const handleSearchChange = (value) => {
    setInputSearch(value);
    setSearchQuery(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // no-op (filtering already happens on change)
  };

  const filteredCategories = useMemo(() => {
    const list = Array.isArray(services) ? services : [];

    return list.filter((cat) => {
      // Hide logic (backend returns boolean, but handle both boolean/1 for safety)
      const isHidden = cat.isHidden === true || cat.isHidden === 1;
      if (isHidden) return false;

      const matchSearch =
        (cat.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(cat.popularIssues) ? cat.popularIssues : [])
          .some((issue) => (issue || '').toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSearch;
    });
  }, [services, searchQuery]);

  const handleSelectCategory = (catId) => {
    setCategory(catId);
    onNavigate('service-details', catId);
  };

  const handleIssueClick = (issue) => {
    setInputSearch(issue);
    setSearchQuery(issue);
  };

  return (
    <div id="services-page" className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <ServiceHeader
          selectedArea={selectedArea}
          inputSearch={inputSearch}
          setInputSearch={setInputSearch}
          onSearchSubmit={handleSearchSubmit}
          onSearchChange={handleSearchChange}
        />

        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900">No Services Match "{searchQuery}"</h3>
            <p className="text-slate-500 text-sm mt-2">Try querying something else, like 'electrician' or 'AC repair'.</p>
            <button
              onClick={() => {
                setInputSearch('');
                setSearchQuery('');
              }}
              className="mt-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat) => (
              <ServiceCard
                key={cat.id}
                category={cat}
                providers={providers}
                onSelect={(id) => handleSelectCategory(id)}
                onIssueClick={handleIssueClick}
              />
            ))}
          </div>
        )}

        <SupportBanner onContact={() => onNavigate('contact')} />
      </div>
    </div>
  );
};

