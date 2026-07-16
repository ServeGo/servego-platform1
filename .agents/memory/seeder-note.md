---
name: Seeder independence
description: Seeder must not import from the frontend directory
---

`backend/seeders/servicesSeed.js` previously imported from `../../frontend/src/data.js`.
This caused a Node.js MODULE_TYPELESS_PACKAGE_JSON warning because the frontend
package.json has no `"type": "module"` field.

**Fix**: Define seed data inline in the seeder file. Never import from the
frontend directory inside backend code.

**Why**: Backend and frontend are separate packages. Cross-package imports
bypass the module type boundaries and produce runtime warnings or failures.
