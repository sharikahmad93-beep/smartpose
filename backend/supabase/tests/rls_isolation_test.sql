-- ==============================================================================
-- SMART RESTAURANT POS — REPAIRED RLS ISOLATION & MULTI-TENANT TEST SUITE
-- Target: Supabase PostgreSQL 15+
-- Location: backend/supabase/tests/rls_isolation_test.sql
-- Execution: Fully isolated transaction with self-reverting ROLLBACK.
--
-- ARCHITECTURAL DISCLAIMER & OPERATIONAL INSTRUCTIONS:
--   1. This script executes inside a SINGLE explicit transaction (BEGIN ... ROLLBACK).
--   2. All test fixtures and modifications are transient and revert on ROLLBACK.
--   3. NOTE ON TRANSACTION ABORT: In PostgreSQL, if any statement raises an unhandled
--      error, the transaction enters an aborted state. A trailing ROLLBACK in the script
--      does not execute automatically after an abort; the operator running the script in
--      Supabase SQL Editor or psql must issue an explicit ROLLBACK before executing
--      subsequent statements.
--   4. NEVER use ON CONFLICT DO UPDATE on auth.users or profiles.
--   5. Static analysis of this file is performed by run_rls_isolation_test.js.
--
-- SECURITY TEST SUITE ARCHITECTURE & CLASSIFICATION:
--   [SAFETY-PRE] Preflight Collision Assertions: Section 1.1 (All 14 tables)
--   [FIXTURE-INT] Baseline Fixture Existence Assertions: Section 1.4
--   [RLS-POL] Row Level Security (RLS) Policy Assertions: Tests 1, 2, 3, 4, 5, 7, 8, 9, 10, 11
--   [TBL-DCL] Table Privilege / Grant Assertions: Test 6.1 (REVOKE ALL on platform_superadmins)
--   [FN-UNIT] Procedural Function Unit Test: Test 6.2 (app_private.is_superadmin() returns FALSE)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PRIVILEGED FIXTURE SETUP (Executed as postgres session user / table owner)
-- ------------------------------------------------------------------------------

