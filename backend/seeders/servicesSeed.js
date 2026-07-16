/**
 * Seeds the Service catalog with default entries if the table is empty.
 * Data is defined inline so this seeder has no dependency on the frontend source.
 */
import prisma from '../prisma/client.js';

const DEFAULT_SERVICES = [
  { id: 'svc-1', name: 'Electrician',      description: 'Certified electricians for wiring, fixtures, switchboards, and power failures.',        popularIssues: ['Short circuit fixing', 'Fan installation', 'Switchboard repair', 'Complete home rewiring', 'Inverter setup'] },
  { id: 'svc-2', name: 'Plumber',          description: 'Expert plumbing for leakages, pipe blockages, taps, basin installs, and pumps.',         popularIssues: ['Tap leakage repair', 'Drain blockage removal', 'Water meter install', 'Bathroom fittings', 'Water tank repair'] },
  { id: 'svc-3', name: 'AC Repair',        description: 'Deep AC filter clean, gas charging, cooling restoration, and system installations.',      popularIssues: ['AC deep servicing', 'Gas leakage refill', 'Cooling troubleshooting', 'AC uninstallation', 'Noise correction'] },
  { id: 'svc-4', name: 'Home Cleaning',    description: 'Dusting, mopping, bathroom scrubbing, kitchen cleaning & trash handling.',               popularIssues: ['Regular 2BHK cleaning', 'Regular 3BHK cleaning', 'Kitchen deep scrubbing', 'Bathroom disinfection'] },
  { id: 'svc-5', name: 'Deep Cleaning',    description: 'Thorough sanitation, steam vacuuming, hard water stain removal, and sofa shampooing.',   popularIssues: ['Full villa deep cleaning', 'Sofa & carpet shampoo', 'Balcony pressure wash', 'Move-out thorough cleaning'] },
  { id: 'svc-6', name: 'Painting',         description: 'Premium wall texture, wall putty, interior/exterior painting with free masking service.', popularIssues: ['Single accent wall design', 'Full apartment painting', 'Waterproofing & crack filling', 'Wall stencil art'] },
  { id: 'svc-7', name: 'Appliance Repair', description: 'Quick diagnostics and genuine spare parts for washing machines, TVs, and refrigerators.', popularIssues: ['Washing machine spin issue', 'Refrigerator not-cooling', 'Microwave oven healing', 'Chimney filter cleanup'] },
  { id: 'svc-8', name: 'Carpentry',        description: 'Woodwork repairs, hinge replacement, custom wardrobe design, and alignment fixes.',       popularIssues: ['Door hinge replacement', 'Wardrobe latch repair', 'Custom shelves installation', 'Bed assembly / alignment'] },
  { id: 'svc-9', name: 'Home Maintenance', description: 'General handyman tasks, wall mounting, lock replacements, and minor repairs.',            popularIssues: ['TV wall mounting', 'Curtain rod installation', 'Door lock replacement', 'Mirror / painting hanging'] },
];

const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, '-');

export async function seedServicesIfEmpty() {
  const existing = await prisma.service.findMany();
  if (existing.length > 0) return;

  for (const svc of DEFAULT_SERVICES) {
    await prisma.service.create({
      data: {
        id: svc.id,
        name: svc.name,
        nameNormalized: normalize(svc.name),
        description: svc.description,
        popularIssues: svc.popularIssues || [],
      },
    });
  }

  console.info(`[seed] Seeded ${DEFAULT_SERVICES.length} services into Service catalog.`);
}
