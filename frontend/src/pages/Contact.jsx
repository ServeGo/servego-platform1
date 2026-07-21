import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, Mail, MapPin, Clock, Send, MessageSquare } from 'lucide-react';

export default function Contact({ onNavigate }) {
  const { currentUser, submitSupportTicket } = useApp();

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onNavigate && onNavigate('login');
      return;
    }
    setLoading(true);
    try {
      await submitSupportTicket(formData);
      setSubmitted(true);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f4f8fb] min-h-screen py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight text-center mb-10">
          Get in touch
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left panel - dark */}
          <div className="bg-slate-900 rounded-2xl p-8 text-white">
            <h2 className="text-xl font-bold mb-6">Contact Information</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Phone</p>
                  <p className="font-semibold">+91 1800-123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="font-semibold">support@servego.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Address</p>
                  <p className="font-semibold">123 Business Park, Sector 5<br />Mumbai, Maharashtra 400001</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Support Hours</p>
                  <p className="font-semibold">24/7 Customer Support</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - form */}
          <div className="enterprise-card p-8">
            {!currentUser && (
              <div className="bg-amber-50 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6 border border-amber-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                Please login to submit a support ticket.
              </div>
            )}

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-sm text-slate-500">
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="enterprise-label mb-1.5 block">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your name"
                    className="enterprise-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="enterprise-label mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="you@example.com"
                    className="enterprise-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="enterprise-label mb-1.5 block">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className="enterprise-input w-full"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="booking">Booking Issue</option>
                    <option value="payment">Payment Problem</option>
                    <option value="feedback">Feedback</option>
                    <option value="partner">Partner Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="enterprise-label mb-1.5 block">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Describe your issue or question..."
                    rows={5}
                    className="enterprise-input w-full resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !currentUser}
                  className="enterprise-btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
