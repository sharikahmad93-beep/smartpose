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
