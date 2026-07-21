import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import HowItWorks from '../components/HowItWorks';
import TrustBanner from '../components/TrustBanner';
import AppPromo from '../components/AppPromo';
import PartnerCTA from '../components/PartnerCTA';

export default function Home({ onNavigate }) {
  return (
    <div className="accent-glow">
      <Hero onNavigate={onNavigate} />
      <CategoryGrid onNavigate={onNavigate} />
      <HowItWorks />
      <TrustBanner />
      <AppPromo />
      <PartnerCTA onNavigate={onNavigate} />
    </div>
  );
}
