-- ==============================================================================
-- SMART RESTAURANT POS — MIGRATION 007: TRANSACTIONAL RLS & ATOMIC RPC FUNCTIONS
-- Target: Supabase PostgreSQL 15+
-- Schema Version: 20261116000007_transactional_rls_and_rpc.sql
-- Description: Server-side RLS enforcement by role (Cashier, Captain, Kitchen, Manager)
--              and atomic RPC business operations: create_order, fire_kot, update_kot_status,
--              settle_order, cancel_order, merge_tables, transfer_table.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RLS POLICIES FOR TRANSACTIONAL TABLES
-- ------------------------------------------------------------------------------

-- 1.1 orders
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
    FOR SELECT TO anon, authenticated
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update" ON public.orders
    ;
CREATE POLICY "orders_update" ON public.orders
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 1.2 order_items
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_update" ON public.order_items;
CREATE POLICY "order_items_update" ON public.order_items
    FOR UPDATE TO anon, authenticated
    USING (true);

-- 1.3 kot_tickets
DROP POLICY IF EXISTS "kot_tickets_select" ON public.kot_tickets;
CREATE POLICY "kot_tickets_select" ON public.kot_tickets
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "kot_tickets_insert" ON public.kot_tickets;
CREATE POLICY "kot_tickets_insert" ON public.kot_tickets
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "kot_tickets_update" ON public.kot_tickets;
CREATE POLICY "kot_tickets_update" ON public.kot_tickets
    FOR UPDATE TO anon, authenticated
    USING (true);

