-- ==============================================================================
-- SMART RESTAURANT POS SAAS PLATFORM — MASTER PHASE 1 DEPLOYMENT SCRIPT
-- Target: Supabase Cloud PostgreSQL 15+ (ap-south-1 Mumbai)
-- Project: smart-restaurant-pos-dev (Ref: hptreskxtbbxxzhuokbo)
-- Includes: Migrations 001-005 + Master Permissions + Roles + Demo Brand Seed
-- ==============================================================================


-- ==============================================================================
-- SECTION: supabase/migrations/20261114000001_tenancy_and_access.sql
-- ==============================================================================

-- ==============================================================================
-- SMART RESTAURANT POS — MIGRATION 001: TENANCY AND ACCESS MANAGEMENT
-- Target: Supabase PostgreSQL 15+
-- Schema Version: 20261114000001_tenancy_and_access.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PRIVATE SECURITY SCHEMA
-- Dedicated private schema for security functions and audit triggers.
-- Not exposed to PostgREST / Supabase Data API.
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- TABLE 1: tenants
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    legal_name VARCHAR(200),
    gstin VARCHAR(15),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₹',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

-- Partial unique index allows slug re-use if previous tenant was soft-deleted
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_slug ON public.tenants(slug) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- TABLE 2: branches
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_main_branch BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, id) -- Enables composite foreign key enforcement on branch-scoped child entities
);

-- Partial unique index: Branch code unique per tenant among active branches
CREATE UNIQUE INDEX IF NOT EXISTS uq_branches_tenant_code ON public.branches(tenant_id, code) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- TABLE 3: profiles
-- User demographics linked to Supabase auth.users.
-- Security rule: profiles.is_superadmin MUST NEVER exist.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- TABLE 4: platform_superadmins
-- Platform-wide superadmin authorization. Completely decoupled from profiles.
-- Write permissions are permanently revoked from client roles.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_superadmins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

REVOKE ALL ON TABLE public.platform_superadmins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.platform_superadmins TO service_role;

-- ------------------------------------------------------------------------------
-- TABLE 5: roles
-- Configurable tenant roles and global system roles (tenant_id IS NULL).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(tenant_id, code)
);

-- Partial unique index guarantees system/global role codes (tenant_id IS NULL) are unique
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_global_code ON public.roles(code) WHERE tenant_id IS NULL;

-- ------------------------------------------------------------------------------
-- TABLE 6: permissions
-- Master registry of granular authorization capabilities.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

-- ------------------------------------------------------------------------------
-- TABLE 7: role_permissions
-- Mapping between roles and granular permissions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

-- ------------------------------------------------------------------------------
-- TABLE 8: memberships
-- Maps a user profile to a tenant under a specific role.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, tenant_id)
);

-- ------------------------------------------------------------------------------
-- TABLE 9: branch_access
-- Restricts staff operational authority to designated branches.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branch_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(membership_id, branch_id)
);

-- ------------------------------------------------------------------------------
-- TABLE 10: audit_logs
-- Immutable forensic and regulatory audit log.
-- Direct client INSERT, UPDATE, DELETE are strictly REVOKED.
-- Populated exclusively via database triggers and trusted server contexts.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated, service_role;


-- ==============================================================================
-- SECTION: supabase/migrations/20261114000002_restaurant_configuration.sql
-- ==============================================================================

