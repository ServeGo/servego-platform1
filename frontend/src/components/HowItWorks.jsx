export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Book',
      description: 'Choose your service and select a time that works for you.',
    },
    {
      number: 2,
      title: 'Match',
      description: 'We connect you with a verified professional in your area.',
    },
    {
      number: 3,
      title: 'Done',
      description: 'Get your service completed with our quality guarantee.',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sky-500 font-semibold text-sm uppercase tracking-wider mb-2">
            Simple, Fast, Reliable
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            How It Works
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
          {/* Connector lines (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-sky-300 via-sky-400 to-teal-400" />

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center z-10"
            >
              {/* Number badge */}
              <div className="w-16 h-16 rounded-full bg-sky-400 flex items-center justify-center shadow-lg shadow-sky-200 mb-6">
                <span className="text-2xl font-extrabold text-white">{step.number}</span>
              </div>

              {/* Card */}
              <div className="enterprise-card w-full max-w-xs p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
