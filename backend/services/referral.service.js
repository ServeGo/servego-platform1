import { UserRepository } from '../repositories/user.repository.js';
import { BadRequestError, NotFoundError, ConflictError } from '../errors/ApiError.js';

const normalizeCode = (code) => (code || '').toString().trim();

export const ReferralService = {
  async applyReferral(code, userId) {
    if (!code) throw new BadRequestError('MISSING_FIELDS', 'Missing required field: code');

    const normalized = normalizeCode(code);
    const sponsor = await UserRepository.findFirst(
      { referralCode: normalized },
      { id: true, referralCode: true }
    );

    if (!sponsor) throw new NotFoundError('NOT_FOUND', 'Invalid referral code');

    if (sponsor.id === userId) {
      throw new BadRequestError('INVALID_REFERRAL', 'You cannot apply your own referral code.');
    }

    const applicant = await UserRepository.findById(userId, { id: true, referredBy: true });
    if (!applicant) throw new NotFoundError('NOT_FOUND', 'User not found');
    if (applicant.referredBy) {
      throw new ConflictError('DUPLICATE_ENTRY', 'Referral code already applied.');
    }

    const BONUS_EARNED = 250;

    const result = await UserRepository.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: applicant.id },
        data: { referredBy: sponsor.referralCode, referralBonusEarned: BONUS_EARNED }
      });

      await tx.user.update({
        where: { id: sponsor.id },
        data: { referralsCount: { increment: 1 } }
      });

      const sponsorUpdated = await tx.user.findUnique({
        where: { id: sponsor.id },
        select: { referralsCount: true, referralDiscountBalance: true }
      });

      return {
        referredBy: sponsor.referralCode,
        referredCount: sponsorUpdated.referralsCount,
        bonusEarned: BONUS_EARNED
      };
    });

    return result;
  },

  async getMeReferral(userId) {
    const user = await UserRepository.findById(userId, {
      referredBy: true, referralCode: true, referralsCount: true, referralDiscountBalance: true, referralBonusEarned: true
    });

    if (!user) throw new NotFoundError('NOT_FOUND', 'User not found');

    return {
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referredCount: user.referralsCount,
      bonusEarned: user.referralBonusEarned || 0,
      discountBalance: user.referralDiscountBalance || 0
    };
  },

  async generate(userId) {
    const user = await UserRepository.findById(userId, { referralCode: true, role: true, name: true });
    if (!user) throw new NotFoundError('NOT_FOUND', 'User not found');
    if (user.referralCode) return { referralCode: user.referralCode };

    const prefix = user.role === 'provider' ? 'PRO' : 'CUST';
    const code = `SERVEGO-${prefix}-${user.name.slice(0, 3).toUpperCase().replace(/\\s/g, 'X')}${Math.floor(100 + Math.random() * 900)}`;
    const updated = await UserRepository.update(userId, { referralCode: code }, { select: { referralCode: true } });
    return updated;
  }
};
