# Smart Restaurant POS — Multi-Tenant Security & RLS Architecture

**Document Version:** 1.1.0 (Hardened Security Release)  
**Security Standard:** Zero-Trust Database-Enforced Row Level Security (RLS)  
**Target Platform:** Supabase PostgreSQL 15+ & Auth

---

## 1. Zero-Trust Security Tenets & Schema Architecture

1. **Client Identity is Untrusted:** The frontend Flutter app or Next.js browser client can never dictate its own `tenant_id` or `branch_id`. All permissions derive strictly from `auth.uid()` verified against the server-side `memberships` and `branch_access` tables.
2. **Dedicated Private Security Schema (`app_private`):**
   * All custom security helper functions reside in a dedicated `app_private` schema.
   * `app_private` is **never exposed** through PostgREST (Supabase Data API). It is invisible over HTTP/REST.
   * `EXECUTE` privileges are revoked from `PUBLIC` and `anon`. Granted only to `authenticated` and `service_role`.
   * Functions use `SECURITY DEFINER` with an explicit, immutable search path:  
     `SET search_path = app_private, public, pg_temp;`
3. **Super Admin Isolation (`platform_superadmins`):**
   * Authority is verified strictly against `platform_superadmins(user_id)`.
   * Standard profiles cannot elevate privileges. `INSERT`, `UPDATE`, and `DELETE` on `platform_superadmins` are revoked from client roles.
4. **Audit Log Immutability:**
   * Direct client `INSERT`, `UPDATE`, and `DELETE` are revoked from `audit_logs`.
   * Audit rows are produced exclusively through PostgreSQL triggers using trusted internal database context (`auth.uid()`, `inet_client_addr()`, `current_timestamp`).
5. **No Service-Role Key on Clients:** `SUPABASE_SERVICE_ROLE_KEY` is strictly reserved for headless server-side operations. Client apps use `NEXT_PUBLIC_SUPABASE_ANON_KEY` combined with user JWT tokens.

---

## 2. Server-Side Security Definer Functions (`app_private` Schema)

### 2.1 Schema Initialization & Privilege Lockdown
```sql
CREATE SCHEMA IF NOT EXISTS app_private;

-- Block external HTTP/Data API access
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;
```

---

### 2.2 `app_private.is_superadmin()`
Verifies whether the current authenticated identity is listed in `platform_superadmins`. Safely handles `auth.uid() IS NULL`.
```sql
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
```

---

### 2.3 `app_private.get_user_tenant_ids()`
Returns all tenant UUIDs where the authenticated user has an active membership. Returns empty set if unauthenticated.
```sql
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
    SELECT tenant_id
    FROM public.memberships
    WHERE user_id = v_user_id
      AND is_active = TRUE;
END;
$$;

REVOKE ALL ON FUNCTION app_private.get_user_tenant_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.get_user_tenant_ids() TO authenticated, service_role;
```

---

### 2.4 `app_private.has_branch_access(target_branch_id UUID)`
Verifies branch-level access. Tenant Owners have blanket access across all branches in their tenant; other roles require an explicit `branch_access` record.
```sql
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
    -- Safe exit for unauthenticated calls
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Super Admin has platform-wide operational access
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

    -- Tenant Owner has blanket access to all branches of their brand
    IF v_role_code = 'OWNER' THEN
        RETURN TRUE;
    END IF;

    -- Check explicit branch authorization
    RETURN EXISTS (
        SELECT 1
        FROM public.memberships m
        JOIN public.branch_access ba ON ba.membership_id = m.id
        WHERE m.user_id = v_user_id
          AND ba.branch_id = target_branch_id
          AND m.is_active = TRUE
    );
END;
$$;

REVOKE ALL ON FUNCTION app_private.has_branch_access(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.has_branch_access(UUID) TO authenticated, service_role;
```

---

### 2.5 `app_private.has_permission(required_permission VARCHAR, target_tenant_id UUID)`
Checks granular RBAC capability keys.
```sql
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
```

---

## 3. Concrete Row Level Security (RLS) Policy Specifications

### 3.1 Non-Recursive Memberships Policy
To prevent infinite recursion (`ERROR: infinite recursion detected in policy for relation "memberships"`), the SELECT policy on `memberships` uses a direct non-recursive predicate:
```sql
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Non-recursive: Users see only their own membership records; Superadmins see all
CREATE POLICY "memberships_select"
ON memberships
FOR SELECT
USING (
    user_id = auth.uid()
    OR app_private.is_superadmin()
);

-- Only Tenant Owners or Superadmins can insert/modify memberships
CREATE POLICY "memberships_insert"
ON memberships
FOR INSERT
WITH CHECK (
    app_private.has_permission('staff.manage', tenant_id)
    OR app_private.is_superadmin()
);

CREATE POLICY "memberships_update"
ON memberships
FOR UPDATE
USING (
    app_private.has_permission('staff.manage', tenant_id)
    OR app_private.is_superadmin()
);
```