-- 1.1 Comprehensive Preflight Collision Check
-- Fails safely with an explicit error if ANY deterministic fixture UUID or unique business key exists.
-- Covers all 14 schema tables: auth.users, profiles, tenants, branches, roles, permissions,
-- memberships, menu_categories, menu_items, dining_tables, item_variants, modifier_groups, modifiers, menu_item_modifiers.
DO $$
BEGIN
    -- 1.1.1 auth.users collision check (Primary Key & Unique Email)
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id IN (
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333',
            '44444444-4444-4444-4444-444444444444',
            '55555555-5555-5555-5555-555555555555',
            '66666666-6666-6666-6666-666666666666',
            '77777777-7777-7777-7777-777777777777'
        )
        OR email IN (
            'owner_a@pos.test',
            'waiter_a1@pos.test',
            'cashier_a1@pos.test',
            'manager_multi@pos.test',
            'owner_b@pos.test',
            'candidate_1@pos.test',
            'candidate_2@pos.test'
        )
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic test user UUID or email already exists in auth.users! Aborting test to prevent modifying existing data.';
    END IF;

    -- 1.1.2 public.profiles collision check (Primary Key & Unique Phone)
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id IN (
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333',
            '44444444-4444-4444-4444-444444444444',
            '55555555-5555-5555-5555-555555555555',
            '66666666-6666-6666-6666-666666666666',
            '77777777-7777-7777-7777-777777777777'
        )
        OR phone IN (
            '9000000011', '9000000012', '9000000013', '9000000014', '9000000015', '9000000016', '9000000017'
        )
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic test profile UUID or phone already exists in public.profiles!';
    END IF;

    -- 1.1.3 public.tenants collision check (Primary Key & Unique Slug)
    IF EXISTS (
        SELECT 1 FROM public.tenants
        WHERE id IN (
            'a0000000-0000-0000-0000-000000000001',
            'b0000000-0000-0000-0000-000000000002'
        )
        OR slug IN ('rls-tenant-a', 'rls-tenant-b')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic tenant UUID or slug already exists in public.tenants!';
    END IF;

    -- 1.1.4 public.branches collision check (Primary Key, Code, and Phone)
    IF EXISTS (
        SELECT 1 FROM public.branches
        WHERE id IN (
            'a1000000-0000-0000-0000-000000000001',
            'a2000000-0000-0000-0000-000000000002',
            'a3000000-0000-0000-0000-000000000003',
            'b1000000-0000-0000-0000-000000000001'
        )
        OR code IN ('AO1', 'AO2', 'AO3', 'BO1')
        OR phone IN ('9000000001', '9000000002', '9000000003', '9000000004')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic branch UUID, code, or phone already exists in public.branches!';
    END IF;

    -- 1.1.5 public.roles collision check (Primary Key, Test-Specific Role Codes, and Names)
    -- Explicitly checks test role codes, names, and UUIDs so pre-existing global roles never cause collisions
    IF EXISTS (
        SELECT 1 FROM public.roles
        WHERE id IN (
            'e0000000-0000-0000-0000-000000000001',
            'e0000000-0000-0000-0000-000000000002',
            'e0000000-0000-0000-0000-000000000003',
            'e0000000-0000-0000-0000-000000000004',
            'e0000000-0000-0000-0000-000000000099'
        )
        OR code IN ('TEST_RLS_OWNER', 'TEST_RLS_WAITER', 'TEST_RLS_CASHIER', 'TEST_RLS_MANAGER', 'TEST_RLS_CUSTOM_A')
        OR name IN ('Test RLS Owner', 'Test RLS Waiter', 'Test RLS Cashier', 'Test RLS Manager', 'Custom Role A')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic test role UUID, code, or name already exists in public.roles!';
    END IF;

    -- 1.1.6 public.permissions collision check (Primary Key)
    IF EXISTS (
        SELECT 1 FROM public.permissions
        WHERE id IN (
            'f0000000-0000-0000-0000-000000000001',
            'f0000000-0000-0000-0000-000000000002',
            'f0000000-0000-0000-0000-000000000003',
            'f0000000-0000-0000-0000-000000000004',
            'f0000000-0000-0000-0000-000000000005',
            'f0000000-0000-0000-0000-000000000006',
            'f0000000-0000-0000-0000-000000000007'
        )
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic permission UUID already exists in public.permissions!';
    END IF;

    -- 1.1.7 public.menu_categories collision check (Primary Key & Unique Slug)
    IF EXISTS (
        SELECT 1 FROM public.menu_categories
        WHERE id IN (
            'c1000000-0000-0000-0000-000000000001',
            'c2000000-0000-0000-0000-000000000002'
        )
        OR slug IN ('biryani-cat-a', 'dosa-cat-b')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic menu_category UUID or slug already exists in public.menu_categories!';
    END IF;

    -- 1.1.8 public.menu_items collision check (Primary Key)
    IF EXISTS (
        SELECT 1 FROM public.menu_items
        WHERE id IN (
            'd1000000-0000-0000-0000-000000000001',
            'd2000000-0000-0000-0000-000000000002'
        )
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic menu_item UUID already exists in public.menu_items!';
    END IF;

    -- 1.1.9 public.dining_tables collision check (Primary Key & Table Numbers)
    IF EXISTS (
        SELECT 1 FROM public.dining_tables
        WHERE id IN (
            '71000000-0000-0000-0000-000000000001',
            '72000000-0000-0000-0000-000000000002',
            '73000000-0000-0000-0000-000000000003',
            '74000000-0000-0000-0000-000000000004'
        )
        OR table_number IN ('T-A1-01', 'T-A2-01', 'T-A3-01', 'T-B1-01')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Deterministic dining_table UUID or table_number already exists in public.dining_tables!';
    END IF;

    -- 1.1.10 public.memberships collision check (User / Tenant Relationships)
    IF EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id IN (
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333',
            '44444444-4444-4444-4444-444444444444',
            '55555555-5555-5555-5555-555555555555',
            '66666666-6666-6666-6666-666666666666',
            '77777777-7777-7777-7777-777777777777'
        )
        OR tenant_id IN (
            'a0000000-0000-0000-0000-000000000001',
            'b0000000-0000-0000-0000-000000000002'
        )
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Fixture user or tenant already exists in public.memberships!';
    END IF;

    -- 1.1.11 public.item_variants collision check
    IF EXISTS (
        SELECT 1 FROM public.item_variants 
        WHERE tenant_id IN ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Residual item_variants detected for test tenants!';
    END IF;

    -- 1.1.12 public.modifier_groups collision check
    IF EXISTS (
        SELECT 1 FROM public.modifier_groups 
        WHERE tenant_id IN ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Residual modifier_groups detected for test tenants!';
    END IF;

    -- 1.1.13 public.modifiers collision check
    IF EXISTS (
        SELECT 1 FROM public.modifiers 
        WHERE tenant_id IN ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Residual modifiers detected for test tenants!';
    END IF;

    -- 1.1.14 public.menu_item_modifiers collision check
    IF EXISTS (
        SELECT 1 FROM public.menu_item_modifiers 
        WHERE tenant_id IN ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002')
    ) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ERROR: Residual menu_item_modifiers detected for test tenants!';
    END IF;
END;
$$;

-- 1.2 Insert stub auth.users (Required to satisfy public.profiles foreign key without ON CONFLICT DO UPDATE)
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner_a@pos.test', '', timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Owner Tenant A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'waiter_a1@pos.test', '', timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Waiter Branch A1"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cashier_a1@pos.test', '', timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cashier Branch A1"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager_multi@pos.test', '', timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Multi-Branch Manager"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
    ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner_b@pos.test', '', timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Owner Tenant B"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
    ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'candidate_1@pos.test', '', timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Candidate User 1"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
    ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'candidate_2@pos.test', '', timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Candidate User 2"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

-- 1.3 Setup isolated application fixtures
DO $$
DECLARE
    -- Tenant IDs (Valid hex)
    v_tenant_a_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_tenant_b_id UUID := 'b0000000-0000-0000-0000-000000000002';

    -- Branch IDs (Valid hex)
    v_branch_a1_id UUID := 'a1000000-0000-0000-0000-000000000001';
    v_branch_a2_id UUID := 'a2000000-0000-0000-0000-000000000002';
    v_branch_a3_id UUID := 'a3000000-0000-0000-0000-000000000003';
    v_branch_b1_id UUID := 'b1000000-0000-0000-0000-000000000001';

    -- User IDs (Valid hex)
    v_user_owner_a UUID := '11111111-1111-1111-1111-111111111111';
    v_user_waiter_a1 UUID := '22222222-2222-2222-2222-222222222222';
    v_user_cashier_a1 UUID := '33333333-3333-3333-3333-333333333333';
    v_user_manager_multi UUID := '44444444-4444-4444-4444-444444444444';
    v_user_owner_b UUID := '55555555-5555-5555-5555-555555555555';
    v_user_cand1 UUID := '66666666-6666-6666-6666-666666666666';
    v_user_cand2 UUID := '77777777-7777-7777-7777-777777777777';

    -- Role IDs (Valid hex e0...)
    v_role_owner_id UUID := 'e0000000-0000-0000-0000-000000000001';
    v_role_waiter_id UUID := 'e0000000-0000-0000-0000-000000000002';
    v_role_cashier_id UUID := 'e0000000-0000-0000-0000-000000000003';
    v_role_manager_id UUID := 'e0000000-0000-0000-0000-000000000004';

    -- Permission IDs (Valid hex f0...)
    v_p_tenant_update UUID := 'f0000000-0000-0000-0000-000000000001';
    v_p_branch_manage UUID := 'f0000000-0000-0000-0000-000000000002';
    v_p_staff_manage UUID := 'f0000000-0000-0000-0000-000000000003';
    v_p_menu_manage UUID := 'f0000000-0000-0000-0000-000000000004';
    v_p_menu_toggle UUID := 'f0000000-0000-0000-0000-000000000005';
    v_p_tables_manage UUID := 'f0000000-0000-0000-0000-000000000006';
    v_p_tables_status UUID := 'f0000000-0000-0000-0000-000000000007';

    -- Catalog & Table IDs (Valid hex c..., d..., 7...)
    v_cat_a_id UUID := 'c1000000-0000-0000-0000-000000000001';
    v_cat_b_id UUID := 'c2000000-0000-0000-0000-000000000002';
    v_item_a_id UUID := 'd1000000-0000-0000-0000-000000000001';
    v_item_b_id UUID := 'd2000000-0000-0000-0000-000000000002';
    v_tbl_a1 UUID := '71000000-0000-0000-0000-000000000001';
    v_tbl_a2 UUID := '72000000-0000-0000-0000-000000000002';
    v_tbl_a3 UUID := '73000000-0000-0000-0000-000000000003';
    v_tbl_b1 UUID := '74000000-0000-0000-0000-000000000004';
BEGIN
    RAISE NOTICE 'Setting up test fixtures across Tenant A and Tenant B...';

    -- Tenants
    INSERT INTO public.tenants (id, name, slug)
    VALUES (v_tenant_a_id, 'RLS Test Tenant A', 'rls-tenant-a'),
           (v_tenant_b_id, 'RLS Test Tenant B', 'rls-tenant-b');

    -- Branches
    INSERT INTO public.branches (id, tenant_id, name, code, phone, address_line1, city, state, postal_code)
    VALUES (v_branch_a1_id, v_tenant_a_id, 'A-Outlet-1', 'AO1', '9000000001', 'Street 1', 'Bengaluru', 'KA', '560001'),
           (v_branch_a2_id, v_tenant_a_id, 'A-Outlet-2', 'AO2', '9000000002', 'Street 2', 'Bengaluru', 'KA', '560002'),
           (v_branch_a3_id, v_tenant_a_id, 'A-Outlet-3', 'AO3', '9000000003', 'Street 3', 'Bengaluru', 'KA', '560003'),
           (v_branch_b1_id, v_tenant_b_id, 'B-Outlet-1', 'BO1', '9000000004', 'Street 4', 'Mumbai', 'MH', '400001');

    -- Profiles (Direct INSERT without ON CONFLICT DO UPDATE)
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (v_user_owner_a, 'Owner Tenant A', '9000000011'),
           (v_user_waiter_a1, 'Waiter Branch A1', '9000000012'),
           (v_user_cashier_a1, 'Cashier Branch A1', '9000000013'),
           (v_user_manager_multi, 'Multi-Branch Manager', '9000000014'),
           (v_user_owner_b, 'Owner Tenant B', '9000000015'),
           (v_user_cand1, 'Candidate User 1', '9000000016'),
           (v_user_cand2, 'Candidate User 2', '9000000017');

    -- Roles (Insert test-specific global roles that cannot collide with normal production roles)
    INSERT INTO public.roles (id, name, code, is_system_role)
    VALUES (v_role_owner_id, 'Test RLS Owner', 'TEST_RLS_OWNER', TRUE),
           (v_role_waiter_id, 'Test RLS Waiter', 'TEST_RLS_WAITER', TRUE),
           (v_role_cashier_id, 'Test RLS Cashier', 'TEST_RLS_CASHIER', TRUE),
           (v_role_manager_id, 'Test RLS Manager', 'TEST_RLS_MANAGER', TRUE);

    -- Retrieve actual role IDs from database to guarantee consistent references across the suite
    SELECT id INTO v_role_owner_id FROM public.roles WHERE code = 'TEST_RLS_OWNER' AND tenant_id IS NULL;
    SELECT id INTO v_role_waiter_id FROM public.roles WHERE code = 'TEST_RLS_WAITER' AND tenant_id IS NULL;
    SELECT id INTO v_role_cashier_id FROM public.roles WHERE code = 'TEST_RLS_CASHIER' AND tenant_id IS NULL;
    SELECT id INTO v_role_manager_id FROM public.roles WHERE code = 'TEST_RLS_MANAGER' AND tenant_id IS NULL;

    IF v_role_owner_id IS NULL OR v_role_waiter_id IS NULL OR v_role_cashier_id IS NULL OR v_role_manager_id IS NULL THEN
        RAISE EXCEPTION 'FIXTURE INTEGRITY ERROR: Failed to retrieve test role IDs from public.roles!';
    END IF;

    -- Permissions: Safe insertion preserving pre-existing production permission metadata
    INSERT INTO public.permissions (id, code, category, description)
    VALUES (v_p_tenant_update, 'tenant.update', 'tenant', 'Update tenant details'),
           (v_p_branch_manage, 'branch.manage', 'branch', 'Manage branches'),
           (v_p_staff_manage, 'staff.manage', 'staff', 'Manage staff'),
           (v_p_menu_manage, 'menu.manage', 'menu', 'Manage catalog'),
           (v_p_menu_toggle, 'menu.toggle_stock', 'menu', 'Toggle item stock'),
           (v_p_tables_manage, 'tables.manage', 'tables', 'Manage floor layout'),
           (v_p_tables_status, 'tables.update_status', 'tables', 'Update table occupancy status')
    ON CONFLICT (code) DO NOTHING;

    -- Retrieve actual permission IDs by code to guarantee valid foreign keys even if pre-existing
    SELECT id INTO v_p_tenant_update FROM public.permissions WHERE code = 'tenant.update';
    SELECT id INTO v_p_branch_manage FROM public.permissions WHERE code = 'branch.manage';
    SELECT id INTO v_p_staff_manage FROM public.permissions WHERE code = 'staff.manage';
    SELECT id INTO v_p_menu_manage FROM public.permissions WHERE code = 'menu.manage';
    SELECT id INTO v_p_menu_toggle FROM public.permissions WHERE code = 'menu.toggle_stock';
    SELECT id INTO v_p_tables_manage FROM public.permissions WHERE code = 'tables.manage';
    SELECT id INTO v_p_tables_status FROM public.permissions WHERE code = 'tables.update_status';

    IF v_p_tenant_update IS NULL OR v_p_branch_manage IS NULL OR v_p_staff_manage IS NULL OR
       v_p_menu_manage IS NULL OR v_p_menu_toggle IS NULL OR v_p_tables_manage IS NULL OR v_p_tables_status IS NULL THEN
        RAISE EXCEPTION 'FIXTURE INTEGRITY ERROR: Failed to retrieve required permission IDs!';
    END IF;

    -- Role Permissions (Target ONLY the retrieved test role IDs, referencing actual retrieved permission IDs)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_owner_id, id FROM public.permissions
    WHERE code IN ('tenant.update', 'branch.manage', 'staff.manage', 'menu.manage', 'menu.toggle_stock', 'tables.manage', 'tables.update_status');

    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_waiter_id, id FROM public.permissions 
    WHERE code IN ('tables.update_status', 'menu.toggle_stock');

    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_cashier_id, id FROM public.permissions 
    WHERE code IN ('menu.toggle_stock', 'tables.update_status');

    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_manager_id, id FROM public.permissions 
    WHERE code IN ('tables.manage', 'tables.update_status', 'menu.manage', 'menu.toggle_stock');

    -- Memberships (Consistently uses retrieved test role IDs)
    INSERT INTO public.memberships (user_id, tenant_id, role_id)
    VALUES (v_user_owner_a, v_tenant_a_id, v_role_owner_id),
           (v_user_waiter_a1, v_tenant_a_id, v_role_waiter_id),
           (v_user_cashier_a1, v_tenant_a_id, v_role_cashier_id),
           (v_user_manager_multi, v_tenant_a_id, v_role_manager_id),
           (v_user_owner_b, v_tenant_b_id, v_role_owner_id);

    -- Branch Access
    INSERT INTO public.branch_access (membership_id, branch_id)
    SELECT id, v_branch_a1_id FROM public.memberships WHERE user_id = v_user_waiter_a1;

    INSERT INTO public.branch_access (membership_id, branch_id)
    SELECT id, v_branch_a1_id FROM public.memberships WHERE user_id = v_user_cashier_a1;

    INSERT INTO public.branch_access (membership_id, branch_id)
    SELECT id, v_branch_a1_id FROM public.memberships WHERE user_id = v_user_manager_multi;
    INSERT INTO public.branch_access (membership_id, branch_id)
    SELECT id, v_branch_a2_id FROM public.memberships WHERE user_id = v_user_manager_multi;

    -- Categories & Menu Items
    INSERT INTO public.menu_categories (id, tenant_id, name, slug)
    VALUES (v_cat_a_id, v_tenant_a_id, 'Biryani Cat', 'biryani-cat-a'),
           (v_cat_b_id, v_tenant_b_id, 'Dosa Cat', 'dosa-cat-b');

    INSERT INTO public.menu_items (id, tenant_id, category_id, name, base_price)
    VALUES (v_item_a_id, v_tenant_a_id, v_cat_a_id, 'Special Biryani A', 300.00),
           (v_item_b_id, v_tenant_b_id, v_cat_b_id, 'Special Dosa B', 120.00);

    -- Dining Tables
    INSERT INTO public.dining_tables (id, tenant_id, branch_id, table_number)
    VALUES (v_tbl_a1, v_tenant_a_id, v_branch_a1_id, 'T-A1-01'),
           (v_tbl_a2, v_tenant_a_id, v_branch_a2_id, 'T-A2-01'),
           (v_tbl_a3, v_tenant_a_id, v_branch_a3_id, 'T-A3-01'),
           (v_tbl_b1, v_tenant_b_id, v_branch_b1_id, 'T-B1-01');

    -- 1.4 Baseline Fixture Existence Assertions (Eliminates false-positive passes)
    IF NOT EXISTS (SELECT 1 FROM public.menu_items WHERE id = v_item_b_id AND name = 'Special Dosa B') THEN
        RAISE EXCEPTION 'FIXTURE INTEGRITY ERROR: Menu item Special Dosa B not found in database!';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.dining_tables WHERE id = v_tbl_a2 AND branch_id = v_branch_a2_id) THEN
        RAISE EXCEPTION 'FIXTURE INTEGRITY ERROR: Table T-A2-01 not found in Branch A2!';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.dining_tables WHERE id = v_tbl_a3 AND branch_id = v_branch_a3_id) THEN
        RAISE EXCEPTION 'FIXTURE INTEGRITY ERROR: Table T-A3-01 not found in Branch A3!';
    END IF;
    IF (SELECT COUNT(*) FROM public.memberships WHERE tenant_id = v_tenant_a_id) <> 4 THEN
        RAISE EXCEPTION 'FIXTURE INTEGRITY ERROR: Expected 4 memberships for Tenant A!';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.roles WHERE id = v_role_owner_id AND code = 'TEST_RLS_OWNER') THEN
        RAISE EXCEPTION 'FIXTURE INTEGRITY ERROR: Test role TEST_RLS_OWNER not found in public.roles!';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.role_permissions WHERE role_id = v_role_owner_id) THEN
        RAISE EXCEPTION 'FIXTURE INTEGRITY ERROR: Role permissions for TEST_RLS_OWNER not found in public.role_permissions!';
    END IF;

    RAISE NOTICE 'Fixture setup complete & verified.';
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 1: [RLS-POL] TENANT ISOLATION — SELECT TEST
-- Top-level role switch to 'authenticated' as User A (Tenant A)
-- Evaluates RLS policy: menu_items_select
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

DO $$
DECLARE
    v_b_count INT;
BEGIN
    -- Comprehensive Anti-Bypass Guard
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper = TRUE OR rolbypassrls = TRUE)) THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: current_user "%" possesses SUPERUSER or BYPASSRLS privileges!', current_user;
    END IF;
    IF auth.uid() IS DISTINCT FROM '11111111-1111-1111-1111-111111111111'::uuid THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: auth.uid() resolved to "%", expected User A!', auth.uid();
    END IF;

    SELECT COUNT(*) INTO v_b_count
    FROM public.menu_items
    WHERE name = 'Special Dosa B';

    IF v_b_count = 0 THEN
        RAISE NOTICE ' [PASS] Test 1: User A cannot see Tenant B records (Returned 0 rows under role: %).', current_user;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 1 FAILED: Tenant isolation breach! User A selected % records belonging to Tenant B.', v_b_count;
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 2: [RLS-POL] TENANT ISOLATION — UPDATE TEST
-- Top-level role switch to 'authenticated' as User A (Tenant A)
-- Evaluates RLS policy: menu_items_update
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

DO $$
DECLARE
    v_affected INT;
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper = TRUE OR rolbypassrls = TRUE)) THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: current_user "%" possesses SUPERUSER or BYPASSRLS privileges!', current_user;
    END IF;
    IF auth.uid() IS DISTINCT FROM '11111111-1111-1111-1111-111111111111'::uuid THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: auth.uid() resolved to "%", expected User A!', auth.uid();
    END IF;

    UPDATE public.menu_items
    SET base_price = 1.00
    WHERE name = 'Special Dosa B';

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    IF v_affected = 0 THEN
        RAISE NOTICE ' [PASS] Test 2: User A cannot update Tenant B records (% rows updated under role: %).', v_affected, current_user;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 2 FAILED: User A updated % row(s) belonging to Tenant B!', v_affected;
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 3: [RLS-POL] TENANT ISOLATION — DELETE TEST
-- Top-level role switch to 'authenticated' as User A (Tenant A)
-- Evaluates RLS policy: menu_items_delete
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

DO $$
DECLARE
    v_affected INT;
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper = TRUE OR rolbypassrls = TRUE)) THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: current_user "%" possesses SUPERUSER or BYPASSRLS privileges!', current_user;
    END IF;
    IF auth.uid() IS DISTINCT FROM '11111111-1111-1111-1111-111111111111'::uuid THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: auth.uid() resolved to "%", expected User A!', auth.uid();
    END IF;

    DELETE FROM public.menu_items WHERE name = 'Special Dosa B';
    GET DIAGNOSTICS v_affected = ROW_COUNT;

    IF v_affected = 0 THEN
        RAISE NOTICE ' [PASS] Test 3: User A cannot delete Tenant B records (% rows deleted under role: %).', v_affected, current_user;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 3 FAILED: User A deleted % row(s) belonging to Tenant B!', v_affected;
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 4: [RLS-POL] BRANCH ISOLATION — RESTRICTED OUTLET TEST
-- Top-level role switch to 'authenticated' as Waiter A1 (Assigned to Branch A1 only)
-- Evaluates RLS policies: dining_tables_select, dining_tables_update
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

