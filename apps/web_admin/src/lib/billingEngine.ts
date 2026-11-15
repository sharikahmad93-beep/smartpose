/**
 * SMART RESTAURANT POS — BILLING & FINANCIAL ENGINE
 * Implements standard Indian GST, PetPooja discount rules, round-off,
 * multi-tender balance checking, and recipe BOM stock calculations.
 * Strict Rule: No floating-point rounding errors on currency.
 */

export interface LineItem {
  id: string;
  name: string;
  price: number; // in Rupees, up to 2 decimal places
  quantity: number;
  kotSentQty?: number;
}

export interface DiscountInput {
  type: 'NONE' | 'PERCENT' | 'FLAT' | 'COUPON';
  value: number; // e.g., 10 for 10% or 100 for ₹100 flat
  reason?: string;
}

export interface BillCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number; // 2.5%
  sgst: number; // 2.5%
  totalTax: number; // 5%
  packagingCharges: number;
  netBeforeRoundOff: number;
  roundOff: number;
  grandTotal: number;
}

export interface TenderPayment {
  mode: 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'DUE';
  amount: number;
}

export interface RecipeBOM {
  menuItemId: string;
  rawMaterialId: string;
  materialName: string;
  quantityRequired: number; // in kg/liters
}

export const billingEngine = {
  // 1. Calculate raw subtotal from cart items
  calculateSubtotal(items: LineItem[]): number {
    const rawTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return Math.round(rawTotal * 100) / 100;
  },

  // 2. Calculate discount with strict upper boundary (discount cannot exceed subtotal)
  calculateDiscount(subtotal: number, discount: DiscountInput): number {
    if (!discount || discount.type === 'NONE' || discount.value <= 0) {
      return 0.00;
    }

    let calculated = 0;
    if (discount.type === 'PERCENT') {
      const clampedPercent = Math.min(Math.max(discount.value, 0), 100);
      calculated = Math.round((subtotal * (clampedPercent / 100)) * 100) / 100;
    } else {
      // FLAT or COUPON
      calculated = Math.round(discount.value * 100) / 100;
    }

    // Boundary rule: Discount cannot exceed bill subtotal
    return Math.min(calculated, subtotal);
  },

  // 3. Complete Bill Breakdown (GST 5% = 2.5% CGST + 2.5% SGST, Packaging, Round-off)
  calculateBill(
    items: LineItem[],
    discount: DiscountInput = { type: 'NONE', value: 0 },
    orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE_AGGREGATOR' = 'DINE_IN',
    taxRate: number = 0.05
  ): BillCalculationResult {
    const subtotal = this.calculateSubtotal(items);
    const discountAmount = this.calculateDiscount(subtotal, discount);
    const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    // 5% GST split equally between CGST and SGST
    const halfTaxRate = taxRate / 2;
    const cgst = Math.round((taxableAmount * halfTaxRate) * 100) / 100;
    const sgst = Math.round((taxableAmount * halfTaxRate) * 100) / 100;
    const totalTax = Math.round((cgst + sgst) * 100) / 100;

    // Delivery or Takeaway packaging charge
    const packagingCharges = (orderType === 'TAKEAWAY' || orderType === 'DELIVERY') ? 25.00 : 0.00;

    const netBeforeRoundOff = Math.round((taxableAmount + totalTax + packagingCharges) * 100) / 100;
    const grandTotal = Math.round(netBeforeRoundOff);
    const roundOff = Math.round((grandTotal - netBeforeRoundOff) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      cgst,
      sgst,
      totalTax,
      packagingCharges,
      netBeforeRoundOff,
      roundOff,
      grandTotal,
    };
  },

  // 4. Validate Multi-Tender Split Payment
  validatePayments(grandTotal: number, tenders: TenderPayment[]): { isValid: boolean; totalPaid: number; balance: number } {
    const totalPaid = tenders.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const balance = Math.round((grandTotal - totalPaid) * 100) / 100;

    // Within ±1 rupee tolerance for cash round-off
    const isValid = Math.abs(balance) <= 1.00;
    return {
      isValid,
      totalPaid: Math.round(totalPaid * 100) / 100,
      balance,
    };
  },

  // 5. Calculate Recipe BOM Stock Deductions
  calculateRecipeConsumption(
    soldItems: Array<{ menuItemId: string; quantity: number }>,
    recipes: RecipeBOM[]
  ): Array<{ rawMaterialId: string; materialName: string; totalConsumed: number }> {
    const consumptionMap = new Map<string, { materialName: string; total: number }>();

    for (const item of soldItems) {
      const itemRecipes = recipes.filter(r => r.menuItemId === item.menuItemId);
      for (const recipe of itemRecipes) {
        const current = consumptionMap.get(recipe.rawMaterialId) || {
          materialName: recipe.materialName,
          total: 0,
        };
        current.total += (recipe.quantityRequired * item.quantity);
        consumptionMap.set(recipe.rawMaterialId, current);
      }
    }

    return Array.from(consumptionMap.entries()).map(([rawMaterialId, data]) => ({
      rawMaterialId,
      materialName: data.materialName,
      totalConsumed: Math.round(data.total * 1000) / 1000,
    }));
  },
};
