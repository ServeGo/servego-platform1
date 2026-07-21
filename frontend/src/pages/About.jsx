import { Shield, Heart, Lock, Award, GraduationCap, Wrench, Paintbrush, Zap } from 'lucide-react';

export default function About() {
  const stats = [
    { label: 'Cities', value: '15+' },
    { label: 'Providers', value: '500+' },
    { label: 'Jobs Completed', value: '10,000+' },
    { label: 'Avg Rating', value: '4.8 ★' },
    { label: 'SLA Compliance', value: '98%' },
  ];

  const pillars = [
    {
      icon: Shield,
      title: 'Ironclad Safety Vetting',
      description:
        'Every provider goes through a rigorous multi-step verification including background checks, skill assessments, and identity verification before joining our platform.',
    },
    {
      icon: Heart,
      title: 'Partner First Philosophy',
      description:
        'We invest in our providers with training programs, insurance coverage, and fair pricing models that ensure sustainable livelihoods.',
    },
    {
      icon: Lock,
      title: 'Absolute Price Guard',
      description:
        'No hidden fees, no surge pricing. What you see is what you pay. Our transparent pricing model protects both customers and providers.',
    },
  ];

  const trainingCards = [
    {
      icon: Wrench,
      title: 'Technical Skills',
      desc: 'Hands-on training with modern tools and techniques',
    },
    {
      icon: GraduationCap,
      title: 'Safety Protocols',
      desc: 'Comprehensive safety procedures and best practices',
    },
    {
      icon: Paintbrush,
      title: 'Customer Service',
      desc: 'Communication skills and professional etiquette',
    },
    {
      icon: Zap,
      title: 'Quality Standards',
      desc: 'Our benchmarks for delivering exceptional service',
    },
  ];

  return (
    <div className="bg-[#f4f8fb] min-h-screen">
      {/* Hero */}
      <section className="py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Uncompromised Quality.
            <br />
            <span className="bg-gradient-to-r from-sky-500 to-teal-400 bg-clip-text text-transparent">
              At Your Command.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            ServeGo was founded with a simple mission: make professional home
            services accessible, reliable, and affordable for everyone. We connect
            you with verified experts who deliver quality work every time.
          </p>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-12">
            Our Foundation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="enterprise-card p-6">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mb-4">
                  <pillar.icon className="w-6 h-6 text-sky-500" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{pillar.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sky-500 font-semibold text-sm uppercase tracking-wider mb-2">
              Skills & Mastery
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Training Program
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Our comprehensive training ensures every provider meets the highest
              standards of quality and professionalism.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trainingCards.map((card) => (
              <div key={card.title} className="enterprise-card p-5 text-center">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mx-auto mb-3">
                  <card.icon className="w-5 h-5 text-teal-500" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{card.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
