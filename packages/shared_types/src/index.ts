/**
 * ==============================================================================
 * SMART RESTAURANT POS SAAS PLATFORM — CANONICAL SHARED TYPES
 * Location: packages/shared_types/src/index.ts
 * Target: Next.js Web Admin, Super Admin, Node.js Worker, and Client SDKs
 * ==============================================================================
 */

// ==============================================================================
// 1. DOMAIN A: TENANCY & ACCESS CONTROL
// ==============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  legal_name?: string | null;
  gstin?: string | null;
  currency_code: string;
  currency_symbol: string;
  timezone: string;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  phone: string;
  email?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_main_branch: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Profile {
  id: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSuperadmin {
  user_id: string;
  granted_by?: string | null;
  notes?: string | null;
  created_at: string;
}

export type SystemRoleCode =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'KITCHEN';

export interface Role {
  id: string;
  tenant_id?: string | null;
  name: string;
  code: SystemRoleCode | string;
  description?: string | null;
  is_system_role: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  code: string;
  category: 'tenancy' | 'branch' | 'staff' | 'menu' | 'tables' | 'orders' | 'kitchen' | 'billing' | 'reports' | 'audit';
  description: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface Membership {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  profile?: Profile;
  role?: Role;
  tenant?: Tenant;
  branch_access?: BranchAccess[];
}

export interface BranchAccess {
  id: string;
  membership_id: string;
  branch_id: string;
  is_default: boolean;
  created_at: string;
  branch?: Branch;
}

export interface AuditLog {
  id: string;
  tenant_id?: string | null;
  branch_id?: string | null;
  actor_id?: string | null;
  entity_name: string;
  entity_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'EXECUTE';
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

// ==============================================================================
// 2. DOMAIN B: RESTAURANT CONFIGURATION
// ==============================================================================

export interface RestaurantSetting {
  tenant_id: string;
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  enable_table_ordering: boolean;
  enable_kds: boolean;
  enable_inventory: boolean;
  updated_at: string;
}

export interface TaxSetting {
  id: string;
  tenant_id: string;
  name: string;
  rate_percent: number;
  is_inclusive: boolean;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent: number;
  is_active: boolean;
  created_at: string;
}

export interface ServiceCharge {
  id: string;
  tenant_id: string;
  name: string;
  rate_percent: number;
  is_optional: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BusinessHour {
  id: string;
  branch_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// ==============================================================================
// 3. DOMAIN C: POS CATALOG & DINING TABLES
// ==============================================================================

export type TableStatus = 'VACANT' | 'OCCUPIED' | 'BILLED' | 'RESERVED' | 'OUT_OF_SERVICE';

export interface DiningTable {
  id: string;
  tenant_id: string;
  branch_id: string;
  table_number: string;
  section: string;
  seating_capacity: number;
  status: TableStatus;
  qr_token?: string | null;
  current_order_id?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface MenuCategory {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string;
  tax_setting_id?: string | null;
  name: string;
  short_code?: string | null;
  description?: string | null;
  image_url?: string | null;
  base_price: number;
  is_veg: boolean;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined
  category?: MenuCategory;
  variants?: ItemVariant[];
  modifier_groups?: ModifierGroup[];
  tax_setting?: TaxSetting;
}

export interface ItemVariant {
  id: string;
  tenant_id: string;
  item_id: string;
  name: string;
  sku?: string | null;
  price: number;
  is_default: boolean;
  is_available: boolean;
  created_at: string;
}

export interface ModifierGroup {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  created_at: string;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  tenant_id: string;
  group_id: string;
  name: string;
  price_adjustment: number;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface MenuItemModifier {
  tenant_id: string;
  menu_item_id: string;
  modifier_group_id: string;
  sort_order: number;
}

// ==============================================================================
// 4. DOMAIN D: ORDERS, KOT & BILLING (Phase 2 Types)
// ==============================================================================

export type OrderStatus = 'DRAFT' | 'ACTIVE' | 'BILLED' | 'SETTLED' | 'CANCELLED';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export interface Order {
  id: string;
  tenant_id: string;
  branch_id: string;
  table_id?: string | null;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  guest_count: number;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  service_charge_total: number;
  grand_total: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OrderItem[];
  table?: DiningTable;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  variant_id?: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string | null;
  kot_status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  created_at: string;
}

// ==============================================================================
// 5. API / AUTH CONTEXT INTERFACES
// ==============================================================================

export interface AuthenticatedUserContext {
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  roleCode: SystemRoleCode | string;
  isSuperAdmin: boolean;
  accessibleBranches: string[];
  permissions: string[];
}
