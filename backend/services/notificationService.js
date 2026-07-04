import prisma from '../prisma/client.js';

async function createNotification(userId, title, message, type = 'SYSTEM') {
  try {
    return await prisma.notification.create({
      data: { userId, title, message, type, isRead: false }
    });
  } catch (err) {
    console.error(`[NotificationService] Failed to create notification for user ${userId}:`, err.message);
    return null;
  }
}

export async function notifyBookingCreated(io, booking, customer, providerUserId) {
  const [providerNotif, customerNotif] = await Promise.all([
    providerUserId && createNotification(
      providerUserId,
      'New Service Request',
      `You have a new ${booking.serviceCategory} request from ${customer.name}.`,
      'BOOKING'
    ),
    createNotification(
      customer.id,
      'Booking Received',
      `Your ${booking.serviceCategory} booking is pending confirmation.`,
      'BOOKING'
    )
  ]);
  if (io) {
    io.emit('newJobLead', booking);
    if (providerNotif) io.emit('notification', providerNotif);
    if (customerNotif) io.emit('notification', customerNotif);
  }
}

export async function notifyBookingStatusChanged(io, booking, updatedStatus, providerUserId) {
  const [customerNotif, providerNotif] = await Promise.all([
    createNotification(
      booking.customerId,
      'Booking Status Updated',
      `Your booking for ${booking.serviceCategory} has been updated to "${updatedStatus}".`,
      'BOOKING'
    ),
    providerUserId && createNotification(
      providerUserId,
      'Booking Update',
      `Booking ${booking.id} changed to ${updatedStatus}.`,
      'BOOKING'
    )
  ]);
  if (io) {
    io.emit('bookingUpdated', { bookingId: booking.id, status: updatedStatus });
    if (customerNotif) io.emit('notification', customerNotif);
    if (providerNotif) io.emit('notification', providerNotif);
  }
}

export async function notifyServiceApproved(providerUserId, serviceName) {
  return createNotification(
    providerUserId,
    'Service Approved',
    `Your service request "${serviceName}" has been approved.`,
    'SERVICE_APPROVAL'
  );
}

export async function notifyServiceDenied(providerUserId, serviceName, reason) {
  return createNotification(
    providerUserId,
    'Service Denied',
    `Your service request "${serviceName}" has been denied.\nReason: ${reason}`,
    'SERVICE_DENIAL'
  );
}

export async function notifyPaymentReceived(userId, bookingId) {
  return createNotification(
    userId,
    'Payment Received',
    `Payment for booking ${bookingId} was received successfully.`,
    'PAYMENT'
  );
}

export async function notifyReviewPublished(userId) {
  return createNotification(
    userId,
    'Review Published',
    'Thank you for sharing your feedback. It helps other customers choose trusted providers.',
    'REVIEW'
  );
}
