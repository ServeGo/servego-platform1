---
name: Mock client where-matching
description: What where-clause patterns the mock Prisma client handles
---

`backend/prisma/mockClient.js` — `matchesWhere(record, where, collectionName)`:

- **Scalar operators**: equals, in, notIn, not, gte, lte, gt, lt, contains, startsWith, endsWith
- **mode: insensitive**: supported on equals and contains
- **Logical**: OR, AND, NOT (array or single object)
- **Compound unique keys** (e.g. `providerId_serviceId: { providerId, serviceId }`):
  registered in `COMPOUND_KEYS` map — extend this map for new compound keys
- **Nested relation where** (e.g. `service: { name: { equals: 'Electrician' } }` on providerService):
  resolved via `RELATION_FK` map — extend this map when adding new relations

**Why:** Prisma controllers use all these patterns; without support the mock
returns wrong results or empty arrays silently.

**How to apply:** When adding a new model relation that controllers filter on,
add an entry to `RELATION_FK` in mockClient.js.
Format: `'collectionName.relationKey': (rec) => store.<related>.find(...)`.
