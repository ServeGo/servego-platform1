import prisma from '../prisma/client.js';

export async function writeAuditLog({ actorId, actorRole, action, targetType, targetId, oldValue = null, newValue = null, ip = null }) {
  try {
    return await prisma.auditLog.create({
      data: { actorId, actorRole, action, targetType, targetId, oldValue, newValue, ip }
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err.message);
    return null;
  }
}
