import prisma from '../prisma/client.js';
import { refreshProviderReputation } from '../services/providerReputationService.js';

export const BookingController = {
  getAll: async (req, res) => {
    try {
      const bookings = await prisma.booking.findMany({
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          provider: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }
            }
          },
          service: true,
          payment: true
        }
      });
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve active/historical bookings', details: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          provider: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }
            }
          },
          service: true,
          payment: true
        }
      });
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

      const timestamp = new Date().toISOString();
      const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

      const result = await prisma.booking.create({
        data: {
          id: bookingId,
          customerId: bookingData.customerId,
          providerId: bookingData.providerId,
          serviceCategory: bookingData.serviceCategory,
          bookingDate: bookingData.bookingDate,
          bookingTimeSlot: bookingData.bookingTimeSlot,
          status: 'PENDING',
          paymentStatus: bookingData.paymentStatus?.toUpperCase() || 'UNPAID',
          paymentMethod: bookingData.paymentMethod || null,
          locationAddress: bookingData.locationAddress,
          city: bookingData.city || 'Hyderabad',
          instructions: bookingData.instructions || '',
          bookingTime: timestamp,

          messages: [],

          reviewed: false,
          statusHistory: [
            { status: 'PENDING', timestamp, note: 'Booking created by customer' }
          ]
        }
      });


      await prisma.notification.create({
        data: {
          userId: bookingData.providerId,
          title: 'New Service Job Request',
          message: `You have received a new ${bookingData.serviceCategory} request from ${bookingData.customerName || 'a customer'} on ${bookingData.bookingDate}.`,
          type: 'BOOKING',
          isRead: false
        }
      });

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

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      const updatedStatus = status.toUpperCase();
      const newHistory = [...(booking.statusHistory || []), {
        status: updatedStatus,
        timestamp: new Date().toISOString(),
        note: note || `Status changed to ${updatedStatus}`
      }];

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: updatedStatus,
          statusHistory: newHistory
        }
      });

      await refreshProviderReputation(booking.providerId);

      await prisma.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Booking Status Updated',
          message: `Your booking for ${booking.serviceCategory} has been updated to "${updatedStatus}".`,
          type: 'BOOKING',
          isRead: false
        }
      });

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

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      const messageObj = {
        id: `msg_${Math.random().toString(36).substring(2, 9)}`,
        senderId,
        senderName,
        senderRole,
        text,
        timestamp: new Date().toISOString()
      };

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          messages: [ ...(booking.messages || []), messageObj ]
        }
      });

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
