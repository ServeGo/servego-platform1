/**
 * ServeGo — Mock Prisma Client
 * Implements a subset of the Prisma client API backed by the in-memory store.
 * Used when DATABASE_URL is absent or DB schema is not migrated.
 */
import { store, genId } from '../data/mockStore.js';

// ── Compound unique key registry ──────────────────────────────────────────────
// Maps Prisma compound-key names to their constituent fields.
const COMPOUND_KEYS = {
  providerId_serviceId: ['providerId', 'serviceId'],
  userId_serviceId:     ['userId', 'serviceId'],
};

// ── Relation FK registry ───────────────────────────────────────────────────────
// For nested where clauses: tells us how to look up a related record from a
// given collection so we can filter on relation fields.
const RELATION_FK = {
  // providerServices.service  → store.services via serviceId
  'providerServices.service':           (rec) => store.services.find(s => s.id === rec.serviceId) || null,
  'providerServices.provider':          (rec) => store.providers.find(p => p.id === rec.providerId) || null,
  // providers.user
  'providers.user':                     (rec) => store.users.find(u => u.id === rec.userId) || null,
  // bookings.*
  'bookings.customer':                  (rec) => store.users.find(u => u.id === rec.customerId) || null,
  'bookings.provider':                  (rec) => store.providers.find(p => p.id === rec.providerId) || null,
  'bookings.service':                   (rec) => store.services.find(s => s.id === rec.serviceId) || null,
  'bookings.payment':                   (rec) => store.payments.find(p => p.bookingId === rec.id) || null,
  // payments.booking (for nested analytics query)
  'payments.booking':                   (rec) => store.bookings.find(b => b.id === rec.bookingId) || null,
  // providerServiceRequests.provider
  'providerServiceRequests.provider':   (rec) => store.providers.find(p => p.id === rec.providerId) || null,
  // notifications.user
  'notifications.user':                 (rec) => store.users.find(u => u.id === rec.userId) || null,
};

// ── Query helpers ─────────────────────────────────────────────────────────────

function matchesScalar(fieldValue, condition) {
  if (condition === null || condition === undefined) return fieldValue == null;
  if (typeof condition !== 'object' || condition instanceof Date || Array.isArray(condition)) {
    return fieldValue === condition;
  }

  // Handle Prisma operators
  for (const [op, opVal] of Object.entries(condition)) {
    const strVal  = String(fieldValue ?? '');
    const insensitive = condition.mode === 'insensitive';

    switch (op) {
      case 'mode': break; // not an operator
      case 'equals': {
        if (!matchesScalar(fieldValue, insensitive ? { contains: opVal, mode: 'insensitive' } : opVal)) return false;
        // Verify full equality, not just contains
        const a = insensitive ? strVal.toLowerCase() : strVal;
        const b = insensitive ? String(opVal ?? '').toLowerCase() : String(opVal ?? '');
        if (a !== b) return false;
        break;
      }
      case 'in':         if (!Array.isArray(opVal) || !opVal.includes(fieldValue)) return false; break;
      case 'notIn':      if (!Array.isArray(opVal) || opVal.includes(fieldValue)) return false; break;
      case 'not':        if (fieldValue === opVal) return false; break;
      case 'gte':        if (!(fieldValue >= opVal)) return false; break;
      case 'lte':        if (!(fieldValue <= opVal)) return false; break;
      case 'gt':         if (!(fieldValue > opVal)) return false; break;
      case 'lt':         if (!(fieldValue < opVal)) return false; break;
      case 'contains': {
        const haystack = insensitive ? strVal.toLowerCase() : strVal;
        const needle   = insensitive ? String(opVal ?? '').toLowerCase() : String(opVal ?? '');
        if (!haystack.includes(needle)) return false;
        break;
      }
      case 'startsWith': if (!strVal.startsWith(String(opVal ?? ''))) return false; break;
      case 'endsWith':   if (!strVal.endsWith(String(opVal ?? ''))) return false; break;
      default: break;
    }
  }
  return true;
}

/**
 * Test whether a record matches all conditions in a Prisma where object.
 * @param {string} collectionName - used for relation FK resolution
 */
function matchesWhere(record, where, collectionName = '') {
  if (!where) return true;

  for (const [key, condition] of Object.entries(where)) {
    // Logical combinators
    if (key === 'AND') {
      const clauses = Array.isArray(condition) ? condition : [condition];
      if (!clauses.every(c => matchesWhere(record, c, collectionName))) return false;
      continue;
    }
    if (key === 'OR') {
      const clauses = Array.isArray(condition) ? condition : [condition];
      if (!clauses.some(c => matchesWhere(record, c, collectionName))) return false;
      continue;
    }
    if (key === 'NOT') {
      const clauses = Array.isArray(condition) ? condition : [condition];
      if (clauses.some(c => matchesWhere(record, c, collectionName))) return false;
      continue;
    }

    // Compound unique key (e.g. providerId_serviceId: { providerId, serviceId })
    if (key in COMPOUND_KEYS && typeof condition === 'object' && condition !== null) {
      const fields = COMPOUND_KEYS[key];
      if (!fields.every(f => record[f] === condition[f])) return false;
      continue;
    }

    // Check if key is a direct field on the record
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      if (!matchesScalar(record[key], condition)) return false;
      continue;
    }

    // Key is not a direct field — try to resolve as a relation
    const relKey = `${collectionName}.${key}`;
    const resolver = RELATION_FK[relKey];
    if (resolver && typeof condition === 'object' && condition !== null) {
      const related = resolver(record);
      if (!related) {
        // No related record found; if condition requires fields, it fails
        return false;
      }
      // related might itself have nested relations — recurse one level
      const relCollection = guessCollectionFromRelKey(key);
      if (!matchesWhere(related, condition, relCollection)) return false;
      continue;
    }

    // Unknown key — skip (don't fail; graceful degradation)
  }
  return true;
}

