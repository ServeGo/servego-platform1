import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';

const USER_SAFE_SELECT = {
  id: true, name: true, email: true, phone: true, role: true,
  avatar: true, status: true, profileComplete: true, address: true, pincode: true,
  referralCode: true, referredBy: true, referralsCount: true,
  referralDiscountBalance: true, referralBonusEarned: true,
  providerId: true, createdAt: true, updatedAt: true,
};

const USER_INCLUDE_PROFILES = {
  customerProfile: true,
  providerProfile: true,
};

export const UserRepository = {
  findById: (id, select) => prisma.user.findUnique({ where: { id }, select }),
  findByIdWithProfiles: (id) => prisma.user.findUnique({ where: { id }, select: { ...USER_SAFE_SELECT, ...USER_INCLUDE_PROFILES } }),
  findByEmail: (email, include) => prisma.user.findUnique({ where: { email }, include }),
  findFirst: (where, select, include) => prisma.user.findFirst({ where, select, include }),
  findMany: (args) => prisma.user.findMany(args),
  count: (where) => prisma.user.count({ where }),
  create: (data) => prisma.user.create({ data }),
  update: (id, data, include) => prisma.user.update({ where: { id }, data, include }),
  updateByWhere: (where, data) => prisma.user.update({ where, data }),
  hashPassword: (password) => bcrypt.hash(password, 12),
  comparePassword: (password, hash) => bcrypt.compare(password, hash),

  createCustomerProfile: (data) => prisma.customer.create({ data }),
  updateCustomerProfile: (id, data) => prisma.customer.update({ where: { id }, data }),

  createAuthEvent: (data) => prisma.authEvent.create({ data }),

  getSafeUser: (user) => {
    if (!user) return null;
    const { password: _, ...safe } = user;
    return safe;
  },

  $transaction: (fn) => prisma.$transaction(fn),

  USER_SAFE_SELECT,
  USER_INCLUDE_PROFILES,
};
