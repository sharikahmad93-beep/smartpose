-- ==============================================================================
-- SMART RESTAURANT POS — AUTOMATED SECURITY & RLS TEST SUITE
-- Target: Supabase PostgreSQL 15+
-- Location: backend/supabase/tests/security_and_rls_test.sql
-- Execution: Fully isolated transaction (BEGIN ... ROLLBACK)
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    -- Test Identifiers
    v_tenant_a_id UUID := gen_random_uuid();
    v_tenant_b_id UUID := gen_random_uuid();
    v_branch_a1_id UUID := gen_random_uuid();
    v_branch_b1_id UUID := gen_random_uuid();
    v_cat_a_id UUID := gen_random_uuid();
    v_cat_b_id UUID := gen_random_uuid();
    v_item_a_id UUID := gen_random_uuid();
    v_item_b_id UUID := gen_random_uuid();
    v_role_global_id UUID := gen_random_uuid();
    v_role_tenant_id UUID := gen_random_uuid();

    -- Verification variables
    v_count INT;
    v_fk_caught BOOLEAN := FALSE;
    v_privilege_blocked BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'SMART RESTAURANT POS — EXECUTABLE SQL SECURITY TEST SUITE';
    RAISE NOTICE '=======================================================';

    -- --------------------------------------------------------------------------
    -- FIXTURE SETUP: Create Valid Tenant A and Tenant B Entities
    -- --------------------------------------------------------------------------
    INSERT INTO public.tenants (id, name, slug)
    VALUES (v_tenant_a_id, 'Test Biryani Express', 'test-biryani-exp');

    INSERT INTO public.tenants (id, name, slug)
    VALUES (v_tenant_b_id, 'Test Dosa Plaza', 'test-dosa-plaza');

    INSERT INTO public.branches (id, tenant_id, name, code, phone, address_line1, city, state, postal_code)
    VALUES (v_branch_a1_id, v_tenant_a_id, 'Indiranagar Outlet', 'IND01', '9876543210', '100 Feet Rd', 'Bengaluru', 'KA', '560038');

    INSERT INTO public.branches (id, tenant_id, name, code, phone, address_line1, city, state, postal_code)
    VALUES (v_branch_b1_id, v_tenant_b_id, 'Koramangala Outlet', 'KOR01', '9876543211', '80 Feet Rd', 'Bengaluru', 'KA', '560034');

    INSERT INTO public.menu_categories (id, tenant_id, name, slug)
    VALUES (v_cat_a_id, v_tenant_a_id, 'Main Course', 'main-course-a');

    INSERT INTO public.menu_categories (id, tenant_id, name, slug)
    VALUES (v_cat_b_id, v_tenant_b_id, 'Breakfast', 'breakfast-b');

    INSERT INTO public.menu_items (id, tenant_id, category_id, name, base_price)
    VALUES (v_item_a_id, v_tenant_a_id, v_cat_a_id, 'Chicken Biryani', 280.00);

    INSERT INTO public.menu_items (id, tenant_id, category_id, name, base_price)
    VALUES (v_item_b_id, v_tenant_b_id, v_cat_b_id, 'Masala Dosa', 90.00);

    RAISE NOTICE 'Setup complete: Tenant A (% / %) and Tenant B (% / %) created.', 
        v_tenant_a_id, v_branch_a1_id, v_tenant_b_id, v_branch_b1_id;

    -- --------------------------------------------------------------------------
    -- TEST 1: CROSS-TENANT DINING TABLE INTEGRITY (Issue 2 Fix Verification)
    -- Attempt to insert a dining table associating Tenant A with Tenant B branch.
    -- --------------------------------------------------------------------------
    RAISE NOTICE 'TEST 1: Executing Cross-Tenant Dining Table Foreign Key Assertion...';
    v_fk_caught := FALSE;
    BEGIN
        INSERT INTO public.dining_tables (id, tenant_id, branch_id, table_number)
        VALUES (gen_random_uuid(), v_tenant_a_id, v_branch_b1_id, 'T-CROSS-1');
    EXCEPTION WHEN foreign_key_violation THEN
        v_fk_caught := TRUE;
    END;

    IF v_fk_caught THEN
        RAISE NOTICE ' [PASS] Test 1: Cross-tenant dining table successfully rejected by composite FK.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 1 FAILED: Database accepted cross-tenant dining_table associating Tenant A with Tenant B branch!';
    END IF;

    -- --------------------------------------------------------------------------
    -- TEST 2: CROSS-TENANT ITEM VARIANT INTEGRITY
    -- Attempt to insert an item_variant associating Tenant A with Tenant B item.
    -- --------------------------------------------------------------------------
    RAISE NOTICE 'TEST 2: Executing Cross-Tenant Item Variant Foreign Key Assertion...';
    v_fk_caught := FALSE;
    BEGIN
        INSERT INTO public.item_variants (tenant_id, item_id, name, price_difference)
        VALUES (v_tenant_a_id, v_item_b_id, 'Cross Variant', 20.00);
    EXCEPTION WHEN foreign_key_violation THEN
        v_fk_caught := TRUE;
    END;

    IF v_fk_caught THEN
        RAISE NOTICE ' [PASS] Test 2: Cross-tenant item variant successfully rejected by composite FK.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 2 FAILED: Database accepted cross-tenant item_variant!';
    END IF;

    -- --------------------------------------------------------------------------
    -- TEST 3: GLOBAL ROLE AUDIT TRIGGER NULL SAFETY (Issue 1 Fix Verification)
    -- Insert, update, and delete a system role where tenant_id IS NULL.
    -- --------------------------------------------------------------------------
    RAISE NOTICE 'TEST 3: Executing Global Role Audit Trigger NULL-Safety Assertion...';
    BEGIN
        -- 3.1 Insert global system role (tenant_id IS NULL)
        INSERT INTO public.roles (id, name, code, tenant_id, is_system_role)
        VALUES (v_role_global_id, 'Test System Auditor', 'TEST_GLOBAL_SYS_AUDITOR', NULL, TRUE);

        -- 3.2 Update global system role
        UPDATE public.roles
        SET name = 'Updated System Auditor'
        WHERE id = v_role_global_id;

        -- 3.3 Delete global system role
        DELETE FROM public.roles
        WHERE id = v_role_global_id;

        RAISE NOTICE ' [PASS] Test 3: Global role lifecycle executed cleanly without audit NOT NULL violation.';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION ' [FAIL] Test 3 FAILED: Trigger crashed on NULL tenant_id role: %', SQLERRM;
    END;

    -- --------------------------------------------------------------------------
    -- TEST 4: TENANT ROLE AUDIT TRIGGER PRESERVATION
    -- Verify tenant-owned role changes STILL generate audit records as expected.
    -- --------------------------------------------------------------------------
    RAISE NOTICE 'TEST 4: Executing Tenant Role Audit Trigger Preservation Assertion...';
    INSERT INTO public.roles (id, name, code, tenant_id, is_system_role)
    VALUES (v_role_tenant_id, 'Special Waiter', 'SPEC_WAITER', v_tenant_a_id, FALSE);

    SELECT COUNT(*) INTO v_count
    FROM public.audit_logs
    WHERE entity_name = 'roles'
      AND entity_id = v_role_tenant_id
      AND tenant_id = v_tenant_a_id;

    IF v_count >= 1 THEN
        RAISE NOTICE ' [PASS] Test 4: Tenant role mutation successfully generated % audit record(s).', v_count;
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 4 FAILED: Audit record was not generated for tenant-owned role!';
    END IF;

    -- --------------------------------------------------------------------------
    -- TEST 5: GLOBAL ROLE UNIQUENESS PARTIAL INDEX (Issue 4 Fix Verification)
    -- Attempt to insert duplicate global role codes.
    -- --------------------------------------------------------------------------
    RAISE NOTICE 'TEST 5: Executing Global Role Code Uniqueness Assertion...';
    INSERT INTO public.roles (name, code, tenant_id, is_system_role)
    VALUES ('Global Manager 1', 'GLOBAL_MGR', NULL, TRUE);

    v_fk_caught := FALSE;
    BEGIN
        INSERT INTO public.roles (name, code, tenant_id, is_system_role)
        VALUES ('Global Manager 2', 'GLOBAL_MGR', NULL, TRUE);
    EXCEPTION WHEN unique_violation THEN
        v_fk_caught := TRUE;
    END;

    IF v_fk_caught THEN
        RAISE NOTICE ' [PASS] Test 5: Duplicate global role code successfully rejected by partial index uq_roles_global_code.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 5 FAILED: Duplicate global role code was accepted!';
    END IF;

    -- --------------------------------------------------------------------------
    -- TEST 6: CLIENT PRIVILEGE LOCKS (TABLE GRANT INTEGRITY)
    -- Verify that client roles (authenticated) cannot write to audit_logs or platform_superadmins.
    -- --------------------------------------------------------------------------
    RAISE NOTICE 'TEST 6: Executing Client Privilege Boundary Assertions...';

    -- 6.1 audit_logs write lock
    IF has_table_privilege('authenticated', 'public.audit_logs', 'INSERT') = FALSE AND
       has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE') = FALSE AND
       has_table_privilege('authenticated', 'public.audit_logs', 'DELETE') = FALSE THEN
        RAISE NOTICE ' [PASS] Test 6.1: Direct client write privileges on audit_logs are revoked.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 6.1 FAILED: authenticated role still has write privileges on audit_logs!';
    END IF;

    -- 6.2 platform_superadmins write and select lock
    IF has_table_privilege('authenticated', 'public.platform_superadmins', 'INSERT') = FALSE AND
       has_table_privilege('authenticated', 'public.platform_superadmins', 'UPDATE') = FALSE AND
       has_table_privilege('authenticated', 'public.platform_superadmins', 'DELETE') = FALSE AND
       has_table_privilege('authenticated', 'public.platform_superadmins', 'SELECT') = FALSE THEN
        RAISE NOTICE ' [PASS] Test 6.2: Direct client privileges on platform_superadmins are completely revoked.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 6.2 FAILED: authenticated role still holds direct access on platform_superadmins!';
    END IF;

    -- --------------------------------------------------------------------------
    -- TEST 7: SECURITY DEFINER FUNCTIONS NULL AUTH SAFETY
    -- --------------------------------------------------------------------------
    RAISE NOTICE 'TEST 7: Executing Security Functions NULL-Auth Safety Assertions...';
    IF app_private.is_superadmin() = FALSE THEN
        RAISE NOTICE ' [PASS] Test 7.1: is_superadmin() returns FALSE for unauthenticated caller.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 7.1 FAILED: is_superadmin() returned TRUE for NULL auth.uid()!';
    END IF;

    IF app_private.has_branch_access(v_branch_a1_id) = FALSE THEN
        RAISE NOTICE ' [PASS] Test 7.2: has_branch_access() returns FALSE for unauthenticated caller.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 7.2 FAILED: has_branch_access() returned TRUE for NULL auth.uid()!';
    END IF;

    IF app_private.has_permission('tenant.update', v_tenant_a_id) = FALSE THEN
        RAISE NOTICE ' [PASS] Test 7.3: has_permission() returns FALSE for unauthenticated caller.';
    ELSE
        RAISE EXCEPTION ' [FAIL] Test 7.3 FAILED: has_permission() returned TRUE for NULL auth.uid()!';
    END IF;

    -- --------------------------------------------------------------------------
    -- TEST 8: SOFT-DELETE PARTIAL UNIQUE INDEX REUSE ASSERTION
    -- Verify that soft-deleted slug/code can be reused cleanly.
    -- --------------------------------------------------------------------------
    RAISE NOTICE 'TEST 8: Executing Soft-Delete Partial Unique Index Reuse Assertion...';
    -- Create branch, soft-delete it, and recreate same code
    INSERT INTO public.branches (tenant_id, name, code, phone, address_line1, city, state, postal_code, deleted_at)
    VALUES (v_tenant_a_id, 'Old Branch', 'REUSE01', '9999999999', 'Old Rd', 'City', 'ST', '123456', timezone('utc', now()));

    BEGIN
        INSERT INTO public.branches (tenant_id, name, code, phone, address_line1, city, state, postal_code)
        VALUES (v_tenant_a_id, 'New Active Branch', 'REUSE01', '9999999999', 'New Rd', 'City', 'ST', '123456');
        RAISE NOTICE ' [PASS] Test 8: Soft-deleted branch code successfully reused by active branch.';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION ' [FAIL] Test 8 FAILED: Partial index blocked reuse of soft-deleted branch code: %', SQLERRM;
    END;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'ALL 8 EXECUTABLE SECURITY TEST SUITES PASSED CLEANLY!';
    RAISE NOTICE '=======================================================';
END;
$$;

ROLLBACK;