-- ==============================================================================
-- SMART RESTAURANT POS — MIGRATION 002: RESTAURANT CONFIGURATION
-- Target: Supabase PostgreSQL 15+
-- Schema Version: 20261114000002_restaurant_configuration.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLE 11: restaurant_settings
-- Operational settings per branch or tenant-wide fallback (branch_id IS NULL).
-- Composite FK enforces branch belongs to the same tenant when branch_id IS NOT NULL.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID UNIQUE,
    enable_kot BOOLEAN NOT NULL DEFAULT TRUE,
    enable_table_management BOOLEAN NOT NULL DEFAULT TRUE,
    enable_voice_ordering BOOLEAN NOT NULL DEFAULT TRUE,
    enable_inventory_tracking BOOLEAN NOT NULL DEFAULT FALSE,
    print_receipt_on_settlement BOOLEAN NOT NULL DEFAULT TRUE,
    round_off_cents BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT fk_restaurant_settings_tenant_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches (tenant_id, id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- TABLE 12: tax_settings
-- Tax configuration (e.g. GST regimes, CGST 2.5% + SGST 2.5%, VAT).
-- rate_percent strictly non-negative.
-- Composite FK enforces branch belongs to the same tenant when branch_id IS NOT NULL.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    rate_percent NUMERIC(5,2) NOT NULL CHECK (rate_percent >= 0),
    is_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT fk_tax_settings_tenant_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches (tenant_id, id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- TABLE 13: service_charges
-- Mandatory or voluntary service fee policies.
-- Composite FK enforces branch belongs to the same tenant when branch_id IS NOT NULL.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID,
    name VARCHAR(100) NOT NULL DEFAULT 'Service Charge',
    rate_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (rate_percent >= 0),
    is_optional BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT fk_service_charges_tenant_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches (tenant_id, id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- TABLE 14: business_hours
-- Operating schedule per day of week (0 = Sunday, 6 = Saturday).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(branch_id, day_of_week)
);


-- ==============================================================================
-- SECTION: supabase/migrations/20261114000003_pos_catalog.sql
-- ==============================================================================

-- ==============================================================================
-- SMART RESTAURANT POS — MIGRATION 003: POS CATALOG AND DINING
-- Target: Supabase PostgreSQL 15+
-- Schema Version: 20261114000003_pos_catalog.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLE 15: dining_tables
-- Floor plan and physical dining tables for dine-in operations.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dining_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    floor_section VARCHAR(50) NOT NULL DEFAULT 'Main Dining',
    seating_capacity INT NOT NULL DEFAULT 4 CHECK (seating_capacity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'VACANT' CHECK (status IN ('VACANT', 'OCCUPIED', 'BILLED', 'RESERVED', 'MAINTENANCE')),
    qr_code_token VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    -- Composite FK guarantees table cannot reference a branch belonging to another tenant
    CONSTRAINT fk_dining_tables_tenant_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches(tenant_id, id) ON DELETE CASCADE
);

-- Partial unique index allows table number re-use if previous record was soft-deleted
CREATE UNIQUE INDEX IF NOT EXISTS uq_dining_tables_branch_number ON public.dining_tables(branch_id, table_number) WHERE deleted_at IS NULL;

-- Partial unique index for QR code tokens: enforces uniqueness among active tables while permitting re-use after soft-delete
CREATE UNIQUE INDEX IF NOT EXISTS uq_dining_tables_qr_token ON public.dining_tables(qr_code_token) WHERE deleted_at IS NULL AND qr_code_token IS NOT NULL;

-- ------------------------------------------------------------------------------
-- TABLE 16: menu_categories
-- Classification hierarchy for menu items.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    color_code VARCHAR(10),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, id) -- Enables composite foreign key enforcement on child menu_items
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_categories_tenant_slug ON public.menu_categories(tenant_id, slug) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- PREREQUISITE: Ensure tax_settings has UNIQUE(tenant_id, id) constraint
-- Enables composite foreign key enforcement on menu_items(tenant_id, tax_setting_id).
-- Fully idempotent with rigorous verification of relation, uniqueness, and columns.
-- Avoids duplicate index creation if a valid UNIQUE constraint already exists.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_con_exists BOOLEAN;
    v_con_deferrable BOOLEAN;
    v_con_cols TEXT[];
    v_con_rec RECORD;
    v_idx_rec RECORD;
    v_idx_match_count INT := 0;
    v_idx_oid OID;
    v_idx_relkind "char";
    v_tbl_oid OID;
    v_is_unique BOOLEAN;
    v_is_valid BOOLEAN;
    v_is_non_partial BOOLEAN;
    v_indnkeyatts INT;
    v_indnatts INT;
    v_amname TEXT;
    v_indexdef TEXT;
    v_idx_cols TEXT[];
BEGIN
    -- --------------------------------------------------------------------------
    -- 1. EXISTING CONSTRAINT VALIDATION
    -- --------------------------------------------------------------------------
    -- Guard against conflicting constraint with the same name on an unexpected relation or contype
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_tax_settings_tenant_id'
          AND (conrelid <> 'public.tax_settings'::regclass OR contype <> 'u')
    ) THEN
        RAISE EXCEPTION 'Constraint "uq_tax_settings_tenant_id" exists with incompatible relation or non-unique contype!';
    END IF;

    -- Check if constraint 'uq_tax_settings_tenant_id' exists on public.tax_settings
    SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.tax_settings'::regclass
          AND conname = 'uq_tax_settings_tenant_id'
          AND contype = 'u'
    ) INTO v_con_exists;

    IF v_con_exists THEN
        -- Verify that existing constraint covers exactly (tenant_id, id) in that order, and is NOT DEFERRABLE
        SELECT c.condeferrable, array_agg(a.attname ORDER BY k.ord)
        INTO v_con_deferrable, v_con_cols
        FROM pg_constraint c
        CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE c.conrelid = 'public.tax_settings'::regclass
          AND c.conname = 'uq_tax_settings_tenant_id'
        GROUP BY c.condeferrable;

        IF v_con_deferrable THEN
            RAISE EXCEPTION 'Constraint "uq_tax_settings_tenant_id" on public.tax_settings is DEFERRABLE! Foreign keys cannot reference a deferrable unique constraint.';
        END IF;

        IF v_con_cols IS DISTINCT FROM ARRAY['tenant_id', 'id'] THEN
            RAISE EXCEPTION 'Existing constraint "uq_tax_settings_tenant_id" on public.tax_settings has incompatible columns: %, expected (tenant_id, id)!',
                v_con_cols;
        END IF;

        -- Valid non-deferrable constraint already present and verified; return cleanly without creating redundant index
        RETURN;
    END IF;

    -- Also check if ANY OTHER unique constraint on public.tax_settings already covers exactly (tenant_id, id)
    FOR v_con_rec IN
        SELECT c.conname, c.condeferrable, array_agg(a.attname ORDER BY k.ord) AS cols
        FROM pg_constraint c
        CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE c.conrelid = 'public.tax_settings'::regclass
          AND c.contype = 'u'
        GROUP BY c.oid, c.conname, c.condeferrable
    LOOP
        IF v_con_rec.cols = ARRAY['tenant_id', 'id'] THEN
            IF v_con_rec.condeferrable THEN
                RAISE EXCEPTION 'Matching UNIQUE constraint "%" on public.tax_settings is DEFERRABLE! Foreign keys cannot reference a deferrable unique constraint.',
                    v_con_rec.conname;
            END IF;

            -- A valid non-deferrable unique constraint covering (tenant_id, id) already exists under another name; return cleanly
            RETURN;
        END IF;
    END LOOP;

    -- --------------------------------------------------------------------------
    -- 2. INDEX OBJECT VALIDATION & CONDITIONAL CREATION
    -- --------------------------------------------------------------------------
    -- Explicitly verify relations named "uq_tax_settings_tenant_id" without relying on max() aggregation
    FOR v_idx_rec IN
        SELECT c.oid, c.relkind
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'uq_tax_settings_tenant_id'
    LOOP
        v_idx_match_count := v_idx_match_count + 1;
        v_idx_oid := v_idx_rec.oid;
        v_idx_relkind := v_idx_rec.relkind;
    END LOOP;

    IF v_idx_match_count > 1 THEN
        RAISE EXCEPTION 'Multiple relations named "uq_tax_settings_tenant_id" exist in public schema!';
    ELSIF v_idx_match_count = 1 THEN
        IF v_idx_relkind <> 'i' THEN
            RAISE EXCEPTION 'Relation "public.uq_tax_settings_tenant_id" exists but has relkind "%", expected "i" (index)!',
                v_idx_relkind;
        END IF;
    ELSE
        -- Index does not exist: create the prerequisite unique index dynamically
        EXECUTE 'CREATE UNIQUE INDEX uq_tax_settings_tenant_id ON public.tax_settings(tenant_id, id)';

        SELECT c.oid, c.relkind
        INTO v_idx_oid, v_idx_relkind
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'uq_tax_settings_tenant_id';
    END IF;

    -- Extract index properties
    SELECT
        i.indrelid,
        i.indisunique,
        i.indisvalid,
        (i.indpred IS NULL),
        i.indnkeyatts,
        i.indnatts,
        am.amname,
        pg_get_indexdef(c.oid)
    INTO
        v_tbl_oid,
        v_is_unique,
        v_is_valid,
        v_is_non_partial,
        v_indnkeyatts,
        v_indnatts,
        v_amname,
        v_indexdef
    FROM pg_class c
    JOIN pg_index i ON i.indexrelid = c.oid
    JOIN pg_am am ON am.oid = c.relam
    WHERE c.oid = v_idx_oid;

    -- Verify index target table is specifically public.tax_settings
    IF v_tbl_oid <> 'public.tax_settings'::regclass THEN
        RAISE EXCEPTION 'Index "uq_tax_settings_tenant_id" belongs to relation "%", expected "public.tax_settings"!',
            v_tbl_oid::regclass;
    END IF;

    -- Verify index is a valid, unique, non-partial B-tree index
    IF NOT (v_is_unique AND v_is_valid AND v_is_non_partial AND v_amname = 'btree') THEN
        RAISE EXCEPTION 'Index "uq_tax_settings_tenant_id" must be a valid, unique, non-partial B-tree index (unique=%, valid=%, non-partial=%, am=%)!',
            v_is_unique, v_is_valid, v_is_non_partial, v_amname;
    END IF;

    -- Verify exact key columns (tenant_id, id) and reject any INCLUDE columns
    IF v_indnkeyatts <> 2 OR v_indnatts <> 2 THEN
        RAISE EXCEPTION 'Index "uq_tax_settings_tenant_id" has invalid column count (nkeyatts=%, natts=%), expected exactly 2 key columns and 0 INCLUDE columns!',
            v_indnkeyatts, v_indnatts;
    END IF;

    -- Extract exact key column names in order using pg_attribute
    SELECT array_agg(a.attname ORDER BY k.ord)
    INTO v_idx_cols
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
    WHERE c.oid = v_idx_oid
      AND k.ord <= i.indnkeyatts;

    IF v_idx_cols IS DISTINCT FROM ARRAY['tenant_id', 'id'] THEN
        RAISE EXCEPTION 'Index "uq_tax_settings_tenant_id" key columns are %, expected exactly (tenant_id, id)!',
            v_idx_cols;
    END IF;

    IF v_indexdef NOT LIKE '%USING btree (tenant_id, id)' THEN
        RAISE EXCEPTION 'Index "uq_tax_settings_tenant_id" definition "%" does not match expected columns (tenant_id, id)!',
            v_indexdef;
    END IF;

    -- --------------------------------------------------------------------------
    -- 3. SAFELY ATTACH UNIQUE INDEX AS A UNIQUE CONSTRAINT
    -- --------------------------------------------------------------------------
    ALTER TABLE public.tax_settings
        ADD CONSTRAINT uq_tax_settings_tenant_id
        UNIQUE USING INDEX uq_tax_settings_tenant_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- TABLE 17: menu_items
