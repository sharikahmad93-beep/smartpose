-- ==============================================================================
-- SMART RESTAURANT POS — MIGRATION 004: SECURITY FUNCTIONS AND RLS POLICIES
-- Target: Supabase PostgreSQL 15+
-- Schema Version: 20261114000004_security_functions_and_rls.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS (app_private SCHEMA)
-- ------------------------------------------------------------------------------

-- 1.1 is_superadmin()
-- Verifies whether current user is in platform_superadmins table.
CREATE OR REPLACE FUNCTION app_private.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
STABLE
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.platform_superadmins
        WHERE user_id = v_user_id
    );
END;
$$;

REVOKE ALL ON FUNCTION app_private.is_superadmin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_superadmin() TO authenticated, service_role;

-- 1.2 get_user_tenant_ids()
-- Returns all tenant UUIDs where the authenticated user has an active membership.
CREATE OR REPLACE FUNCTION app_private.get_user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
STABLE
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT m.tenant_id
    FROM public.memberships m
    JOIN public.tenants t ON t.id = m.tenant_id
    WHERE m.user_id = v_user_id
      AND m.is_active = TRUE
      AND t.is_active = TRUE
      AND t.deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION app_private.get_user_tenant_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.get_user_tenant_ids() TO authenticated, service_role;

-- 1.3 has_branch_access(target_branch_id UUID)
-- Verifies branch authorization. Owners have blanket access to all branches of their tenant.
-- Other roles require an explicit branch_access record.
CREATE OR REPLACE FUNCTION app_private.has_branch_access(target_branch_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
STABLE
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_tenant_id UUID;
    v_role_code VARCHAR;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF app_private.is_superadmin() THEN
        RETURN TRUE;
    END IF;

    -- Resolve tenant for the requested branch
    SELECT tenant_id INTO v_tenant_id
    FROM public.branches
    WHERE id = target_branch_id AND deleted_at IS NULL;

    IF v_tenant_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check user role within this tenant
    SELECT r.code INTO v_role_code
    FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = v_user_id
      AND m.tenant_id = v_tenant_id
      AND m.is_active = TRUE;

    IF v_role_code = 'OWNER' THEN
        RETURN TRUE;
    END IF;

    -- Check explicit branch authorization
    RETURN EXISTS (
        SELECT 1
        FROM public.memberships m
        JOIN public.branch_access ba ON ba.membership_id = m.id
        WHERE m.user_id = v_user_id
          AND m.tenant_id = v_tenant_id
          AND ba.branch_id = target_branch_id
          AND m.is_active = TRUE
    );
END;
$$;

REVOKE ALL ON FUNCTION app_private.has_branch_access(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.has_branch_access(UUID) TO authenticated, service_role;

-- 1.4 has_permission(required_permission VARCHAR, target_tenant_id UUID)
-- Checks granular RBAC capability keys.
CREATE OR REPLACE FUNCTION app_private.has_permission(required_permission VARCHAR, target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
STABLE
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF app_private.is_superadmin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.memberships m
        JOIN public.roles r ON r.id = m.role_id
        JOIN public.role_permissions rp ON rp.role_id = r.id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE m.user_id = v_user_id
          AND m.tenant_id = target_tenant_id
          AND m.is_active = TRUE
          AND p.code = required_permission
    );
END;
$$;

REVOKE ALL ON FUNCTION app_private.has_permission(VARCHAR, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.has_permission(VARCHAR, UUID) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ACROSS ALL 21 PUBLIC TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. RLS POLICIES — DOMAIN A: TENANCY AND ACCESS
-- ------------------------------------------------------------------------------

-- 3.1 tenants
CREATE POLICY "tenants_select" ON public.tenants
    FOR SELECT USING (
        id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "tenants_insert" ON public.tenants
    FOR INSERT WITH CHECK (app_private.is_superadmin());

CREATE POLICY "tenants_update" ON public.tenants
    FOR UPDATE USING (
        app_private.is_superadmin()
        OR (id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('tenant.update', id))
    ) WITH CHECK (
        app_private.is_superadmin()
        OR (id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('tenant.update', id))
    );

CREATE POLICY "tenants_delete" ON public.tenants
    FOR DELETE USING (app_private.is_superadmin());

-- 3.2 branches
CREATE POLICY "branches_select" ON public.branches
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "branches_insert" ON public.branches
    FOR INSERT WITH CHECK (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('branch.manage', tenant_id))
    );

CREATE POLICY "branches_update" ON public.branches
    FOR UPDATE USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('branch.manage', tenant_id))
    ) WITH CHECK (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('branch.manage', tenant_id))
    );

