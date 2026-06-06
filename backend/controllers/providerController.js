import { ProviderModel } from '../models/providerModel.js';
import { ReviewModel } from '../models/reviewModel.js';

export const ProviderController = {
  getAll: async (req, res) => {
    try {
      const providers = await ProviderModel.getAll();
      
      // Inject dynamically loaded reviews into each provider object for the frontend
      const hydratedProviders = await Promise.all(
        providers.map(async (p) => {
          const reviews = await ReviewModel.getForProvider(p.id);
          return {
            ...p,
            reviews: reviews || []
          };
        })
      );

      res.json(hydratedProviders);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch service partners', details: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await ProviderModel.getById(id);
      if (!provider) {
        return res.status(404).json({ error: 'Service provider not found' });
      }

      const reviews = await ReviewModel.getForProvider(id);
      provider.reviews = reviews || [];

      res.json(provider);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve provider details', details: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { bio, hourlyRate, specialties, serviceAreas } = req.body;

      const provider = await ProviderModel.getById(id);
      if (!provider) {
        return res.status(404).json({ error: 'Service provider profile missing' });
      }

      const updated = await ProviderModel.update(id, { bio, hourlyRate, specialties, serviceAreas });
      const reviews = await ReviewModel.getForProvider(id);
      updated.reviews = reviews || [];

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update partner profile', details: err.message });
    }
  },

  updateAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { availableDays, timeSlots } = req.body;

      const updated = await ProviderModel.update(id, { availableDays, timeSlots });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update calendar availability schedule', details: err.message });
    }
  },

  verify: async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      const updated = await ProviderModel.update(id, { isVerified: !!isVerified });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify provider credentials', details: err.message });
    }
  }
};