function guessCollectionFromRelKey(relKey) {
  const map = {
    service: 'services', provider: 'providers', user: 'users',
    customer: 'users', booking: 'bookings', payment: 'payments',
    notification: 'notifications', ticket: 'tickets',
  };
  return map[relKey] || '';
}

/**
 * Sort an array by a Prisma orderBy descriptor.
 */
function applyOrderBy(records, orderBy) {
  if (!orderBy) return records;
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...records].sort((a, b) => {
    for (const order of orders) {
      for (const [field, dir] of Object.entries(order)) {
        const av = a[field]; const bv = b[field];
        if (av === bv) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av < bv ? -1 : 1;
        return dir === 'desc' ? -cmp : cmp;
      }
    }
    return 0;
  });
}

function applySelect(record, select) {
  if (!select || !record) return record;
  const result = {};
  for (const [key, val] of Object.entries(select)) {
    if (val) result[key] = record[key] ?? null;
  }
  return result;
}

// ── Relation resolver for include ─────────────────────────────────────────────

function resolveInclude(record, include, collectionName) {
  if (!include || !record) return record;
  const result = { ...record };

  for (const [relKey, relVal] of Object.entries(include)) {
    if (!relVal) continue;
    const subInclude = (typeof relVal === 'object' && relVal !== true) ? relVal.include : null;
    const subSelect  = (typeof relVal === 'object' && relVal !== true) ? relVal.select  : null;

    switch (`${collectionName}.${relKey}`) {
      case 'providers.user':
      case 'providers.providerProfile': {
        const found = store.users.find(u => u.id === record.userId) || null;
        result[relKey] = found ? (subSelect ? applySelect(found, subSelect) : found) : null;
        break;
      }
      case 'providers.reviews': {
        result[relKey] = store.reviews.filter(r => r.providerId === record.id);
        break;
      }
      case 'providers.badges': {
        result[relKey] = []; // Mock: no badge system yet
        break;
      }
      case 'providers.providerServices': {
        const items = store.providerServices.filter(ps => ps.providerId === record.id);
        result[relKey] = items.map(item => resolveInclude(item, subInclude, 'providerServices'));
        break;
      }
      case 'providers.providerServiceRequests': {
        result[relKey] = store.providerServiceRequests.filter(r => r.providerId === record.id);
        break;
      }
      case 'bookings.customer': {
        const found = store.users.find(u => u.id === record.customerId) || null;
        result[relKey] = found ? (subSelect ? applySelect(found, subSelect) : found) : null;
        break;
      }
      case 'bookings.provider': {
        const prov = store.providers.find(p => p.id === record.providerId) || null;
        if (prov) {
          const defaultProvInclude = subInclude || { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } };
          result[relKey] = resolveInclude(prov, defaultProvInclude, 'providers');
        } else {
          result[relKey] = null;
        }
        break;
      }
      case 'bookings.service': {
        result[relKey] = store.services.find(s => s.id === record.serviceId) || null;
        break;
      }
      case 'bookings.payment': {
        result[relKey] = store.payments.find(p => p.bookingId === record.id) || null;
        break;
      }
      case 'users.customerProfile': {
        result[relKey] = store.customerProfiles.find(cp => cp.userId === record.id) || null;
        break;
      }
      case 'users.providerProfile': {
        result[relKey] = store.providers.find(p => p.userId === record.id) || null;
        break;
      }
      case 'users.authEvents': {
        result[relKey] = store.authEvents.filter(e => e.userId === record.id);
        break;
      }
      case 'providerServices.service': {
        const svc = store.services.find(s => s.id === record.serviceId) || null;
        result[relKey] = svc;
        break;
      }
      case 'providerServices.provider': {
        const prov = store.providers.find(p => p.id === record.providerId) || null;
        result[relKey] = prov ? resolveInclude(prov, subInclude, 'providers') : null;
        break;
      }
      case 'providerServiceRequests.provider': {
        const prov = store.providers.find(p => p.id === record.providerId) || null;
        result[relKey] = prov ? resolveInclude(prov, subInclude, 'providers') : null;
        break;
      }
      case 'providerServiceRequests.service': {
        result[relKey] = store.services.find(s => s.id === record.serviceId) || null;
        break;
      }
      case 'notifications.user': {
        result[relKey] = store.users.find(u => u.id === record.userId) || null;
        break;
      }
      default:
        result[relKey] = null;
    }
  }

  return result;
}