CREATE POLICY "branches_delete" ON public.branches
    FOR DELETE USING (app_private.is_superadmin());

-- 3.3 profiles
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (
        id = auth.uid()
        OR app_private.is_superadmin()
        OR id IN (
            SELECT m.user_id FROM public.memberships m
            WHERE m.tenant_id IN (SELECT app_private.get_user_tenant_ids())
        )
    );

CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid() OR app_private.is_superadmin());

CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (id = auth.uid() OR app_private.is_superadmin())
    WITH CHECK (id = auth.uid() OR app_private.is_superadmin());

CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE USING (app_private.is_superadmin());

-- 3.4 platform_superadmins
CREATE POLICY "platform_superadmins_select" ON public.platform_superadmins
    FOR SELECT USING (app_private.is_superadmin());
-- Note: Zero INSERT, UPDATE, DELETE policies for client roles; revoked at grant level.

-- 3.5 roles
CREATE POLICY "roles_select" ON public.roles
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
            tenant_id IS NULL
            OR tenant_id IN (SELECT app_private.get_user_tenant_ids())
            OR app_private.is_superadmin()
        )
    );

CREATE POLICY "roles_insert" ON public.roles
    FOR INSERT WITH CHECK (
        app_private.is_superadmin()
        OR (tenant_id IS NOT NULL AND tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('roles.custom', tenant_id))
    );

CREATE POLICY "roles_update" ON public.roles
    FOR UPDATE USING (
        app_private.is_superadmin()
        OR (tenant_id IS NOT NULL AND tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('roles.custom', tenant_id))
    ) WITH CHECK (
        app_private.is_superadmin()
        OR (tenant_id IS NOT NULL AND tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('roles.custom', tenant_id))
    );

CREATE POLICY "roles_delete" ON public.roles
    FOR DELETE USING (app_private.is_superadmin());

-- 3.6 permissions
CREATE POLICY "permissions_select" ON public.permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "permissions_all_superadmin" ON public.permissions
    FOR ALL USING (app_private.is_superadmin());

-- 3.7 role_permissions
CREATE POLICY "role_permissions_select" ON public.role_permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "role_permissions_modify" ON public.role_permissions
    FOR ALL USING (
        app_private.is_superadmin()
        OR role_id IN (
            SELECT r.id FROM public.roles r
            WHERE r.tenant_id IN (SELECT app_private.get_user_tenant_ids())
              AND app_private.has_permission('roles.custom', r.tenant_id)
        )
    );

-- 3.8 memberships (Tenant-isolated SELECT policy, non-recursive via SECURITY DEFINER)
CREATE POLICY "memberships_select" ON public.memberships
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "memberships_insert" ON public.memberships
    FOR INSERT WITH CHECK (
        app_private.is_superadmin()
        OR (
            tenant_id IN (SELECT app_private.get_user_tenant_ids())
            AND app_private.has_permission('staff.manage', tenant_id)
            AND EXISTS (
                SELECT 1 FROM public.roles r
                WHERE r.id = role_id
                  AND ((r.tenant_id IS NULL AND r.code <> 'SUPER_ADMIN') OR r.tenant_id = memberships.tenant_id)
            )
        )
    );

