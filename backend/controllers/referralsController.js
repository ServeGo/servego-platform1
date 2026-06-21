import prisma from '../prisma/client.js';

const normalizeCode = (code) => (code || '').toString().trim();

export const ReferralsController = {
  applyReferral: async (req, res) => {
    try {
      const { userId, code } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing required field: userId' });
      if (!code) return res.status(400).json({ error: 'Missing required field: code' });

      const normalized = normalizeCode(code);
      const sponsor = await prisma.user.findUnique({
        where: { referralCode: normalized },
        select: { id: true, referralCode: true, referralsCount: true }
      });

      if (!sponsor) return res.status(404).json({ error: 'Invalid referral code' });

      if (sponsor.id === userId) {
        return res.status(400).json({ error: 'You cannot apply your own referral code.' });
      }

      // Prevent applying multiple times
      const applicant = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, referredBy: true } });
      if (!applicant) return res.status(404).json({ error: 'User not found' });
      if (applicant.referredBy) {
        return res.status(409).json({ error: 'Referral code already applied.' });
      }

      // Create/record referral relationship and immediate onboarding bonus credit.
      // (Your UI expects: referredBy, referredCount, bonusEarned)
      const BONUS_EARNED = 250;

      const result = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: applicant.id },
          data: { referredBy: sponsor.referralCode, referralBonusEarned: BONUS_EARNED }
        });

        await tx.user.update({
          where: { id: sponsor.id },
          data: { referralsCount: sponsor.referralsCount + 1 }
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

      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to apply referral code', details: err.message });
    }
  },

  getMeReferral: async (req, res) => {
    try {
      const userId = req.query?.userId;
      if (!userId) return res.status(400).json({ error: 'Missing required query param: userId' });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referredBy: true, referralCode: true, referralsCount: true, referralDiscountBalance: true, referralBonusEarned: true }
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        referredCount: user.referralsCount,
        bonusEarned: user.referralBonusEarned || 0,
        discountBalance: user.referralDiscountBalance || 0
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch referral info', details: err.message });
    }
  }
};

