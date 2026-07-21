import { UserRepository } from '../repositories/user.repository.js';
import { AuthService } from '../services/auth.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const resetTokens = new Map();

function generateResetCode() {
  return crypto.randomInt(100000, 999999).toString();
}

export const UserController = {
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await UserRepository.findByEmail(normalizedEmail);
      if (!user) {
        return sendApiSuccess(res, 200, { message: 'If an account exists with this email, a reset code has been sent.' });
      }

      const code = generateResetCode();
      resetTokens.set(normalizedEmail, { code, expiresAt: Date.now() + 15 * 60 * 1000 });

      return sendApiSuccess(res, 200, {
        message: 'If an account exists with this email, a reset code has been sent.',
        resetToken: code,
      });
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to process password reset request');
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      const normalizedEmail = String(email).trim().toLowerCase();

      const stored = resetTokens.get(normalizedEmail);
      if (!stored || stored.code !== token) {
        return sendApiError(res, 400, 'INVALID_TOKEN', 'Invalid or incorrect reset code.');
      }
      if (Date.now() > stored.expiresAt) {
        resetTokens.delete(normalizedEmail);
        return sendApiError(res, 400, 'TOKEN_EXPIRED', 'Reset code has expired. Please request a new one.');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await UserRepository.updateByWhere({ email: normalizedEmail }, { password: hashedPassword });

      resetTokens.delete(normalizedEmail);

      return sendApiSuccess(res, 200, { message: 'Password reset successful. You can now sign in with your new password.' });
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to reset password');
    }
  },

  getUsers: async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return sendApiError(res, 403, 'FORBIDDEN', 'Admin access required.');
      }

      const { page = 1, limit = 50, role, status, search } = req.query;
      const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, Math.max(1, parseInt(limit)));

      const where = {};
      if (role) where.role = role;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        UserRepository.findMany({
          where,
          select: {
            id: true, name: true, email: true, phone: true, role: true,
            avatar: true, status: true, address: true, pincode: true,
            referralCode: true, referredBy: true, referralsCount: true,
            referralDiscountBalance: true, referralBonusEarned: true,
            profileComplete: true, providerId: true,
            createdAt: true, updatedAt: true,
            customerProfile: true, providerProfile: true
          },
          skip,
          take: Math.min(100, Math.max(1, parseInt(limit))),
          orderBy: { createdAt: 'desc' }
        }),
        UserRepository.count(where)
      ]);

      return sendApiSuccess(res, 200, {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / Math.min(100, Math.max(1, parseInt(limit))))
        }
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve users');
    }
  },

  register: async (req, res) => {
    try {
      const data = req.body;
      const result = await AuthService.register(data, { ip: req.ip, userAgent: req.get('user-agent') });
      return sendApiSuccess(res, 201, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Server signup registration failed');
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password, { ip: req.ip, userAgent: req.get('user-agent') });
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again later');
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to refresh token');
    }
  },

  getMe: async (req, res) => {
    try {
      const result = await AuthService.getMe(req.user.id);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch user profile');
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, address, pincode } = req.body;

      if (req.user?.role !== 'admin' && req.user?.id !== id) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only update your own profile.');
      }

      const user = await UserRepository.findByIdWithProfiles(id);
      if (!user) {
        return sendApiError(res, 404, 'USER_NOT_FOUND', 'User not found');
      }

      const updatedUser = await UserRepository.update(id, {
        name: name?.trim() ?? user.name,
        phone: phone?.trim() ?? user.phone,
        address: address?.trim() ?? user.address,
        pincode: pincode?.trim() ?? user.pincode
      }, { customerProfile: true, providerProfile: true });

      if (user.role === 'customer') {
        if (user.customerProfile) {
          await UserRepository.updateCustomerProfile(user.customerProfile.id, {
            address: address?.trim() ?? user.customerProfile.address,
            pincode: pincode?.trim() ?? user.customerProfile.pincode
          });
        } else if (address && pincode) {
          await UserRepository.createCustomerProfile({ userId: user.id, address: address.trim(), pincode: pincode.trim(), preferences: [] });
        }
      }

      const refreshed = await UserRepository.findByIdWithProfiles(id);
      const { password: __, ...safeUser } = refreshed;
      return sendApiSuccess(res, 200, { user: safeUser });
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update user profile');
    }
  }
};
