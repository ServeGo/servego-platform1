import prisma from '../prisma/client.js';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

export const ServiceController = {
  getAll: async (req, res) => {
    try {
      const services = await prisma.service.findMany();
      res.json(services);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch services', details: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, popularIssues } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Missing required field: name' });
      }

      // Generate SID-101, SID-102, ... by finding the highest existing SID-xxx id
      const existing = await prisma.service.findMany({ select: { id: true } });
      const maxNum = existing.reduce((max, s) => {
        const m = s.id.match(/^SID-(\d+)$/);
        return m ? Math.max(max, parseInt(m[1], 10)) : max;
      }, 0);
      const newId = `SID-${maxNum + 1}`;

      const created = await prisma.service.create({
        data: {
          id: newId,
          name,
          nameNormalized: normalize(name),
          description: description || '',
          popularIssues: Array.isArray(popularIssues) ? popularIssues : []
        }
      });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create service', details: err.message });
    }
  },

  deleteOne: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Missing service id' });

      await prisma.service.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.status(500).json({ error: 'Failed to delete service', details: err.message });
    }
  },

  updateOne: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Missing service id' });

      const { name, description, popularIssues } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Missing required field: name' });

      const updated = await prisma.service.update({
        where: { id },
        data: {
          name,
          nameNormalized: normalize(name),
          description: description || '',
          popularIssues: Array.isArray(popularIssues) ? popularIssues : []
        }
      });


      res.json({ success: true, service: updated });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.status(500).json({ error: 'Failed to update service', details: err.message });
    }
  },

  hideOne: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Missing service id' });

      const { isHidden } = req.body || {};
      const updated = await prisma.service.update({
        where: { id },
        data: {
          isHidden: isHidden === true || isHidden === 'true'
        }
      });

      res.json({ success: true, service: updated });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.status(500).json({ error: 'Failed to hide service', details: err.message });
    }
  }
};






