import prisma from '../prisma/client.js';

export const ProviderController = {
  getAll: async (req, res) => {
    try {
      const providers = await prisma.provider.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatar: true }
          },
          reviews: true
        }
      });
      res.json(providers);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch service partners', details: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await prisma.provider.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatar: true }
          },
          reviews: true
        }
      });
      if (!provider) {
        return res.status(404).json({ error: 'Service provider not found' });
      }
      res.json(provider);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve provider details', details: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { bio, hourlyRate, specialties, serviceAreas } = req.body;

      const existing = await prisma.provider.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Service provider profile missing' });
      }

      const updated = await prisma.provider.update({
        where: { id },
        data: {
          bio,
          hourlyRate: hourlyRate !== undefined ? Number(hourlyRate) : existing.hourlyRate,
          specialties: Array.isArray(specialties) ? specialties : existing.specialties,
          serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : existing.serviceAreas
        },
        include: { reviews: true }
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update partner profile', details: err.message });
    }
  },

  updateAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { availableDays, timeSlots } = req.body;

      const updated = await prisma.provider.update({
        where: { id },
        data: {
          availableDays: Array.isArray(availableDays) ? availableDays : undefined,
          timeSlots: Array.isArray(timeSlots) ? timeSlots : undefined
        }
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update calendar availability schedule', details: err.message });
    }
  },

  verify: async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      const updated = await prisma.provider.update({
        where: { id },
        data: {
          isVerified: Boolean(isVerified)
        }
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify provider credentials', details: err.message });
    }
  }
};
