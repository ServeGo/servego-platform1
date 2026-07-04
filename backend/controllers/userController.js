import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';

export const UserController = {
  getUsers: async (req, res) => {
    try {
      const users = await prisma.user.findMany({
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
        }
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
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

      if (!name || !email || !phone || !role || !password) {
        return res.status(400).json({ error: 'Missing required signup parameters (name, email, phone, role, password)' });
      }

      if (!acceptedTerms) {
        return res.status(400).json({ error: 'You must agree to the Terms & Conditions to continue.' });
      }

      if (!confirmPassword) {
        return res.status(400).json({ error: 'Confirm Password is required.' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Password and Confirm Password must match.' });
      }

      if (role === 'customer') {
        if (!address || !pincode) {
          return res.status(400).json({ error: 'Address and pincode are required for customer signup.' });
        }
        if (!/^[0-9]{5,6}$/.test(String(pincode))) {
          return res.status(400).json({ error: 'Invalid pincode. Expected 5-6 digits.' });
        }
      } else if (role === 'provider') {
        if (!serviceInterested) {
          return res.status(400).json({ error: 'Service interested is required for provider signup.' });
        }
        if (!/^[A-Za-z\s]+$/.test(String(serviceInterested).trim())) {
          return res.status(400).json({ error: 'Please choose a valid service category.' });
        }
      } else {
        return res.status(400).json({ error: 'Signup role must be either customer or provider.' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please choose another email.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const referralCode = `SERVEGO-${role === 'provider' ? 'PRO' : 'CUST'}-${name.substring(0, 3).toUpperCase().replace(/\s/g, 'X')}${Math.floor(10 + Math.random() * 90)}`;
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&size=150`;

      const newUser = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          phone,
          role,
          password: hashedPassword,
          avatar,
          status: 'ACTIVE',
          address: role === 'customer' ? address : null,
          pincode: role === 'customer' ? pincode : null,
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
            address,
            pincode,
            preferences: []
          }
        });
      }

      if (role === 'provider') {
        providerProfile = await prisma.provider.create({
          data: {
            userId: newUser.id,
            category: serviceInterested,
            bio: `Experienced specialist offering high-quality professional home servicing in ${serviceInterested}.`,
            specialties: [`Emergency ${serviceInterested} Repair`, `Residential Installation`, `Routine Maintenance`],
            serviceAreas: ['Gachibowli', 'Madhapur', 'Kondapur', 'Jubilee Hills'],
            photo: photo || null,
            serviceInterested,
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
          success: true
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

      res.status(201).json({ success: true, user: safeUser });
    } catch (err) {
      console.error('Signup registration error:', err);
      res.status(500).json({ error: 'Server signup registration failed', details: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Please enter both your email address and password.' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          customerProfile: true,
          providerProfile: true
        }
      });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        await prisma.authEvent.create({
          data: {
            email: normalizedEmail,
            eventType: 'LOGIN',
            success: false
          }
        });
        return res.status(401).json({ error: 'Incorrect email address or password. Please verify and try again.' });
      }

      if (user.status !== 'ACTIVE') {
        // Structured response so frontend can show a clean “under review” state for providers/customers.
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
          success: true
        }
      });

      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server authentication login failed', details: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, address, pincode } = req.body;
      const user = await prisma.user.findUnique({ where: { id }, include: { customerProfile: true } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: name ?? user.name,
          phone: phone ?? user.phone,
          address: address ?? user.address,
          pincode: pincode ?? user.pincode
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
              address: address ?? user.customerProfile.address,
              pincode: pincode ?? user.customerProfile.pincode
            }
          });
        } else if (address && pincode) {
          await prisma.customer.create({
            data: {
              userId: user.id,
              address,
              pincode,
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
      res.status(500).json({ error: 'Failed to update user profile', details: err.message });
    }
  }
};
