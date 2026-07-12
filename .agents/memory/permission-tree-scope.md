---
name: Permission tree scope discipline
description: Rule for what belongs in the staff DeptPermissions tree vs. what should be excluded, learned during a "make the permission tree complete" task.
---

When a task asks to make the staff Role & Permission tree "complete" or match "every real UI action," resist the urge to invent matching backend/frontend features just so every permission checkbox has something to gate.

**Why:** During a permission-tree rebuild, a `canEditVoucher` checkbox was added to the tree/type/DB migration, but grepping the codebase confirmed no "edit voucher" feature exists anywhere (only create/delete/print). Keeping the checkbox would have required inventing a brand-new edit-voucher UI, which is out of scope when a task says "confine changes strictly to the permissions table/UI and its enforcement logic" (no new features).

**How to apply:** Before wiring a new permission key, grep for the real action it's supposed to gate (e.g. a delete/edit handler, a button, a route). If nothing matches, drop the permission key entirely rather than building a matching feature. Only keep permissions like `canDeleteVoucher` that map to an already-existing control (e.g. existing `deleteRv`/`deletePv` trash-icon buttons).
