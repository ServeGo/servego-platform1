import { query, run, get } from '../config/db.js';

export const ServiceModel = {
  getAll: async () => {
    const rows = await query(`SELECT * FROM services ORDER BY createdAt DESC`);
    return rows.map((r) => ({
      ...r,
      popularIssues: r.popularIssues ? JSON.parse(r.popularIssues) : [],
      isHidden: r.isHidden === 1
    }));
  },

  getById: async (id) => {
    const r = await get(`SELECT * FROM services WHERE id = ?`, [id]);
    if (!r) return null;
    return {
      ...r,
      popularIssues: r.popularIssues ? JSON.parse(r.popularIssues) : [],
      isHidden: r.isHidden === 1
    };
  },

  create: async ({ id, name, description = '', basePrice = 0, popularIssues = [] }) => {
    await run(`
      INSERT INTO services (id, name, description, basePrice, popularIssues, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      name,
      description,
      basePrice,
      JSON.stringify(popularIssues),
      new Date().toISOString()
    ]);

    return await ServiceModel.getById(id);
  },

  deleteById: async (id) => {
    // SQLite returns changes count via run()
    const result = await run(`DELETE FROM services WHERE id = ?`, [id]);
    return result?.changes > 0;
  },

  updateById: async (id, { name, description = '', basePrice = 0, popularIssues = [] }) => {
    const result = await run(
      `UPDATE services
       SET name = ?, description = ?, basePrice = ?, popularIssues = ?
       WHERE id = ?`,
      [
        name,
        description,
        Number(basePrice ?? 0),
        JSON.stringify(Array.isArray(popularIssues) ? popularIssues : []),
        id
      ]
    );
    return result?.changes > 0;
  },

  setHiddenById: async (id, isHidden) => {
    const result = await run(
      `UPDATE services SET isHidden = ? WHERE id = ?`,
      [isHidden ? 1 : 0, id]
    );
    return result?.changes > 0;
  }
};





