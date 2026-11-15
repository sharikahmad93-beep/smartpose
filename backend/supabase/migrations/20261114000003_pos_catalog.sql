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