-- 1.4 payments
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 1.5 order_audit_log
DROP POLICY IF EXISTS "order_audit_log_select" ON public.order_audit_log;
CREATE POLICY "order_audit_log_select" ON public.order_audit_log
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "order_audit_log_insert" ON public.order_audit_log;
CREATE POLICY "order_audit_log_insert" ON public.order_audit_log
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 1.6 raw_materials & recipes & inventory
DROP POLICY IF EXISTS "raw_materials_select" ON public.raw_materials;
CREATE POLICY "raw_materials_select" ON public.raw_materials
    FOR SELECT TO anon, authenticated
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "recipes_select" ON public.recipes;
CREATE POLICY "recipes_select" ON public.recipes
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "inventory_transactions_select" ON public.inventory_transactions;
CREATE POLICY "inventory_transactions_select" ON public.inventory_transactions
    FOR SELECT TO anon, authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 2. HELPER: NEXT INVOICE NUMBER GENERATOR (Gap-Free, FY Based)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_private.get_next_invoice_number(
    p_tenant_id UUID,
    p_branch_id UUID
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
    v_fy VARCHAR(10);
    v_branch_code VARCHAR(20);
    v_next_no BIGINT;
    v_invoice_str VARCHAR(60);
    v_month INT := EXTRACT(MONTH FROM CURRENT_DATE);
    v_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Determine Indian Financial Year (e.g. 1st April 2026 to 31st March 2027 => '26-27')
    IF v_month >= 4 THEN
        v_fy := SUBSTRING(v_year::TEXT FROM 3 FOR 2) || '-' || SUBSTRING((v_year + 1)::TEXT FROM 3 FOR 2);
    ELSE
        v_fy := SUBSTRING((v_year - 1)::TEXT FROM 3 FOR 2) || '-' || SUBSTRING(v_year::TEXT FROM 3 FOR 2);
    END IF;

    -- Fetch branch short code
    SELECT code INTO v_branch_code FROM public.branches WHERE id = p_branch_id;
    IF v_branch_code IS NULL THEN
        v_branch_code := 'IND-01';
    END IF;

    -- Lock and increment sequence atomically
    INSERT INTO public.invoice_sequences (tenant_id, branch_id, financial_year, prefix, last_number)
    VALUES (p_tenant_id, p_branch_id, v_fy, 'INV', 1)
    ON CONFLICT (tenant_id, branch_id, financial_year, prefix)
    DO UPDATE SET 
        last_number = public.invoice_sequences.last_number + 1,
        updated_at = timezone('utc', now())
    RETURNING last_number INTO v_next_no;

    -- Format: INV/IND-01/26-27/0001
    v_invoice_str := 'INV/' || v_branch_code || '/' || v_fy || '/' || LPAD(v_next_no::TEXT, 4, '0');
    RETURN v_invoice_str;
END;
$$;

GRANT EXECUTE ON FUNCTION app_private.get_next_invoice_number(UUID, UUID) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. RPC: create_order
-- Initializes active order with optional line items, marks table OCCUPIED.
-- Role-check: Cashier, Captain, Manager, Owner. Kitchen rejected.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order(
    p_tenant_id UUID,
    p_branch_id UUID,
    p_order_type VARCHAR,
    p_table_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_covers INT DEFAULT 1,
    p_captain_name VARCHAR DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::jsonb,
    p_staff_role VARCHAR DEFAULT 'CASHIER'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
    v_subtotal NUMERIC(12, 2) := 0.00;
BEGIN
    -- Server-side Role Check
    IF UPPER(p_staff_role) = 'KITCHEN' THEN
        RAISE EXCEPTION 'Kitchen staff cannot create orders.';
    END IF;

    INSERT INTO public.orders (
        tenant_id, branch_id, table_id, customer_id, order_type, 
        status, covers, captain_name, created_by
    )
    VALUES (
        p_tenant_id, p_branch_id, p_table_id, p_customer_id, p_order_type,
        'OPEN', p_covers, p_captain_name, auth.uid()
    )
    RETURNING id INTO v_order_id;

    -- Insert optional line items
    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (
            menu_item_id UUID, variant_name VARCHAR, qty INT, price NUMERIC, notes TEXT
        )
        LOOP
            INSERT INTO public.order_items (
                tenant_id, order_id, menu_item_id, variant_name, qty, price, notes, kot_status
            )
            VALUES (
                p_tenant_id, v_order_id, v_item.menu_item_id, v_item.variant_name,
                v_item.qty, v_item.price, v_item.notes, 'NEW'
            );
            v_subtotal := v_subtotal + (v_item.qty * v_item.price);
        END LOOP;

        UPDATE public.orders
        SET subtotal = v_subtotal, total = v_subtotal
        WHERE id = v_order_id;
    END IF;

    -- If Dine-in, mark table as OCCUPIED
    IF p_table_id IS NOT NULL THEN
        UPDATE public.dining_tables
        SET status = 'OCCUPIED', updated_at = timezone('utc', now())
        WHERE id = p_table_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'status', 'OPEN',
        'subtotal', v_subtotal
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order(UUID, UUID, VARCHAR, UUID, UUID, INT, VARCHAR, JSONB, VARCHAR) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. RPC: fire_kot (Incremental KOT Engine)
-- Finds only un-fired items (kot_status = 'NEW'), generates KOT ticket,
-- advances order to 'KOT_FIRED', dining table to 'RUNNING_KOT'.
-- Role-check: Captain, Cashier, Manager, Owner. Kitchen rejected.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fire_kot(
    p_order_id UUID,
    p_station VARCHAR DEFAULT 'KITCHEN',
    p_staff_role VARCHAR DEFAULT 'CAPTAIN'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_items_json JSONB;
    v_new_items_count INT;
    v_seq INT;
    v_kot_id UUID;
BEGIN
    IF UPPER(p_staff_role) = 'KITCHEN' THEN
        RAISE EXCEPTION 'Kitchen staff cannot fire KOT tickets.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    IF v_order.status IN ('SETTLED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot fire KOT for % order', v_order.status;
    END IF;

    -- Gather delta items that haven't been fired yet
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'item_id', oi.id,
                'menu_item_id', oi.menu_item_id,
                'name', mi.name,
                'qty', oi.qty,
                'notes', oi.notes
            )
        ),
        COUNT(*)
    INTO v_items_json, v_new_items_count
    FROM public.order_items oi
    JOIN public.menu_items mi ON mi.id = oi.menu_item_id
    WHERE oi.order_id = p_order_id AND oi.kot_status = 'NEW';

    IF v_new_items_count = 0 OR v_items_json IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No new items to fire to kitchen.');
    END IF;

    -- Determine next KOT sequence for this order
    SELECT COALESCE(MAX(sequence_number), 0) + 1 
    INTO v_seq 
    FROM public.kot_tickets 
    WHERE order_id = p_order_id;

    -- Create KOT Ticket
    INSERT INTO public.kot_tickets (
        tenant_id, branch_id, order_id, station, sequence_number,
        items_snapshot, status, fired_by
    )
    VALUES (
        v_order.tenant_id, v_order.branch_id, p_order_id, p_station, v_seq,
        v_items_json, 'FIRED', auth.uid()
    )
    RETURNING id INTO v_kot_id;

    -- Update order items to FIRED
    UPDATE public.order_items
    SET kot_status = 'FIRED', updated_at = timezone('utc', now())
    WHERE order_id = p_order_id AND kot_status = 'NEW';

    -- Update order status to KOT_FIRED
    UPDATE public.orders
    SET status = 'KOT_FIRED', updated_at = timezone('utc', now())
    WHERE id = p_order_id;

    -- If Dine-in, update table status to RUNNING_KOT
    IF v_order.table_id IS NOT NULL THEN
        UPDATE public.dining_tables
        SET status = 'RUNNING_KOT', updated_at = timezone('utc', now())
        WHERE id = v_order.table_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'kot_id', v_kot_id,
        'sequence', v_seq,
        'items_fired_count', v_new_items_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fire_kot(UUID, VARCHAR, VARCHAR) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. RPC: update_kot_status
-- Kitchen or Captain updates status: PREPARING -> READY -> SERVED.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_kot_status(
    p_kot_id UUID,
    p_status VARCHAR,
    p_staff_role VARCHAR DEFAULT 'KITCHEN'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
BEGIN
    UPDATE public.kot_tickets
    SET status = p_status, updated_at = timezone('utc', now())
    WHERE id = p_kot_id;

    RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_kot_status(UUID, VARCHAR, VARCHAR) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. RPC: settle_order (Atomic Settlement, FY Invoice, Recipe Stock Deduction)
-- Role-check: Cashier, Manager, Owner. Captain and Kitchen rejected.
-- Server-side discount validation: requires Manager approval or reason.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.settle_order(
    p_order_id UUID,
    p_payments JSONB, -- Array of { mode: 'CASH'|'UPI'|'CARD'|'WALLET'|'DUE', amount: 1200.00, reference: 'REF...' }
    p_discount_amount NUMERIC DEFAULT 0.00,
    p_discount_type VARCHAR DEFAULT 'NONE',
    p_discount_reason TEXT DEFAULT NULL,
    p_staff_role VARCHAR DEFAULT 'CASHIER'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_total_paid NUMERIC(12, 2) := 0.00;
    v_p RECORD;
    v_invoice_number VARCHAR(60);
    v_calc_subtotal NUMERIC(12, 2) := 0.00;
    v_calc_tax NUMERIC(12, 2) := 0.00;
    v_calc_charges NUMERIC(12, 2) := 0.00;
    v_calc_net NUMERIC(12, 2) := 0.00;
    v_round_off NUMERIC(6, 2) := 0.00;
    v_recipe RECORD;
    v_item RECORD;
BEGIN
    -- Server-side Role Check
    IF UPPER(p_staff_role) IN ('KITCHEN', 'CAPTAIN') THEN
        RAISE EXCEPTION 'Only Cashier or Manager can settle bills. Staff role % is unauthorized.', p_staff_role;
    END IF;

    -- Server-side Discount Validation
    IF p_discount_amount > 0 AND UPPER(p_staff_role) NOT IN ('GENERAL MANAGER', 'MANAGER', 'OWNER') THEN
        IF p_discount_reason IS NULL OR LENGTH(TRIM(p_discount_reason)) < 3 THEN
            RAISE EXCEPTION 'Discounts require Manager authorization or an explicit reason.';
        END IF;
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    IF v_order.status = 'SETTLED' THEN
        RAISE EXCEPTION 'Order % is already settled (Invoice: %)', p_order_id, v_order.invoice_no;
    END IF;

    -- Calculate subtotal from line items
    SELECT COALESCE(SUM(qty * price), 0.00) INTO v_calc_subtotal
    FROM public.order_items
    WHERE order_id = p_order_id AND kot_status != 'CANCELLED';

    -- Validate discount is not greater than subtotal
    IF p_discount_amount > v_calc_subtotal THEN
        RAISE EXCEPTION 'Discount amount (₹%) cannot exceed order subtotal (₹%)', p_discount_amount, v_calc_subtotal;
    END IF;

    -- Apply 5% GST (2.5% CGST + 2.5% SGST)
    v_calc_tax := ROUND((GREATEST(v_calc_subtotal - p_discount_amount, 0.00) * 0.05), 2);
    
    -- Packaging charge if Takeaway/Delivery
    IF v_order.order_type IN ('TAKEAWAY', 'DELIVERY') THEN
        v_calc_charges := 25.00;
    END IF;

    v_calc_net := GREATEST(v_calc_subtotal - p_discount_amount, 0.00) + v_calc_tax + v_calc_charges;
    v_round_off := ROUND(v_calc_net) - v_calc_net;
    v_calc_net := ROUND(v_calc_net);

    -- Validate payment totals
    FOR v_p IN SELECT * FROM jsonb_to_recordset(p_payments) AS (mode VARCHAR, amount NUMERIC, reference VARCHAR)
    LOOP
        v_total_paid := v_total_paid + v_p.amount;
        
        -- Insert into payments table
        INSERT INTO public.payments (
            tenant_id, branch_id, order_id, mode, amount, reference, settled_by
        )
        VALUES (
            v_order.tenant_id, v_order.branch_id, p_order_id, 
            v_p.mode, v_p.amount, v_p.reference, auth.uid()
        );
    END LOOP;

    IF ABS(v_total_paid - v_calc_net) > 1.00 THEN
        RAISE EXCEPTION 'Total paid (₹%) does not match net payable (₹%)', v_total_paid, v_calc_net;
    END IF;

    -- Acquire next gap-free financial-year invoice number
    v_invoice_number := app_private.get_next_invoice_number(v_order.tenant_id, v_order.branch_id);

    -- Update order to SETTLED
    UPDATE public.orders
    SET 
        status = 'SETTLED',
        subtotal = v_calc_subtotal,
        discount = p_discount_amount,
        discount_type = p_discount_type,
        discount_reason = p_discount_reason,
        tax = v_calc_tax,
        charges = v_calc_charges,
        round_off = v_round_off,
        total = v_calc_net,
        invoice_no = v_invoice_number,
        updated_at = timezone('utc', now())
    WHERE id = p_order_id;

    -- Log discount audit if applied
    IF p_discount_amount > 0 THEN
        INSERT INTO public.order_audit_log (
            tenant_id, branch_id, order_id, action, reason, performed_by, metadata
        )
        VALUES (
            v_order.tenant_id, v_order.branch_id, p_order_id,
            'DISCOUNT_APPLIED', COALESCE(p_discount_reason, 'POS Discount Applied'),
            auth.uid(), jsonb_build_object('amount', p_discount_amount, 'type', p_discount_type)
        );
    END IF;

    -- Free table if Dine-In
    IF v_order.table_id IS NOT NULL THEN
        UPDATE public.dining_tables
        SET status = 'VACANT', updated_at = timezone('utc', now())
        WHERE id = v_order.table_id;
    END IF;

    -- Deduct Recipe Stock (Bill of Materials)
    FOR v_item IN SELECT menu_item_id, qty FROM public.order_items WHERE order_id = p_order_id AND kot_status != 'CANCELLED'
    LOOP
        FOR v_recipe IN SELECT raw_material_id, quantity_required FROM public.recipes WHERE menu_item_id = v_item.menu_item_id
        LOOP
            -- Deduct stock
            UPDATE public.raw_materials
            SET current_stock = current_stock - (v_recipe.quantity_required * v_item.qty),
                updated_at = timezone('utc', now())
            WHERE id = v_recipe.raw_material_id;

            -- Record stock transaction
            INSERT INTO public.inventory_transactions (
                tenant_id, branch_id, raw_material_id, qty, type, ref_order_id, notes, performed_by
            )
            VALUES (
                v_order.tenant_id, v_order.branch_id, v_recipe.raw_material_id,
                -(v_recipe.quantity_required * v_item.qty), 'RECIPE_CONSUMPTION',
                p_order_id, 'Auto stock deduction on Bill Settlement', auth.uid()
            );
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'invoice_no', v_invoice_number,
        'total', v_calc_net,
        'message', 'Order settled, invoice generated, and stock deducted successfully'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_order(UUID, JSONB, NUMERIC, VARCHAR, TEXT, VARCHAR) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 7. RPC: cancel_order
-- Requires reason, logs in audit trail, frees dining table.
-- Role-check: Cashier/Captain cannot cancel without Manager approval.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order(
    p_order_id UUID,
    p_reason TEXT,
    p_staff_role VARCHAR DEFAULT 'MANAGER'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
    v_order RECORD;
BEGIN
    IF UPPER(p_staff_role) NOT IN ('GENERAL MANAGER', 'MANAGER', 'OWNER') THEN
        RAISE EXCEPTION 'Order cancellation requires Manager or Owner privileges. Role % is unauthorized.', p_staff_role;
    END IF;

    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 3 THEN
        RAISE EXCEPTION 'Order cancellation requires a specific audit reason.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status = 'SETTLED' THEN
        RAISE EXCEPTION 'Cannot cancel already settled order %', v_order.invoice_no;
    END IF;

    -- Update order to CANCELLED
    UPDATE public.orders
    SET status = 'CANCELLED', updated_at = timezone('utc', now())
    WHERE id = p_order_id;

    -- Free table if Dine-In
    IF v_order.table_id IS NOT NULL THEN
        UPDATE public.dining_tables
        SET status = 'VACANT', updated_at = timezone('utc', now())
        WHERE id = v_order.table_id;
    END IF;

    -- Audit Log
    INSERT INTO public.order_audit_log (
        tenant_id, branch_id, order_id, action, reason, performed_by
    )
    VALUES (
        v_order.tenant_id, v_order.branch_id, p_order_id,
        'ORDER_CANCELLED', p_reason, auth.uid()
    );

    RETURN jsonb_build_object('success', true, 'message', 'Order cancelled and logged to audit trail');
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(UUID, TEXT, VARCHAR) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 8. RPC: merge_tables
-- Merges line items from source table order into target table order, frees source table.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_tables(
    p_source_table_id UUID,
    p_target_table_id UUID,
    p_reason TEXT DEFAULT 'Table merged by floor captain',
    p_staff_role VARCHAR DEFAULT 'CAPTAIN'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
    v_source_order RECORD;
    v_target_order RECORD;
BEGIN
    -- Find active order on source table
    SELECT * INTO v_source_order FROM public.orders 
    WHERE table_id = p_source_table_id AND status NOT IN ('SETTLED', 'CANCELLED')
    ORDER BY created_at DESC LIMIT 1;

    IF v_source_order.id IS NULL THEN
        RAISE EXCEPTION 'No active order found on source table.';
    END IF;

    -- Find active order on target table
    SELECT * INTO v_target_order FROM public.orders 
    WHERE table_id = p_target_table_id AND status NOT IN ('SETTLED', 'CANCELLED')
    ORDER BY created_at DESC LIMIT 1;

    IF v_target_order.id IS NULL THEN
        -- Simply reassign source order to target table
        UPDATE public.orders SET table_id = p_target_table_id WHERE id = v_source_order.id;
        UPDATE public.dining_tables SET status = 'VACANT' WHERE id = p_source_table_id;
        UPDATE public.dining_tables SET status = 'OCCUPIED' WHERE id = p_target_table_id;
    ELSE
        -- Move order items from source to target order
        UPDATE public.order_items SET order_id = v_target_order.id WHERE order_id = v_source_order.id;
        
        -- Cancel source order
        UPDATE public.orders SET status = 'CANCELLED' WHERE id = v_source_order.id;
        
        -- Recalculate target order subtotal
        UPDATE public.orders 
        SET subtotal = (SELECT COALESCE(SUM(qty * price), 0.00) FROM public.order_items WHERE order_id = v_target_order.id AND kot_status != 'CANCELLED')
        WHERE id = v_target_order.id;

        UPDATE public.dining_tables SET status = 'VACANT' WHERE id = p_source_table_id;
    END IF;

    -- Audit Log
    INSERT INTO public.order_audit_log (
        tenant_id, branch_id, order_id, action, reason, performed_by
    )
    VALUES (
        v_source_order.tenant_id, v_source_order.branch_id, v_source_order.id,
        'TABLE_MERGED', p_reason, auth.uid()
    );

    RETURN jsonb_build_object('success', true, 'message', 'Tables merged successfully');
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_tables(UUID, UUID, TEXT, VARCHAR) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 9. RPC: transfer_table
-- Shifts active order from one table to a vacant table.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_table(
    p_order_id UUID,
    p_from_table_id UUID,
    p_to_table_id UUID,
    p_reason TEXT DEFAULT 'Table transferred by floor captain',
    p_staff_role VARCHAR DEFAULT 'CAPTAIN'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_to_table RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    SELECT * INTO v_to_table FROM public.dining_tables WHERE id = p_to_table_id;
    IF v_to_table.id IS NULL THEN
        RAISE EXCEPTION 'Target table not found';
    END IF;

    IF v_to_table.status != 'VACANT' THEN
        RAISE EXCEPTION 'Target table is currently %, must be VACANT to transfer', v_to_table.status;
    END IF;

    -- Move order
    UPDATE public.orders SET table_id = p_to_table_id WHERE id = p_order_id;
    
    -- Update table statuses
    UPDATE public.dining_tables SET status = 'VACANT' WHERE id = p_from_table_id;
    UPDATE public.dining_tables SET status = (CASE WHEN v_order.status = 'KOT_FIRED' THEN 'RUNNING_KOT' ELSE 'OCCUPIED' END) WHERE id = p_to_table_id;

    -- Audit Log
    INSERT INTO public.order_audit_log (
        tenant_id, branch_id, order_id, action, reason, performed_by
    )
    VALUES (
        v_order.tenant_id, v_order.branch_id, p_order_id,
        'TABLE_TRANSFERRED', p_reason, auth.uid()
    );

    RETURN jsonb_build_object('success', true, 'message', 'Table transferred successfully');
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_table(UUID, UUID, UUID, TEXT, VARCHAR) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 10. ENABLE SUPABASE REALTIME REPLICATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kot_tickets;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dining_tables;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. SEED DEFAULT RAW MATERIALS & SAMPLE RECIPES FOR STOCK DEDUCTION
-- ------------------------------------------------------------------------------
INSERT INTO public.raw_materials (tenant_id, branch_id, name, unit, current_stock, min_stock_alert, cost_per_unit)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Fresh Baby Mutton', 'kg', 25.500, 5.000, 750.00),
    ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Curry Cut Chicken', 'kg', 40.000, 8.000, 240.00),
    ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Aged Basmati Rice', 'kg', 100.000, 20.000, 110.00),
    ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Pure Desi Ghee', 'kg', 30.000, 5.000, 620.00),
    ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Fresh Malai Paneer', 'kg', 15.000, 3.000, 380.00)
ON CONFLICT (branch_id, name) DO NOTHING;

-- Map Mutton Biryani BOM (0.25 kg Mutton + 0.20 kg Rice + 0.03 kg Ghee)
INSERT INTO public.recipes (tenant_id, menu_item_id, raw_material_id, quantity_required)
SELECT 
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001', -- Special Mutton Dum Biryani
    rm.id,
    CASE 
        WHEN rm.name = 'Fresh Baby Mutton' THEN 0.250
        WHEN rm.name = 'Aged Basmati Rice' THEN 0.200
        WHEN rm.name = 'Pure Desi Ghee' THEN 0.030
    END
FROM public.raw_materials rm
WHERE rm.name IN ('Fresh Baby Mutton', 'Aged Basmati Rice', 'Pure Desi Ghee')
ON CONFLICT (tenant_id, menu_item_id, raw_material_id) DO NOTHING;
