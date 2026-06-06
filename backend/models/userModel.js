import { query, run, get } from '../config/db.js';

export const UserModel = {
  getAll: async () => {
    return await query(`SELECT * FROM users`);
  },

  getById: async (id) => {
    return await get(`SELECT * FROM users WHERE id = ?`, [id]);
  },

  getByEmail: async (email) => {
    return await get(`SELECT * FROM users WHERE email = ?`, [email]);
  },

  create: async ({ id, name, email, phone, role, password, avatar, address = null, pincode = null, referralCode, referralDiscountBalance = 0, referralsCount = 0 }) => {
    const joinedDate = new Date().toISOString().split('T')[0];
    await run(`
      INSERT INTO users (id, name, email, phone, role, joinedDate, avatar, status, password, address, pincode, referralCode, referralsCount, referralDiscountBalance)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
    `, [id, name, email, phone, role, joinedDate, avatar, password, address, pincode, referralCode, referralsCount, referralDiscountBalance]);
    return await UserModel.getById(id);
  },

  update: async (id, fields) => {
    const keys = Object.keys(fields);
    if (keys.length === 0) return await UserModel.getById(id);
    
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => fields[k]);
    values.push(id);

    await run(`UPDATE users SET ${setClause} WHERE id = ?`, values);
    return await UserModel.getById(id);
  }
};
