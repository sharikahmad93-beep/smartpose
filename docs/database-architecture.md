# Smart Restaurant POS — Database Architecture Specification

**Document Version:** 1.1.0 (Hardened Security Release)  
**Status:** Approved Architectural Blueprint  
**Target Engine:** Supabase PostgreSQL 15+  
**Target Applications:** Flutter (Windows POS, Android POS, KDS, Owner App), Next.js 15 (Restaurant Admin, Super Admin), Node.js Sync Worker

---

## 1. Architectural Philosophy & Core Principles

### 1.1 Multi-Tenant Hierarchy (Tenant ➔ Branch ➔ Operational Entities)
* **Tenant (Restaurant Brand):** The primary legal, billing, and isolation entity (e.g., "The Biryani House"). A tenant owns configuration, menus, roles, and master subscriptions.
* **Branch (Outlet):** A physical or virtual location operated by the tenant (e.g., "Indiranagar Branch", "Koramangala Branch"). A branch owns physical tables, localized pricing, local staff assignments, kitchen display screens, and order sessions.
* **User (Profile):** Globally unified across Supabase Auth (`auth.users`). A single human identity (email/phone) can hold different roles across different branches or multiple restaurants.
* **Platform Super Admin (`platform_superadmins`):** Completely decoupled from regular tenant profiles. Stored in a dedicated, inaccessible table in `public`, verified strictly via `app_private.is_superadmin()`.

### 1.2 Data Integrity, Tenancy Anchors & Offline Sync
1. **Client-Generated UUIDs:** All primary keys utilize `UUIDv4` generated either on the server or on offline Flutter POS clients. This prevents ID collision during asynchronous batch sync.
2. **Denormalized Tenant Anchors with Composite Foreign Keys:** Child entities (e.g., `item_variants`, `modifiers`) explicitly include `tenant_id` and enforce cross-tenant integrity via composite foreign keys referencing `(tenant_id, id)` on the parent table. A child record can never physically link to a parent belonging to a different tenant.
3. **Soft-Delete Partial Unique Indexes:** To allow re-use of human-readable codes/numbers (e.g., table numbers, branch codes, category slugs) after a record is soft-deleted, hard `UNIQUE` constraints are replaced with PostgreSQL partial unique indexes (`WHERE deleted_at IS NULL`).
4. **Optimistic Locking:** Every mutable row features a `version INT NOT NULL DEFAULT 1` column. Updates increment `version = version + 1`, preventing stale offline writes from overwriting newer server records.
5. **Immutable Append-Only Audit Trail:** Direct client `INSERT`, `UPDATE`, and `DELETE` on `audit_logs` are revoked. Audit rows are generated exclusively through server-side triggers using verified PostgreSQL system contexts.

---

## 2. Phased Domain Roadmap

| Domain | Phase | Implementation Status | Purpose |
|---|---|---|---|
| **A. Platform & Tenancy** | **Phase 1** | **Active Design** | Tenant management, branch segregation, RBAC, profiles, superadmins, audit logs |
| **B. Restaurant Configuration** | **Phase 1** | **Active Design** | Currency, tax regimes, service charges, operating hours |
| **C. POS Foundation (Catalog & Dining)** | **Phase 1** | **Active Design** | Tables, categories, menu items, variants, modifier groups |
| **D. Orders & KOT** | **Phase 2** | *Planned* | Live orders, order items, kitchen display tickets, bill splitting |
| **E. Billing & Payments** | **Phase 2** | *Planned* | Cash, UPI, card, partial settlements, refunds, invoices |
| **F. Inventory & Procurement** | **Phase 3** | *Planned* | Raw materials, recipes (BOM), stock deductions, suppliers, POs |
| **G. Financials & Subscriptions** | **Phase 3** | *Planned* | Cash drawer shifts, expenses, SaaS tenant subscriptions |

---

## 3. Database Schema Definitions (Phase 1 Tables)

### Domain A: Platform & Tenancy

#### 1. `tenants`
The top-level organization/restaurant entity.
```sql
CREATE TABLE tenants (
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

-- Partial index allows slug re-use if previous tenant was soft-deleted
CREATE UNIQUE INDEX uq_tenants_slug ON tenants(slug) WHERE deleted_at IS NULL;
```

#### 2. `branches`
Physical restaurant outlets under a tenant.
```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_branches_tenant_code ON branches(tenant_id, code) WHERE deleted_at IS NULL;
```

#### 3. `profiles`
Extended profile for Supabase `auth.users`. Contains user demographic details only (privilege escalation vector `is_superadmin` removed).
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

#### 4. `platform_superadmins`
Dedicated, isolated table storing platform-level operators. Fully protected from regular tenant or client write access.
```sql
CREATE TABLE platform_superadmins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    notes TEXT
);

-- Revoke all write permissions from client roles
REVOKE ALL ON TABLE platform_superadmins FROM anon, authenticated;
```

#### 5. `roles`
Configurable system and custom tenant roles.
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL indicates global default role template
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(tenant_id, code)
);
```

#### 6. `permissions`
Granular authorization capabilities.
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);
```

#### 7. `role_permissions`
Mapping roles to granular capabilities.
```sql
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);
```

#### 8. `memberships`
Assigns a user to a tenant under a designated role.
```sql
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, tenant_id)
);
```

#### 9. `branch_access`
Scoping a member's operational authority to specific branches.
```sql
CREATE TABLE branch_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(membership_id, branch_id)
);
```

