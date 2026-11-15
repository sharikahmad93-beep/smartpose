-- ==============================================================================
-- SMART RESTAURANT POS — MIGRATION 005: AUDIT TRIGGERS AND PERFORMANCE INDEXES
-- Target: Supabase PostgreSQL 15+
-- Schema Version: 20261114000005_audit_triggers_and_indexes.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HELPER TRIGGER FUNCTION: set_updated_at()
-- Automatically updates the updated_at timestamp on record updates.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app_private.set_updated_at() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.set_updated_at() TO authenticated, service_role;

-- Apply updated_at triggers
CREATE OR REPLACE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_branches_updated_at
    BEFORE UPDATE ON public.branches
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_memberships_updated_at
    BEFORE UPDATE ON public.memberships
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_restaurant_settings_updated_at
    BEFORE UPDATE ON public.restaurant_settings
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_tax_settings_updated_at
    BEFORE UPDATE ON public.tax_settings
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_service_charges_updated_at
    BEFORE UPDATE ON public.service_charges
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_business_hours_updated_at
    BEFORE UPDATE ON public.business_hours
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_dining_tables_updated_at
    BEFORE UPDATE ON public.dining_tables
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_menu_categories_updated_at
    BEFORE UPDATE ON public.menu_categories
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_item_variants_updated_at
    BEFORE UPDATE ON public.item_variants
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_modifier_groups_updated_at
    BEFORE UPDATE ON public.modifier_groups
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

CREATE OR REPLACE TRIGGER trg_modifiers_updated_at
    BEFORE UPDATE ON public.modifiers
    FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

-- ------------------------------------------------------------------------------
-- 2. AUDIT LOG TRIGGER FUNCTION: process_audit_log()
-- Generates tamper-proof audit records using internal database contexts.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
    v_tenant_id UUID;
    v_branch_id UUID := NULL;
    v_user_id UUID := auth.uid();
    v_entity_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_entity_id := OLD.id;
        
        -- Resolve tenant_id
        IF TG_TABLE_NAME = 'branches' THEN
            v_tenant_id := OLD.tenant_id;
            v_branch_id := OLD.id;
        ELSIF TG_TABLE_NAME = 'dining_tables' THEN
            v_tenant_id := OLD.tenant_id;
            v_branch_id := OLD.branch_id;
        ELSIF TG_TABLE_NAME = 'business_hours' THEN
            SELECT tenant_id INTO v_tenant_id FROM public.branches WHERE id = OLD.branch_id;
            v_branch_id := OLD.branch_id;
        ELSIF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := OLD.id;
        ELSE
            -- Default check for tables containing tenant_id
            v_tenant_id := OLD.tenant_id;
        END IF;

        -- Safe detection for global / system records (e.g. global roles with tenant_id IS NULL).
        -- Preserves audit_logs.tenant_id NOT NULL constraint without breaking global operations.
        -- Platform-level administrative audit logging can be introduced separately in a future phase.
        IF v_tenant_id IS NULL THEN
            RETURN OLD;
        END IF;

        INSERT INTO public.audit_logs (
            tenant_id, branch_id, user_id, action, entity_name, entity_id, old_data, created_at
        ) VALUES (
            v_tenant_id, v_branch_id, v_user_id, TG_OP, TG_TABLE_NAME, v_entity_id, to_jsonb(OLD), timezone('utc', now())
        );
        RETURN OLD;
    ELSE
        v_entity_id := NEW.id;

        -- Resolve tenant_id
        IF TG_TABLE_NAME = 'branches' THEN
            v_tenant_id := NEW.tenant_id;
            v_branch_id := NEW.id;
        ELSIF TG_TABLE_NAME = 'dining_tables' THEN
            v_tenant_id := NEW.tenant_id;
            v_branch_id := NEW.branch_id;
        ELSIF TG_TABLE_NAME = 'business_hours' THEN
            SELECT tenant_id INTO v_tenant_id FROM public.branches WHERE id = NEW.branch_id;
            v_branch_id := NEW.branch_id;
        ELSIF TG_TABLE_NAME = 'tenants' THEN
            v_tenant_id := NEW.id;
        ELSE
            v_tenant_id := NEW.tenant_id;
        END IF;

        -- Safe detection for global / system records (e.g. global roles with tenant_id IS NULL).
        IF v_tenant_id IS NULL THEN
            RETURN NEW;
        END IF;

        INSERT INTO public.audit_logs (
            tenant_id, branch_id, user_id, action, entity_name, entity_id, old_data, new_data, created_at
        ) VALUES (
            v_tenant_id, v_branch_id, v_user_id, TG_OP, TG_TABLE_NAME, v_entity_id,
            CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
            to_jsonb(NEW),
            timezone('utc', now())
        );
        RETURN NEW;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION app_private.process_audit_log() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.process_audit_log() TO authenticated, service_role;

-- Apply audit triggers to key entities
CREATE OR REPLACE TRIGGER trg_audit_tenants
    AFTER INSERT OR UPDATE OR DELETE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_branches
    AFTER INSERT OR UPDATE OR DELETE ON public.branches
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_memberships
    AFTER INSERT OR UPDATE OR DELETE ON public.memberships
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_restaurant_settings
    AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_settings
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_tax_settings
    AFTER INSERT OR UPDATE OR DELETE ON public.tax_settings
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_service_charges
    AFTER INSERT OR UPDATE OR DELETE ON public.service_charges
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_dining_tables
    AFTER INSERT OR UPDATE OR DELETE ON public.dining_tables
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_menu_items
    AFTER INSERT OR UPDATE OR DELETE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_item_variants
    AFTER INSERT OR UPDATE OR DELETE ON public.item_variants
    FOR EACH ROW EXECUTE FUNCTION app_private.process_audit_log();

-- ------------------------------------------------------------------------------
-- 3. PERFORMANCE & LOOKUP INDEXES
-- ------------------------------------------------------------------------------

-- Branches & Tenancy
CREATE INDEX IF NOT EXISTS idx_branches_tenant ON public.branches(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_user_tenant ON public.memberships(user_id, tenant_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_memberships_role ON public.memberships(role_id);
CREATE INDEX IF NOT EXISTS idx_branch_access_membership ON public.branch_access(membership_id);
CREATE INDEX IF NOT EXISTS idx_branch_access_branch ON public.branch_access(branch_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON public.role_permissions(permission_id);

-- Dining & Floor layout
CREATE INDEX IF NOT EXISTS idx_dining_tables_branch_status ON public.dining_tables(branch_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dining_tables_tenant ON public.dining_tables(tenant_id) WHERE deleted_at IS NULL;

-- Catalog & Menu Lookups
CREATE INDEX IF NOT EXISTS idx_menu_categories_tenant ON public.menu_categories(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_cat ON public.menu_items(category_id, is_available) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant ON public.menu_items(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_item_variants_item ON public.item_variants(tenant_id, item_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_modifier_groups_tenant ON public.modifier_groups(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_modifiers_group ON public.modifiers(tenant_id, group_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_menu_item_modifiers_tenant ON public.menu_item_modifiers(tenant_id);

-- Audit Log Lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_name, entity_id);
