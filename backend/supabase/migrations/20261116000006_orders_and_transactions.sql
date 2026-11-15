-- ==============================================================================
-- SMART RESTAURANT POS — MIGRATION 006: TRANSACTIONAL ENGINE
-- Target: Supabase PostgreSQL 15+
-- Schema Version: 20261116000006_orders_and_transactions.sql
-- Description: Real transactional tables for Orders, KOT, Multi-Tender Payments,
--              Order Audit Trails, Gap-Free Financial-Year Invoicing, and Recipes.
-- Safety: 100% ADDITIVE — Does not modify or drop any existing 001-005 tables.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE: customers
-- Phone-based CRM & loyalty points store.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(150),
    email VARCHAR(150),
    address TEXT,
    loyalty_points INT NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
    total_spend NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_spend >= 0.00),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_tenant_phone 
    ON public.customers(tenant_id, phone) 
    WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- 2. TABLE: invoice_sequences
-- Financial-Year based, gap-free, duplicate-proof sequential numbering per branch.
-- Format: INV/IND-01/26-27/0001
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    financial_year VARCHAR(10) NOT NULL, -- e.g. '2026-27'
    prefix VARCHAR(20) NOT NULL DEFAULT 'INV',
    last_number BIGINT NOT NULL DEFAULT 0 CHECK (last_number >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_invoice_sequences_branch_fy_prefix UNIQUE (tenant_id, branch_id, financial_year, prefix)
);

-- ------------------------------------------------------------------------------
-- 3. TABLE: orders
-- Master transactional order record. Money stored as NUMERIC(12, 2) (no floats).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    table_id UUID REFERENCES public.dining_tables(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_type VARCHAR(30) NOT NULL DEFAULT 'DINE_IN' 
        CHECK (order_type IN ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE_AGGREGATOR')),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' 
        CHECK (status IN ('OPEN', 'KOT_FIRED', 'BILLED', 'SETTLED', 'CANCELLED', 'HELD')),
    
    -- Exact Financial Calculations
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0.00),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0.00),
    discount_type VARCHAR(20) NOT NULL DEFAULT 'NONE' 
        CHECK (discount_type IN ('NONE', 'PERCENT', 'FLAT', 'COUPON')),
    discount_reason TEXT,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0.00),
    charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (charges >= 0.00), -- Packing / Service charges
    round_off NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0.00),
    
    -- Invoicing & Business Context
    invoice_no VARCHAR(60),
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    covers INT NOT NULL DEFAULT 1 CHECK (covers >= 0),
    captain_name VARCHAR(100),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

-- Essential Performance & Reporting Indexes
CREATE INDEX IF NOT EXISTS idx_orders_tenant_branch ON public.orders(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_date ON public.orders(business_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id) WHERE status != 'SETTLED' AND status != 'CANCELLED';
CREATE INDEX IF NOT EXISTS idx_orders_invoice_no ON public.orders(invoice_no) WHERE invoice_no IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. TABLE: order_items
-- Line items attached to orders with incremental KOT tracking.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    variant_name VARCHAR(50),
    qty INT NOT NULL CHECK (qty > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0.00),
    notes TEXT,
    kot_status VARCHAR(30) NOT NULL DEFAULT 'NEW' 
        CHECK (kot_status IN ('NEW', 'FIRED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_kot_status ON public.order_items(kot_status);

-- ------------------------------------------------------------------------------
-- 5. TABLE: kot_tickets
-- Incremental physical/KDS kitchen tickets.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kot_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    station VARCHAR(50) NOT NULL DEFAULT 'KITCHEN' 
        CHECK (station IN ('KITCHEN', 'BAR', 'TANDOOR', 'DESSERT')),
    sequence_number INT NOT NULL DEFAULT 1 CHECK (sequence_number > 0),
    items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'FIRED' 
        CHECK (status IN ('FIRED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED')),
    fired_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    fired_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_kot_tickets_order_id ON public.kot_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_kot_tickets_branch_status ON public.kot_tickets(branch_id, status);

-- ------------------------------------------------------------------------------
-- 6. TABLE: payments
-- Multi-Tender split payment records (Cash, UPI, Card, Wallet, Due).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    mode VARCHAR(30) NOT NULL 
        CHECK (mode IN ('CASH', 'UPI', 'CARD', 'WALLET', 'DUE')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    reference VARCHAR(100), -- UPI Ref / EDC Card Auth Code
    settled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    settled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_settled_at ON public.payments(branch_id, settled_at);

-- ------------------------------------------------------------------------------
-- 7. TABLE: order_audit_log
-- Audit trail for every sensitive action: cancel, discount, reprint, void.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL 
        CHECK (action IN ('DISCOUNT_APPLIED', 'ITEM_CANCELLED', 'ORDER_CANCELLED', 'BILL_REPRINTED', 'BILL_VOIDED', 'TABLE_MERGED', 'TABLE_TRANSFERRED')),
    reason TEXT NOT NULL,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_order_audit_log_order_id ON public.order_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_log_branch ON public.order_audit_log(branch_id, performed_at);

-- ------------------------------------------------------------------------------
-- 8. TABLE: raw_materials
-- Inventory raw ingredients ledger.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'kg', 'liter', 'packet', 'pcs'
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    min_stock_alert NUMERIC(12, 3) NOT NULL DEFAULT 5.000,
    cost_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_per_unit >= 0.00),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_raw_materials_branch_name 
    ON public.raw_materials(branch_id, name) 
    WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- 9. TABLE: recipes (Bill of Materials — BOM)
-- Maps dish items to raw material consumption.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
    quantity_required NUMERIC(12, 3) NOT NULL CHECK (quantity_required > 0.000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_recipes_menu_raw UNIQUE (tenant_id, menu_item_id, raw_material_id)
);

-- ------------------------------------------------------------------------------
-- 10. TABLE: inventory_transactions
-- Audit log of all stock movements (consumption on sale, purchase, wastage).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
    qty NUMERIC(12, 3) NOT NULL, -- Positive for stock in, Negative for consumption
    type VARCHAR(30) NOT NULL 
        CHECK (type IN ('RECIPE_CONSUMPTION', 'GRN_PURCHASE', 'WASTAGE', 'AUDIT_ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT')),
    ref_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_tx_material_date 
    ON public.inventory_transactions(raw_material_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_order_id 
    ON public.inventory_transactions(ref_order_id) WHERE ref_order_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 11. ENABLE ROW LEVEL SECURITY (RLS) ON ALL NEW TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kot_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
