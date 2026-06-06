import { ServiceModel } from '../models/serviceModel.js';

export const ServiceController = {
  getAll: async (req, res) => {
    try {
      const services = await ServiceModel.getAll();
      res.json(services);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch services', details: err.message });
    }
  },

  create: async (req, res) => {
    try {
      // Admin-only enforcement (current frontend passes currentUser.role)
      const role = req.body?.role;
      if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id, name, description, basePrice, popularIssues } = req.body;

      if (!name || !id) {
        return res.status(400).json({ error: 'Missing required fields: id, name' });
      }

      const created = await ServiceModel.create({
        id,
        name,
        description: description || '',
        basePrice: Number(basePrice ?? 0),
        popularIssues: Array.isArray(popularIssues) ? popularIssues : []
      });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create service', details: err.message });
    }
  },

  deleteOne: async (req, res) => {
    try {
      const role = req.body?.role;
      if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Missing service id' });

      const deleted = await ServiceModel.deleteById(id);
      if (!deleted) return res.status(404).json({ error: 'Service not found' });

      res.json({ success: true, deleted });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete service', details: err.message });
    }
  },

  updateOne: async (req, res) => {
    try {
      const role = req.body?.role;
      if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Missing service id' });

      const { name, description, basePrice, popularIssues } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Missing required fields: name' });

      const updated = await ServiceModel.updateById(id, {
        name,
        description: description || '',
        basePrice: basePrice === undefined ? 0 : Number(basePrice),
        popularIssues: Array.isArray(popularIssues) ? popularIssues : []
      });

      if (!updated) return res.status(404).json({ error: 'Service not found' });

      const service = await ServiceModel.getById(id);
      res.json({ success: true, service });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update service', details: err.message });
    }
  },

  hideOne: async (req, res) => {
    try {
      const role = req.body?.role;
      if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Missing service id' });

      const { isHidden } = req.body || {};
      const updated = await ServiceModel.setHiddenById(id, isHidden === true || isHidden === 1);
      if (!updated) return res.status(404).json({ error: 'Service not found' });

      const service = await ServiceModel.getById(id);
      res.json({ success: true, service });
    } catch (err) {
      res.status(500).json({ error: 'Failed to hide service', details: err.message });
    }
  }
};






