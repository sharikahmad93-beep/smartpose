import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hptreskxtbbxxzhuokbo.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdHJlc2t4dGJieHh6aHVva2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1OTM5OTcsImV4cCI6MjExMDE2OTk5N30.5hRgayOUVjUwl1l70GFnOLHaBLtpFLsviPTO0ZAFTeI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TENANT_ID = '10000000-0000-0000-0000-000000000001';
const BRANCH_ID = '20000000-0000-0000-0000-000000000001';

describe('PetPooja POS — Step 6 Realtime DB & Server-Side Security RPC Tests', () => {

  // 1. Role Check: Kitchen cannot create orders
  it('Server should reject order creation when staff role is KITCHEN', async () => {
    const { data, error } = await supabase.rpc('create_order', {
      p_tenant_id: TENANT_ID,
      p_branch_id: BRANCH_ID,
      p_order_type: 'DINE_IN',
      p_table_id: null,
      p_customer_id: null,
      p_covers: 1,
      p_captain_name: 'Chef Imran',
      p_items: [],
      p_staff_role: 'KITCHEN',
    });

    assert.ok(error, 'Expected error for Kitchen creating order');
    assert.match(error.message, /Kitchen staff cannot create orders/i);
  });

  // 2. Role Check: Captain cannot settle orders
  it('Server should reject bill settlement when staff role is CAPTAIN', async () => {
    const { data, error } = await supabase.rpc('settle_order', {
      p_order_id: '47452103-fe1a-4672-bc6c-145ab5a120db',
      p_payments: [{ mode: 'CASH', amount: 100 }],
      p_discount_amount: 0,
      p_discount_type: 'NONE',
      p_discount_reason: null,
      p_staff_role: 'CAPTAIN',
    });

    assert.ok(error, 'Expected error for Captain settling bill');
    assert.match(error.message, /Only Cashier or Manager can settle bills/i);
  });

  // 3. Discount Check: Cashier cannot apply discount without Manager authorization or reason
  it('Server should reject cashier discount if reason is missing', async () => {
    const { data, error } = await supabase.rpc('settle_order', {
      p_order_id: '47452103-fe1a-4672-bc6c-145ab5a120db',
      p_payments: [{ mode: 'CASH', amount: 100 }],
      p_discount_amount: 50.00,
      p_discount_type: 'FLAT',
      p_discount_reason: null, // missing reason
      p_staff_role: 'CASHIER',
    });

    assert.ok(error, 'Expected error for cashier discount without reason');
    assert.match(error.message, /Discounts require Manager authorization/i);
  });

  // 4. Role Check: Cashier cannot cancel order
  it('Server should reject order cancellation from non-manager', async () => {
    const { data, error } = await supabase.rpc('cancel_order', {
      p_order_id: '47452103-fe1a-4672-bc6c-145ab5a120db',
      p_reason: 'Guest left without eating',
      p_staff_role: 'CASHIER',
    });

    assert.ok(error, 'Expected error for cashier cancelling order');
    assert.match(error.message, /requires Manager or Owner privileges/i);
  });

  // 5. Atomic Flow: Create Order -> Fire KOT -> Settle with FY Invoice
  it('Server should create, fire KOT, and settle order with gap-free FY invoice', async () => {
    // 5.1 Create Dine-in order for Table T-02
    const createRes = await supabase.rpc('create_order', {
      p_tenant_id: TENANT_ID,
      p_branch_id: BRANCH_ID,
      p_order_type: 'DINE_IN',
      p_table_id: 'aa6bd634-407d-4a46-b58d-d51a177ea8dc', // T-02
      p_customer_id: null,
      p_covers: 2,
      p_captain_name: 'Rahul Sharma',
      p_items: [
        {
          menu_item_id: '50000000-0000-0000-0000-000000000001', // Mutton Biryani (380)
          variant_name: 'Regular',
          qty: 1,
          price: 380.00,
          notes: 'Extra raita',
        },
      ],
      p_staff_role: 'CAPTAIN',
    });

    assert.equal(createRes.error, null);
    assert.ok(createRes.data.order_id);
    const orderId = createRes.data.order_id;

    // 5.2 Fire KOT
    const kotRes = await supabase.rpc('fire_kot', {
      p_order_id: orderId,
      p_station: 'KITCHEN',
      p_staff_role: 'CAPTAIN',
    });

    assert.equal(kotRes.error, null);
    assert.equal(kotRes.data.success, true);
    assert.equal(kotRes.data.items_fired_count, 1);

    // 5.3 Settle Order (Subtotal: 380, Tax 5%: 19, Total: 399)
    const settleRes = await supabase.rpc('settle_order', {
      p_order_id: orderId,
      p_payments: [
        { mode: 'UPI', amount: 399.00, reference: 'UPI-TEST-9988' },
      ],
      p_discount_amount: 0.00,
      p_discount_type: 'NONE',
      p_discount_reason: null,
      p_staff_role: 'CASHIER',
    });

    assert.equal(settleRes.error, null);
    assert.equal(settleRes.data.success, true);
    assert.ok(settleRes.data.invoice_no.startsWith('INV/BLR-IND-01/'));
    assert.equal(settleRes.data.total, 399.00);
  });
});
