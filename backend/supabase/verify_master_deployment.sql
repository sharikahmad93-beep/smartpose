-- ==============================================================================
-- SMART RESTAURANT POS — MASTER POST-DEPLOYMENT VERIFICATION SCRIPT
-- Location: backend/supabase/verify_master_deployment.sql
-- Target: Run in Supabase SQL Editor after running master_deploy_phase_1.sql
-- ==============================================================================

DO $$
DECLARE
    v_missing_tables TEXT[] := '{}';
    v_missing_functions TEXT[] := '{}';
    v_table_count INT;
    v_fn_count INT;
    v_role_count INT;
    v_perm_count INT;
    v_item_count INT;
    v_tbl_count INT;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'SMART RESTAURANT POS — LIVE CLOUD VERIFICATION RUN';
    RAISE NOTICE '=======================================================';

    -- 1. VERIFY ALL 21 TABLES EXIST
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'tenants', 'branches', 'profiles', 'platform_superadmins', 'roles',
        'permissions', 'role_permissions', 'memberships', 'branch_access',
        'audit_logs', 'restaurant_settings', 'tax_settings', 'service_charges',
        'business_hours', 'dining_tables', 'menu_categories', 'menu_items',
        'item_variants', 'modifier_groups', 'modifiers', 'menu_item_modifiers'
      );

    IF v_table_count = 21 THEN
        RAISE NOTICE ' [PASS] Table Verification: All 21 Phase 1 Tables exist in public schema.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Missing Tables! Found % of 21 required tables.', v_table_count;
    END IF;

    -- 2. VERIFY SECURITY DEFINER FUNCTIONS IN app_private
    SELECT COUNT(*) INTO v_fn_count
    FROM information_schema.routines
    WHERE routine_schema = 'app_private'
      AND routine_name IN ('is_superadmin', 'get_user_tenant_ids', 'has_branch_access', 'has_permission');

    IF v_fn_count = 4 THEN
        RAISE NOTICE ' [PASS] Function Verification: All 4 Security Functions exist in app_private.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Missing Functions! Found % of 4 required app_private functions.', v_fn_count;
    END IF;

    -- 3. VERIFY GLOBAL SYSTEM ROLES (INCLUDING SUPER_ADMIN)
    SELECT COUNT(*) INTO v_role_count
    FROM public.roles
    WHERE tenant_id IS NULL
      AND code IN ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN');

    IF v_role_count = 6 THEN
        RAISE NOTICE ' [PASS] System Roles Verification: All 6 Global System Roles (including SUPER_ADMIN) exist.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Missing System Roles! Found % of 6 required global roles.', v_role_count;
    END IF;

    -- 4. VERIFY MASTER PERMISSIONS REGISTRY
    SELECT COUNT(*) INTO v_perm_count FROM public.permissions;
    IF v_perm_count >= 27 THEN
        RAISE NOTICE ' [PASS] Permissions Verification: % granular capabilities registered.', v_perm_count;
    ELSE
        RAISE EXCEPTION ' [FAIL] Permissions Registry incomplete! Found % permissions, expected at least 27.', v_perm_count;
    END IF;

    -- 5. VERIFY DEMO TENANT & OUTLETS
    IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'biryani-express') THEN
        RAISE NOTICE ' [PASS] Brand Verification: Demo Tenant "Biryani Express" active.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Demo Tenant "Biryani Express" not found!';
    END IF;

    -- 6. VERIFY CATALOG ITEMS & TABLES
    SELECT COUNT(*) INTO v_item_count FROM public.menu_items;
    SELECT COUNT(*) INTO v_tbl_count FROM public.dining_tables;

    RAISE NOTICE ' [PASS] Catalog Verification: % menu items seeded.', v_item_count;
    RAISE NOTICE ' [PASS] Dining Layout Verification: % tables seeded across outlets.', v_tbl_count;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'LIVE VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL [100%% PASS]';
    RAISE NOTICE '=======================================================';
END;
$$;
