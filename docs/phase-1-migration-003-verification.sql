-- ==============================================================================
-- SMART RESTAURANT POS — PHASE 1 MIGRATION 003 VERIFICATION SUITE
-- Target: Supabase PostgreSQL 15+ (Project: hptreskxtbbxxzhuokbo, Mumbai ap-south-1)
-- Location: docs/phase-1-migration-003-verification.sql
-- Execution Mode: READ-ONLY diagnostic queries to verify database state.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- CHECK A: ALL 21 PHASE 1 TABLES EXIST IN PUBLIC SCHEMA
-- ------------------------------------------------------------------------------
SELECT 
    expected.table_name,
    expected.domain,
    CASE 
        WHEN t.table_name IS NOT NULL THEN 'EXISTS [PASS]'
        ELSE 'MISSING [FAIL]'
    END AS status
FROM (
    VALUES 
        -- Domain A: Tenancy & Access (Migration 001)
        ('tenants', 'Domain A (Tenancy & Access)'),
        ('branches', 'Domain A (Tenancy & Access)'),
        ('profiles', 'Domain A (Tenancy & Access)'),
        ('platform_superadmins', 'Domain A (Tenancy & Access)'),
        ('roles', 'Domain A (Tenancy & Access)'),
        ('permissions', 'Domain A (Tenancy & Access)'),
        ('role_permissions', 'Domain A (Tenancy & Access)'),
        ('memberships', 'Domain A (Tenancy & Access)'),
        ('branch_access', 'Domain A (Tenancy & Access)'),
        ('audit_logs', 'Domain A (Tenancy & Access)'),
        -- Domain B: Restaurant Configuration (Migration 002)
        ('restaurant_settings', 'Domain B (Configuration)'),
        ('tax_settings', 'Domain B (Configuration)'),
        ('service_charges', 'Domain B (Configuration)'),
        ('business_hours', 'Domain B (Configuration)'),
        -- Domain C: POS Catalog & Dining (Migration 003)
        ('dining_tables', 'Domain C (POS Catalog)'),
        ('menu_categories', 'Domain C (POS Catalog)'),
        ('menu_items', 'Domain C (POS Catalog)'),
        ('item_variants', 'Domain C (POS Catalog)'),
        ('modifier_groups', 'Domain C (POS Catalog)'),
        ('modifiers', 'Domain C (POS Catalog)'),
        ('menu_item_modifiers', 'Domain C (POS Catalog)')
) AS expected(table_name, domain)
LEFT JOIN information_schema.tables t 
    ON t.table_schema = 'public' AND t.table_name = expected.table_name
ORDER BY expected.domain, expected.table_name;

-- ------------------------------------------------------------------------------
-- CHECK B: ROW LEVEL SECURITY (RLS) STATUS ACROSS ALL 21 TABLES
-- (Reports current RLS state. Note: Policies are bound in Migration 004).
-- ------------------------------------------------------------------------------
SELECT 
    c.relname AS table_name,
    CASE 
        WHEN c.relrowsecurity = TRUE THEN 'ENABLED [PASS]'
        ELSE 'DISABLED (Awaiting Migration 004) [INFO]'
    END AS rls_status,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN (
        'tenants', 'branches', 'profiles', 'platform_superadmins', 'roles',
        'permissions', 'role_permissions', 'memberships', 'branch_access', 'audit_logs',
        'restaurant_settings', 'tax_settings', 'service_charges', 'business_hours',
        'dining_tables', 'menu_categories', 'menu_items', 'item_variants',
        'modifier_groups', 'modifiers', 'menu_item_modifiers'
  )
ORDER BY c.relname;

-- ------------------------------------------------------------------------------
-- CHECK C: MIGRATION 003 SEVEN POS CATALOG TABLES EXISTENCE & COLUMNS
-- ------------------------------------------------------------------------------
SELECT 
    expected.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN 'EXISTS [PASS]'
        ELSE 'MISSING [FAIL]'
    END AS existence_status,
    (
        SELECT count(*) 
        FROM information_schema.columns c 
        WHERE c.table_schema = 'public' AND c.table_name = expected.table_name
    ) AS column_count
