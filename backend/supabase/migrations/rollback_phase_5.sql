-- ==============================================================================
-- SMART RESTAURANT POS — ROLLBACK SCRIPT FOR PHASE 5 TRANSACTIONAL MIGRATIONS
-- Schema Targets: 20261116000006_orders_and_transactions.sql
--                 20261116000007_transactional_rls_and_rpc.sql
-- Safety: Drops ONLY Phase 5 functions, policies, and tables in reverse dependency order.
-- Does NOT touch migrations 001-005.
-- ==============================================================================

-- Drop RPC Functions
DROP FUNCTION IF EXISTS public.cancel_order(UUID, TEXT);
DROP FUNCTION IF EXISTS public.settle_order(UUID, JSONB, NUMERIC, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS public.fire_kot(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, VARCHAR, UUID, UUID, INT, VARCHAR);
DROP FUNCTION IF EXISTS app_private.get_next_invoice_number(UUID, UUID);

-- Drop Tables in reverse dependency order
DROP TABLE IF EXISTS public.inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.raw_materials CASCADE;
DROP TABLE IF EXISTS public.order_audit_log CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.kot_tickets CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.invoice_sequences CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
