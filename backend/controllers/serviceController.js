import prisma from '../prisma/client.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

export const ServiceController = {
  getAll: async (req, res) => {
    try {
      const services = await prisma.service.findMany();
      return sendApiSuccess(res, 200, services);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch services', err.message);
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, popularIssues } = req.body;
      if (!name) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required field: name');
      }

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

      return sendApiSuccess(res, 201, created);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create service', err.message);
    }
  },

  deleteOne: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing service id');

      await prisma.service.delete({ where: { id } });
      return sendApiSuccess(res, 200, { message: 'Service deleted successfully' });
    } catch (err) {
      if (err.code === 'P2025') {
        return sendApiError(res, 404, 'NOT_FOUND', 'Service not found');
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to delete service', err.message);
    }
  },

  updateOne: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing service id');

      const { name, description, popularIssues } = req.body || {};
      if (!name) return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required field: name');

      const updated = await prisma.service.update({
        where: { id },
        data: {
          name,
          nameNormalized: normalize(name),
          description: description || '',
          popularIssues: Array.isArray(popularIssues) ? popularIssues : []
        }
      });


      return sendApiSuccess(res, 200, { service: updated });
    } catch (err) {
      if (err.code === 'P2025') {
        return sendApiError(res, 404, 'NOT_FOUND', 'Service not found');
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update service', err.message);
    }
  },

  hideOne: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing service id');

      const { isHidden } = req.body || {};
      const updated = await prisma.service.update({
        where: { id },
        data: {
          isHidden: isHidden === true || isHidden === 'true'
        }
      });

      return sendApiSuccess(res, 200, { service: updated });
    } catch (err) {
      if (err.code === 'P2025') {
        return sendApiError(res, 404, 'NOT_FOUND', 'Service not found');
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to hide service', err.message);
    }
  }
};






