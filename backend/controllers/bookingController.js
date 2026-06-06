import { BookingModel } from '../models/bookingModel.js';
import { NotificationModel } from '../models/notificationModel.js';

export const BookingController = {
  getAll: async (req, res) => {
    try {
      const bookings = await BookingModel.getAll();
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve active/historical bookings', details: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await BookingModel.getById(id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      res.json(booking);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch booking details', details: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const bookingData = req.body;
      if (!bookingData.customerId || !bookingData.providerId || !bookingData.serviceCategory) {
        return res.status(400).json({ error: 'Missing critical booking components (customerId, providerId, serviceCategory)' });
      }

      // Format custom fields and invoice ID
      const timestamp = new Date().toISOString();
      const randomInvoiceId = `SG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

      const booking = {
        id: bookingId,
        customerId: bookingData.customerId,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        providerId: bookingData.providerId,
        providerName: bookingData.providerName,
        providerAvatar: bookingData.providerAvatar,
        serviceCategory: bookingData.serviceCategory,
        bookingDate: bookingData.bookingDate,
        bookingTimeSlot: bookingData.bookingTimeSlot,
        status: 'pending',
        paymentStatus: bookingData.paymentStatus || 'unpaid',
        paymentMethod: bookingData.paymentMethod || null,
        locationAddress: bookingData.locationAddress,
        city: bookingData.city || 'Hyderabad',
        instructions: bookingData.instructions || '',
        totalAmount: Number(bookingData.totalAmount),
        tax: Number(bookingData.tax || Math.round(Number(bookingData.totalAmount) * 0.05)),
        serviceFee: Number(bookingData.serviceFee || 30),
        invoiceNumber: randomInvoiceId,
        bookingTime: timestamp,
        messages: [],
        reviewed: 0,
        statusHistory: [
          { status: 'pending', timestamp, note: 'Booking created by customer' }
        ]
      };

      const result = await BookingModel.create(booking);

      // Add automated system notification for the provider!
      await NotificationModel.create({
        userId: booking.providerId,
        role: 'provider',
        title: 'New Service Job Request',
        message: `You have received a new ${booking.serviceCategory} request from ${booking.customerName} on ${booking.bookingDate}.`,
        type: 'booking'
      });

      // Global socket dispatch for real-time dashboards
      const io = req.app.get('socketio');
      if (io) {
        io.emit('newJobLead', result);
      }

      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to lock in service booking', details: err.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'A valid service status string is required.' });
      }

      const updated = await BookingModel.updateStatus(id, status, note);

      // Create a notification for the customer about status change
      await NotificationModel.create({
        userId: updated.customerId,
        role: 'customer',
        title: 'Booking Status Updated',
        message: `Your booking for ${updated.serviceCategory} has been updated to "${status}".`,
        type: 'booking'
      });

      // Global socket push
      const io = req.app.get('socketio');
      if (io) {
        io.emit('bookingUpdated', updated);
      }

      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  addMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { senderId, senderName, senderRole, text } = req.body;

      if (!senderId || !text) {
        return res.status(400).json({ error: 'Sender details and message contents are required.' });
      }

      const messageObj = {
        id: `msg_${Math.random().toString(36).substring(2, 9)}`,
        senderId,
        senderName,
        senderRole,
        text,
        timestamp: new Date().toISOString()
      };

      const booking = await BookingModel.addMessage(id, messageObj);

      // Global socket dispatch
      const io = req.app.get('socketio');
      if (io) {
        io.emit('chatMessageReceived', { bookingId: id, message: messageObj });
      }

      res.status(201).json(messageObj);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