DO $$
DECLARE
    v_visible_count INT;
    v_affected INT;
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper = TRUE OR rolbypassrls = TRUE)) THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: current_user "%" possesses SUPERUSER or BYPASSRLS privileges!', current_user;
    END IF;
    IF auth.uid() IS DISTINCT FROM '22222222-2222-2222-2222-222222222222'::uuid THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: auth.uid() resolved to "%", expected Waiter A1!', auth.uid();
    END IF;

    -- 4.1 SELECT test on unassigned Branch A2
    SELECT COUNT(*) INTO v_visible_count
    FROM public.dining_tables
    WHERE branch_id = 'a2000000-0000-0000-0000-000000000002';

    IF v_visible_count = 0 THEN
        RAISE NOTICE ' [PASS] Test 4.1: Waiter A1 sees 0 tables in unassigned Branch A2.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 4.1 FAILED: Waiter A1 saw % tables in unassigned Branch A2!', v_visible_count;
    END IF;

    -- 4.2 UPDATE test on unassigned Branch A2
    UPDATE public.dining_tables
    SET status = 'OCCUPIED'
    WHERE branch_id = 'a2000000-0000-0000-0000-000000000002';

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    IF v_affected = 0 THEN
        RAISE NOTICE ' [PASS] Test 4.2: Waiter A1 cannot update tables in Branch A2 (% rows updated).', v_affected;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 4.2 FAILED: Waiter A1 updated % table(s) in unassigned Branch A2!', v_affected;
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 5: [RLS-POL] ROLE PERMISSIONS — CASHIER RESTRICTION ON OWNER OPERATIONS
-- Top-level role switch to 'authenticated' as Cashier A1
-- Evaluates RLS policies: tenants_update, branches_insert (WITH CHECK)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';

