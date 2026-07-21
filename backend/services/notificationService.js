import { NotificationRepository } from '../repositories/index.js';
import logger from '../utils/logger.js';

/**
 * Create a notification for a user
 */
async function createNotification(userId, title, message, type = 'SYSTEM') {
  try {
    const notification = await NotificationRepository.create({ userId, title, message, type, isRead: false });
    return notification;
  } catch (err) {
    logger.error(`[NotificationService] Failed to create notification for user ${userId}:`, err.message);
    return null;
  }
}

/**
 * Emit notification to user's room
 */
function emitToUserRoom(io, userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    if (event === 'notification') io.to(`user:${userId}`).emit('notification:new', { notificationId: data?.id, type: data?.type });
  }
}

/**
 * Notify about a new booking creation
 */
export async function notifyBookingCreated(io, booking, customer, providerUserId) {
  const notifications = [];

  if (providerUserId) {
    const providerNotif = await createNotification(
      providerUserId,
      'New Service Request',
      `You have a new ${booking.serviceCategory} request from ${customer?.name || 'a customer'}.`,
      'BOOKING'
    );
    notifications.push(providerNotif);
  }

  const customerNotif = await createNotification(
    customer?.id,
    'Booking Received',
    `Your ${booking.serviceCategory} booking is pending confirmation.`,
    'BOOKING'
  );
  notifications.push(customerNotif);

  // Emit real-time events
  if (io) {
    // Emit to provider's room if they have one
    if (providerUserId) {
      emitToUserRoom(io, providerUserId, 'newJobLead', booking);
      if (notifications[0]) {
        emitToUserRoom(io, providerUserId, 'notification', notifications[0]);
      }
    }
    // Emit to customer's room
    if (notifications[1]) {
      emitToUserRoom(io, customer?.id, 'notification', notifications[1]);
    }
  }
}

/**
 * Notify about booking status change
 */
export async function notifyBookingStatusChanged(io, booking, updatedStatus, providerUserId) {
  const notifications = [];

  const customerNotif = await createNotification(
    booking.customerId,
    'Booking Status Updated',
    `Your booking for ${booking.serviceCategory} has been updated to "${updatedStatus}".`,
    'BOOKING'
  );
  notifications.push(customerNotif);

  if (providerUserId) {
    const providerNotif = await createNotification(
      providerUserId,
      'Booking Update',
      `Booking ${booking.id} changed to ${updatedStatus}.`,
      'BOOKING'
    );
    notifications.push(providerNotif);
  }

  if (io) {
    // Emit to customer's room
    emitToUserRoom(io, booking.customerId, 'bookingUpdated', { 
      bookingId: booking.id, 
      status: updatedStatus,
      serviceCategory: booking.serviceCategory 
    });
    if (notifications[0]) {
      emitToUserRoom(io, booking.customerId, 'notification', notifications[0]);
    }

    // Emit to provider's room
    if (providerUserId) {
      emitToUserRoom(io, providerUserId, 'bookingStatusChanged', {
        bookingId: booking.id,
        status: updatedStatus,
        serviceCategory: booking.serviceCategory
      });
      if (notifications[1]) {
        emitToUserRoom(io, providerUserId, 'notification', notifications[1]);
      }
    }
  }
}

/**
 * Notify provider about service approval
 */
export async function notifyServiceApproved(providerUserId, serviceName) {
  const notification = await createNotification(
    providerUserId,
    'Service Approved',
    `Your service request "${serviceName}" has been approved.`,
    'SERVICE_APPROVAL'
  );
  return notification;
}

/**
 * Notify provider about service denial
 */
export async function notifyServiceDenied(providerUserId, serviceName, reason) {
  const notification = await createNotification(
    providerUserId,
    'Service Denied',
    `Your service request "${serviceName}" has been denied.\nReason: ${reason || 'No reason provided'}`,
    'SERVICE_DENIAL'
  );
  return notification;
}

/**
 * Notify about payment received
 */
export async function notifyPaymentReceived(userId, bookingId) {
  const notification = await createNotification(
    userId,
    'Payment Received',
    `Payment for booking ${bookingId} was received successfully.`,
    'PAYMENT'
  );
  return notification;
}

/**
 * Notify about review publication
 */
export async function notifyReviewPublished(userId) {
  const notification = await createNotification(
    userId,
    'Review Published',
    'Thank you for sharing your feedback. It helps other customers choose trusted providers.',
    'REVIEW'
  );
  return notification;
}

/**
 * Bulk create notifications for multiple users
 */
export async function createBulkNotifications(userIds, title, message, type = 'SYSTEM') {
  try {
    const notifications = await NotificationRepository.createMany(
      userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        isRead: false
      })),
      true
    );
    return notifications;
  } catch (err) {
    logger.error('[NotificationService] Bulk notification creation failed:', err.message);
    return null;
  }
}
