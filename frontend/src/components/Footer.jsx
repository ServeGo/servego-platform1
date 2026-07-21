import React, { useState } from 'react';
import { Send, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export default function Footer({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleLinkClick = (page, categoryId = null) => {
    onNavigate(page, categoryId);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  const footerColumns = [
    {
      title: 'Company',
      links: [
        { label: 'About Us', page: 'about' },
        { label: 'Careers', page: 'about' },
        { label: 'Blog', page: 'about' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Cleaning', id: 'home-cleaning' },
        { label: 'Plumbing', id: 'plumber' },
        { label: 'Electrical', id: 'electrician' },
        { label: 'Painting', id: 'painting' },
        { label: 'AC Repair', id: 'ac-repair' },
        { label: 'Carpentry', id: 'carpentry' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', page: 'faq' },
        { label: 'Contact Us', page: 'contact' },
        { label: 'FAQ', page: 'faq' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', page: 'about' },
        { label: 'Privacy Policy', page: 'about' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Youtube, label: 'YouTube', href: '#' },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-10">
          {/* Brand column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                <span className="text-white font-extrabold text-xs leading-none">S</span>
              </div>
              <span className="font-extrabold text-white text-sm">ServeGo</span>
            </div>
            <p className="text-slate-400 text-[13px] leading-relaxed max-w-xs font-medium">
              Verified local experts at your doorstep within 60 minutes. Trusted, vetted, and safe home services.
            </p>
            <div className="flex gap-3">
              {['Safety', 'Insured', 'Verified'].map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className="md:col-span-2 space-y-3">
              <h5 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">{col.title}</h5>
              <div className="flex flex-col gap-2">
                {col.links.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.id) handleLinkClick('service-details', item.id);
                      else if (item.page) handleLinkClick(item.page);
                    }}
                    className="text-slate-400 hover:text-white text-[13px] font-medium text-left transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="pt-8 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <h4 className="text-[13px] font-bold text-white mb-1">Stay updated</h4>
              <p className="text-[12px] text-slate-400 font-medium">Get the latest service tips and offers in your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="bg-slate-800 border border-slate-700 text-white text-[13px] px-4 py-2.5 rounded-l-lg rounded-r-none focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-slate-500 w-full sm:w-64"
              />
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-r-lg rounded-l-none font-bold text-[12px] flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Subscribe
              </button>
            </form>
          </div>
          {subscribed && (
            <p className="text-[12px] text-teal-400 font-semibold mb-4 enterprise-fade-in">Thanks for subscribing!</p>
          )}
        </div>

        {/* Social + bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[12px]">
            <span className="text-slate-500 font-medium">&copy; 2026 ServeGo. All rights reserved.</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-500 font-medium">Made with love in Hyderabad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
