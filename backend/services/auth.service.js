import { UserRepository } from '../repositories/user.repository.js';
import { ProviderRepository } from '../repositories/provider.repository.js';
import { generateTokenPair, verifyRefreshToken, isAuthBlocked, recordFailedAuthAttempt } from '../utils/auth.js';
import { validatePasswordStrength } from '../utils/validation.js';
import { BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, NotFoundError } from '../errors/ApiError.js';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index.js';

const googleClient = new OAuth2Client(config.googleClientId);

export const AuthService = {
  async register(data, reqMeta = {}) {
    const { name, email, phone, role, password, confirmPassword, address, pincode, photo, acceptedTerms } = data;

    if (!name || !email || !phone || !role || !password) {
      throw new BadRequestError('MISSING_FIELDS', 'Please fill in all required fields');
    }
    if (acceptedTerms !== true && acceptedTerms !== 'true' && acceptedTerms !== 1 && acceptedTerms !== '1') {
      throw new BadRequestError('TERMS_NOT_ACCEPTED', 'Please accept the Terms & Conditions to continue');
    }
    if (!confirmPassword) throw new BadRequestError('MISSING_FIELDS', 'Please confirm your password');
    if (password !== confirmPassword) throw new BadRequestError('PASSWORD_MISMATCH', 'Passwords do not match. Please try again.');

    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      throw new BadRequestError('WEAK_PASSWORD', 'Password must be at least 8 characters and include a lowercase letter and a number', passwordErrors);
    }

    if (role === 'customer') {
      if (!address || !pincode) throw new BadRequestError('MISSING_FIELDS', 'Please enter your address and pincode');
      if (!/^[0-9]{5,6}$/.test(String(pincode))) throw new BadRequestError('INVALID_PINCODE', 'Please enter a valid 5-6 digit pincode');
    } else if (role !== 'provider') {
      throw new BadRequestError('INVALID_ROLE', 'Please select either Customer or Provider as your account type');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    if (existingUser) throw new ConflictError('EMAIL_EXISTS', 'An account with this email already exists. Try logging in instead.');

    const hashedPassword = await UserRepository.hashPassword(password);
    const referralCode = `SERVEGO-${role === 'provider' ? 'PRO' : 'CUST'}-${name.substring(0, 3).toUpperCase().replace(/\s/g, 'X')}${Math.floor(10 + Math.random() * 90)}`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&size=150`;

    const newUser = await UserRepository.create({
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
      referralDiscountBalance: 0,
    });

    let customerProfile = null;
    let providerProfile = null;

    if (role === 'customer') {
      customerProfile = await UserRepository.createCustomerProfile({
        userId: newUser.id,
        address: address?.trim(),
        pincode: String(pincode).trim(),
        preferences: [],
      });
    }

    if (role === 'provider') {
      providerProfile = await ProviderRepository.create({
        userId: newUser.id,
        category: 'General',
        bio: 'Experienced specialist offering high-quality professional home servicing.',
        specialties: ['Residential Services', 'Routine Maintenance'],
        serviceAreas: ['Gachibowli', 'Madhapur', 'Kondapur', 'Jubilee Hills'],
        photo: photo || null,
        isVerified: false,
        isFeatured: false,
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'],
      });
      await UserRepository.update(newUser.id, { providerId: providerProfile.id });
    }

    await UserRepository.createAuthEvent({
      userId: newUser.id,
      email: newUser.email,
      eventType: 'SIGNUP',
      success: true,
      ip: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });

    const safeUser = {
      id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone,
      role: newUser.role, avatar: newUser.avatar, status: newUser.status,
      profileComplete: newUser.profileComplete, address: newUser.address, pincode: newUser.pincode,
      providerId: role === 'provider' ? providerProfile?.id || null : null,
      customerProfile, providerProfile,
      referralCode: newUser.referralCode, referredBy: newUser.referredBy,
      referralsCount: newUser.referralsCount, referralDiscountBalance: newUser.referralDiscountBalance,
      createdAt: newUser.createdAt, updatedAt: newUser.updatedAt,
    };

    const tokens = generateTokenPair(newUser);
    return { user: safeUser, ...tokens };
  },

  async login(identifier, password, reqMeta = {}) {
    if (!identifier || !password) throw new BadRequestError('MISSING_FIELDS', 'Please enter your email/phone and password');

    const clientIp = reqMeta.ip;
    if (isAuthBlocked(clientIp)) {
      throw new BadRequestError('AUTH_BLOCKED', 'Too many login attempts. Please try again after 15 minutes');
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const isEmail = normalizedIdentifier.includes('@');

    let user;
    if (isEmail) {
      user = await UserRepository.findByEmail(normalizedIdentifier, {
        customerProfile: true,
        providerProfile: true,
      });
    } else {
      const phoneClean = normalizedIdentifier.replace(/[\s\-+]/g, '');
      user = await UserRepository.findFirst(
        { phone: { contains: phoneClean } },
        undefined,
        { customerProfile: true, providerProfile: true }
      );
    }

    if (!user || !user.password) {
      await UserRepository.createAuthEvent({
        email: user?.email || normalizedIdentifier, eventType: 'LOGIN', success: false,
        ip: clientIp, userAgent: reqMeta.userAgent,
      });
      recordFailedAuthAttempt(clientIp);
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid credentials. Please check and try again.');
    }

    const isValidCredentials = await UserRepository.comparePassword(password, user.password);

    if (!isValidCredentials) {
      await UserRepository.createAuthEvent({
        email: user.email, eventType: 'LOGIN', success: false,
        ip: clientIp, userAgent: reqMeta.userAgent,
      });
      recordFailedAuthAttempt(clientIp);
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid credentials. Please check and try again.');
    }

    if (user.status !== 'ACTIVE') {
      const blockedReason = user.status === 'INACTIVE' || user.status === 'SUSPENDED' ? 'inactive_or_suspended' : 'under_review';
      throw new ForbiddenError('ACCOUNT_NOT_ACTIVE', 'Your account is not active. Please contact support for assistance');
    }
    if (user.role === 'provider' && user.providerProfile?.accountStatus === 'BLOCKED') {
      throw new ForbiddenError('PROVIDER_BLOCKED', 'This provider account has been blocked. Please contact support.');
    }

    await UserRepository.createAuthEvent({
      userId: user.id, email: user.email, eventType: 'LOGIN', success: true,
      ip: clientIp, userAgent: reqMeta.userAgent,
    });

    const safeUser = UserRepository.getSafeUser(user);
    const tokens = generateTokenPair(user);
    return { user: safeUser, ...tokens };
  },

  async googleLogin(googleToken, reqMeta = {}) {
    if (!googleToken) throw new BadRequestError('MISSING_FIELDS', 'Google token is required');

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: config.googleClientId,
      });
    } catch {
      throw new UnauthorizedError('INVALID_GOOGLE_TOKEN', 'Invalid Google authentication token');
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await UserRepository.findByEmail(email, {
      customerProfile: true,
      providerProfile: true,
    });

    if (!user) {
      user = await UserRepository.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        phone: '',
        role: 'customer',
        password: null,
        avatar: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=0F172A&color=fff&size=150`,
        status: 'ACTIVE',
        authProvider: 'google',
        googleId,
        referralCode: `SERVEGO-GOOGLE-${Math.floor(10 + Math.random() * 90)}`,
        referralsCount: 0,
        referralDiscountBalance: 0,
      });

      await UserRepository.createCustomerProfile({
        userId: user.id,
        address: '',
        pincode: '',
        preferences: [],
      });

      user = await UserRepository.findByEmail(email, {
        customerProfile: true,
        providerProfile: true,
      });

      await UserRepository.createAuthEvent({
        userId: user.id,
        email: user.email,
        eventType: 'SIGNUP',
        success: true,
        ip: reqMeta.ip,
        userAgent: reqMeta.userAgent,
      });
    } else {
      if (!user.googleId) {
        await UserRepository.update(user.id, { googleId, authProvider: 'google' });
      }

      if (user.status !== 'ACTIVE') {
        throw new ForbiddenError('ACCOUNT_NOT_ACTIVE', 'Your account is not active. Please contact support for assistance');
      }
    }

    await UserRepository.createAuthEvent({
      userId: user.id,
      email: user.email,
      eventType: 'GOOGLE_LOGIN',
      success: true,
      ip: reqMeta.ip,
      userAgent: reqMeta.userAgent,
    });

    const safeUser = UserRepository.getSafeUser(user);
    const tokens = generateTokenPair(user);
    return { user: safeUser, ...tokens };
  },

  async refreshToken(refreshToken) {
    if (!refreshToken) throw new BadRequestError('MISSING_TOKEN', 'Refresh token is required.');

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) throw new UnauthorizedError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');

    const user = await UserRepository.findById(decoded.id, { id: true, email: true, role: true, status: true });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError('ACCOUNT_INACTIVE', 'User account is not active.');

    return generateTokenPair(user);
  },

  async getMe(userId) {
    const user = await UserRepository.findByIdWithProfiles(userId);
    if (!user) throw new NotFoundError('NOT_FOUND', 'User not found.');
    return { user };
  },
};