CREATE POLICY "memberships_update" ON public.memberships
    FOR UPDATE USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('staff.manage', tenant_id))
    ) WITH CHECK (
        app_private.is_superadmin()
        OR (
            tenant_id IN (SELECT app_private.get_user_tenant_ids())
            AND app_private.has_permission('staff.manage', tenant_id)
            AND EXISTS (
                SELECT 1 FROM public.roles r
                WHERE r.id = role_id
                  AND ((r.tenant_id IS NULL AND r.code <> 'SUPER_ADMIN') OR r.tenant_id = memberships.tenant_id)
            )
        )
    );

CREATE POLICY "memberships_delete" ON public.memberships
    FOR DELETE USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('staff.manage', tenant_id))
    );

-- 3.9 branch_access
CREATE POLICY "branch_access_select" ON public.branch_access
    FOR SELECT USING (
        membership_id IN (SELECT m.id FROM public.memberships m WHERE m.user_id = auth.uid())
        OR app_private.is_superadmin()
        OR membership_id IN (
            SELECT m.id FROM public.memberships m
            WHERE m.tenant_id IN (SELECT app_private.get_user_tenant_ids())
              AND app_private.has_permission('staff.manage', m.tenant_id)
        )
    );

CREATE POLICY "branch_access_modify" ON public.branch_access
    FOR ALL USING (
        app_private.is_superadmin()
        OR membership_id IN (
            SELECT m.id FROM public.memberships m
            WHERE app_private.has_permission('staff.manage', m.tenant_id)
        )
    );

-- 3.10 audit_logs
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (
        (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('audit.view', tenant_id))
        OR app_private.is_superadmin()
    );
-- Zero client INSERT, UPDATE, DELETE policies. Revoked at grant level.

-- ------------------------------------------------------------------------------
-- 4. RLS POLICIES — DOMAIN B: RESTAURANT CONFIGURATION
-- ------------------------------------------------------------------------------

-- 4.1 restaurant_settings
CREATE POLICY "restaurant_settings_select" ON public.restaurant_settings
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "restaurant_settings_modify" ON public.restaurant_settings
    FOR ALL USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('tenant.update', tenant_id))
    );

-- 4.2 tax_settings
CREATE POLICY "tax_settings_select" ON public.tax_settings
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "tax_settings_modify" ON public.tax_settings
    FOR ALL USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('tenant.update', tenant_id))
    );

-- 4.3 service_charges
CREATE POLICY "service_charges_select" ON public.service_charges
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "service_charges_modify" ON public.service_charges
    FOR ALL USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('tenant.update', tenant_id))
    );

-- 4.4 business_hours
CREATE POLICY "business_hours_select" ON public.business_hours
    FOR SELECT USING (
        branch_id IN (SELECT b.id FROM public.branches b WHERE b.tenant_id IN (SELECT app_private.get_user_tenant_ids()))
        OR app_private.is_superadmin()
    );

CREATE POLICY "business_hours_modify" ON public.business_hours
    FOR ALL USING (
        app_private.is_superadmin()
        OR branch_id IN (
            SELECT b.id FROM public.branches b
            WHERE app_private.has_permission('branch.manage', b.tenant_id)
        )
    );

-- ------------------------------------------------------------------------------
-- 5. RLS POLICIES — DOMAIN C: POS CATALOG AND DINING
-- ------------------------------------------------------------------------------

-- 5.1 dining_tables (Branch-level authorization)
CREATE POLICY "dining_tables_select" ON public.dining_tables
    FOR SELECT USING (
        app_private.has_branch_access(branch_id)
        OR app_private.is_superadmin()
    );

CREATE POLICY "dining_tables_insert" ON public.dining_tables
    FOR INSERT WITH CHECK (
        app_private.is_superadmin()
        OR (
            app_private.has_branch_access(branch_id)
            AND tenant_id IN (SELECT app_private.get_user_tenant_ids())
            AND app_private.has_permission('tables.manage', tenant_id)
        )
    );

