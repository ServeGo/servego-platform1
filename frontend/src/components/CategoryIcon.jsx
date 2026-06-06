import React from 'react';
import { Zap, Droplet, Wind, Sparkles, Paintbrush, Tv, Hammer, Wrench } from 'lucide-react';

export const CategoryIcon = ({ name, className }) => {
  switch (name) {
    case 'Electrician': return <Zap className={className} />;
    case 'Plumber': return <Droplet className={className} />;
    case 'AC Repair': return <Wind className={className} />;
    case 'Home Cleaning': return <Sparkles className={className} />;
    case 'Deep Cleaning': return <Sparkles className={className} />; 
    case 'Painting': return <Paintbrush className={className} />;
    case 'Appliance Repair': return <Tv className={className} />;
    case 'Carpentry': return <Hammer className={className} />;
    case 'Home Maintenance': return <Wrench className={className} />;
    default: return <Wrench className={className} />;
  }
};

export default CategoryIcon;
