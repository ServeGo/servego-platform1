import { UserModel } from '../models/userModel.js';
import { ProviderModel } from '../models/providerModel.js';

export const UserController = {
  getUsers: async (req, res) => {
    try {
      const users = await UserModel.getAll();
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
        return res
          .status(400)
          .json({ error: 'Missing required signup parameters (name, email, phone, role, password)' });
      }

      if (typeof acceptedTerms !== 'boolean' || !acceptedTerms) {
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
          return res
            .status(400)
            .json({ error: 'Address and pincode are required for customer signup.' });
        }
        if (!/^[0-9]{5,6}$/.test(String(pincode))) {
          return res.status(400).json({ error: 'Invalid pincode. Expected 5-6 digits.' });
        }
      }

      if (role === 'provider') {
        if (!serviceInterested) {
          return res.status(400).json({ error: 'service interseted is required for provider signup.' });
        }
      }

      const existingUser = await UserModel.getByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please choose another email.' });
      }

      // Generate a unique ID & referral code
      const id = role === 'provider' ? `p_${Math.floor(1000 + Math.random() * 9000)}` : `c_${Math.floor(1000 + Math.random() * 9000)}`;
      const refAbbrev = name.substring(0, 3).toUpperCase().replace(/\s/g, 'X');
      const referralCode = `SERVEGO-${role === 'provider' ? 'PRO' : 'CUST'}-${refAbbrev}${Math.floor(10 + Math.random() * 90)}`;

      // Default high-quality avatars based on role and initials
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&size=150`;

      // 1. Create User in SQLite
      const newUser = await UserModel.create({
        id,
        name,
        email,
        phone,
        role,
        password,
        avatar,
        address: role === 'customer' ? address : null,
        pincode: role === 'customer' ? pincode : null,
        referralCode,
        referralDiscountBalance: 0,
        referralsCount: 0
      });

      // 2. If registering as a provider, bootstrap their Provider table profile
      if (role === 'provider') {
        const cat = serviceInterested || 'Service Provider';
        await ProviderModel.create({
          id,
          name,
          email,
          phone,
          avatar,
          category: cat,
          rating: 4.8,
          reviewCount: 0,
          experienceYears: 3,
          jobsCompleted: 0,
          hourlyRate: cat.toLowerCase().includes('plumb') ? 280 : 350,
          bio: `Experienced specialist offering high-quality professional home servicing in ${cat}. Clean, certified, and fully background-vetted.`,
          specialties: [`Emergency ${cat} Repair`, `Residential Installation`, `Routine Maintenance`],
          serviceAreas: ['Gachibowli', 'Madhapur', 'Kondapur', 'Jubilee Hills'],
          photo: photo || null,
          serviceInterested: serviceInterested,
          isVerified: 1,
          isFeatured: 0,
          availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          timeSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'],
          earnings: 0
        });
      }

      res.status(201).json({ success: true, user: newUser });
    } catch (err) {
      res.status(500).json({ error: 'Server signup registration failed', details: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Please enter both your email address and password.' });
      }

      const user = await UserModel.getByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Incorrect email address or password. Please verify and try again.' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Your account is currently inactive or under safety review. Please contact support.' });
      }

      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ error: 'Server authentication login failed', details: err.message });
    }
  }
};