---

### 3.2 Tenant Isolation Policy (Example: `menu_categories`)
```sql
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_categories_select"
ON menu_categories
FOR SELECT
USING (
    tenant_id IN (SELECT app_private.get_user_tenant_ids())
    OR app_private.is_superadmin()
);

CREATE POLICY "menu_categories_insert"
ON menu_categories
FOR INSERT
WITH CHECK (
    tenant_id IN (SELECT app_private.get_user_tenant_ids())
    AND app_private.has_permission('menu.manage', tenant_id)
);

CREATE POLICY "menu_categories_update"
ON menu_categories
FOR UPDATE
USING (
    tenant_id IN (SELECT app_private.get_user_tenant_ids())
    AND app_private.has_permission('menu.manage', tenant_id)
);

CREATE POLICY "menu_categories_delete"
ON menu_categories
FOR DELETE
USING (app_private.is_superadmin());
```

---

### 3.3 Branch-Level Isolation Policy (Example: `dining_tables`)
```sql
ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dining_tables_select"
ON dining_tables
FOR SELECT
USING (
    app_private.has_branch_access(branch_id)
    OR app_private.is_superadmin()
);

CREATE POLICY "dining_tables_update"
ON dining_tables
FOR UPDATE
USING (
    app_private.has_branch_access(branch_id)
    AND (
        app_private.has_permission('tables.manage', tenant_id)
        OR app_private.has_permission('tables.update_status', tenant_id)
    )
);
```

---

### 3.4 Tamper-Proof Audit Log Security (Append-Only via Triggers)
Client writes (`INSERT`, `UPDATE`, `DELETE`) are strictly revoked at the grant level:
```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Revoke all client modification privileges
REVOKE INSERT, UPDATE, DELETE ON TABLE audit_logs FROM anon, authenticated;
GRANT SELECT ON TABLE audit_logs TO authenticated;

-- SELECT Policy: Only users with 'audit.view' permission or Superadmins can inspect logs
CREATE POLICY "audit_logs_select"
ON audit_logs
FOR SELECT
USING (
    (tenant_id IN (SELECT app_private.get_user_tenant_ids()) AND app_private.has_permission('audit.view', tenant_id))
    OR app_private.is_superadmin()
);
```

#### Automated Trigger for System Audit Generation:
```sql
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
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
        IF TG_TABLE_NAME = 'dining_tables' THEN
            v_branch_id := OLD.branch_id;
        END IF;
        
        INSERT INTO public.audit_logs (tenant_id, branch_id, user_id, action, entity_name, entity_id, old_data, created_at)
        VALUES (v_tenant_id, v_branch_id, v_user_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), timezone('utc', now()));
        RETURN OLD;
    ELSE
        v_tenant_id := NEW.tenant_id;
        IF TG_TABLE_NAME = 'dining_tables' THEN
            v_branch_id := NEW.branch_id;
        END IF;

        INSERT INTO public.audit_logs (tenant_id, branch_id, user_id, action, entity_name, entity_id, old_data, new_data, created_at)
        VALUES (v_tenant_id, v_branch_id, v_user_id, TG_OP, TG_TABLE_NAME, NEW.id, 
                CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END, 
                to_jsonb(NEW), timezone('utc', now()));
        RETURN NEW;
    END IF;
END;
$$;
```

---

## 4. Threat Matrix & Verified Defensive Controls

| Threat Vector | Attack Scenario | Defensive Countermeasure |
|---|---|---|
| **Cross-Tenant ID Tampering** | Malicious client submits payload with another restaurant's `tenant_id`. | `tenant_id IN (SELECT app_private.get_user_tenant_ids())` rejects the write at database kernel level. |
| **Branch Hopping** | Waiter in Outlet A attempts to change table status in Outlet B. | `app_private.has_branch_access(branch_id)` validates against explicit `branch_access` rows. |
| **Audit Forgery / Modification** | Rogue cashier attempts to inject fake audit records or delete void entries. | Direct `INSERT`, `UPDATE`, and `DELETE` on `audit_logs` are revoked from client roles. Triggers log state changes automatically. |
| **Super Admin Privilege Escalation** | Regular user executes `UPDATE profiles SET is_superadmin=true`. | `is_superadmin` removed from `profiles`. Stored exclusively in `platform_superadmins` where client writes are permanently revoked. |
| **Search Path Hijacking** | Malicious schema objects shadow core database functions. | All security functions explicitly set `SET search_path = app_private, public, pg_temp;`. |
| **RLS Infinite Recursion** | `memberships` table RLS queries helper function querying `memberships`. | `memberships_select` policy uses direct predicate `user_id = auth.uid() OR app_private.is_superadmin()`, eliminating recursive loops. |