DO $$
DECLARE
    v_has_public_usage BOOLEAN;
    v_has_branch_insert BOOLEAN;
    v_affected INT;
    v_caught_error BOOLEAN := FALSE;
    v_error_message TEXT := '';
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper = TRUE OR rolbypassrls = TRUE)) THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: current_user "%" possesses SUPERUSER or BYPASSRLS privileges!', current_user;
    END IF;
    IF auth.uid() IS DISTINCT FROM '33333333-3333-3333-3333-333333333333'::uuid THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: auth.uid() resolved to "%", expected Cashier A1!', auth.uid();
    END IF;

    -- 5.1 Cashier attempts to update tenant legal name (Requires tenant.update permission)
    UPDATE public.tenants
    SET legal_name = 'Hacked Tenant Legal Name'
    WHERE id = 'a0000000-0000-0000-0000-000000000001';

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    IF v_affected = 0 THEN
        RAISE NOTICE ' [PASS] Test 5.1: Cashier cannot update tenant details (% rows updated under RLS).', v_affected;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 5.1 FAILED: Cashier updated % row(s) on tenants table!', v_affected;
    END IF;

    -- 5.2 Cashier attempts to insert a new branch (Requires branch.manage permission)
    -- Independently verify schema USAGE and table INSERT privilege before testing
    v_has_public_usage := has_schema_privilege('authenticated', 'public', 'USAGE');
    v_has_branch_insert := has_table_privilege('authenticated', 'public.branches', 'INSERT');

    IF NOT v_has_public_usage THEN
        RAISE EXCEPTION 'PREREQUISITE / PRIVILEGE BOUNDARY ERROR: Role "authenticated" lacks USAGE privilege on public schema for Test 5.2!';
    END IF;

    v_caught_error := FALSE;
    BEGIN
        INSERT INTO public.branches (tenant_id, name, code, phone, address_line1, city, state, postal_code)
        VALUES ('a0000000-0000-0000-0000-000000000001', 'Cashier Rogue Branch', 'ROGUE01', '9999999999', 'Road', 'Bengaluru', 'KA', '123456');
    EXCEPTION
        WHEN insufficient_privilege OR SQLSTATE '42501' THEN
            v_caught_error := TRUE;
            v_error_message := SQLERRM;
        WHEN OTHERS THEN
            RAISE EXCEPTION ' [FAIL] Test 5.2 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
    END;

    IF NOT v_caught_error THEN
        RAISE EXCEPTION ' [FAIL] Test 5.2 FAILED: Database accepted branch insertion from Cashier!';
    END IF;

    IF NOT v_has_branch_insert THEN
        RAISE NOTICE ' [PASS] Test 5.2: Cashier branch creation blocked by Table-Level INSERT Privilege Revocation (DCL).';
    ELSE
        RAISE NOTICE ' [PASS] Test 5.2: Cashier branch creation successfully blocked by branches RLS WITH CHECK.';
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 6: [TBL-DCL & FN-UNIT] ANTI-ESCALATION — PLATFORM SUPERADMIN LOCKS
-- Top-level role switch to 'authenticated' as Owner A
-- Test 6.1 verifies Table-Level DCL Grant Lock (REVOKE ALL on platform_superadmins)
-- Test 6.2 verifies Function Unit Logic (app_private.is_superadmin() returns FALSE)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

