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
