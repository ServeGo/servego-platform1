import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Building2, User, Phone, Mail, CreditCard, FileCheck, Tag, CheckCircle } from 'lucide-react';
import { SERVICE_CATEGORIES } from '../data';

export default function BecomePartner({ onNavigate }) {
  const { currentUser } = useApp();

  const [businessType, setBusinessType] = useState('individual');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: currentUser?.email || '',
    pan: '',
    gst: '',
    category: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const valueProps = [
    {
      icon: CreditCard,
      title: 'Transparent Payouts',
      description: 'Get clear, upfront pricing with no hidden deductions. Track all earnings in real-time.',
    },
    {
      icon: Tag,
      title: 'Lead Generation',
      description: 'Access a steady stream of qualified customer leads in your area.',
    },
    {
      icon: Building2,
      title: 'Business Insurance',
      description: 'Comprehensive insurance coverage for every job you complete through ServeGo.',
    },
    {
      icon: FileCheck,
      title: 'Training & Certification',
      description: 'Free skill development programs and industry-recognized certifications.',
    },
  ];

  const stats = [
    { label: 'Active Providers', value: '200+' },
    { label: 'Avg Monthly Earnings', value: '₹45,000' },
    { label: 'Satisfaction Rate', value: '98%' },
  ];

  return (
    <div className="bg-[#f4f8fb] min-h-screen">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* Hero */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Grow your business
            <br />
            <span className="bg-gradient-to-r from-sky-500 to-teal-400 bg-clip-text text-transparent">
              with ServeGo
            </span>
          </h1>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            Join our network of verified professionals and reach thousands of
            customers in your area.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-sky-500">{stat.value}</div>
                <div className="text-xs md:text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-10">
            Why Partner with Us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((prop) => (
              <div key={prop.title} className="enterprise-card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
                  <prop.icon className="w-6 h-6 text-sky-500" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{prop.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration form */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">
            Register as a Partner
          </h2>

          {submitted ? (
            <div className="enterprise-card p-8 text-center enterprise-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h3>
              <p className="text-sm text-slate-500 mb-6">
                We&apos;ll review your application and get back to you within 2-3 business days.
              </p>
              <button
                onClick={() => onNavigate && onNavigate('home')}
                className="enterprise-btn-primary"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="enterprise-card p-6 space-y-5">
              {/* Business type toggle */}
              <div>
                <label className="enterprise-label mb-2 block">Business Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBusinessType('individual')}
                    className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                      businessType === 'individual'
                        ? 'bg-sky-400 text-slate-900 border-sky-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessType('business')}
                    className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                      businessType === 'business'
                        ? 'bg-sky-400 text-slate-900 border-sky-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    Business
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="enterprise-label flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4 text-sky-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="enterprise-input w-full"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="enterprise-label flex items-center gap-2 mb-1.5">
                  <Phone className="w-4 h-4 text-sky-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="enterprise-input w-full"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="enterprise-label flex items-center gap-2 mb-1.5">
                  <Mail className="w-4 h-4 text-sky-500" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="enterprise-input w-full"
                  required
                />
              </div>

              {/* PAN */}
              <div>
                <label className="enterprise-label flex items-center gap-2 mb-1.5">
                  <CreditCard className="w-4 h-4 text-sky-500" />
                  PAN Number
                </label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="enterprise-input w-full uppercase"
                  required
                />
              </div>

              {/* GST (business only) */}
              {businessType === 'business' && (
                <div>
                  <label className="enterprise-label flex items-center gap-2 mb-1.5">
                    <Building2 className="w-4 h-4 text-sky-500" />
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={formData.gst}
                    onChange={(e) => handleChange('gst', e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="enterprise-input w-full uppercase"
                  />
                </div>
              )}

              {/* Category */}
              <div>
                <label className="enterprise-label flex items-center gap-2 mb-1.5">
                  <Tag className="w-4 h-4 text-sky-500" />
                  Service Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="enterprise-input w-full"
                  required
                >
                  <option value="">Select a category</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="enterprise-btn-primary w-full py-3">
                Submit Application
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
