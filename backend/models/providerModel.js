import { query, run, get } from '../config/db.js';

export const ProviderModel = {
  getAll: async () => {
    const rows = await query(`SELECT * FROM providers`);
    return rows.map(r => ({
      ...r,
      specialties: r.specialties ? JSON.parse(r.specialties) : [],
      serviceAreas: r.serviceAreas ? JSON.parse(r.serviceAreas) : [],
      availableDays: r.availableDays ? JSON.parse(r.availableDays) : [],
      timeSlots: r.timeSlots ? JSON.parse(r.timeSlots) : [],
      isVerified: r.isVerified === 1,
      isFeatured: r.isFeatured === 1
    }));
  },

  getById: async (id) => {
    const r = await get(`SELECT * FROM providers WHERE id = ?`, [id]);
    if (!r) return null;
    return {
      ...r,
      specialties: r.specialties ? JSON.parse(r.specialties) : [],
      serviceAreas: r.serviceAreas ? JSON.parse(r.serviceAreas) : [],
      availableDays: r.availableDays ? JSON.parse(r.availableDays) : [],
      timeSlots: r.timeSlots ? JSON.parse(r.timeSlots) : [],
      isVerified: r.isVerified === 1,
      isFeatured: r.isFeatured === 1
    };
  },

  create: async ({ id, name, email, phone, avatar, category, rating = 4.8, reviewCount = 0, experienceYears = 3, jobsCompleted = 0, hourlyRate = 300, bio = '', specialties = [], serviceAreas = [], photo = null, serviceInterested = null, isVerified = 1, isFeatured = 0, availableDays = [], timeSlots = [], earnings = 0 }) => {
    await run(`
      INSERT INTO providers (id, name, email, phone, avatar, category, rating, reviewCount, experienceYears, jobsCompleted, hourlyRate, bio, specialties, serviceAreas, photo, serviceInterested, isVerified, isFeatured, availableDays, timeSlots, earnings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, email, phone, avatar, category, rating, reviewCount, experienceYears, jobsCompleted, hourlyRate, bio, JSON.stringify(specialties), JSON.stringify(serviceAreas), photo, serviceInterested, isVerified ? 1 : 0, isFeatured ? 1 : 0, JSON.stringify(availableDays), JSON.stringify(timeSlots), earnings]);
    return await ProviderModel.getById(id);
  },

  update: async (id, fields) => {
    const mutableFields = { ...fields };
    if (mutableFields.specialties) mutableFields.specialties = JSON.stringify(mutableFields.specialties);
    if (mutableFields.serviceAreas) mutableFields.serviceAreas = JSON.stringify(mutableFields.serviceAreas);
    if (mutableFields.availableDays) mutableFields.availableDays = JSON.stringify(mutableFields.availableDays);
    if (mutableFields.timeSlots) mutableFields.timeSlots = JSON.stringify(mutableFields.timeSlots);
    if (mutableFields.isVerified !== undefined) mutableFields.isVerified = mutableFields.isVerified ? 1 : 0;
    if (mutableFields.isFeatured !== undefined) mutableFields.isFeatured = mutableFields.isFeatured ? 1 : 0;

    const keys = Object.keys(mutableFields);
    if (keys.length === 0) return await ProviderModel.getById(id);

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => mutableFields[k]);
    values.push(id);

    await run(`UPDATE providers SET ${setClause} WHERE id = ?`, values);
    return await ProviderModel.getById(id);
  }
};