// ── Generic model factory ─────────────────────────────────────────────────────

function makeModel(collectionName) {
  const getCol = () => store[collectionName];

  return {
    async findMany({ where, orderBy, include, select, take, skip } = {}) {
      let results = getCol().filter(r => matchesWhere(r, where, collectionName));
      results = applyOrderBy(results, orderBy);
      if (skip) results = results.slice(skip);
      if (take) results = results.slice(0, take);
      return results.map(r => {
        const withRel = resolveInclude(r, include, collectionName);
        return select ? applySelect(withRel, select) : withRel;
      });
    },

    async findUnique({ where, include, select } = {}) {
      const record = getCol().find(r => matchesWhere(r, where, collectionName)) || null;
      if (!record) return null;
      const withRel = resolveInclude(record, include, collectionName);
      return select ? applySelect(withRel, select) : withRel;
    },

    async findFirst({ where, orderBy, include, select } = {}) {
      let results = getCol().filter(r => matchesWhere(r, where, collectionName));
      results = applyOrderBy(results, orderBy);
      const record = results[0] || null;
      if (!record) return null;
      const withRel = resolveInclude(record, include, collectionName);
      return select ? applySelect(withRel, select) : withRel;
    },

    async create({ data, include, select } = {}) {
      const now = new Date().toISOString();
      const newRecord = { id: genId(), createdAt: now, updatedAt: now, ...data };
      getCol().push(newRecord);
      const withRel = resolveInclude(newRecord, include, collectionName);
      return select ? applySelect(withRel, select) : withRel;
    },

    async update({ where, data, include, select } = {}) {
      const col = getCol();
      const idx = col.findIndex(r => matchesWhere(r, where, collectionName));
      if (idx === -1) {
        const err = new Error(`Record to update not found in ${collectionName}`);
        err.code = 'P2025';
        throw err;
      }
      col[idx] = { ...col[idx], ...data, updatedAt: new Date().toISOString() };
      const withRel = resolveInclude(col[idx], include, collectionName);
      return select ? applySelect(withRel, select) : withRel;
    },

    async upsert({ where, create: createData, update: updateData, include, select } = {}) {
      const col = getCol();
      const idx = col.findIndex(r => matchesWhere(r, where, collectionName));
      if (idx !== -1) {
        col[idx] = { ...col[idx], ...updateData, updatedAt: new Date().toISOString() };
        const withRel = resolveInclude(col[idx], include, collectionName);
        return select ? applySelect(withRel, select) : withRel;
      }
      return this.create({ data: createData, include, select });
    },

    async delete({ where } = {}) {
      const col = getCol();
      const idx = col.findIndex(r => matchesWhere(r, where, collectionName));
      if (idx === -1) {
        const err = new Error(`Record to delete not found in ${collectionName}`);
        err.code = 'P2025';
        throw err;
      }
      const [deleted] = col.splice(idx, 1);
      return deleted;
    },

    async deleteMany({ where } = {}) {
      const col = getCol();
      const before = col.length;
      const toKeep = col.filter(r => !matchesWhere(r, where, collectionName));
      col.splice(0, col.length, ...toKeep);
      return { count: before - toKeep.length };
    },

    async count({ where } = {}) {
      return getCol().filter(r => matchesWhere(r, where, collectionName)).length;
    },

    async aggregate({ where, _count, _sum, _avg } = {}) {
      const records = getCol().filter(r => matchesWhere(r, where, collectionName));
      const result = {};
      if (_count) result._count = { _all: records.length };
      if (_sum) {
        result._sum = {};
        for (const f of Object.keys(_sum)) {
          result._sum[f] = records.reduce((acc, r) => acc + (Number(r[f]) || 0), 0);
        }
      }
      if (_avg) {
        result._avg = {};
        for (const f of Object.keys(_avg)) {
          const nums = records.map(r => Number(r[f]) || 0);
          result._avg[f] = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
        }
      }
      return result;
    },
  };
}

// ── Mock Prisma Client ────────────────────────────────────────────────────────

const mockPrisma = {
  user:                   makeModel('users'),
  provider:               makeModel('providers'),
  customer:               makeModel('customerProfiles'),
  providerService:        makeModel('providerServices'),
  providerServiceRequest: makeModel('providerServiceRequests'),
  service:                makeModel('services'),
  booking:                makeModel('bookings'),
  payment:                makeModel('payments'),
  notification:           makeModel('notifications'),
  ticket:                 makeModel('tickets'),
  review:                 makeModel('reviews'),
  authEvent:              makeModel('authEvents'),

  $queryRaw:    async () => [{ ok: 1 }],
  $connect:     async () => {},
  $disconnect:  async () => {},
  $transaction: async (fn) => {
    if (typeof fn === 'function') return fn(mockPrisma);
    const results = [];
    for (const p of fn) results.push(await p);
    return results;
  },
};

export default mockPrisma;