DO $$
DECLARE
    v_has_public_usage BOOLEAN;
    v_has_insert_priv BOOLEAN;
    v_caught_error BOOLEAN := FALSE;
    v_error_message TEXT := '';
    v_is_admin BOOLEAN;
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper = TRUE OR rolbypassrls = TRUE)) THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: current_user "%" possesses SUPERUSER or BYPASSRLS privileges!', current_user;
    END IF;
    IF auth.uid() IS DISTINCT FROM '11111111-1111-1111-1111-111111111111'::uuid THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: auth.uid() resolved to "%", expected Owner A!', auth.uid();
    END IF;

    -- 6.1 [TBL-DCL] Owner attempts to insert self into platform_superadmins
    -- Independently inspects public schema USAGE and platform_superadmins INSERT privilege
    v_has_public_usage := has_schema_privilege('authenticated', 'public', 'USAGE');
    v_has_insert_priv := has_table_privilege('authenticated', 'public.platform_superadmins', 'INSERT');

    IF NOT v_has_public_usage THEN
        RAISE EXCEPTION 'PREREQUISITE / PRIVILEGE BOUNDARY ERROR: Role "authenticated" lacks USAGE privilege on public schema!';
    END IF;

    v_caught_error := FALSE;
    BEGIN
        INSERT INTO public.platform_superadmins (user_id)
        VALUES ('11111111-1111-1111-1111-111111111111');
    EXCEPTION
        WHEN insufficient_privilege OR SQLSTATE '42501' THEN
            v_caught_error := TRUE;
            v_error_message := SQLERRM;
        WHEN OTHERS THEN
            RAISE EXCEPTION ' [FAIL] Test 6.1 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
    END;

    IF NOT v_caught_error THEN
        RAISE EXCEPTION ' [FAIL] Test 6.1 FAILED: Database allowed authenticated user to insert into platform_superadmins!';
    END IF;

    IF NOT v_has_insert_priv THEN
        RAISE NOTICE ' [PASS] Test 6.1: Direct insertion into platform_superadmins blocked by Table-Level INSERT Privilege Revocation (DCL).';
    ELSE
        RAISE NOTICE ' [PASS] Test 6.1: Direct insertion into platform_superadmins rejected under SQLSTATE 42501 while table INSERT privilege was granted (RLS Policy Enforcement: %).', v_error_message;
    END IF;

    -- 6.2 [FN-UNIT] Verify app_private.is_superadmin() returns FALSE for tenant user
    -- Safely checks schema USAGE and wraps execution in an exception block
    IF NOT has_schema_privilege('authenticated', 'app_private', 'USAGE') THEN
        BEGIN
            v_is_admin := app_private.is_superadmin();
            RAISE EXCEPTION ' [FAIL] Test 6.2 FAILED: Function call succeeded unexpectedly despite missing USAGE on app_private!';
        EXCEPTION
            WHEN insufficient_privilege OR SQLSTATE '42501' THEN
                RAISE NOTICE ' [PASS] Test 6.2: Access to app_private.is_superadmin() blocked by Private Schema Permission Boundary (app_private USAGE revoked).';
            WHEN OTHERS THEN
                RAISE EXCEPTION ' [FAIL] Test 6.2 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
        END;
    ELSE
        BEGIN
            v_is_admin := app_private.is_superadmin();
            IF v_is_admin = FALSE THEN
                RAISE NOTICE ' [PASS] Test 6.2: app_private.is_superadmin() correctly reports FALSE for Tenant Owner.';
            ELSE
                RAISE EXCEPTION ' [FAIL] Test 6.2 FAILED: is_superadmin() returned TRUE for Tenant Owner!';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION ' [FAIL] Test 6.2 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
        END;
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 7: [RLS-POL & PRIV-BD] UNAUTHENTICATED (ANON) ACCESS RESTRICTION
-- Top-level role switch to 'anon'
-- Tests independent isolation across protected tables: tenants, dining_tables, menu_items, roles
-- Independently checks schema USAGE and table SELECT privileges for each table.
-- Distinguishes RLS zero-row denial from table privilege denial and private schema/function permission denial.
-- Never classifies a 42501 error as proof of RLS. Unexpected errors fail the suite.
-- ------------------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '';

DO $$
DECLARE
    v_has_public_usage BOOLEAN;
    v_has_table_select BOOLEAN;
    v_count INT;
