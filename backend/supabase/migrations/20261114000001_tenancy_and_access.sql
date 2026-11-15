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
