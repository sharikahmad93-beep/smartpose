-- ==============================================================================
-- SMART RESTAURANT POS — PHASE 1 ROLLBACK SCRIPT
-- Target: Supabase PostgreSQL 15+
-- Purpose: Safely rolls back Phase 1 migrations in strict reverse dependency order.
-- ==============================================================================

-- 1. DROP AUDIT TRIGGERS & UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trg_audit_item_variants ON public.item_variants;
DROP TRIGGER IF EXISTS trg_audit_menu_items ON public.menu_items;
DROP TRIGGER IF EXISTS trg_audit_dining_tables ON public.dining_tables;
DROP TRIGGER IF EXISTS trg_audit_service_charges ON public.service_charges;
DROP TRIGGER IF EXISTS trg_audit_tax_settings ON public.tax_settings;
DROP TRIGGER IF EXISTS trg_audit_restaurant_settings ON public.restaurant_settings;
DROP TRIGGER IF EXISTS trg_audit_roles ON public.roles;
DROP TRIGGER IF EXISTS trg_audit_memberships ON public.memberships;
DROP TRIGGER IF EXISTS trg_audit_branches ON public.branches;
DROP TRIGGER IF EXISTS trg_audit_tenants ON public.tenants;

DROP TRIGGER IF EXISTS trg_modifiers_updated_at ON public.modifiers;
DROP TRIGGER IF EXISTS trg_modifier_groups_updated_at ON public.modifier_groups;
DROP TRIGGER IF EXISTS trg_item_variants_updated_at ON public.item_variants;
DROP TRIGGER IF EXISTS trg_menu_items_updated_at ON public.menu_items;
DROP TRIGGER IF EXISTS trg_menu_categories_updated_at ON public.menu_categories;
DROP TRIGGER IF EXISTS trg_dining_tables_updated_at ON public.dining_tables;
DROP TRIGGER IF EXISTS trg_business_hours_updated_at ON public.business_hours;
DROP TRIGGER IF EXISTS trg_service_charges_updated_at ON public.service_charges;
DROP TRIGGER IF EXISTS trg_tax_settings_updated_at ON public.tax_settings;
DROP TRIGGER IF EXISTS trg_restaurant_settings_updated_at ON public.restaurant_settings;
DROP TRIGGER IF EXISTS trg_memberships_updated_at ON public.memberships;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_branches_updated_at ON public.branches;
DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;

-- 2. DROP SECURITY HELPER FUNCTIONS
DROP FUNCTION IF EXISTS app_private.process_audit_log();
DROP FUNCTION IF EXISTS app_private.set_updated_at();
DROP FUNCTION IF EXISTS app_private.has_permission(VARCHAR, UUID);
DROP FUNCTION IF EXISTS app_private.has_branch_access(UUID);
DROP FUNCTION IF EXISTS app_private.get_user_tenant_ids();
DROP FUNCTION IF EXISTS app_private.is_superadmin();

-- 3. DROP DOMAIN C TABLES (POS Catalog and Dining)
DROP TABLE IF EXISTS public.menu_item_modifiers CASCADE;
DROP TABLE IF EXISTS public.modifiers CASCADE;
DROP TABLE IF EXISTS public.modifier_groups CASCADE;
DROP TABLE IF EXISTS public.item_variants CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;
DROP TABLE IF EXISTS public.dining_tables CASCADE;

-- 4. DROP DOMAIN B TABLES (Restaurant Configuration)
DROP TABLE IF EXISTS public.business_hours CASCADE;
DROP TABLE IF EXISTS public.service_charges CASCADE;
DROP TABLE IF EXISTS public.tax_settings CASCADE;
DROP TABLE IF EXISTS public.restaurant_settings CASCADE;

-- 5. DROP DOMAIN A TABLES (Tenancy and Access Management)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.branch_access CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.platform_superadmins CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- 6. DROP PRIVATE SCHEMA
DROP SCHEMA IF EXISTS app_private CASCADE;
