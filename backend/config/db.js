import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err);
  } else {
    console.log('✅ Connected to SQLite SQL database.');
  }
});

// Promisified SQL query interfaces
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const initDB = async () => {
  console.log('⚡ Bootstrapping Relational Schema Tables...');

  // 1. Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      role TEXT CHECK(role IN ('customer', 'provider', 'admin')) NOT NULL,
      joinedDate TEXT NOT NULL,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      password TEXT NOT NULL,
      address TEXT,
      pincode TEXT,
      referralCode TEXT,
      referralsCount INTEGER DEFAULT 0,
      referralDiscountBalance REAL DEFAULT 0
    )
  `);

  // 2. Providers Table
  await run(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      avatar TEXT,
      category TEXT NOT NULL,
      rating REAL DEFAULT 4.8,
      reviewCount INTEGER DEFAULT 1,
      experienceYears INTEGER DEFAULT 3,
      jobsCompleted INTEGER DEFAULT 15,
      hourlyRate INTEGER DEFAULT 300,
      bio TEXT,
      specialties TEXT, -- JSON Array
      serviceAreas TEXT,  -- JSON Array
      photo TEXT,
      serviceInterested TEXT,
      isVerified INTEGER DEFAULT 1, -- 0 or 1
      isFeatured INTEGER DEFAULT 0, -- 0 or 1
      availableDays TEXT, -- JSON Array
      timeSlots TEXT,     -- JSON Array
      earnings REAL DEFAULT 0
    )
  `);

  // 3. Bookings Table
  await run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerEmail TEXT,
      customerPhone TEXT,
      providerId TEXT NOT NULL,
      providerName TEXT NOT NULL,
      providerAvatar TEXT,
      serviceCategory TEXT NOT NULL,
      bookingDate TEXT NOT NULL,
      bookingTimeSlot TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'confirmed', 'ongoing', 'completed', 'cancelled')) DEFAULT 'pending',
      paymentStatus TEXT CHECK(paymentStatus IN ('pending', 'unpaid', 'paid')) DEFAULT 'unpaid',
      paymentMethod TEXT,
      locationAddress TEXT NOT NULL,
      city TEXT NOT NULL,
      instructions TEXT,
      totalAmount REAL NOT NULL,
      tax REAL DEFAULT 0,
      serviceFee REAL DEFAULT 0,
      invoiceNumber TEXT,
      bookingTime TEXT NOT NULL,
      messages TEXT DEFAULT '[]', -- JSON stringified array of messages
      reviewed INTEGER DEFAULT 0,  -- 0 or 1
      statusHistory TEXT DEFAULT '[]' -- JSON stringified status changes
    )
  `);

  // 4. Notifications Table
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      role TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      read INTEGER DEFAULT 0, -- 0 or 1
      type TEXT DEFAULT 'general'
    )
  `);

  // 5. Support Tickets Table
  await run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT CHECK(status IN ('open', 'resolved', 'closed')) DEFAULT 'open',
      date TEXT NOT NULL,
      response TEXT
    )
  `);

  // 6. Reviews Table (Relational review log)
  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      reviewerName TEXT NOT NULL,
      rating REAL NOT NULL,
      comment TEXT,
      date TEXT NOT NULL,
      serviceCategory TEXT,
      providerId TEXT NOT NULL
    )
  `);

  // 7. Services (Service Categories)
  await run(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      basePrice REAL DEFAULT 0,
      popularIssues TEXT DEFAULT '[]',
      isHidden INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);

  // Migration: add `isHidden` column to existing DBs where services table was created earlier
  try {
    const col = await get(`PRAGMA table_info(services)`);
    const hasIsHidden = Array.isArray(col)
      ? col.some((c) => c.name === 'isHidden')
      : false;

    // If PRAGMA result helper above doesn't return array in your sqlite wrapper,
    // fall back to direct query.
    if (!hasIsHidden) {
      await run(`ALTER TABLE services ADD COLUMN isHidden INTEGER DEFAULT 0`);
      console.log('✅ Migrated services table: added isHidden column');
    }
  } catch (e) {
    // If column already exists or migration not supported, ignore.
    if (typeof e?.message === 'string' && e.message.toLowerCase().includes('duplicate')) {
      console.log('ℹ️ services table already has isHidden column');
    }
  }


  // --- Seed initial data ---
  const usersCount = await get('SELECT COUNT(*) as count FROM users');
  if (usersCount.count === 0) {
    console.log('🌱 Seeding users database table...');
    const seedUsers = [
      {
        id: 'c_user',
        name: 'Anand Kumar',
        email: 'anand.kumar@gmail.com',
        phone: '9988776655',
        role: 'customer',
        joinedDate: '2025-10-10',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'active',
        password: 'password',
        referralCode: 'SERVEGO-CUST-ANA25',
        referralsCount: 2,
        referralDiscountBalance: 150
      },
      {
        id: 'c_user_meta',
        name: 'Purna Shekhar',
        email: 'purnashekhar2352@gmail.com',
        phone: '9876543210',
        role: 'customer',
        joinedDate: '2026-06-03',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        status: 'active',
        password: 'password',
        referralCode: 'SERVEGO-CUST-PUR95',
        referralsCount: 0,
        referralDiscountBalance: 0
      },
      {
        id: 'a_user',
        name: 'ServeGo Administrator',
        email: 'admin@servego.com',
        phone: '1800-419-8899',
        role: 'admin',
        joinedDate: '2025-01-01',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        status: 'active',
        password: 'password',
        referralCode: null,
        referralsCount: 0,
        referralDiscountBalance: 0
      },
      {
        id: 'p1',
        name: 'KSR Electricals (Srinivas Rao)',
        email: 'srinivas.ksr@servego.com',
        phone: '9848022311',
        role: 'provider',
        joinedDate: '2025-06-15',
        avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
        status: 'active',
        password: 'password',
        referralCode: 'SERVEGO-PRO-SRI11',
        referralsCount: 1,
        referralsEarningsBonus: 250
      },
      {
        id: 'p3',
        name: 'Super Leak-Fix Plumbers (Sanjay Kumar)',
        email: 'sanjay.plumb@servego.com',
        phone: '9966144889',
        role: 'provider',
        joinedDate: '2025-07-20',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        status: 'active',
        password: 'password',
        referralCode: 'SERVEGO-PRO-SAN89',
        referralsCount: 3,
        referralsEarningsBonus: 750
      },
      {
        id: 'p2',
        name: 'Rahim Electronics',
        email: 'rahim.elec@servego.com',
        phone: '9121087456',
        role: 'provider',
        joinedDate: '2025-08-01',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
        status: 'active',
        password: 'password',
        referralCode: 'SERVEGO-PRO-RAH56',
        referralsCount: 0,
        referralsEarningsBonus: 0
      }
    ];

    for (const u of seedUsers) {
      await run(`
        INSERT INTO users (id, name, email, phone, role, joinedDate, avatar, status, password, address, pincode, referralCode, referralsCount, referralDiscountBalance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [u.id, u.name, u.email, u.phone, u.role, u.joinedDate, u.avatar, u.status, u.password, u.address || null, u.pincode || null, u.referralCode, u.referralsCount, u.referralDiscountBalance]);
    }
  }

  const providersCount = await get('SELECT COUNT(*) as count FROM providers');
  if (providersCount.count === 0) {
    console.log('🌱 Seeding providers database table...');
    // Seed initial providers from data.js
    const seedProviders = [
      {
        id: 'p1',
        name: 'KSR Electricals (Srinivas Rao)',
        email: 'srinivas.ksr@servego.com',
        phone: '9848022311',
        avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
        category: 'Electrician',
        rating: 4.9,
        reviewCount: 32,
        experienceYears: 8,
        jobsCompleted: 345,
        hourlyRate: 350,
        bio: 'Professional licensed electrician trained under industrial standards. Specializes in residential troubleshooting, smart home switch conversions, and complex electrical diagnostics. Committed to speed and electrical safety.',
        specialties: JSON.stringify(['Smart Switches Setup', 'Inverter Repairs', 'Short Circuit Detection', '3-Phase Panel Wiring']),
        serviceAreas: JSON.stringify(['Gachibowli', 'Madhapur', 'Jubilee Hills', 'Kondapur', 'Kukatpally']),
        isVerified: 1,
        isFeatured: 1,
        availableDays: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
        timeSlots: JSON.stringify(['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM']),
        earnings: 68500
      },
      {
        id: 'p2',
        name: 'Rahim Electronics',
        email: 'rahim.elec@servego.com',
        phone: '9121087456',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
        category: 'Electrician',
        rating: 4.7,
        reviewCount: 18,
        experienceYears: 5,
        jobsCompleted: 112,
        hourlyRate: 300,
        bio: 'Punctual electrician specializing in energy-efficient lighting designs, emergency repairs, and power outages. Serving the wider Gachibowli community with immediate response times.',
        specialties: JSON.stringify(['Energy Saving LEDs', 'Fan & Geyser Installation', 'Switchboard Repair']),
        serviceAreas: JSON.stringify(['Gachibowli', 'Kondapur', 'Banjara Hills', 'Begumpet']),
        isVerified: 1,
        isFeatured: 0,
        availableDays: JSON.stringify(['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        timeSlots: JSON.stringify(['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']),
        earnings: 24700
      },
      {
        id: 'p3',
        name: 'Super Leak-Fix Plumbers (Sanjay Kumar)',
        email: 'sanjay.plumb@servego.com',
        phone: '9966144889',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        category: 'Plumber',
        rating: 4.85,
        reviewCount: 42,
        experienceYears: 6,
        jobsCompleted: 231,
        hourlyRate: 280,
        bio: 'Master Plumber Sanjay Kumar offers fast, premium leak diagnostics, pipe layouts, pressure pumps, and general toilet maintenance. Equipped with modern leak sonar detection kits.',
        specialties: JSON.stringify(['Leak Sonar Diagnostics', 'Internal Pipeline Repair', 'High-Pressure Booster Pumps', 'Clogged Drain Clearance']),
        serviceAreas: JSON.stringify(['Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Begumpet', 'Somajiguda']),
        isVerified: 1,
        isFeatured: 1,
        availableDays: JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        timeSlots: JSON.stringify(['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM']),
        earnings: 45000
      }
    ];

    for (const p of seedProviders) {
      await run(`
        INSERT INTO providers (id, name, email, phone, avatar, category, rating, reviewCount, experienceYears, jobsCompleted, hourlyRate, bio, specialties, serviceAreas, photo, serviceInterested, isVerified, isFeatured, availableDays, timeSlots, earnings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.id, p.name, p.email, p.phone, p.avatar, p.category, p.rating, p.reviewCount, p.experienceYears, p.jobsCompleted, p.hourlyRate, p.bio, p.specialties, p.serviceAreas, p.photo || null, p.serviceInterested || null, p.isVerified, p.isFeatured, p.availableDays, p.timeSlots, p.earnings]);
    }
  }

  const notificationsCount = await get('SELECT COUNT(*) as count FROM notifications');
  if (notificationsCount.count === 0) {
    console.log('🌱 Seeding notifications database table...');
    const seedNotifications = [
      {
        id: 'n1',
        userId: 'c_user',
        role: 'customer',
        title: 'Welcome to ServeGo',
        message: 'Book verified home experts in Hyderabad starting today. Get 10% off on your first booking using Code: FIRST10.',
        timestamp: '2026-06-03T10:00:00Z',
        read: 0,
        type: 'general'
      },
      {
        id: 'n2',
        userId: 'p1',
        role: 'provider',
        title: 'Account Active',
        message: 'Welcome Srinivas Rao! Your professional profile for KSR Electricals has been verified. Keep availability updated to receive nearby leads.',
        timestamp: '2026-06-02T12:00:00Z',
        read: 0,
        type: 'verification'
      }
    ];

    for (const n of seedNotifications) {
      await run(`
        INSERT INTO notifications (id, userId, role, title, message, timestamp, read, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [n.id, n.userId, n.role, n.title, n.message, n.timestamp, n.read, n.type]);
    }
  }

  const ticketsCount = await get('SELECT COUNT(*) as count FROM tickets');
  if (ticketsCount.count === 0) {
    console.log('🌱 Seeding support tickets table...');
    const seedTickets = [
      {
        id: 'TKT-201',
        name: 'Anand Kumar',
        email: 'anand.kumar@gmail.com',
        subject: 'Refund Question on cancelled booking',
        message: 'I would like to know if there are any charges if I cancel my booking 24 hours prior to the job. Please assist.',
        status: 'open',
        date: '2026-06-02',
        response: null
      },
      {
        id: 'TKT-202',
        name: 'KKS Electricals',
        email: 'kks@electricals.com',
        subject: 'Pincode expansion update',
        message: 'Can I add Miyapur and Bachupally to my work-service zones? They are not appearing under my selection list.',
        status: 'resolved',
        date: '2026-06-01',
        response: 'Hi We have now expanded operations into Gachibowli, Kukatpally and nearest zones. You can select them directly now.'
      }
    ];

    for (const t of seedTickets) {
      await run(`
        INSERT INTO tickets (id, name, email, subject, message, status, date, response)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [t.id, t.name, t.email, t.subject, t.message, t.status, t.date, t.response]);
    }
  }

  const reviewsCount = await get('SELECT COUNT(*) as count FROM reviews');
  if (reviewsCount.count === 0) {
    console.log('🌱 Seeding reviews table...');
    const seedReviews = [
      {
        id: 'r1_1',
        reviewerName: 'Rohan Sharma',
        rating: 5,
        comment: 'Excellent prompt service Came in 30 mins to Jubilee Hills and fixed the main trip load switch perfectly.',
        date: '2026-05-24',
        serviceCategory: 'Electrician',
        providerId: 'p1'
      },
      {
        id: 'r1_2',
        reviewerName: 'Prathyusha N',
        rating: 4.8,
        comment: 'Very careful and clean work. Installed 3 smart geyser panels efficiently.',
        date: '2026-05-12',
        serviceCategory: 'Electrician',
        providerId: 'p1'
      },
      {
        id: 'r2_1',
        reviewerName: 'Madhav G',
        rating: 4.6,
        comment: 'Fixed the faulty wiring in my kitchen cabinet within an hour. Highly professional.',
        date: '2026-05-19',
        serviceCategory: 'Electrician',
        providerId: 'p2'
      },
      {
        id: 'r3_1',
        reviewerName: 'Anand Kumar',
        rating: 4.9,
        comment: 'Sanjay detected the leak inside our drawing-room wall without breaking any tiles. Brilliant engineering',
        date: '2026-05-28',
        serviceCategory: 'Plumber',
        providerId: 'p3'
      }
    ];

    for (const r of seedReviews) {
      await run(`
        INSERT INTO reviews (id, reviewerName, rating, comment, date, serviceCategory, providerId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [r.id, r.reviewerName, r.rating, r.comment, r.date, r.serviceCategory, r.providerId]);
    }
  }

  const bookingsCount = await get('SELECT COUNT(*) as count FROM bookings');
  if (bookingsCount.count === 0) {
    console.log('🌱 Seeding bookings table...');
    const seedBookings = [
      {
        id: 'BK-1082',
        customerId: 'c_user',
        customerName: 'Anand Kumar',
        customerEmail: 'anand.kumar@gmail.com',
        customerPhone: '9988776655',
        providerId: 'p3',
        providerName: 'Super Leak-Fix Plumbers (Sanjay Kumar)',
        providerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        serviceCategory: 'Plumber',
        bookingDate: '2026-06-01',
        bookingTimeSlot: '11:00 AM',
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'UPI',
        locationAddress: 'Flat 402, Oakwood Apartments, Jubilee Hills Road 36',
        city: 'Hyderabad',
        instructions: 'Leaking tap underneath bathroom sink basin. Please call before arriving.',
        totalAmount: 280,
        tax: 14,
        serviceFee: 30,
        invoiceNumber: 'SG-2026-0112',
        bookingTime: '2026-05-31T15:30:00Z',
        messages: '[]',
        reviewed: 1,
        statusHistory: JSON.stringify([
          { status: 'pending', timestamp: '2026-05-31T15:30:00Z', note: 'Booking created by customer' },
          { status: 'confirmed', timestamp: '2026-05-31T16:00:00Z', note: 'Accepted by partner Sanjay Kumar' },
          { status: 'ongoing', timestamp: '2026-06-01T11:15:00Z', note: 'Partner is at the location. Work started.' },
          { status: 'completed', timestamp: '2026-06-01T12:05:00Z', note: 'Plumbing repair completed. Payment collected via UPI.' }
        ])
      },
      {
        id: 'BK-1083',
        customerId: 'c_user',
        customerName: 'Anand Kumar',
        customerEmail: 'anand.kumar@gmail.com',
        customerPhone: '9988776655',
        providerId: 'p1',
        providerName: 'KSR Electricals (Srinivas Rao)',
        providerAvatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
        serviceCategory: 'Electrician',
        bookingDate: '2026-06-04',
        bookingTimeSlot: '02:00 PM',
        status: 'pending',
        paymentStatus: 'unpaid',
        locationAddress: 'Flat 402, Oakwood Apartments, Jubilee Hills Road 36',
        city: 'Hyderabad',
        instructions: 'Ceiling fan regulator replacement. Need to fit new anchor plates.',
        totalAmount: 350,
        tax: 18,
        serviceFee: 30,
        invoiceNumber: 'SG-2026-0113',
        bookingTime: '2026-06-03T14:45:00Z',
        messages: '[]',
        reviewed: 0,
        statusHistory: JSON.stringify([
          { status: 'pending', timestamp: '2026-06-03T14:45:00Z', note: 'Booking created by customer' }
        ])
      }
    ];

    for (const b of seedBookings) {
      await run(`
        INSERT INTO bookings (id, customerId, customerName, customerEmail, customerPhone, providerId, providerName, providerAvatar, serviceCategory, bookingDate, bookingTimeSlot, status, paymentStatus, paymentMethod, locationAddress, city, instructions, totalAmount, tax, serviceFee, invoiceNumber, bookingTime, messages, reviewed, statusHistory)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [b.id, b.customerId, b.customerName, b.customerEmail, b.customerPhone, b.providerId, b.providerName, b.providerAvatar, b.serviceCategory, b.bookingDate, b.bookingTimeSlot, b.status, b.paymentStatus, b.paymentMethod, b.locationAddress, b.city, b.instructions, b.totalAmount, b.tax, b.serviceFee, b.invoiceNumber, b.bookingTime, b.messages, b.reviewed, b.statusHistory]);
    }
  }

  // Seed services if empty
  try {
    const { seedServicesIfEmpty } = await import('../seeders/servicesSeed.js');
    await seedServicesIfEmpty();
  } catch (e) {
    console.warn('⚠️ Services seeding skipped:', e.message);
  }

  console.log('✅ Relational SQL Database Schema fully operational!');
};