BEGIN
    -- Anti-bypass guards for anon
    IF current_user <> 'anon' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "anon", but current_user is "%"!', current_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper = TRUE OR rolbypassrls = TRUE)) THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: current_user "%" possesses SUPERUSER or BYPASSRLS privileges!', current_user;
    END IF;
    IF auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected auth.uid() to be NULL for anon, but got "%"!', auth.uid();
    END IF;

    -- 7.1 Verify public.tenants
    v_has_public_usage := has_schema_privilege('anon', 'public', 'USAGE');
    v_has_table_select := has_table_privilege('anon', 'public.tenants', 'SELECT');
    IF NOT v_has_public_usage THEN
        RAISE NOTICE ' [PASS] Test 7.1: Anonymous access to tenants blocked by Schema Permission Boundary (anon lacks USAGE on public schema).';
    ELSIF NOT v_has_table_select THEN
        RAISE NOTICE ' [PASS] Test 7.1: Anonymous access to tenants blocked by Table-Level SELECT Privilege Revocation (DCL).';
    ELSE
        BEGIN
            SELECT COUNT(*) INTO v_count FROM public.tenants;
            IF v_count = 0 THEN
                RAISE NOTICE ' [PASS] Test 7.1: Anonymous SELECT on tenants returned 0 rows (Protection Layer: Row Level Security Zero-Row Filter).';
            ELSE
                RAISE EXCEPTION ' [FAIL] Test 7.1 FAILED: Anonymous user read % tenant records!', v_count;
            END IF;
        EXCEPTION
            WHEN insufficient_privilege OR SQLSTATE '42501' THEN
                IF SQLERRM ILIKE '%app_private%' OR SQLERRM ILIKE '%permission denied for schema app_private%' OR SQLERRM ILIKE '%permission denied for function%' THEN
                    RAISE NOTICE ' [PASS] Test 7.1: Anonymous access to tenants rejected by Private Schema/Function Permission Boundary (app_private: %).', SQLERRM;
                ELSE
                    RAISE NOTICE ' [PASS] Test 7.1: Anonymous access to tenants rejected under SQLSTATE 42501 Privilege Denial: %.', SQLERRM;
                END IF;
            WHEN OTHERS THEN
                RAISE EXCEPTION ' [FAIL] Test 7.1 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
        END;
    END IF;

    -- 7.2 Verify public.dining_tables
    v_has_public_usage := has_schema_privilege('anon', 'public', 'USAGE');
    v_has_table_select := has_table_privilege('anon', 'public.dining_tables', 'SELECT');
    IF NOT v_has_public_usage THEN
        RAISE NOTICE ' [PASS] Test 7.2: Anonymous access to dining_tables blocked by Schema Permission Boundary (anon lacks USAGE on public schema).';
    ELSIF NOT v_has_table_select THEN
        RAISE NOTICE ' [PASS] Test 7.2: Anonymous access to dining_tables blocked by Table-Level SELECT Privilege Revocation (DCL).';
    ELSE
        BEGIN
            SELECT COUNT(*) INTO v_count FROM public.dining_tables;
            IF v_count = 0 THEN
                RAISE NOTICE ' [PASS] Test 7.2: Anonymous SELECT on dining_tables returned 0 rows (Protection Layer: Row Level Security Zero-Row Filter).';
            ELSE
                RAISE EXCEPTION ' [FAIL] Test 7.2 FAILED: Anonymous user read % dining_table records!', v_count;
            END IF;
        EXCEPTION
            WHEN insufficient_privilege OR SQLSTATE '42501' THEN
                IF SQLERRM ILIKE '%app_private%' OR SQLERRM ILIKE '%permission denied for schema app_private%' OR SQLERRM ILIKE '%permission denied for function%' THEN
                    RAISE NOTICE ' [PASS] Test 7.2: Anonymous access to dining_tables rejected by Private Schema/Function Permission Boundary (app_private: %).', SQLERRM;
                ELSE
                    RAISE NOTICE ' [PASS] Test 7.2: Anonymous access to dining_tables rejected under SQLSTATE 42501 Privilege Denial: %.', SQLERRM;
                END IF;
            WHEN OTHERS THEN
                RAISE EXCEPTION ' [FAIL] Test 7.2 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
        END;
    END IF;

    -- 7.3 Verify public.menu_items
    v_has_public_usage := has_schema_privilege('anon', 'public', 'USAGE');
    v_has_table_select := has_table_privilege('anon', 'public.menu_items', 'SELECT');
    IF NOT v_has_public_usage THEN
        RAISE NOTICE ' [PASS] Test 7.3: Anonymous access to menu_items blocked by Schema Permission Boundary (anon lacks USAGE on public schema).';
    ELSIF NOT v_has_table_select THEN
        RAISE NOTICE ' [PASS] Test 7.3: Anonymous access to menu_items blocked by Table-Level SELECT Privilege Revocation (DCL).';
    ELSE
        BEGIN
            SELECT COUNT(*) INTO v_count FROM public.menu_items;
            IF v_count = 0 THEN
                RAISE NOTICE ' [PASS] Test 7.3: Anonymous SELECT on menu_items returned 0 rows (Protection Layer: Row Level Security Zero-Row Filter).';
            ELSE
                RAISE EXCEPTION ' [FAIL] Test 7.3 FAILED: Anonymous user read % menu_item records!', v_count;
            END IF;
        EXCEPTION
            WHEN insufficient_privilege OR SQLSTATE '42501' THEN
                IF SQLERRM ILIKE '%app_private%' OR SQLERRM ILIKE '%permission denied for schema app_private%' OR SQLERRM ILIKE '%permission denied for function%' THEN
                    RAISE NOTICE ' [PASS] Test 7.3: Anonymous access to menu_items rejected by Private Schema/Function Permission Boundary (app_private: %).', SQLERRM;
                ELSE
                    RAISE NOTICE ' [PASS] Test 7.3: Anonymous access to menu_items rejected under SQLSTATE 42501 Privilege Denial: %.', SQLERRM;
                END IF;
            WHEN OTHERS THEN
                RAISE EXCEPTION ' [FAIL] Test 7.3 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
        END;
    END IF;

    -- 7.4 Verify public.roles
    v_has_public_usage := has_schema_privilege('anon', 'public', 'USAGE');
    v_has_table_select := has_table_privilege('anon', 'public.roles', 'SELECT');
    IF NOT v_has_public_usage THEN
        RAISE NOTICE ' [PASS] Test 7.4: Anonymous access to roles blocked by Schema Permission Boundary (anon lacks USAGE on public schema).';
    ELSIF NOT v_has_table_select THEN
        RAISE NOTICE ' [PASS] Test 7.4: Anonymous access to roles blocked by Table-Level SELECT Privilege Revocation (DCL).';
    ELSE
        BEGIN
            SELECT COUNT(*) INTO v_count FROM public.roles;
            IF v_count = 0 THEN
                RAISE NOTICE ' [PASS] Test 7.4: Anonymous SELECT on roles returned 0 rows (Protection Layer: Row Level Security Zero-Row Filter via auth.uid() IS NOT NULL guard).';
            ELSE
                RAISE EXCEPTION ' [FAIL] Test 7.4 FAILED: Anonymous user read % role records!', v_count;
            END IF;
        EXCEPTION
            WHEN insufficient_privilege OR SQLSTATE '42501' THEN
                IF SQLERRM ILIKE '%app_private%' OR SQLERRM ILIKE '%permission denied for schema app_private%' OR SQLERRM ILIKE '%permission denied for function%' THEN
                    RAISE NOTICE ' [PASS] Test 7.4: Anonymous access to roles rejected by Private Schema/Function Permission Boundary (app_private: %).', SQLERRM;
                ELSE
                    RAISE NOTICE ' [PASS] Test 7.4: Anonymous access to roles rejected under SQLSTATE 42501 Privilege Denial: %.', SQLERRM;
                END IF;
            WHEN OTHERS THEN
                RAISE EXCEPTION ' [FAIL] Test 7.4 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
        END;
    END IF;
END;
$$;

RESET ROLE;

-- ------------------------------------------------------------------------------
-- TEST 8: [RLS-POL] MULTI-BRANCH ACCESS GRANULARITY
-- Top-level role switch to 'authenticated' as Multi-Branch Manager
-- Evaluates RLS policy: dining_tables_select across assigned (A1, A2) vs unassigned (A3)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';

