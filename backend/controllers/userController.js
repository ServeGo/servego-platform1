import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import { generateTokenPair, verifyRefreshToken, isAuthBlocked, recordFailedAuthAttempt } from '../utils/auth.js';
import { sendApiError } from '../utils/response.js';
import { validatePasswordStrength } from '../utils/validation.js';

export const UserController = {
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
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
            status: true,
            address: true,
            pincode: true,
            referralCode: true,
            referredBy: true,
            referralsCount: true,
            referralDiscountBalance: true,
            referralBonusEarned: true,
            providerId: true,
            createdAt: true,
            updatedAt: true,
            customerProfile: true,
            providerProfile: true
          },
          skip,
          take: Math.min(100, Math.max(1, parseInt(limit))),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / Math.min(100, Math.max(1, parseInt(limit))))
        }
      });
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve users', err.message);
    }
  },

  register: async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        role,
        password,
        confirmPassword,
        address,
        pincode,
        photo,
        serviceInterested,
        acceptedTerms
      } = req.body;

      // Validation
      if (!name || !email || !phone || !role || !password) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required signup parameters (name, email, phone, role, password)');
      }

      if (!acceptedTerms) {
        return sendApiError(res, 400, 'TERMS_NOT_ACCEPTED', 'You must agree to the Terms & Conditions to continue.');
      }

      if (!confirmPassword) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Confirm Password is required.');
      }

      if (password !== confirmPassword) {
        return sendApiError(res, 400, 'PASSWORD_MISMATCH', 'Password and Confirm Password must match.');
      }

      // Password strength validation
      const passwordErrors = validatePasswordStrength(password);
      if (passwordErrors.length > 0) {
        return sendApiError(res, 400, 'WEAK_PASSWORD', 'Password does not meet security requirements', passwordErrors);
      }

      if (role === 'customer') {
        if (!address || !pincode) {
          return sendApiError(res, 400, 'MISSING_FIELDS', 'Address and pincode are required for customer signup.');
        }
        if (!/^[0-9]{5,6}$/.test(String(pincode))) {
          return sendApiError(res, 400, 'INVALID_PINCDE', 'Invalid pincode. Expected 5-6 digits.');
        }
      } else if (role !== 'provider') {
        return sendApiError(res, 400, 'INVALID_ROLE', 'Signup role must be either customer or provider.');
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        return sendApiError(res, 400, 'EMAIL_EXISTS', 'An account with this email address already exists. Please choose another email.');
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const referralCode = `SERVEGO-${role === 'provider' ? 'PRO' : 'CUST'}-${name.substring(0, 3).toUpperCase().replace(/\s/g, 'X')}${Math.floor(10 + Math.random() * 90)}`;
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&size=150`;

      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: String(phone).trim(),
          role,
          password: hashedPassword,
          avatar,
          status: 'ACTIVE',
          address: role === 'customer' ? (address?.trim() || null) : null,
          pincode: role === 'customer' ? String(pincode).trim() : null,
          referralCode,
          referralsCount: 0,
          referralDiscountBalance: 0
        }
      });

      let customerProfile = null;
      let providerProfile = null;

      if (role === 'customer') {
        customerProfile = await prisma.customer.create({
          data: {
            userId: newUser.id,
            address: address?.trim(),
            pincode: String(pincode).trim(),
            preferences: []
          }
        });
      }

      if (role === 'provider') {
        providerProfile = await prisma.provider.create({
          data: {
            userId: newUser.id,
            category: 'General',
            bio: 'Experienced specialist offering high-quality professional home servicing.',
            specialties: ['Residential Services', 'Routine Maintenance'],
            serviceAreas: ['Gachibowli', 'Madhapur', 'Kondapur', 'Jubilee Hills'],
            photo: photo || null,
            isVerified: true,
            isFeatured: false,
            availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            timeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM']
          }
        });

        await prisma.user.update({
          where: { id: newUser.id },
          data: { providerId: providerProfile.id }
        });
      }

      await prisma.authEvent.create({
        data: {
          userId: newUser.id,
          email: newUser.email,
          eventType: 'SIGNUP',
          success: true,
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      const safeUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        avatar: newUser.avatar,
        status: newUser.status,
        address: newUser.address,
        pincode: newUser.pincode,
        providerId: role === 'provider' ? providerProfile?.id || null : null,
        customerProfile: customerProfile,
        providerProfile: providerProfile,
        referralCode: newUser.referralCode,
        referredBy: newUser.referredBy,
        referralsCount: newUser.referralsCount,
        referralDiscountBalance: newUser.referralDiscountBalance,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };

      const tokens = generateTokenPair(newUser);

      res.status(201).json({ 
        success: true, 
        user: safeUser, 
        ...tokens 
      });
    } catch (err) {
      console.error('Signup registration error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Server signup registration failed', err.message);
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Please enter both your email address and password.');
      }

      const clientIp = req.ip || req.connection?.remoteAddress;
      if (isAuthBlocked(clientIp)) {
        return sendApiError(res, 429, 'AUTH_BLOCKED', 'Too many failed attempts. Please try again in 15 minutes.');
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          customerProfile: true,
          providerProfile: true
        }
      });

      const isValidCredentials = user && await bcrypt.compare(password, user.password);
      
      if (!isValidCredentials) {
        await prisma.authEvent.create({
          data: {
            email: normalizedEmail,
            eventType: 'LOGIN',
            success: false,
            ip: clientIp,
            userAgent: req.get('user-agent')
          }
        });
        
        recordFailedAuthAttempt(clientIp);
        
        return sendApiError(res, 401, 'INVALID_CREDENTIALS', 'Incorrect email address or password. Please verify and try again.');
      }

      if (user.status !== 'ACTIVE') {
        const blockedReason = user.status === 'INACTIVE' || user.status === 'SUSPENDED' ? 'inactive_or_suspended' : 'under_review';
        return res.status(403).json({
          success: false,
          error: 'Your account is currently under review. Please wait for approval.',
          blockedReason,
          needsReview: true
        });
      }

      await prisma.authEvent.create({
        data: {
          userId: user.id,
          email: user.email,
          eventType: 'LOGIN',
          success: true,
          ip: clientIp,
          userAgent: req.get('user-agent')
        }
      });

      const { password: _, ...safeUser } = user;
      const tokens = generateTokenPair(user);
      
      res.json({ success: true, user: safeUser, ...tokens });
    } catch (err) {
      console.error('Login error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Server authentication login failed', err.message);
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return sendApiError(res, 400, 'MISSING_TOKEN', 'Refresh token is required.');
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return sendApiError(res, 401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        return sendApiError(res, 401, 'ACCOUNT_INACTIVE', 'User account is not active.');
      }

      const tokens = generateTokenPair(user);

      res.json({ 
        success: true, 
        ...tokens 
      });
    } catch (err) {
      console.error('Token refresh error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to refresh token', err.message);
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, address, pincode } = req.body;

      if (req.user?.role !== 'admin' && req.user?.id !== id) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only update your own profile.');
      }

      const user = await prisma.user.findUnique({ where: { id }, include: { customerProfile: true } });
      if (!user) {
        return sendApiError(res, 404, 'USER_NOT_FOUND', 'User not found');
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: name?.trim() ?? user.name,
          phone: phone?.trim() ?? user.phone,
          address: address?.trim() ?? user.address,
          pincode: pincode?.trim() ?? user.pincode
        },
        include: {
          customerProfile: true,
          providerProfile: true
        }
      });

      if (user.role === 'customer') {
        if (user.customerProfile) {
          await prisma.customer.update({
            where: { id: user.customerProfile.id },
            data: {
              address: address?.trim() ?? user.customerProfile.address,
              pincode: pincode?.trim() ?? user.customerProfile.pincode
            }
          });
        } else if (address && pincode) {
          await prisma.customer.create({
            data: {
              userId: user.id,
              address: address.trim(),
              pincode: pincode.trim(),
              preferences: []
            }
          });
        }
      }

      const refreshed = await prisma.user.findUnique({
        where: { id },
        include: { customerProfile: true, providerProfile: true }
      });
      const { password: __, ...safeUser } = refreshed;
      res.json({ success: true, user: safeUser });
    } catch (err) {
      console.error('Failed to update user profile:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update user profile', err.message);
    }
  }
};
