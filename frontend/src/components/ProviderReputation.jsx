import React from 'react';
import { Award, CalendarCheck, Flame, Gem, Heart, Medal, Star, Trophy, Zap } from 'lucide-react';

const levelMeta = {
  BRONZE: { label: 'Bronze', Icon: Medal, className: 'bg-orange-50 text-orange-800 border-orange-200' },
  SILVER: { label: 'Silver', Icon: Medal, className: 'bg-slate-100 text-slate-700 border-slate-200' },
  GOLD: { label: 'Gold', Icon: Medal, className: 'bg-amber-50 text-amber-800 border-amber-200' },
  ELITE: { label: 'Elite', Icon: Star, className: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
};

const badgeMeta = {
  TOP_RATED: { label: 'Top Rated', Icon: Trophy, className: 'bg-amber-50 text-amber-800 border-amber-200' },
  FAST_RESPONSE: { label: 'Fast Response', Icon: Zap, className: 'bg-sky-50 text-sky-800 border-sky-200' },
  JOBS_100: { label: '100 Jobs', Icon: Flame, className: 'bg-rose-50 text-rose-800 border-rose-200' },
  RELIABLE_PROVIDER: { label: 'Reliable', Icon: CalendarCheck, className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  MULTI_SERVICE_EXPERT: { label: 'Multi-Service Expert', Icon: Gem, className: 'bg-violet-50 text-violet-800 border-violet-200' },
  CUSTOMER_FAVORITE: { label: 'Customer Favorite', Icon: Heart, className: 'bg-pink-50 text-pink-800 border-pink-200' },
  ELITE_PROVIDER: { label: 'Elite Provider', Icon: Award, className: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
};

const normalizeBadges = (badges = []) => (
  badges
    .map((badge) => (typeof badge === 'string' ? { badgeType: badge } : badge))
    .filter((badge) => badge?.badgeType && badgeMeta[badge.badgeType])
);

export function VerificationLevelPill({ provider, dark = false }) {
  const level = provider?.verificationLevel || 'BRONZE';
  const meta = levelMeta[level] || levelMeta.BRONZE;
  const Icon = meta.Icon;
  const className = dark
    ? 'bg-white/10 text-white border-white/15'
    : meta.className;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase ${className}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

export function ReputationBadgeStrip({ badges, limit = 3, dark = false }) {
  const visibleBadges = normalizeBadges(badges).slice(0, limit);
  if (!visibleBadges.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleBadges.map((badge) => {
        const meta = badgeMeta[badge.badgeType];
        const Icon = meta.Icon;
        const className = dark
          ? 'bg-white/10 text-slate-100 border-white/15'
          : meta.className;

        return (
          <span
            key={badge.badgeType}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold ${className}`}
          >
            <Icon className="w-3 h-3" />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

export function AchievementList({ badges }) {
  const visibleBadges = normalizeBadges(badges);

  if (!visibleBadges.length) {
    return (
      <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        Achievements unlock automatically after enough completed jobs, reviews, services, and reliability history.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {visibleBadges.map((badge) => {
        const meta = badgeMeta[badge.badgeType];
        const Icon = meta.Icon;
        const earned = badge.awardedAt ? new Date(badge.awardedAt).toLocaleDateString('en-IN', {
          month: 'short',
          year: 'numeric'
        }) : null;

        return (
          <div key={badge.badgeType} className="border border-slate-200 rounded-2xl p-4 bg-white">
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-xl border flex items-center justify-center ${meta.className}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div>
                <div className="text-sm font-black text-slate-900">{meta.label}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  {earned ? `Earned ${earned}` : 'Automatically awarded'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