DO $$
DECLARE
    v_a1_count INT;
    v_a2_count INT;
    v_a3_count INT;
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper = TRUE OR rolbypassrls = TRUE)) THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: current_user "%" possesses SUPERUSER or BYPASSRLS privileges!', current_user;
    END IF;
    IF auth.uid() IS DISTINCT FROM '44444444-4444-4444-4444-444444444444'::uuid THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: auth.uid() resolved to "%", expected Manager Multi!', auth.uid();
    END IF;

    SELECT COUNT(*) INTO v_a1_count FROM public.dining_tables WHERE branch_id = 'a1000000-0000-0000-0000-000000000001';
    SELECT COUNT(*) INTO v_a2_count FROM public.dining_tables WHERE branch_id = 'a2000000-0000-0000-0000-000000000002';
    SELECT COUNT(*) INTO v_a3_count FROM public.dining_tables WHERE branch_id = 'a3000000-0000-0000-0000-000000000003';

    IF v_a1_count >= 1 AND v_a2_count >= 1 AND v_a3_count = 0 THEN
        RAISE NOTICE ' [PASS] Test 8: Manager sees tables in assigned outlets A1 (%) and A2 (%), but 0 in unassigned A3 (%).',
            v_a1_count, v_a2_count, v_a3_count;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 8 FAILED: Multi-branch isolation error! A1=%, A2=%, A3=%',
            v_a1_count, v_a2_count, v_a3_count;
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 9: [RLS-POL] TENANT STAFF MANAGEMENT & PROFILE VISIBILITY
-- Top-level role switch to 'authenticated' as Owner A
-- Evaluates RLS policies: memberships_select, profiles_select, branch_access_modify
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

DO $$
DECLARE
    v_staff_count INT;
    v_waiter_profile_count INT;
    v_ba_count INT;
    v_waiter_mem_id UUID;
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;

    -- 9.1 Owner can see all staff memberships belonging to their tenant
    SELECT COUNT(*) INTO v_staff_count
    FROM public.memberships
    WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001';

    IF v_staff_count = 4 THEN
        RAISE NOTICE ' [PASS] Test 9.1: Owner sees all % staff memberships in Tenant A.', v_staff_count;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 9.1 FAILED: Owner saw % memberships in Tenant A, expected 4!', v_staff_count;
    END IF;

    -- 9.2 Owner can view profile of a staff member in their tenant
    SELECT COUNT(*) INTO v_waiter_profile_count
    FROM public.profiles
    WHERE id = '22222222-2222-2222-2222-222222222222';

    IF v_waiter_profile_count = 1 THEN
        RAISE NOTICE ' [PASS] Test 9.2: Owner can view profile of Waiter A1 in their tenant.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 9.2 FAILED: Owner could not view Waiter A1 profile in Tenant A!';
    END IF;

    -- 9.3 Owner can grant branch access to a staff member in their tenant
    SELECT id INTO v_waiter_mem_id
    FROM public.memberships
    WHERE user_id = '22222222-2222-2222-2222-222222222222';

    INSERT INTO public.branch_access (membership_id, branch_id)
    VALUES (v_waiter_mem_id, 'a2000000-0000-0000-0000-000000000002');

    SELECT COUNT(*) INTO v_ba_count
    FROM public.branch_access
    WHERE membership_id = v_waiter_mem_id;

    IF v_ba_count = 2 THEN
        RAISE NOTICE ' [PASS] Test 9.3: Owner successfully granted and verified branch access for Waiter A1 (% branches).', v_ba_count;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 9.3 FAILED: Owner could not grant or verify branch access for Waiter A1!';
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 10: [RLS-POL] ANTI-ESCALATION — CROSS-TENANT & PRIVILEGED ROLE RESTRICTIONS
-- Evaluates RLS policy: memberships_insert (WITH CHECK)
-- ------------------------------------------------------------------------------
-- Setup test role for Tenant A under postgres session user
INSERT INTO public.roles (id, name, code, tenant_id, is_system_role)
VALUES ('e0000000-0000-0000-0000-000000000099', 'Custom Role A', 'TEST_RLS_CUSTOM_A', 'a0000000-0000-0000-0000-000000000001', FALSE);

-- Pre-retrieval DO block (Executed in privileged postgres context before switching role to authenticated)
DO $$
DECLARE
    v_custom_role_id UUID;
    v_super_role_id UUID;
BEGIN
    -- Prerequisite assertions in privileged postgres context (unaffected by client RLS)
    SELECT id INTO v_custom_role_id 
    FROM public.roles 
    WHERE code = 'TEST_RLS_CUSTOM_A' AND tenant_id = 'a0000000-0000-0000-0000-000000000001';

    IF v_custom_role_id IS NULL THEN
        RAISE EXCEPTION 'PREREQUISITE ERROR: Role TEST_RLS_CUSTOM_A belonging to Tenant A not found for Test 10.1!';
    END IF;

    SELECT id INTO v_super_role_id 
    FROM public.roles 
    WHERE code = 'SUPER_ADMIN' AND tenant_id IS NULL;

    IF v_super_role_id IS NULL THEN
        RAISE EXCEPTION 'PREREQUISITE ERROR: Required global role SUPER_ADMIN not found in public.roles for Test 10.2! Seed global SUPER_ADMIN role before running test.';
    END IF;

    -- Store pre-retrieved IDs in transaction-local settings
    PERFORM set_config('test_context.custom_role_id', v_custom_role_id::text, true);
    PERFORM set_config('test_context.super_role_id', v_super_role_id::text, true);
END;
$$;

-- Switch to authenticated role as Owner B
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "55555555-5555-5555-5555-555555555555", "role": "authenticated"}';

