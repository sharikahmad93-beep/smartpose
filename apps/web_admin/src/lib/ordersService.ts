import { createClient } from './supabase/client';

export const DEFAULT_TENANT_ID = '10000000-0000-0000-0000-000000000001';
export const DEFAULT_BRANCH_ID = '20000000-0000-0000-0000-000000000001';

const OFFLINE_QUEUE_KEY = 'smartpos_offline_order_queue';

export interface CreateOrderParams {
  tenantId?: string;
  branchId?: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE_AGGREGATOR';
  tableId?: string | null;
  customerId?: string | null;
  covers?: number;
  captainName?: string;
  items: Array<{
    menu_item_id: string;
    variant_name?: string;
    qty: number;
    price: number;
    notes?: string;
  }>;
  staffRole?: string;
}

export interface PaymentItem {
  mode: 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'DUE';
  amount: number;
  reference?: string;
}

export interface SettleOrderParams {
  orderId: string;
  payments: PaymentItem[];
  discountAmount?: number;
  discountType?: 'NONE' | 'PERCENT' | 'FLAT' | 'COUPON';
  discountReason?: string;
  staffRole?: string;
}

export const ordersService = {
  getSupabase() {
    return createClient();
  },

  // 1. Create order via atomic RPC
  async createOrder(params: CreateOrderParams) {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase.rpc('create_order', {
        p_tenant_id: params.tenantId || DEFAULT_TENANT_ID,
        p_branch_id: params.branchId || DEFAULT_BRANCH_ID,
        p_order_type: params.orderType,
        p_table_id: params.tableId || null,
        p_customer_id: params.customerId || null,
        p_covers: params.covers || 1,
        p_captain_name: params.captainName || 'Staff',
        p_items: params.items,
        p_staff_role: params.staffRole || 'CASHIER',
      });

      if (error) throw error;
      return { success: true, ...data };
    } catch (err: any) {
      console.warn('Network or DB error on createOrder, buffering to offline queue:', err.message);
      this.bufferOfflineOrder(params);
      return {
        success: true,
        offline: true,
        order_id: `offline-${Date.now()}`,
        status: 'OPEN',
        message: 'Order saved to offline queue',
      };
    }
  },

  // 2. Fire Incremental KOT ticket
  async fireKOT(orderId: string, station: string = 'KITCHEN', staffRole: string = 'CAPTAIN') {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase.rpc('fire_kot', {
        p_order_id: orderId,
        p_station: station,
        p_staff_role: staffRole,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error firing KOT:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 3. Update KOT Status (Kitchen / Captain)
  async updateKOTStatus(kotId: string, status: string, staffRole: string = 'KITCHEN') {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase.rpc('update_kot_status', {
        p_kot_id: kotId,
        p_status: status,
        p_staff_role: staffRole,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error updating KOT status:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 4. Settle Order (Payments + FY Invoice Sequence + BOM Stock Deduction)
  async settleOrder(params: SettleOrderParams) {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase.rpc('settle_order', {
        p_order_id: params.orderId,
        p_payments: params.payments,
        p_discount_amount: params.discountAmount || 0.0,
        p_discount_type: params.discountType || 'NONE',
        p_discount_reason: params.discountReason || null,
        p_staff_role: params.staffRole || 'CASHIER',
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error settling order:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 5. Cancel Order with mandatory audit reason
  async cancelOrder(orderId: string, reason: string, staffRole: string = 'MANAGER') {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
        p_reason: reason,
        p_staff_role: staffRole,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error cancelling order:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 6. Merge Tables
  async mergeTables(sourceTableId: string, targetTableId: string, reason?: string, staffRole: string = 'CAPTAIN') {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase.rpc('merge_tables', {
        p_source_table_id: sourceTableId,
        p_target_table_id: targetTableId,
        p_reason: reason || 'Merged by floor staff',
        p_staff_role: staffRole,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error merging tables:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 7. Transfer Table
  async transferTable(orderId: string, fromTableId: string, toTableId: string, reason?: string, staffRole: string = 'CAPTAIN') {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase.rpc('transfer_table', {
        p_order_id: orderId,
        p_from_table_id: fromTableId,
        p_to_table_id: toTableId,
        p_reason: reason || 'Transferred by floor staff',
        p_staff_role: staffRole,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error transferring table:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 8. Fetch Dining Tables
  async fetchTables() {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase
        .from('dining_tables')
        .select('*')
        .eq('branch_id', DEFAULT_BRANCH_ID)
        .order('table_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Failed to fetch dining tables from Supabase, using fallback');
      return [];
    }
  },

  // 9. Subscribe to Dining Tables Realtime
  subscribeToTables(onUpdate: (payload: any) => void) {
    const supabase = this.getSupabase();
    const channel = supabase
      .channel('realtime:dining_tables')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dining_tables' },
        (payload) => onUpdate(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // 10. Fetch KDS Active Tickets
  async fetchKDSQueue() {
    const supabase = this.getSupabase();
    try {
      const { data, error } = await supabase
        .from('kot_tickets')
        .select('*, orders(order_type, table_id, dining_tables(table_number))')
        .in('status', ['FIRED', 'PREPARING'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Failed to fetch KDS queue from Supabase');
      return [];
    }
  },

  // 11. Subscribe to KDS Realtime
  subscribeToKDS(onUpdate: (payload: any) => void) {
    const supabase = this.getSupabase();
    const channel = supabase
      .channel('realtime:kot_tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kot_tickets' },
        (payload) => onUpdate(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // 12. Offline Queue Management
  bufferOfflineOrder(order: CreateOrderParams) {
    if (typeof window === 'undefined') return;
    try {
      const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      existing.push({ order, bufferedAt: new Date().toISOString() });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to store offline order in localStorage', e);
    }
  },

  async flushOfflineQueue() {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return 0;
      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return 0;

      let flushedCount = 0;
      const remaining = [];

      for (const item of queue) {
        try {
          const res = await this.createOrder(item.order);
          if (res.success && !res.offline) {
            flushedCount++;
          } else {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      return flushedCount;
    } catch (e) {
      console.error('Error flushing offline queue', e);
      return 0;
    }
  },
};
