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
          referralsCount: true,
          referralDiscountBalance: true,
          createdAt: true,
          updatedAt: true
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
      } else {
        return res.status(400).json({ error: 'Signup role must be either customer or provider.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please choose another email.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const referralCode = `SERVEGO-${role === 'provider' ? 'PRO' : 'CUST'}-${name.substring(0, 3).toUpperCase().replace(/\s/g, 'X')}${Math.floor(10 + Math.random() * 90)}`;
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&size=150`;

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
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

      if (role === 'provider') {
        await prisma.provider.create({
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
      }

      await prisma.authEvent.create({
        data: {
          userId: newUser.id,
          email: newUser.email,
          eventType: 'SIGNUP',
          success: true
        }
      });

      const { password: _, ...safeUser } = newUser;
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

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        await prisma.authEvent.create({
          data: {
            email,
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
  }
};