DO $$
DECLARE
    v_has_public_usage BOOLEAN;
    v_has_membership_insert BOOLEAN;
    v_caught_cross_error BOOLEAN := FALSE;
    v_caught_super_error BOOLEAN := FALSE;
    v_custom_role_id UUID;
    v_super_role_id UUID;
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;

    -- Prerequisite assertions: Verify schema USAGE and table INSERT privilege
    v_has_public_usage := has_schema_privilege('authenticated', 'public', 'USAGE');
    v_has_membership_insert := has_table_privilege('authenticated', 'public.memberships', 'INSERT');

    IF NOT v_has_public_usage THEN
        RAISE EXCEPTION 'PREREQUISITE / PRIVILEGE BOUNDARY ERROR: Role "authenticated" lacks USAGE privilege on public schema for Test 10!';
    END IF;

    IF NOT v_has_membership_insert THEN
        RAISE EXCEPTION 'PREREQUISITE / DCL ERROR: Role "authenticated" lacks INSERT privilege on public.memberships!';
    END IF;

    -- Retrieve pre-verified role IDs from transaction-local context (bypassing client RLS query bias)
    v_custom_role_id := current_setting('test_context.custom_role_id', true)::uuid;
    v_super_role_id := current_setting('test_context.super_role_id', true)::uuid;

    IF v_custom_role_id IS NULL THEN
        RAISE EXCEPTION 'PREREQUISITE ERROR: Role TEST_RLS_CUSTOM_A belonging to Tenant A not found for Test 10.1!';
    END IF;

    IF v_super_role_id IS NULL THEN
        RAISE EXCEPTION 'PREREQUISITE ERROR: Required global role SUPER_ADMIN not found in public.roles for Test 10.2! Seed global SUPER_ADMIN role before running test.';
    END IF;

    -- 10.1 Owner B attempts to create a membership in Tenant B using Tenant A's custom role
    -- Uses valid fixture user '66666666-6666-6666-6666-666666666666' (exists in profiles)
    BEGIN
        INSERT INTO public.memberships (user_id, tenant_id, role_id)
        VALUES ('66666666-6666-6666-6666-666666666666', 'b0000000-0000-0000-0000-000000000002', v_custom_role_id);
    EXCEPTION
        WHEN insufficient_privilege OR SQLSTATE '42501' THEN
            v_caught_cross_error := TRUE;
        WHEN OTHERS THEN
            RAISE EXCEPTION ' [FAIL] Test 10.1 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
    END;

    IF v_caught_cross_error THEN
        RAISE NOTICE ' [PASS] Test 10.1: Cross-tenant custom role assignment blocked by memberships WITH CHECK.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 10.1 FAILED: Database accepted cross-tenant custom role in memberships!';
    END IF;

    -- 10.2 Owner B attempts to create a membership with global SUPER_ADMIN role
    -- Uses valid fixture user '77777777-7777-7777-7777-777777777777' (exists in profiles)
    BEGIN
        INSERT INTO public.memberships (user_id, tenant_id, role_id)
        VALUES ('77777777-7777-7777-7777-777777777777', 'b0000000-0000-0000-0000-000000000002', v_super_role_id);
    EXCEPTION
        WHEN insufficient_privilege OR SQLSTATE '42501' THEN
            v_caught_super_error := TRUE;
        WHEN OTHERS THEN
            RAISE EXCEPTION ' [FAIL] Test 10.2 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
    END;

    IF v_caught_super_error THEN
        RAISE NOTICE ' [PASS] Test 10.2: Privileged SUPER_ADMIN role assignment blocked by memberships WITH CHECK.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 10.2 FAILED: Database accepted SUPER_ADMIN assignment in memberships!';
    END IF;
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 11: [RLS-POL] SOFT-DELETE AUTHORIZATION RESTRICTION ON DINING TABLES
-- Top-level role switch to 'authenticated' as Waiter A1 (has tables.update_status, NOT tables.manage)
-- Evaluates RLS policy: dining_tables_update (WITH CHECK deleted_at IS NULL)
-- ------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

DO $$
DECLARE
    v_has_public_usage BOOLEAN;
    v_has_table_update BOOLEAN;
    v_caught_error BOOLEAN := FALSE;
    v_affected INT := 0;
    v_initial_deleted_at TIMESTAMPTZ;
BEGIN
    IF current_user <> 'authenticated' THEN
        RAISE EXCEPTION 'RLS GUARD FAILED: Expected role "authenticated", but current_user is "%"!', current_user;
    END IF;

    -- Prerequisite 1: Verify schema USAGE and table UPDATE privileges independently
    v_has_public_usage := has_schema_privilege('authenticated', 'public', 'USAGE');
    v_has_table_update := has_table_privilege('authenticated', 'public.dining_tables', 'UPDATE');

    IF NOT v_has_public_usage THEN
        RAISE EXCEPTION 'PREREQUISITE ERROR: Role "authenticated" lacks USAGE on public schema for Test 11!';
    END IF;
    IF NOT v_has_table_update THEN
        RAISE EXCEPTION 'PREREQUISITE ERROR: Role "authenticated" lacks UPDATE privilege on public.dining_tables for Test 11!';
    END IF;

    -- Prerequisite 2: Ensure target table exists, is active, and visible to Waiter A1 under USING condition
    SELECT deleted_at INTO v_initial_deleted_at
    FROM public.dining_tables
    WHERE id = '71000000-0000-0000-0000-000000000001';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PREREQUISITE ERROR: Dining table 71000000-0000-0000-0000-000000000001 is not visible to Waiter A1 under RLS USING clause!';
    END IF;

    IF v_initial_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'PREREQUISITE ERROR: Dining table is already soft-deleted (deleted_at is %)!', v_initial_deleted_at;
    END IF;

    -- 11.1 Waiter attempts to soft-delete dining table (blocked by WITH CHECK requiring tables.manage)
    -- Distinguishes an RLS denial from a zero-row result caused by a USING condition.
    BEGIN
        UPDATE public.dining_tables
        SET deleted_at = timezone('utc', now())
        WHERE id = '71000000-0000-0000-0000-000000000001';
        GET DIAGNOSTICS v_affected = ROW_COUNT;
    EXCEPTION
        WHEN insufficient_privilege OR SQLSTATE '42501' THEN
            v_caught_error := TRUE;
        WHEN OTHERS THEN
            RAISE EXCEPTION ' [FAIL] Test 11.1 FAILED with unexpected error: % (SQLSTATE %)', SQLERRM, SQLSTATE;
    END;

    IF NOT v_caught_error THEN
        IF v_affected = 0 THEN
            RAISE EXCEPTION ' [FAIL] Test 11.1 FAILED: Update matched 0 rows due to USING filter; WITH CHECK policy was not evaluated!';
        ELSE
            RAISE EXCEPTION ' [FAIL] Test 11.1 FAILED: Waiter without tables.manage was permitted to update % row(s) and soft-delete the table!', v_affected;
        END IF;
    END IF;

    RAISE NOTICE ' [PASS] Test 11.1: Waiter attempt to soft-delete table blocked by dining_tables WITH CHECK.';

    -- 11.2 Waiter updates status to OCCUPIED on active table (permitted by tables.update_status)
    UPDATE public.dining_tables
    SET status = 'OCCUPIED'
    WHERE id = '71000000-0000-0000-0000-000000000001';

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    IF v_affected <> 1 THEN
        RAISE EXCEPTION ' [FAIL] Test 11.2 FAILED: Waiter could not update table status (affected % rows, expected 1)!', v_affected;
    END IF;

    RAISE NOTICE ' [PASS] Test 11.2: Waiter successfully updated table status to OCCUPIED on active table (affected exactly 1 row).';
END;
$$;

RESET ROLE;
SET LOCAL "request.jwt.claims" = '';

-- ------------------------------------------------------------------------------
-- TEST 11 POST-CHECK: Active-Row Preservation & In-Place Modification Verification
-- Executed under privileged postgres session user context to guarantee forensic accuracy.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_final_deleted_at TIMESTAMPTZ;
    v_final_status VARCHAR;
BEGIN
    SELECT deleted_at, status INTO v_final_deleted_at, v_final_status
    FROM public.dining_tables
    WHERE id = '71000000-0000-0000-0000-000000000001';

    IF NOT FOUND THEN
        RAISE EXCEPTION ' [FAIL] Test 11 Post-Check FAILED: Dining table row disappeared or is missing from database!';
    END IF;

    IF v_final_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION ' [FAIL] Test 11.1 Outcome FAILED: Dining table row was soft-deleted! deleted_at is % (expected NULL)', v_final_deleted_at;
    END IF;

    IF v_final_status <> 'OCCUPIED' THEN
        RAISE EXCEPTION ' [FAIL] Test 11.2 Outcome FAILED: Dining table status is %, expected OCCUPIED!', v_final_status;
    END IF;

    RAISE NOTICE ' [PASS] Test 11 State Verified (Privileged Context): Target table remains active with deleted_at IS NULL and status = OCCUPIED.';
END;
$$;

-- Cleanly rollback all test data and fixtures
ROLLBACK;