CREATE POLICY "dining_tables_update" ON public.dining_tables
    FOR UPDATE USING (
        app_private.is_superadmin()
        OR (
            app_private.has_branch_access(branch_id)
            AND tenant_id IN (SELECT app_private.get_user_tenant_ids())
            AND (
                app_private.has_permission('tables.manage', tenant_id)
                OR app_private.has_permission('tables.update_status', tenant_id)
            )
        )
    ) WITH CHECK (
        app_private.is_superadmin()
        OR (
            app_private.has_branch_access(branch_id)
            AND tenant_id IN (SELECT app_private.get_user_tenant_ids())
            AND (
                app_private.has_permission('tables.manage', tenant_id)
                OR (
                    app_private.has_permission('tables.update_status', tenant_id)
                    AND deleted_at IS NULL
                )
            )
        )
    );

CREATE POLICY "dining_tables_delete" ON public.dining_tables
    FOR DELETE USING (app_private.is_superadmin());

-- 5.2 menu_categories
CREATE POLICY "menu_categories_select" ON public.menu_categories
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "menu_categories_insert" ON public.menu_categories
    FOR INSERT WITH CHECK (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('menu.manage', tenant_id))
    );

CREATE POLICY "menu_categories_update" ON public.menu_categories
    FOR UPDATE USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('menu.manage', tenant_id))
    ) WITH CHECK (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('menu.manage', tenant_id))
    );

CREATE POLICY "menu_categories_delete" ON public.menu_categories
    FOR DELETE USING (app_private.is_superadmin());

-- 5.3 menu_items
CREATE POLICY "menu_items_select" ON public.menu_items
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "menu_items_insert" ON public.menu_items
    FOR INSERT WITH CHECK (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('menu.manage', tenant_id))
    );

CREATE POLICY "menu_items_update" ON public.menu_items
    FOR UPDATE USING (
        app_private.is_superadmin()
        OR (
            tenant_id IN (SELECT app_private.get_user_tenant_ids())
            AND (
                app_private.has_permission('menu.manage', tenant_id)
                OR app_private.has_permission('menu.toggle_stock', tenant_id)
            )
        )
    ) WITH CHECK (
        app_private.is_superadmin()
        OR (
            tenant_id IN (SELECT app_private.get_user_tenant_ids())
            AND (
                app_private.has_permission('menu.manage', tenant_id)
                OR (
                    app_private.has_permission('menu.toggle_stock', tenant_id)
                    AND deleted_at IS NULL
                )
            )
        )
    );

CREATE POLICY "menu_items_delete" ON public.menu_items
    FOR DELETE USING (app_private.is_superadmin());

-- 5.4 item_variants
CREATE POLICY "item_variants_select" ON public.item_variants
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "item_variants_modify" ON public.item_variants
    FOR ALL USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('menu.manage', tenant_id))
    );

-- 5.5 modifier_groups
CREATE POLICY "modifier_groups_select" ON public.modifier_groups
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "modifier_groups_modify" ON public.modifier_groups
    FOR ALL USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('menu.manage', tenant_id))
    );

-- 5.6 modifiers
CREATE POLICY "modifiers_select" ON public.modifiers
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "modifiers_modify" ON public.modifiers
    FOR ALL USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('menu.manage', tenant_id))
    );

-- 5.7 menu_item_modifiers
CREATE POLICY "menu_item_modifiers_select" ON public.menu_item_modifiers
    FOR SELECT USING (
        tenant_id IN (SELECT app_private.get_user_tenant_ids())
        OR app_private.is_superadmin()
    );

CREATE POLICY "menu_item_modifiers_modify" ON public.menu_item_modifiers
    FOR ALL USING (
        app_private.is_superadmin()
        OR (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('menu.manage', tenant_id))
    );
