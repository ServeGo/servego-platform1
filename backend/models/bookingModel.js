import { query, run, get } from '../config/db.js';

export const BookingModel = {
  getAll: async () => {
    const rows = await query(`SELECT * FROM bookings ORDER BY bookingTime DESC`);
    return rows.map(r => ({
      ...r,
      messages: r.messages ? JSON.parse(r.messages) : [],
      statusHistory: r.statusHistory ? JSON.parse(r.statusHistory) : [],
      reviewed: r.reviewed === 1
    }));
  },

  getById: async (id) => {
    const r = await get(`SELECT * FROM bookings WHERE id = ?`, [id]);
    if (!r) return null;
    return {
      ...r,
      messages: r.messages ? JSON.parse(r.messages) : [],
      statusHistory: r.statusHistory ? JSON.parse(r.statusHistory) : [],
      reviewed: r.reviewed === 1
    };
  },

  create: async (booking) => {
    const id = booking.id || `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = booking.status || 'pending';
    const paymentStatus = booking.paymentStatus || 'unpaid';
    const bookingTime = booking.bookingTime || new Date().toISOString();
    const messagesStr = JSON.stringify(booking.messages || []);
    const historyStr = JSON.stringify(booking.statusHistory || [
      { status: 'pending', timestamp: bookingTime, note: 'Booking created by customer' }
    ]);

    await run(`
      INSERT INTO bookings (
        id, customerId, customerName, customerEmail, customerPhone,
        providerId, providerName, providerAvatar, serviceCategory,
        bookingDate, bookingTimeSlot, status, paymentStatus, paymentMethod,
        locationAddress, city, instructions, totalAmount, tax, serviceFee,
        invoiceNumber, bookingTime, messages, reviewed, statusHistory
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `, [
      id, booking.customerId, booking.customerName, booking.customerEmail, booking.customerPhone,
      booking.providerId, booking.providerName, booking.providerAvatar, booking.serviceCategory,
      booking.bookingDate, booking.bookingTimeSlot, status, paymentStatus, booking.paymentMethod,
      booking.locationAddress, booking.city, booking.instructions, booking.totalAmount,
      booking.tax || 0, booking.serviceFee || 0, booking.invoiceNumber, bookingTime,
      messagesStr, historyStr
    ]);

    return await BookingModel.getById(id);
  },

  updateStatus: async (id, status, note = '') => {
    const booking = await BookingModel.getById(id);
    if (!booking) throw new Error('Booking not found');

    const updatedHistory = [
      ...booking.statusHistory,
      { status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` }
    ];

    await run(`
      UPDATE bookings 
      SET status = ?, statusHistory = ?
      WHERE id = ?
    `, [status, JSON.stringify(updatedHistory), id]);

    return await BookingModel.getById(id);
  },

  updatePayment: async (id, paymentStatus, paymentMethod = null) => {
    await run(`
      UPDATE bookings
      SET paymentStatus = ?, paymentMethod = COALESCE(?, paymentMethod)
      WHERE id = ?
    `, [paymentStatus, paymentMethod, id]);

    return await BookingModel.getById(id);
  },

  addMessage: async (id, message) => {
    const booking = await BookingModel.getById(id);
    if (!booking) throw new Error('Booking not found');

    const updatedMessages = [...booking.messages, message];

    await run(`
      UPDATE bookings
      SET messages = ?
      WHERE id = ?
    `, [JSON.stringify(updatedMessages), id]);

    return await BookingModel.getById(id);
  },

  setReviewed: async (id) => {
    await run(`UPDATE bookings SET reviewed = 1 WHERE id = ?`, [id]);
    return await BookingModel.getById(id);
  }
};
