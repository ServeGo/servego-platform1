import { SavedProRepository } from '../repositories/index.js';
import { ProviderRepository } from '../repositories/provider.repository.js';
import { BadRequestError, NotFoundError } from '../errors/ApiError.js';

export const SavedProService = {
  async getMine(userId) {
    return SavedProRepository.findMany({
      where: { customerId: userId },
      include: {
        provider: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
            badges: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async save(customerId, providerId) {
    if (!providerId) throw new BadRequestError('MISSING_FIELDS', 'providerId is required.');

    const providers = await ProviderRepository.findMany({
      where: { id: providerId, accountStatus: 'ACTIVE', isVerified: true, user: { status: 'ACTIVE' } },
      select: { id: true },
      take: 1
    });
    if (!providers[0]) throw new NotFoundError('NOT_FOUND', 'Provider not found.');

    return SavedProRepository.upsert(customerId, providerId);
  },

  async unsave(customerId, providerId) {
    await SavedProRepository.deleteMany({ customerId, providerId });
    return { message: 'Provider removed from saved list.' };
  }
};
