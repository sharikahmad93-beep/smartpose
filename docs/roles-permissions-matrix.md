# Smart Restaurant POS — Roles & Permissions Matrix

**Document Version:** 1.1.0 (Hardened Security Release)  
**Security Model:** Role-Based Access Control (RBAC) with Granular Capabilities  
**Privilege Authority:** Database-Enforced via `app_private.has_permission()`

---

## 1. System Role Definitions & Authority Boundaries

| Role Code | Role Name | Scope | Authority & Boundary Rules |
|---|---|---|---|
| **SUPER_ADMIN** | SaaS Super Admin | Platform-wide | **Authority Source:** Explicit entry in `public.platform_superadmins`. Cannot be granted by tenant owners. Manages SaaS infrastructure, tenant billing, and platform monitoring. |
| **OWNER** | Restaurant Owner | Tenant-wide | Primary tenant stakeholder; full authority over all branches within their brand, billing, tax settings, staff management, and audit inspection. |
| **MANAGER** | Branch Manager | Branch(es) | Responsible for outlet operations, staff scheduling, table status overrides, discounts, and daily shift closure. Scoped to assigned branches via `branch_access`. |
| **CASHIER** | Cashier / Billing Staff | Branch | Handles POS terminal, customer billing, payment settlements, bill splitting, and cash drawer management. Scoped to assigned branch. |
| **WAITER** | Captain / Waiter | Branch | Mobile handheld order punching, KOT generation, table occupancy management, and item availability checks. Scoped to assigned branch. |
| **KITCHEN** | Kitchen Staff / Chef | Branch | Operates the Kitchen Display System (KDS), acknowledges tickets, marks items as "Preparing" or "Ready", and reports 86'd items. Scoped to assigned branch. |

---

## 2. Granular Permissions Registry

### A. Platform & Tenancy (`tenant.*`, `branch.*`)
* `tenant.view`: View restaurant profile and subscription details.
* `tenant.update`: Modify brand name, logo, GSTIN, currency, and global settings.
* `branch.view`: View branch addresses, operating hours, and localized configs.
* `branch.manage`: Create and modify branches, operating hours, and tax mappings.

### B. Staff & Access Control (`staff.*`, `roles.*`)
* `staff.view`: View employee list and assigned outlets.
* `staff.invite`: Invite new staff members via email or phone.
* `staff.manage`: Assign roles and grant branch access (Tenant-scoped only; cannot grant Super Admin).
* `roles.custom`: Create and configure custom sub-roles.

### C. Menu & Catalog (`menu.*`)
* `menu.view`: Browse categories, dishes, variants, and modifier groups.
* `menu.manage`: Add, edit, or archive menu items, prices, variants, and recipes.
* `menu.toggle_stock`: Mark items as 86'd (out of stock) or available in real time.

### D. Table & Floor Management (`tables.*`)
* `tables.view`: View real-time floor plan, table status, and occupancy.
* `tables.manage`: Add or re-arrange floor sections, tables, and seating capacities.
* `tables.update_status`: Change table state between Vacant, Occupied, and Billed.

### E. Operational Orders & KOT (`orders.*`, `kot.*`)
* `orders.create`: Punch new orders and generate Kitchen Order Tickets (KOT).
* `orders.modify`: Add items, apply modifiers, or change quantities before billing.
* `orders.cancel`: Void an order or item (requires managerial audit log).
* `orders.discount`: Apply item-level or bill-level discounts.
* `kot.view`: View incoming tickets on the Kitchen Display System.
* `kot.update_status`: Update ticket lifecycle (Received ➔ Cooking ➔ Ready ➔ Served).

### F. Billing, Payments & Shifts (`billing.*`, `cash.*`)
* `billing.settle`: Process payment via Cash, UPI, Credit Card, or Split Payment.
* `billing.refund`: Issue customer refunds or credit notes (Audited).
* `cash.open_shift`: Open daily cash drawer session with opening float balance.
* `cash.close_shift`: Perform end-of-day cash reconciliation and discrepancy reporting.

### G. Analytics & Audit (`reports.*`, `audit.*`)
* `reports.daily_summary`: View daily sales, top-selling dishes, and average order value.
* `reports.financial`: Access comprehensive P&L, tax collected (GST), and audit ledgers.
* `audit.view`: Inspect forensic change logs, staff activities, and voided orders.

---

## 3. Role vs Permission Mapping Matrix

| Permission Code | Super Admin | Owner | Manager | Cashier | Waiter | Kitchen |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **`tenant.update`** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`branch.manage`** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`staff.manage`** | ✅ | ✅ | ✅ (Own Branch) | ❌ | ❌ | ❌ |
| **`roles.custom`** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`menu.manage`** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **`menu.toggle_stock`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`tables.manage`** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **`tables.update_status`** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **`orders.create`** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **`orders.modify`** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **`orders.cancel`** | ✅ | ✅ | ✅ (PIN required) | ❌ | ❌ | ❌ |
| **`orders.discount`** | ✅ | ✅ | ✅ | ✅ (Up to 10%) | ❌ | ❌ |
| **`kot.view`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`kot.update_status`** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **`billing.settle`** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **`billing.refund`** | ✅ | ✅ | ✅ (Audited) | ❌ | ❌ | ❌ |
| **`cash.open_close`** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **`reports.daily_summary`** | ✅ | ✅ | ✅ | ✅ (Own Shift) | ❌ | ❌ |
| **`reports.financial`** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **`audit.view`** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Custom Tenant Roles & Escalation Guardrails

1. **Scope Restriction:** Custom roles are strictly scoped to `tenant_id` and cannot access or manage any records outside the tenant boundary.
2. **Anti-Escalation Rule:** A tenant Owner or Manager can only grant permissions that their own role possesses. No tenant user can grant `SUPER_ADMIN` status or modify `platform_superadmins`.
3. **Audit Logging:** Every role assignment or permission change is automatically recorded in `audit_logs` with before-and-after snapshots.