-- Master food and beverage offerings.
-- Features composite UNIQUE(tenant_id, id) for cross-tenant child FK validation.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_code VARCHAR(20),
    description TEXT,
    base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    food_type VARCHAR(20) NOT NULL DEFAULT 'VEG' CHECK (food_type IN ('VEG', 'NON_VEG', 'EGG', 'VEGAN')),
    tax_setting_id UUID,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    preparation_time_minutes INT DEFAULT 15 CHECK (preparation_time_minutes >= 0),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, id), -- Enables composite foreign key enforcement on children
    CONSTRAINT fk_menu_items_tenant_category FOREIGN KEY (tenant_id, category_id)
        REFERENCES public.menu_categories(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_menu_items_tenant_tax FOREIGN KEY (tenant_id, tax_setting_id)
        REFERENCES public.tax_settings(tenant_id, id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_items_tenant_code ON public.menu_items(tenant_id, short_code) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- TABLE 18: item_variants
-- Portion, size, or preparation variations.
-- Composite FK enforces item belongs to the same tenant.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.item_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    price_difference NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sku VARCHAR(50),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_item_variants_tenant_item FOREIGN KEY (tenant_id, item_id)
        REFERENCES public.menu_items(tenant_id, id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- TABLE 19: modifier_groups
-- Groups of customizations (e.g. "Choice of Bread", "Toppings").
-- Features composite UNIQUE(tenant_id, id) for cross-tenant child FK validation.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    min_selection INT NOT NULL DEFAULT 0 CHECK (min_selection >= 0),
    max_selection INT NOT NULL DEFAULT 1 CHECK (max_selection >= min_selection),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, id) -- Enables composite foreign key enforcement on children
);

-- ------------------------------------------------------------------------------
-- TABLE 20: modifiers
-- Individual add-on choices within a group.
-- Composite FK guarantees group belongs to the same tenant.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    group_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    additional_price NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (additional_price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_modifiers_tenant_group FOREIGN KEY (tenant_id, group_id)
        REFERENCES public.modifier_groups(tenant_id, id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- TABLE 21: menu_item_modifiers
-- Maps modifier groups to menu items with cross-tenant composite FK checks.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_item_modifiers (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    modifier_group_id UUID NOT NULL,
    PRIMARY KEY(item_id, modifier_group_id),
    CONSTRAINT fk_mim_tenant_item FOREIGN KEY (tenant_id, item_id)
        REFERENCES public.menu_items(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_mim_tenant_group FOREIGN KEY (tenant_id, modifier_group_id)
        REFERENCES public.modifier_groups(tenant_id, id) ON DELETE CASCADE
);


-- ==============================================================================
-- SECTION: supabase/migrations/20261114000004_security_functions_and_rls.sql
-- ==============================================================================

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


-- ==============================================================================
-- SECTION: supabase/migrations/20261114000005_audit_triggers_and_indexes.sql
-- ==============================================================================

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


-- ==============================================================================
-- SECTION: supabase/seed.sql
-- ==============================================================================

-- ==============================================================================
-- SMART RESTAURANT POS SAAS PLATFORM — MASTER SEED SCRIPT
-- Location: backend/supabase/seed.sql
-- Target: Supabase PostgreSQL 15+ (Production / Staging / Development)
-- Author: Smart Restaurant POS Engineering Team
-- ==============================================================================
-- DESCRIPTION:
-- Populates the canonical foundational data required for the SaaS platform:
-- 1. Master Permissions Registry (27 Granular RBAC capabilities)
-- 2. Master System Roles (SUPER_ADMIN, OWNER, MANAGER, CASHIER, WAITER, KITCHEN)
-- 3. Role-Permission Bindings (According to docs/roles-permissions-matrix.md)
-- 4. Demo Tenant: "Biryani Express" (Multi-Outlet Indian Restaurant Brand)
-- 5. Outlets: "Indiranagar Outlet" (Main) and "Whitefield Outlet"
-- 6. Tax Settings (GST 5% Restaurant Regime) & Service Charges
-- 7. Dining Layout: 10 Tables across AC Dining & Garden Patio
-- 8. POS Catalog: 4 Categories, 12 Items, Variants & Modifiers
--
-- IDEMPOTENCY:
-- All statements use ON CONFLICT clauses to ensure the seed can be safely re-run
-- without throwing duplicate key errors or corrupting existing live data.
-- ==============================================================================

DO $$
DECLARE
    -- Deterministic UUIDs for Demo Brand & Outlets
    v_demo_tenant_id UUID := '10000000-0000-0000-0000-000000000001';
    v_branch_indiranagar_id UUID := '20000000-0000-0000-0000-000000000001';
    v_branch_whitefield_id UUID := '20000000-0000-0000-0000-000000000002';

    -- Tax Setting ID
    v_tax_gst_id UUID := '30000000-0000-0000-0000-000000000001';

    -- Category IDs
    v_cat_biryani_id UUID := '40000000-0000-0000-0000-000000000001';
    v_cat_starters_id UUID := '40000000-0000-0000-0000-000000000002';
    v_cat_breads_id UUID := '40000000-0000-0000-0000-000000000003';
    v_cat_beverages_id UUID := '40000000-0000-0000-0000-000000000004';

    -- Role IDs for bindings
    v_role_super_admin_id UUID;
    v_role_owner_id UUID;
    v_role_manager_id UUID;
    v_role_cashier_id UUID;
    v_role_waiter_id UUID;
    v_role_kitchen_id UUID;

    -- Menu Item IDs
    v_item_mutton_biryani_id UUID := '50000000-0000-0000-0000-000000000001';
    v_item_chicken_biryani_id UUID := '50000000-0000-0000-0000-000000000002';
    v_item_paneer_biryani_id UUID := '50000000-0000-0000-0000-000000000003';
    v_item_chicken_65_id UUID := '50000000-0000-0000-0000-000000000004';
    v_item_paneer_tikka_id UUID := '50000000-0000-0000-0000-000000000005';
    v_item_butter_naan_id UUID := '50000000-0000-0000-0000-000000000006';
    v_item_garlic_naan_id UUID := '50000000-0000-0000-0000-000000000007';
    v_item_gulab_jamun_id UUID := '50000000-0000-0000-0000-000000000008';
    v_item_masala_chai_id UUID := '50000000-0000-0000-0000-000000000009';
    v_item_fresh_lime_soda_id UUID := '50000000-0000-0000-0000-000000000010';
    v_item_tandoori_roti_id UUID := '50000000-0000-0000-0000-000000000011';
    v_item_chicken_kebab_id UUID := '50000000-0000-0000-0000-000000000012';

    -- Modifier Group ID
    v_mod_group_portion_id UUID := '60000000-0000-0000-0000-000000000001';
    v_mod_group_spice_id UUID := '60000000-0000-0000-0000-000000000002';
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'SMART RESTAURANT POS — COMMENCING MASTER SEED SCRIPT';
    RAISE NOTICE '=======================================================';

    -- --------------------------------------------------------------------------
    -- 1. MASTER PERMISSIONS REGISTRY (27 Granular Permissions)
    -- --------------------------------------------------------------------------
    RAISE NOTICE '1. Seeding Master Permissions Registry...';
    INSERT INTO public.permissions (code, category, description)
    VALUES
        -- Tenancy & Branch Management
        ('tenant.view', 'tenancy', 'View restaurant profile and subscription details'),
        ('tenant.update', 'tenancy', 'Modify brand name, logo, GSTIN, currency, and global settings'),
        ('branch.view', 'branch', 'View branch addresses, operating hours, and localized configs'),
        ('branch.manage', 'branch', 'Create and modify branches, operating hours, and tax mappings'),

        -- Staff & RBAC
        ('staff.view', 'staff', 'View employee list and assigned outlets'),
        ('staff.invite', 'staff', 'Invite new staff members via email or phone'),
        ('staff.manage', 'staff', 'Assign roles and grant branch access (Tenant-scoped only)'),
        ('roles.custom', 'staff', 'Create and configure custom tenant sub-roles'),

        -- Menu & Catalog
        ('menu.view', 'menu', 'Browse categories, dishes, variants, and modifier groups'),
        ('menu.manage', 'menu', 'Add, edit, or archive menu items, prices, variants, and recipes'),
        ('menu.toggle_stock', 'menu', 'Mark items as 86d (out of stock) or available in real time'),

        -- Table & Floor Layout
        ('tables.view', 'tables', 'View real-time floor plan, table status, and occupancy'),
        ('tables.manage', 'tables', 'Add or re-arrange floor sections, tables, and seating capacities'),
        ('tables.update_status', 'tables', 'Change table state between Vacant, Occupied, and Billed'),

        -- Operations, Orders & KOT
        ('orders.create', 'orders', 'Punch new orders and generate Kitchen Order Tickets (KOT)'),
        ('orders.modify', 'orders', 'Add items, apply modifiers, or change quantities before billing'),
        ('orders.cancel', 'orders', 'Void an order or item (Managerial audit logged)'),
        ('orders.discount', 'orders', 'Apply item-level or bill-level discounts'),
        ('kot.view', 'kitchen', 'View incoming tickets on the Kitchen Display System (KDS)'),
        ('kot.update_status', 'kitchen', 'Update ticket lifecycle (Received -> Cooking -> Ready -> Served)'),

        -- Billing & Cash Operations
        ('billing.settle', 'billing', 'Process payments via Cash, UPI, Card, or Split Payment'),
        ('billing.refund', 'billing', 'Issue customer refunds or credit notes (Audited)'),
        ('cash.open_shift', 'billing', 'Open daily cash drawer session with opening float balance'),
        ('cash.close_shift', 'billing', 'Perform end-of-day cash reconciliation and discrepancy reporting'),

        -- Analytics, Financials & Audit
        ('reports.daily_summary', 'reports', 'View daily sales, top-selling dishes, and average order value'),
        ('reports.financial', 'reports', 'Access comprehensive P&L, GST tax ledgers, and audit reports'),
        ('audit.view', 'audit', 'Inspect forensic change logs, staff activities, and voided orders')
    ON CONFLICT (code) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 2. MASTER GLOBAL SYSTEM ROLES (tenant_id IS NULL)
    -- --------------------------------------------------------------------------
    RAISE NOTICE '2. Seeding Global System Roles...';
    INSERT INTO public.roles (name, code, description, tenant_id, is_system_role)
    VALUES
        ('SaaS Super Admin', 'SUPER_ADMIN', 'Platform infrastructure and global SaaS administrator role.', NULL, TRUE),
        ('Restaurant Owner', 'OWNER', 'Primary restaurant brand stakeholder with full tenant-wide authority.', NULL, TRUE),
        ('Branch Manager', 'MANAGER', 'Responsible for branch outlet operations, floor layout, staff, and discounts.', NULL, TRUE),
        ('Cashier / Billing Staff', 'CASHIER', 'Handles POS terminal billing, customer payments, cash shifts, and receipts.', NULL, TRUE),
        ('Captain / Waiter', 'WAITER', 'Handheld captain ordering, table occupancy management, and KOT generation.', NULL, TRUE),
        ('Kitchen Staff / Chef', 'KITCHEN', 'Operates Kitchen Display System (KDS), ticket status, and 86d stock reporting.', NULL, TRUE)
    ON CONFLICT (code) WHERE tenant_id IS NULL DO NOTHING;

    -- Retrieve generated IDs of global system roles
    SELECT id INTO v_role_super_admin_id FROM public.roles WHERE code = 'SUPER_ADMIN' AND tenant_id IS NULL;
    SELECT id INTO v_role_owner_id FROM public.roles WHERE code = 'OWNER' AND tenant_id IS NULL;
    SELECT id INTO v_role_manager_id FROM public.roles WHERE code = 'MANAGER' AND tenant_id IS NULL;
    SELECT id INTO v_role_cashier_id FROM public.roles WHERE code = 'CASHIER' AND tenant_id IS NULL;
    SELECT id INTO v_role_waiter_id FROM public.roles WHERE code = 'WAITER' AND tenant_id IS NULL;
    SELECT id INTO v_role_kitchen_id FROM public.roles WHERE code = 'KITCHEN' AND tenant_id IS NULL;

    -- --------------------------------------------------------------------------
    -- 3. BIND ROLES TO PERMISSIONS
    -- --------------------------------------------------------------------------
    RAISE NOTICE '3. Binding Roles to Permissions...';

    -- OWNER Permissions: All tenant-scoped capabilities
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_owner_id, id FROM public.permissions
    ON CONFLICT DO NOTHING;

    -- MANAGER Permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_manager_id, id FROM public.permissions
    WHERE code IN (
        'tenant.view', 'branch.view', 'staff.view', 'staff.manage',
        'menu.view', 'menu.manage', 'menu.toggle_stock',
        'tables.view', 'tables.manage', 'tables.update_status',
        'orders.create', 'orders.modify', 'orders.cancel', 'orders.discount',
        'kot.view', 'kot.update_status',
        'billing.settle', 'billing.refund', 'cash.open_shift', 'cash.close_shift',
        'reports.daily_summary', 'audit.view'
    )
    ON CONFLICT DO NOTHING;

    -- CASHIER Permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_cashier_id, id FROM public.permissions
    WHERE code IN (
        'branch.view', 'menu.view', 'menu.toggle_stock',
        'tables.view', 'tables.update_status',
        'orders.create', 'orders.modify', 'orders.discount',
        'kot.view',
        'billing.settle', 'cash.open_shift', 'cash.close_shift',
        'reports.daily_summary'
    )
    ON CONFLICT DO NOTHING;

    -- WAITER Permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_waiter_id, id FROM public.permissions
    WHERE code IN (
        'branch.view', 'menu.view', 'menu.toggle_stock',
        'tables.view', 'tables.update_status',
        'orders.create', 'orders.modify',
        'kot.view'
    )
    ON CONFLICT DO NOTHING;

    -- KITCHEN Permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_kitchen_id, id FROM public.permissions
    WHERE code IN (
        'menu.view', 'menu.toggle_stock',
        'kot.view', 'kot.update_status'
    )
    ON CONFLICT DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 4. DEMO RESTAURANT BRAND: "Biryani Express"
    -- --------------------------------------------------------------------------
    RAISE NOTICE '4. Seeding Demo Tenant: Biryani Express...';
    INSERT INTO public.tenants (
        id, name, slug, legal_name, gstin, currency_code, currency_symbol, timezone, is_active
    )
    VALUES (
        v_demo_tenant_id,
        'Biryani Express',
        'biryani-express',
        'Biryani Express Hospitality Private Limited',
        '29AAAAA0000A1Z5',
        'INR',
        '₹',
        'Asia/Kolkata',
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        legal_name = EXCLUDED.legal_name,
        gstin = EXCLUDED.gstin;

    -- --------------------------------------------------------------------------
    -- 5. DEMO BRANCH OUTLETS
    -- --------------------------------------------------------------------------
    RAISE NOTICE '5. Seeding Demo Outlets (Indiranagar & Whitefield)...';
    INSERT INTO public.branches (
        id, tenant_id, name, code, phone, email, address_line1, address_line2, city, state, postal_code, is_main_branch, is_active
    )
    VALUES
        (
            v_branch_indiranagar_id, v_demo_tenant_id,
            'Indiranagar Flagship Outlet', 'BLR-IND-01', '+918025200001', 'indiranagar@biryaniexpress.test',
            '100 Feet Road, HAL 2nd Stage', 'Near Metro Station', 'Bengaluru', 'Karnataka', '560038',
            TRUE, TRUE
        ),
        (
            v_branch_whitefield_id, v_demo_tenant_id,
            'Whitefield ITPL Outlet', 'BLR-WHF-01', '+918028400002', 'whitefield@biryaniexpress.test',
            'ITPB Main Road, Pattandur Agrahara', 'Opposite Ascendas Park', 'Bengaluru', 'Karnataka', '560066',
            FALSE, TRUE
        )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        phone = EXCLUDED.phone;

    -- --------------------------------------------------------------------------
    -- 6. RESTAURANT CONFIGURATIONS & TAX SETTINGS
    -- --------------------------------------------------------------------------
    RAISE NOTICE '6. Seeding Restaurant Tax Settings & Brand Config...';
    INSERT INTO public.restaurant_settings (
        tenant_id, brand_name, primary_color, secondary_color, enable_table_ordering, enable_kds, enable_inventory
    )
    VALUES (
        v_demo_tenant_id, 'Biryani Express', '#D9381E', '#F8B133', TRUE, TRUE, TRUE
    )
    ON CONFLICT (tenant_id) DO NOTHING;

    INSERT INTO public.tax_settings (
        id, tenant_id, name, rate_percent, is_inclusive, cgst_percent, sgst_percent, igst_percent, is_active
    )
    VALUES (
        v_tax_gst_id, v_demo_tenant_id, 'GST 5% (Restaurant Non-AC/AC Composite)', 5.00, FALSE, 2.50, 2.50, 0.00, TRUE
    )
    ON CONFLICT (tenant_id, id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 7. DINING ROOM & FLOOR LAYOUT (10 Tables)
    -- --------------------------------------------------------------------------
    RAISE NOTICE '7. Seeding Floor Layout & Dining Tables...';
    INSERT INTO public.dining_tables (
        tenant_id, branch_id, table_number, section, seating_capacity, status
    )
    VALUES
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-01', 'AC Main Hall', 4, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-02', 'AC Main Hall', 4, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-03', 'AC Main Hall', 2, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-04', 'AC Main Hall', 6, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-05', 'Family Section', 8, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-06', 'Garden Patio', 4, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-07', 'Garden Patio', 4, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-08', 'Garden Patio', 2, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-09', 'Rooftop Lounge', 6, 'VACANT'),
        (v_demo_tenant_id, v_branch_indiranagar_id, 'T-10', 'Rooftop Lounge', 4, 'VACANT')
    ON CONFLICT (tenant_id, branch_id, table_number) WHERE deleted_at IS NULL DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 8. MENU CATEGORIES
    -- --------------------------------------------------------------------------
    RAISE NOTICE '8. Seeding Master Menu Categories...';
    INSERT INTO public.menu_categories (
        id, tenant_id, name, slug, description, sort_order, is_active
    )
    VALUES
        (v_cat_biryani_id, v_demo_tenant_id, 'Hyderabadi Dum Biryani', 'dum-biryani', 'Authentic slow-cooked saffron dum biryani served with Mirchi Ka Salan and Raita.', 1, TRUE),
        (v_cat_starters_id, v_demo_tenant_id, 'Tandoori & Starters', 'starters', 'Charcoal-grilled kebabs, tikkas, and spicy appetisers.', 2, TRUE),
        (v_cat_breads_id, v_demo_tenant_id, 'Indian Breads & Curries', 'breads-curries', 'Clay-oven baked naans, rotis, and rich gravies.', 3, TRUE),
        (v_cat_beverages_id, v_demo_tenant_id, 'Beverages & Desserts', 'beverages-desserts', 'Traditional coolers, lassi, cutting chai, and Indian sweets.', 4, TRUE)
    ON CONFLICT (tenant_id, id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 9. MASTER MENU ITEMS
    -- --------------------------------------------------------------------------
    RAISE NOTICE '9. Seeding Master Dishes & Beverages...';
    INSERT INTO public.menu_items (
        id, tenant_id, category_id, tax_setting_id, name, short_code, description, base_price, is_veg, is_available, sort_order
    )
    VALUES
        (v_item_mutton_biryani_id, v_demo_tenant_id, v_cat_biryani_id, v_tax_gst_id, 'Special Mutton Dum Biryani', 'MB01', 'Tender goat meat slow-cooked with basmati rice, saffron, and aromatic spices.', 380.00, FALSE, TRUE, 1),
        (v_item_chicken_biryani_id, v_demo_tenant_id, v_cat_biryani_id, v_tax_gst_id, 'Royal Chicken Dum Biryani', 'CB01', 'Classic Hyderabadi chicken biryani with boiled egg and salan.', 290.00, FALSE, TRUE, 2),
        (v_item_paneer_biryani_id, v_demo_tenant_id, v_cat_biryani_id, v_tax_gst_id, 'Nawabi Paneer Dum Biryani', 'PB01', 'Fresh cottage cheese cubes marinated in mint and hung curd with fragrant rice.', 240.00, TRUE, TRUE, 3),
        (v_item_chicken_65_id, v_demo_tenant_id, v_cat_starters_id, v_tax_gst_id, 'Chicken 65 (Crispy Andhra Style)', 'C65', 'Deep-fried chicken chunks tossed in spicy curry leaf tempering.', 260.00, FALSE, TRUE, 4),
        (v_item_paneer_tikka_id, v_demo_tenant_id, v_cat_starters_id, v_tax_gst_id, 'Tandoori Paneer Tikka', 'PT01', 'Cottage cheese and bell peppers roasted in clay tandoor.', 230.00, TRUE, TRUE, 5),
        (v_item_chicken_kebab_id, v_demo_tenant_id, v_cat_starters_id, v_tax_gst_id, 'Murgh Malai Kebab', 'MMK01', 'Melt-in-mouth creamy chicken skewers with cardamom flavour.', 280.00, FALSE, TRUE, 6),
        (v_item_butter_naan_id, v_demo_tenant_id, v_cat_breads_id, v_tax_gst_id, 'Butter Naan', 'BN01', 'Tandoor baked refined flour bread brushed with salted Amul butter.', 50.00, TRUE, TRUE, 7),
        (v_item_garlic_naan_id, v_demo_tenant_id, v_cat_breads_id, v_tax_gst_id, 'Garlic Herb Naan', 'GN01', 'Crushed garlic and fresh coriander baked naan.', 65.00, TRUE, TRUE, 8),
        (v_item_tandoori_roti_id, v_demo_tenant_id, v_cat_breads_id, v_tax_gst_id, 'Tandoori Wheat Roti', 'TR01', 'Whole wheat healthy roti baked crisp in tandoor.', 35.00, TRUE, TRUE, 9),
        (v_item_gulab_jamun_id, v_demo_tenant_id, v_cat_beverages_id, v_tax_gst_id, 'Hot Gulab Jamun (2 Pcs)', 'GJ01', 'Deep fried khoya dumplings steeped in rose cardamom syrup.', 80.00, TRUE, TRUE, 10),
        (v_item_masala_chai_id, v_demo_tenant_id, v_cat_beverages_id, v_tax_gst_id, 'Irani Masala Chai', 'MC01', 'Traditional dum brewed sweet tea infused with ginger and spices.', 40.00, TRUE, TRUE, 11),
        (v_item_fresh_lime_soda_id, v_demo_tenant_id, v_cat_beverages_id, v_tax_gst_id, 'Fresh Lime Soda (Sweet/Salt)', 'FLS01', 'Sparkling soda cooler with fresh squeezed lemon.', 60.00, TRUE, TRUE, 12)
    ON CONFLICT (tenant_id, id) DO NOTHING;

    -- --------------------------------------------------------------------------
    -- 10. MODIFIER GROUPS & MODIFIERS
    -- --------------------------------------------------------------------------
    RAISE NOTICE '10. Seeding Portion Sizes & Spice Customization Modifiers...';
    INSERT INTO public.modifier_groups (
        id, tenant_id, name, description, min_selections, max_selections, is_required
    )
    VALUES
        (v_mod_group_portion_id, v_demo_tenant_id, 'Portion Size', 'Select your serving portion', 1, 1, TRUE),
        (v_mod_group_spice_id, v_demo_tenant_id, 'Spice Level', 'Customize your heat level', 0, 1, FALSE)
    ON CONFLICT (tenant_id, id) DO NOTHING;

    INSERT INTO public.modifiers (
        tenant_id, group_id, name, price_adjustment, sort_order, is_default
    )
    VALUES
        (v_demo_tenant_id, v_mod_group_portion_id, 'Regular (Single Serve)', 0.00, 1, TRUE),
        (v_demo_tenant_id, v_mod_group_portion_id, 'Large (Double / Family Pack)', 180.00, 2, FALSE),
        (v_demo_tenant_id, v_mod_group_spice_id, 'Medium Spicy', 0.00, 1, TRUE),
        (v_demo_tenant_id, v_mod_group_spice_id, 'Extra Spicy (Andhra Style)', 0.00, 2, FALSE)
    ON CONFLICT (tenant_id, group_id, name) WHERE deleted_at IS NULL DO NOTHING;

    -- Attach Portion Modifiers to Biryanis
    INSERT INTO public.menu_item_modifiers (tenant_id, menu_item_id, modifier_group_id, sort_order)
    VALUES
        (v_demo_tenant_id, v_item_mutton_biryani_id, v_mod_group_portion_id, 1),
        (v_demo_tenant_id, v_item_mutton_biryani_id, v_mod_group_spice_id, 2),
        (v_demo_tenant_id, v_item_chicken_biryani_id, v_mod_group_portion_id, 1),
        (v_demo_tenant_id, v_item_chicken_biryani_id, v_mod_group_spice_id, 2)
    ON CONFLICT (tenant_id, menu_item_id, modifier_group_id) DO NOTHING;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'MASTER SEEDING COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'Tenant: Biryani Express (ID: %)', v_demo_tenant_id;
    RAISE NOTICE 'Global System Roles Seeded: SUPER_ADMIN, OWNER, MANAGER, CASHIER, WAITER, KITCHEN';
    RAISE NOTICE '=======================================================';
END;
$$;

