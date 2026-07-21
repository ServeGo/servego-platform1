import { AuditRepository } from '../repositories/index.js';
import logger from '../utils/logger.js';

export async function writeAuditLog({ actorId, actorRole, action, targetType, targetId, oldValue = null, newValue = null, ip = null }) {
  try {
    return await AuditRepository.create({ actorId, actorRole, action, targetType, targetId, oldValue, newValue, ip });
  } catch (err) {
    logger.error('[AuditLog] Failed to write audit log:', err.message);
    return null;
  }
}
