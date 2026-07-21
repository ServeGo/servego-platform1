import { useState, useMemo } from 'react';
import { Search, Headphones, Shield, MessageCircle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ_DATA = [
  {
    category: 'Booking',
    questions: [
      {
        q: 'How do I book a service?',
        a: 'Browse our services, select a provider, choose your preferred date and time, and confirm the booking. You\'ll receive a confirmation notification immediately.',
      },
      {
        q: 'Can I reschedule or cancel a booking?',
        a: 'Yes, you can reschedule or cancel up to 4 hours before the scheduled time from your dashboard at no extra cost.',
      },
      {
        q: 'What happens if the provider doesn\'t show up?',
        a: 'We guarantee on-time service. If a provider is late, we\'ll assign an alternative professional and you may receive a discount on your booking.',
      },
    ],
  },
  {
    category: 'Pricing',
    questions: [
      {
        q: 'How is pricing calculated?',
        a: 'Our pricing is transparent and based on service type, complexity, and duration. You\'ll see the full price breakdown before confirming your booking.',
      },
      {
        q: 'Are there any hidden fees?',
        a: 'No, we believe in absolute price transparency. The price you see at checkout is the final price you pay.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'If you\'re unsatisfied with the service, contact us within 24 hours and we\'ll review your case for a full or partial refund.',
      },
    ],
  },
  {
    category: 'Providers',
    questions: [
      {
        q: 'Are providers verified?',
        a: 'Every provider undergoes rigorous background checks, skill assessments, and identity verification before joining our platform.',
      },
      {
        q: 'What if I\'m not satisfied with the service?',
        a: 'Contact our support team and we\'ll arrange for the provider to revisit at no extra charge, or assign a different professional.',
      },
    ],
  },
  {
    category: 'Account',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click "Sign Up" and register with your email or phone number. You\'ll receive a verification code to complete registration.',
      },
      {
        q: 'How do loyalty rewards work?',
        a: 'Every booking earns you loyalty points. As you accumulate points, you unlock Bronze, Silver, Gold, and Platinum tiers with increasing benefits.',
      },
    ],
  },
];

const QUICK_LINKS = [
  { icon: Headphones, title: '24/7 Support', description: 'Round the clock assistance' },
  { icon: Shield, title: 'Secure Service', description: 'Verified professionals' },
  { icon: MessageCircle, title: 'Live Chat', description: 'Instant help available' },
];

export default function FAQ({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;
    const q = searchQuery.toLowerCase();
    return FAQ_DATA.map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.questions.length > 0);
  }, [searchQuery]);

  const toggleFaq = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="bg-[#f4f8fb] min-h-screen py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-slate-500 text-lg">
            Find answers to common questions about our services
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for answers..."
            className="enterprise-input w-full pl-12 pr-4 py-3.5 text-base"
          />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {QUICK_LINKS.map((link) => (
            <div
              key={link.title}
              className="enterprise-card p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                <link.icon className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{link.title}</h4>
                <p className="text-xs text-slate-500">{link.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ accordion */}
        <div className="space-y-8">
          {filteredFaqs.map((cat, catIdx) => (
            <div key={cat.category}>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-500" />
                {cat.category}
              </h3>
              <div className="space-y-2">
                {cat.questions.map((item, qIdx) => {
                  const isOpen = openIndex === `${catIdx}-${qIdx}`;
                  return (
                    <div
                      key={qIdx}
                      className="enterprise-card overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(catIdx, qIdx)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <span className="font-semibold text-slate-900 text-sm pr-4">
                          {item.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3 enterprise-fade-in">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredFaqs.length === 0 || filteredFaqs.every((c) => c.questions.length === 0) ? (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No results found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-16 enterprise-card p-8 text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Still need assistance?
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Our support team is here to help you with any questions.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('contact')}
            className="enterprise-btn-primary px-6 py-2.5"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