#### 10. `audit_logs`
Immutable regulatory and forensic audit log. Protected by database trigger generation.
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Client writes revoked. Populated exclusively by database triggers.
REVOKE INSERT, UPDATE, DELETE ON TABLE audit_logs FROM anon, authenticated;
GRANT SELECT ON TABLE audit_logs TO authenticated;
```

---

### Domain B: Restaurant Configuration

#### 11. `restaurant_settings`
Branch-specific or tenant-wide operational parameters.
```sql
CREATE TABLE restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID UNIQUE REFERENCES branches(id) ON DELETE CASCADE,
    enable_kot BOOLEAN NOT NULL DEFAULT TRUE,
    enable_table_management BOOLEAN NOT NULL DEFAULT TRUE,
    enable_voice_ordering BOOLEAN NOT NULL DEFAULT TRUE,
    enable_inventory_tracking BOOLEAN NOT NULL DEFAULT FALSE,
    print_receipt_on_settlement BOOLEAN NOT NULL DEFAULT TRUE,
    round_off_cents BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

#### 12. `tax_settings`
Configurable tax structures (e.g. CGST 2.5% + SGST 2.5%, VAT).
```sql
CREATE TABLE tax_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    rate_percent NUMERIC(5,2) NOT NULL CHECK (rate_percent >= 0),
    is_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

#### 13. `service_charges`
Mandatory or voluntary service fee rules.
```sql
CREATE TABLE service_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Service Charge',
    rate_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (rate_percent >= 0),
    is_optional BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

#### 14. `business_hours`
Store hours per day of week for automated shift & online visibility.
```sql
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(branch_id, day_of_week)
);
```

---

### Domain C: POS Foundation (Catalog & Dining Setup)

#### 15. `dining_tables`
Floor and table layout for dine-in operations.
```sql
CREATE TABLE dining_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    floor_section VARCHAR(50) NOT NULL DEFAULT 'Main Dining',
    seating_capacity INT NOT NULL DEFAULT 4 CHECK (seating_capacity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'VACANT',
    qr_code_token VARCHAR(100) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

-- Partial unique index ensures soft-deleted table numbers can be re-assigned
CREATE UNIQUE INDEX uq_dining_tables_branch_number ON dining_tables(branch_id, table_number) WHERE deleted_at IS NULL;
```

#### 16. `menu_categories`
Classification of dishes.
```sql
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    color_code VARCHAR(10),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_menu_categories_tenant_slug ON menu_categories(tenant_id, slug) WHERE deleted_at IS NULL;
```

#### 17. `menu_items`
Catalog items and food offerings.
```sql
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    short_code VARCHAR(20),
    description TEXT,
    base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    food_type VARCHAR(20) NOT NULL DEFAULT 'VEG',
    tax_setting_id UUID REFERENCES tax_settings(id) ON DELETE SET NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    preparation_time_minutes INT DEFAULT 15,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, id) -- Enables composite foreign key enforcement on children
);

CREATE UNIQUE INDEX uq_menu_items_tenant_code ON menu_items(tenant_id, short_code) WHERE deleted_at IS NULL;
```

#### 18. `item_variants`
Size, portion, or preparation variations. Includes denormalized `tenant_id` and composite foreign key constraint to prevent cross-tenant referencing.
```sql
CREATE TABLE item_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    price_difference NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sku VARCHAR(50),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    -- Composite FK guarantees item belongs to the same tenant
    CONSTRAINT fk_item_variants_tenant_item FOREIGN KEY (tenant_id, item_id) 
        REFERENCES menu_items(tenant_id, id) ON DELETE CASCADE
);
```

#### 19. `modifier_groups`
Collections of add-ons (e.g., "Spice Level", "Extra Toppings").
```sql
CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    min_selection INT NOT NULL DEFAULT 0,
    max_selection INT NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, id) -- Enables composite foreign key enforcement on children
);
```

#### 20. `modifiers`
Individual add-ons with denormalized `tenant_id` and composite foreign key constraint.
```sql
CREATE TABLE modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    group_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    additional_price NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (additional_price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    deleted_at TIMESTAMPTZ,
    -- Composite FK guarantees group belongs to the same tenant
    CONSTRAINT fk_modifiers_tenant_group FOREIGN KEY (tenant_id, group_id)
        REFERENCES modifier_groups(tenant_id, id) ON DELETE CASCADE
);
```

#### 21. `menu_item_modifiers`
Associates modifier groups to specific menu items with cross-tenant check.
```sql
CREATE TABLE menu_item_modifiers (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    modifier_group_id UUID NOT NULL,
    PRIMARY KEY(item_id, modifier_group_id),
    CONSTRAINT fk_mim_tenant_item FOREIGN KEY (tenant_id, item_id)
        REFERENCES menu_items(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_mim_tenant_group FOREIGN KEY (tenant_id, modifier_group_id)
        REFERENCES modifier_groups(tenant_id, id) ON DELETE CASCADE
);
```

---

## 4. Indexing Strategy

```sql
CREATE INDEX idx_branches_tenant ON branches(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tables_branch_status ON dining_tables(branch_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_cat ON menu_items(category_id, is_available) WHERE deleted_at IS NULL;
CREATE INDEX idx_item_variants_item ON item_variants(tenant_id, item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_modifiers_group ON modifiers(tenant_id, group_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_memberships_user_tenant ON memberships(user_id, tenant_id) WHERE is_active = TRUE;
```

---

## 5. Offline-First Synchronization & Conflict Protocol

1. **Client ID Generation:** Every offline order, item, and table status update uses a client-generated UUID.
2. **Idempotency Guarantees:** Sync batches upsert rows via `ON CONFLICT (id) DO UPDATE ... WHERE remote.version <= incoming.version`.
3. **Tombstone Retention (GC Policy):** Soft-deleted records retain their tombstones for 90 days. A scheduled cleanup cron purges soft-deleted rows older than 90 days. Offline clients disconnected for >90 days are required to perform a full baseline reconciliation.
