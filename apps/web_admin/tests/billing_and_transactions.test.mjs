import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import billing engine logic
import { billingEngine } from '../src/lib/billingEngine.js';

describe('PetPooja POS — Step 6 Financial & Billing Calculations', () => {

  // 1. Subtotal Calculation
  it('should accurately calculate subtotal for multiple line items', () => {
    const items = [
      { id: '1', name: 'Special Mutton Dum Biryani', price: 380.00, quantity: 2 },
      { id: '2', name: 'Chicken 65', price: 260.00, quantity: 1 },
      { id: '3', name: 'Butter Naan', price: 50.00, quantity: 3 },
    ];
    // (380 * 2) + (260 * 1) + (50 * 3) = 760 + 260 + 150 = 1170.00
    const subtotal = billingEngine.calculateSubtotal(items);
    assert.equal(subtotal, 1170.00);
  });

  // 2. 5% GST (2.5% CGST + 2.5% SGST)
  it('should compute exact 5% GST split equally between CGST and SGST', () => {
    const items = [
      { id: '1', name: 'Nawabi Paneer Dum Biryani', price: 240.00, quantity: 2 }, // 480
    ];
    const bill = billingEngine.calculateBill(items, { type: 'NONE', value: 0 }, 'DINE_IN', 0.05);
    assert.equal(bill.subtotal, 480.00);
    assert.equal(bill.taxableAmount, 480.00);
    assert.equal(bill.cgst, 12.00); // 2.5% of 480
    assert.equal(bill.sgst, 12.00); // 2.5% of 480
    assert.equal(bill.totalTax, 24.00); // 5% of 480
    assert.equal(bill.grandTotal, 504.00); // 480 + 24
  });

  // 3. Percentage Discount
  it('should compute 10% discount and tax on reduced taxable amount', () => {
    const items = [
      { id: '1', name: 'Biryani Platter', price: 1000.00, quantity: 1 },
    ];
    const bill = billingEngine.calculateBill(items, { type: 'PERCENT', value: 10 }, 'DINE_IN', 0.05);
    assert.equal(bill.subtotal, 1000.00);
    assert.equal(bill.discountAmount, 100.00);
    assert.equal(bill.taxableAmount, 900.00);
    assert.equal(bill.cgst, 22.50); // 2.5% of 900
    assert.equal(bill.sgst, 22.50); // 2.5% of 900
    assert.equal(bill.totalTax, 45.00); // 5% of 900
    assert.equal(bill.grandTotal, 945.00); // 900 + 45
  });

  // 4. Flat Discount
  it('should compute flat ₹150 discount correctly', () => {
    const items = [
      { id: '1', name: 'Biryani Platter', price: 1000.00, quantity: 1 },
    ];
    const bill = billingEngine.calculateBill(items, { type: 'FLAT', value: 150 }, 'DINE_IN', 0.05);
    assert.equal(bill.subtotal, 1000.00);
    assert.equal(bill.discountAmount, 150.00);
    assert.equal(bill.taxableAmount, 850.00);
    assert.equal(bill.cgst, 21.25);
    assert.equal(bill.sgst, 21.25);
    assert.equal(bill.totalTax, 42.50);
    assert.equal(bill.grandTotal, 893.00); // 850 + 42.50 = 892.50 rounded to 893
    assert.equal(bill.roundOff, 0.50);
  });

  // 5. Boundary Condition: Discount > Bill Amount
  it('should cap discount at subtotal when discount exceeds bill', () => {
    const items = [
      { id: '1', name: 'Chai', price: 40.00, quantity: 1 },
    ];
    // Attempting ₹100 discount on ₹40 item
    const bill = billingEngine.calculateBill(items, { type: 'FLAT', value: 100 }, 'DINE_IN', 0.05);
    assert.equal(bill.subtotal, 40.00);
    assert.equal(bill.discountAmount, 40.00); // Capped at 40
    assert.equal(bill.taxableAmount, 0.00);
    assert.equal(bill.totalTax, 0.00);
    assert.equal(bill.grandTotal, 0.00);
  });

  // 6. Round-Off Calculation
  it('should round to nearest whole rupee with exact round-off value', () => {
    const items = [
      { id: '1', name: 'Item A', price: 99.50, quantity: 1 }, // Tax 5% = 4.98, Net = 104.48 -> 104.00, roundOff = -0.48
    ];
    const bill = billingEngine.calculateBill(items, { type: 'NONE', value: 0 }, 'DINE_IN', 0.05);
    assert.equal(bill.grandTotal, 104.00);
    assert.equal(bill.roundOff, -0.48);
  });

  // 7. Multi-Tender Split Payment Validation
  it('should validate exact split payments across Cash, UPI, and Card', () => {
    const grandTotal = 1250.00;
    const splitPayments = [
      { mode: 'CASH', amount: 500.00 },
      { mode: 'UPI', amount: 500.00 },
      { mode: 'CARD', amount: 250.00 },
    ];
    const check = billingEngine.validatePayments(grandTotal, splitPayments);
    assert.equal(check.isValid, true);
    assert.equal(check.totalPaid, 1250.00);
    assert.equal(check.balance, 0.00);
  });

  it('should reject incomplete split payment when balance remains', () => {
    const grandTotal = 1250.00;
    const partialPayments = [
      { mode: 'CASH', amount: 500.00 },
      { mode: 'UPI', amount: 400.00 },
    ];
    const check = billingEngine.validatePayments(grandTotal, partialPayments);
    assert.equal(check.isValid, false);
    assert.equal(check.totalPaid, 900.00);
    assert.equal(check.balance, 350.00);
  });

  // 8. Recipe BOM Stock Deduction Calculation
  it('should accurately calculate raw ingredient consumption from sold items', () => {
    const recipes = [
      { menuItemId: 'item-biryani', rawMaterialId: 'rm-mutton', materialName: 'Baby Mutton', quantityRequired: 0.250 },
      { menuItemId: 'item-biryani', rawMaterialId: 'rm-rice', materialName: 'Basmati Rice', quantityRequired: 0.200 },
      { menuItemId: 'item-biryani', rawMaterialId: 'rm-ghee', materialName: 'Desi Ghee', quantityRequired: 0.030 },
      { menuItemId: 'item-naan', rawMaterialId: 'rm-flour', materialName: 'Maida', quantityRequired: 0.120 },
    ];

    const soldItems = [
      { menuItemId: 'item-biryani', quantity: 4 }, // 4 biryanis
      { menuItemId: 'item-naan', quantity: 5 }, // 5 naans
    ];

    const consumption = billingEngine.calculateRecipeConsumption(soldItems, recipes);

    const mutton = consumption.find(c => c.rawMaterialId === 'rm-mutton');
    const rice = consumption.find(c => c.rawMaterialId === 'rm-rice');
    const ghee = consumption.find(c => c.rawMaterialId === 'rm-ghee');
    const flour = consumption.find(c => c.rawMaterialId === 'rm-flour');

    assert.equal(mutton?.totalConsumed, 1.000); // 4 * 0.250 kg = 1.0 kg
    assert.equal(rice?.totalConsumed, 0.800);   // 4 * 0.200 kg = 0.8 kg
    assert.equal(ghee?.totalConsumed, 0.120);   // 4 * 0.030 kg = 0.12 kg
    assert.equal(flour?.totalConsumed, 0.600);  // 5 * 0.120 kg = 0.6 kg
  });
});
