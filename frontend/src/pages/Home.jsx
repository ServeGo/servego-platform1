import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES } from '../data';

// Components
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import TrustBanner from '../components/TrustBanner';
import HowItWorks from '../components/HowItWorks';
import AppPromo from '../components/AppPromo';
import PartnerCTA from '../components/PartnerCTA';

export const Home = ({ onNavigate }) => {
  const { 
    selectedArea, setArea, 
    searchQuery, setSearchQuery, setCategory, providers
  } = useApp();

  const [inputQuery, setInputQuery] = useState(searchQuery);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(inputQuery);
    setCategory(null);
    onNavigate('services');
  };

  const handleCategoryClick = (catId) => {
    setCategory(catId);
    onNavigate('service-details', catId);
  };

  const handleQuickSearch = (term) => {
    setInputQuery(term);
    setSearchQuery(term);
    onNavigate('services');
  };

  return (
    <div id="home-page" className="bg-slate-50 min-h-screen">
      <Hero 
        onSearch={handleSearchSubmit}
        selectedArea={selectedArea}
        setArea={setArea}
        inputQuery={inputQuery}
        setInputQuery={setInputQuery}
        onQuickSearch={handleQuickSearch}
      />



      <CategoryGrid 
        categories={SERVICE_CATEGORIES}
        providers={providers}
        onCategoryClick={handleCategoryClick}
        onSeeAll={() => { setCategory(null); onNavigate('services'); }}
      />

      <TrustBanner onBookAC={() => handleCategoryClick('ac-repair')} />

      <HowItWorks />

      <AppPromo />

      <PartnerCTA onApply={() => onNavigate('partner')} />


    </div>
  );
};

