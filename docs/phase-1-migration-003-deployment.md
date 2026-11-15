# Phase 1 — Migration 003 Deployment Guide (POS Catalog & Dining Setup)

**Document Version:** 1.0.0  
**Target Environment:** Supabase Cloud Development Project  
**Target Project Reference:** `hptreskxtbbxxzhuokbo`  
**Region:** South Asia (Mumbai) — AWS Region `ap-south-1`  
**Migration File:** [`backend/supabase/migrations/20261114000003_pos_catalog.sql`](file:///C:/Projects/smart-restaurant-pos/backend/supabase/migrations/20261114000003_pos_catalog.sql)  
**Verification File:** [`docs/phase-1-migration-003-verification.sql`](file:///C:/Projects/smart-restaurant-pos/docs/phase-1-migration-003-verification.sql)  

---

## 1. Overview & Architectural Scope

Migration 003 implements **Domain C: POS Foundation (Catalog & Dining Setup)** of the Smart Restaurant POS SaaS platform.

### Scope of Migration 003:
1. **Prerequisite Idempotency:** Safely ensures `public.tax_settings` possesses a non-deferrable `UNIQUE(tenant_id, id)` constraint without generating duplicate indexes.
2. **Floor Layout & Tables:** Creates `public.dining_tables` with composite foreign key `(tenant_id, branch_id) REFERENCES public.branches(tenant_id, id)` and soft-delete partial unique indexes on table numbers and QR tokens.
3. **Master Catalog:** Creates `public.menu_categories` with `UNIQUE(tenant_id, id)` and `public.menu_items` with composite foreign keys to both category and tax settings.
4. **Variants & Customizations:** Creates `public.item_variants`, `public.modifier_groups`, `public.modifiers`, and the junction table `public.menu_item_modifiers` with dual composite foreign keys preventing cross-tenant attachments.

---

## 2. Pre-Deployment Checklist

Before deploying Migration 003, verify the following prerequisites:
- [x] Migration 001 (`20261114000001_tenancy_and_access.sql`) is deployed.
- [x] Migration 002 (`20261114000002_restaurant_configuration.sql`) is deployed.
- [x] Target Supabase project confirmed: `hptreskxtbbxxzhuokbo` (`ap-south-1`, Mumbai).
- [x] Full static code review and non-deferrable unique constraint hardening complete.

---

## 3. Manual Deployment Procedure (Supabase Dashboard)

Follow these steps to apply Migration 003 through the Supabase Dashboard SQL Editor:

### Step 1: Open Supabase Project
1. Navigate to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select the project **`hptreskxtbbxxzhuokbo`** (Region: Mumbai, `ap-south-1`).

### Step 2: Access SQL Editor
1. In the left navigation sidebar, click on **SQL Editor**.
2. Click **+ New Query** to open a fresh SQL execution tab.
3. Rename the tab to: `Migration 003 - POS Catalog`.

### Step 3: Load Migration SQL
1. Open the local migration file:  
   [`backend/supabase/migrations/20261114000003_pos_catalog.sql`](file:///C:/Projects/smart-restaurant-pos/backend/supabase/migrations/20261114000003_pos_catalog.sql)
2. Copy the entire file contents.
3. Paste the contents into the SQL Editor query window.

### Step 4: Execute Migration
1. Click the green **Run** button (or press `Ctrl + Enter` / `Cmd + Enter`).
2. **Prompt Handling ("Enable RLS"):**
   * If Supabase Studio displays a prompt asking to **"Run and enable RLS"**, select **Run and enable RLS** (or proceed with standard run).
   * *Note:* Full granular RLS policies for all tables are formally declared and bound in Migration 004. Enabling RLS now enforces safe default-deny on client roles (`anon`, `authenticated`).
3. Ensure the output pane displays:
   ```text
   Success. No rows returned.
   ```

---

## 4. Post-Deployment Verification Procedure

To verify that all database objects, constraints, and relational anchors have been applied accurately:

### Step 1: Run Verification Script
1. In Supabase SQL Editor, click **+ New Query**.
2. Rename the tab to: `Verify Migration 003`.
3. Copy the contents of:  
   [`docs/phase-1-migration-003-verification.sql`](file:///C:/Projects/smart-restaurant-pos/docs/phase-1-migration-003-verification.sql)
4. Paste and click **Run**.

### Step 2: Expected Verification Results

#### Query A: All 21 Phase 1 Tables Exist
* All 21 tables (`tenants`, `branches`, `profiles`, `platform_superadmins`, `roles`, `permissions`, `role_permissions`, `memberships`, `branch_access`, `audit_logs`, `restaurant_settings`, `tax_settings`, `service_charges`, `business_hours`, `dining_tables`, `menu_categories`, `menu_items`, `item_variants`, `modifier_groups`, `modifiers`, `menu_item_modifiers`) must return `status = 'EXISTS [PASS]'`.

#### Query B: RLS Status Check
* Confirms RLS status. If "Run and enable RLS" was selected, reports `ENABLED [PASS]`. If deferred to Migration 004, reports `DISABLED (Awaiting Migration 004) [INFO]`.

#### Query C: Migration 003 POS Catalog Tables
* `dining_tables` (13 columns)
* `menu_categories` (11 columns)
* `menu_items` (15 columns)
* `item_variants` (12 columns)
* `modifier_groups` (11 columns)
* `modifiers` (10 columns)
* `menu_item_modifiers` (3 columns)

#### Query D: Seven Composite Tenant-Scoped Foreign Keys
Must return exactly 7 rows with `isolation_status = 'TENANT SCOPED [PASS]'`:
1. `fk_dining_tables_tenant_branch`: `(tenant_id, branch_id) -> branches(tenant_id, id)` [CASCADE]
2. `fk_menu_items_tenant_category`: `(tenant_id, category_id) -> menu_categories(tenant_id, id)` [RESTRICT]
3. `fk_menu_items_tenant_tax`: `(tenant_id, tax_setting_id) -> tax_settings(tenant_id, id)` [RESTRICT]
4. `fk_item_variants_tenant_item`: `(tenant_id, item_id) -> menu_items(tenant_id, id)` [CASCADE]
5. `fk_modifiers_tenant_group`: `(tenant_id, group_id) -> modifier_groups(tenant_id, id)` [CASCADE]
6. `fk_mim_tenant_item`: `(tenant_id, item_id) -> menu_items(tenant_id, id)` [CASCADE]
7. `fk_mim_tenant_group`: `(tenant_id, modifier_group_id) -> modifier_groups(tenant_id, id)` [CASCADE]

#### Query E: `tax_settings` Unique Constraint
* Returns `uq_tax_settings_tenant_id` on `public.tax_settings`, `key_columns = {tenant_id, id}`, `constraint_type = 'UNIQUE [PASS]'`, `deferrability_status = 'NON-DEFERRABLE [PASS]'`.

#### Query F: QR Code Token Partial Unique Index
* Returns `uq_dining_tables_qr_token` on `public.dining_tables`, `is_unique = 'UNIQUE [PASS]'`, `is_valid = 'VALID [PASS]'`, `is_partial = 'PARTIAL [PASS]'`, predicate `(deleted_at IS NULL) AND (qr_code_token IS NOT NULL)`.

#### Query G: Menu Item Relationships
* Confirms both `fk_menu_items_tenant_category` and `fk_menu_items_tenant_tax` are strictly tenant-scoped (`isolation_verdict = '... [PASS]'`).

---

## 5. Recovery & Rollback Procedure

If SQL execution fails or an error is raised during migration:

1. **Review Error Output:** Note the line number and exact PostgreSQL error message.
2. **Catalog Collision:** If an error states `relation "uq_tax_settings_tenant_id" already exists with incompatible properties`, verify whether an unmanaged index exists in `public.tax_settings` from manual experimentation.
3. **Safe Rollback of Domain C (if needed):**
   Execute in SQL Editor:
   ```sql
   DROP TABLE IF EXISTS public.menu_item_modifiers CASCADE;
   DROP TABLE IF EXISTS public.modifiers CASCADE;
   DROP TABLE IF EXISTS public.modifier_groups CASCADE;
   DROP TABLE IF EXISTS public.item_variants CASCADE;
   DROP TABLE IF EXISTS public.menu_items CASCADE;
   DROP TABLE IF EXISTS public.menu_categories CASCADE;
   DROP TABLE IF EXISTS public.dining_tables CASCADE;
   ALTER TABLE IF EXISTS public.tax_settings DROP CONSTRAINT IF EXISTS uq_tax_settings_tenant_id;
   DROP INDEX IF EXISTS public.uq_tax_settings_tenant_id;
   ```
4. **Preserve Foundation:** Do NOT drop tables from Migration 001 (`tenants`, `branches`, `memberships`, etc.) or Migration 002 (`restaurant_settings`, `tax_settings`, etc.).