FROM (
    VALUES 
        ('dining_tables'),
        ('menu_categories'),
        ('menu_items'),
        ('item_variants'),
        ('modifier_groups'),
        ('modifiers'),
        ('menu_item_modifiers')
) AS expected(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_schema = 'public' AND t.table_name = expected.table_name
ORDER BY expected.table_name;

-- ------------------------------------------------------------------------------
-- CHECK D: ALL SEVEN COMPOSITE TENANT-SCOPED FOREIGN KEYS IN MIGRATION 003
-- Verifies exact source columns, target table, and target columns.
-- ------------------------------------------------------------------------------
SELECT 
    con.conname AS foreign_key_name,
    src_tbl.relname AS child_table,
    src_cols.cols AS child_columns,
    ref_tbl.relname AS parent_table,
    ref_cols.cols AS parent_columns,
    CASE con.confdeltype 
        WHEN 'c' THEN 'CASCADE'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'n' THEN 'SET NULL'
        ELSE con.confdeltype::text
    END AS on_delete_rule,
    con.condeferrable AS is_deferrable,
    CASE 
        WHEN src_cols.cols[1]::text = 'tenant_id' AND ref_cols.cols[1]::text = 'tenant_id' 
        THEN 'TENANT SCOPED [PASS]'
        ELSE 'UNSAFE [FAIL]'
    END AS isolation_status
FROM pg_constraint con
JOIN pg_class src_tbl ON src_tbl.oid = con.conrelid
JOIN pg_namespace src_ns ON src_ns.oid = src_tbl.relnamespace
JOIN pg_class ref_tbl ON ref_tbl.oid = con.confrelid
CROSS JOIN LATERAL (
    SELECT array_agg(a.attname::text ORDER BY k.ord) AS cols
    FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
) src_cols
CROSS JOIN LATERAL (
    SELECT array_agg(a.attname::text ORDER BY k.ord) AS cols
    FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum
) ref_cols
WHERE src_ns.nspname = 'public'
  AND con.contype = 'f'
  AND con.conname IN (
      'fk_dining_tables_tenant_branch',
      'fk_menu_items_tenant_category',
      'fk_menu_items_tenant_tax',
      'fk_item_variants_tenant_item',
      'fk_modifiers_tenant_group',
      'fk_mim_tenant_item',
      'fk_mim_tenant_group'
  )
ORDER BY src_tbl.relname, con.conname;

-- ------------------------------------------------------------------------------
-- CHECK E: tax_settings UNIQUE CONSTRAINT IS VALID & NON-DEFERRABLE
-- ------------------------------------------------------------------------------
SELECT 
    con.conname AS constraint_name,
    tbl.relname AS table_name,
    cols.columns AS key_columns,
    CASE WHEN con.contype = 'u' THEN 'UNIQUE [PASS]' ELSE 'NON-UNIQUE [FAIL]' END AS constraint_type,
    CASE WHEN con.condeferrable = FALSE THEN 'NON-DEFERRABLE [PASS]' ELSE 'DEFERRABLE [FAIL]' END AS deferrability_status
FROM pg_constraint con
JOIN pg_class tbl ON tbl.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
CROSS JOIN LATERAL (
    SELECT array_agg(a.attname::text ORDER BY k.ord) AS columns
    FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
) cols
WHERE ns.nspname = 'public'
  AND tbl.relname = 'tax_settings'
  AND con.conname = 'uq_tax_settings_tenant_id';

-- ------------------------------------------------------------------------------
-- CHECK F: QR CODE TOKEN PARTIAL UNIQUE INDEX VALIDATION
-- ------------------------------------------------------------------------------
SELECT 
    c.relname AS index_name,
    t.relname AS table_name,
    CASE WHEN i.indisunique = TRUE THEN 'UNIQUE [PASS]' ELSE 'NON-UNIQUE [FAIL]' END AS uniqueness,
    CASE WHEN i.indisvalid = TRUE THEN 'VALID [PASS]' ELSE 'INVALID [FAIL]' END AS index_validity,
    CASE WHEN i.indpred IS NOT NULL THEN 'PARTIAL [PASS]' ELSE 'NON-PARTIAL [FAIL]' END AS partial_index,
    pg_get_expr(i.indpred, i.indrelid) AS partial_predicate,
    pg_get_indexdef(c.oid) AS full_index_definition
FROM pg_class c
JOIN pg_index i ON i.indexrelid = c.oid
JOIN pg_class t ON t.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'uq_dining_tables_qr_token';

-- ------------------------------------------------------------------------------
-- CHECK G: MENU ITEM CATEGORY & TAX RELATIONSHIPS TENANT SCOPING
-- ------------------------------------------------------------------------------
SELECT 
    con.conname AS constraint_name,
    src_tbl.relname AS child_table,
    ref_tbl.relname AS parent_table,
    cols.child_columns,
    ref_cols.parent_columns,
    CASE 
        WHEN cols.child_columns::text[] = ARRAY['tenant_id', 'category_id']::text[] AND ref_cols.parent_columns::text[] = ARRAY['tenant_id', 'id']::text[]
        THEN 'CATEGORY TENANT ISOLATION [PASS]'
        WHEN cols.child_columns::text[] = ARRAY['tenant_id', 'tax_setting_id']::text[] AND ref_cols.parent_columns::text[] = ARRAY['tenant_id', 'id']::text[]
        THEN 'TAX REGIME TENANT ISOLATION [PASS]'
        ELSE 'CROSS-TENANT RISK [FAIL]'
    END AS isolation_verdict
FROM pg_constraint con
JOIN pg_class src_tbl ON src_tbl.oid = con.conrelid
JOIN pg_class ref_tbl ON ref_tbl.oid = con.confrelid
CROSS JOIN LATERAL (
    SELECT array_agg(a.attname::text ORDER BY k.ord) AS child_columns
    FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
) cols
CROSS JOIN LATERAL (
    SELECT array_agg(a.attname::text ORDER BY k.ord) AS parent_columns
    FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum
) ref_cols
WHERE src_tbl.relname = 'menu_items'
  AND con.conname IN ('fk_menu_items_tenant_category', 'fk_menu_items_tenant_tax')
ORDER BY con.conname;
