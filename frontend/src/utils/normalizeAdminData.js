// Centralized client-side normalization for admin derived metrics.

export const TICKET_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
});

export const PROVIDER_APPROVAL_STATUS = Object.freeze({
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
});

const normalizeString = (value) => (value ?? '').toString().trim().toLowerCase();

/**
 * Canonical boolean: whether a provider is verified/approved.
 * Backend may send `isVerified` or `verified` (or other variants).
 */
export function normalizeProviderIsVerified(provider) {
  if (!provider) return false;

  const isVerified = provider.isVerified;
  if (typeof isVerified === 'boolean') return isVerified;

  // Backend sometimes uses `verified`
  const verified = provider.verified;
  if (typeof verified === 'boolean') return verified;

  // Sometimes backend sends strings
  const v = provider.isVerified ?? provider.verified;
  const sv = normalizeString(v);
  if (sv === 'true' || sv === '1' || sv === 'yes' || sv === 'approved' || sv === 'verified') return true;
  if (sv === 'false' || sv === '0' || sv === 'no' || sv === 'unapproved' || sv === 'unverified') return false;

  return false;
}

/**
 * Canonical ticket status.
 * Backend may send `open`/`OPEN` or other casing.
 */
export function normalizeTicketStatus(status) {
  const s = normalizeString(status);

  // Only map known statuses; otherwise return normalized string.
  if (s === TICKET_STATUS.OPEN) return TICKET_STATUS.OPEN;
  if (s === TICKET_STATUS.CLOSED) return TICKET_STATUS.CLOSED;

  return s;
}

export function isOpenTicket(ticket) {
  if (!ticket) return false;
  return normalizeTicketStatus(ticket.status) === TICKET_STATUS.OPEN;
}

