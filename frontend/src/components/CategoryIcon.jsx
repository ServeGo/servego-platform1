import {
  Paintbrush,
  Wrench,
  Zap,
  Palette,
  Snowflake,
  Hammer,
  Bug,
  Refrigerator,
} from 'lucide-react';

const ICON_MAP = {
  Cleaning: Paintbrush,
  Plumbing: Wrench,
  Electrical: Zap,
  Painting: Palette,
  'AC Repair': Snowflake,
  Carpentry: Hammer,
  'Pest Control': Bug,
  'Appliance Repair': Refrigerator,
};

export default function CategoryIcon({ category, size = 'md' }) {
  const Icon = ICON_MAP[category] || Wrench;

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorMap = {
    Cleaning: 'text-sky-600',
    Plumbing: 'text-blue-600',
    Electrical: 'text-amber-500',
    Painting: 'text-purple-600',
    'AC Repair': 'text-cyan-600',
    Carpentry: 'text-orange-600',
    'Pest Control': 'text-red-500',
    'Appliance Repair': 'text-teal-600',
  };

  return (
    <Icon
      className={`${sizeClasses[size] || sizeClasses.md} ${colorMap[category] || 'text-sky-600'}`}
    />
  );
}
