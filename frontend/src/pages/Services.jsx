import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES, CITIES } from '../data';
import ServiceHeader from '../components/ServiceHeader';
import ServiceCard from '../components/ServiceCard';

export default function Services({ onNavigate }) {
  const { searchServices, servicesList, providers } = useApp();
  const [inputSearch, setInputSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const CATEGORY_LIST = ['All', ...SERVICE_CATEGORIES.map((c) => c.name)];

  const filteredServices = useMemo(() => {
    let list = servicesList || SERVICE_CATEGORIES;

    if (selectedCategory !== 'All') {
      list = list.filter(
        (s) => s.name.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (inputSearch.trim()) {
      const q = inputSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [servicesList, selectedCategory, inputSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const getProviderCount = (catName) => {
    return (providers || []).filter(
      (p) => p.category && p.category.toLowerCase() === catName.toLowerCase()
    ).length;
  };

  return (
    <div className="bg-[#f4f8fb] min-h-screen">
      <ServiceHeader
        selectedArea={selectedArea}
        inputSearch={inputSearch}
        setInputSearch={setInputSearch}
        onSearchSubmit={handleSearchSubmit}
        onSearchChange={(val) => setInputSearch(val)}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORY_LIST.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full text-sm font-semibold px-4 py-2 transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-400 text-slate-900'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Service cards grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No services found</h3>
            <p className="text-sm text-slate-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                category={service}
                providers={providers}
                onSelect={() => onNavigate && onNavigate('service-details', service.id)}
                onIssueClick={(issue) => {
                  setInputSearch(issue);
                  setSelectedCategory('All');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
