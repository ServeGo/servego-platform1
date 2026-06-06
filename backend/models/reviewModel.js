import { query, run, get } from '../config/db.js';

export const ReviewModel = {
  getAll: async () => {
    return await query(`SELECT * FROM reviews ORDER BY date DESC`);
  },

  getForProvider: async (providerId) => {
    return await query(`SELECT * FROM reviews WHERE providerId = ? ORDER BY date DESC`, [providerId]);
  },

  create: async ({ id, reviewerName, rating, comment, serviceCategory, providerId }) => {
    const reviewId = id || `r_${Math.random().toString(36).substring(2, 9)}`;
    const date = new Date().toISOString().split('T')[0];
    await run(`
      INSERT INTO reviews (id, reviewerName, rating, comment, date, serviceCategory, providerId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [reviewId, reviewerName, rating, comment, date, serviceCategory, providerId]);

    // Recalculate provider aggregate rating and update provider record
    const stats = await get(`
      SELECT AVG(rating) as avgRating, COUNT(*) as rCount 
      FROM reviews WHERE providerId = ?
    `, [providerId]);

    if (stats && stats.rCount > 0) {
      await run(`
        UPDATE providers
        SET rating = ?, reviewCount = ?
        WHERE id = ?
      `, [parseFloat(stats.avgRating.toFixed(2)), stats.rCount, providerId]);
    }

    return await get(`SELECT * FROM reviews WHERE id = ?`, [reviewId]);
  }
};
