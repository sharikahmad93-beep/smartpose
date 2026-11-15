/**
 * SMART RESTAURANT POS — BILLING & FINANCIAL ENGINE (ES Module)
 */

export const billingEngine = {
  calculateSubtotal(items) {
    const rawTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return Math.round(rawTotal * 100) / 100;
  },

  calculateDiscount(subtotal, discount) {
    if (!discount || discount.type === 'NONE' || discount.value <= 0) {
      return 0.00;
    }

    let calculated = 0;
    if (discount.type === 'PERCENT') {
      const clampedPercent = Math.min(Math.max(discount.value, 0), 100);
      calculated = Math.round((subtotal * (clampedPercent / 100)) * 100) / 100;
    } else {
      calculated = Math.round(discount.value * 100) / 100;
    }

    return Math.min(calculated, subtotal);
  },

  calculateBill(items, discount = { type: 'NONE', value: 0 }, orderType = 'DINE_IN', taxRate = 0.05) {
    const subtotal = this.calculateSubtotal(items);
    const discountAmount = this.calculateDiscount(subtotal, discount);
    const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    const halfTaxRate = taxRate / 2;
    const cgst = Math.round((taxableAmount * halfTaxRate) * 100) / 100;
    const sgst = Math.round((taxableAmount * halfTaxRate) * 100) / 100;
    const totalTax = Math.round((cgst + sgst) * 100) / 100;

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

  validatePayments(grandTotal, tenders) {
    const totalPaid = tenders.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const balance = Math.round((grandTotal - totalPaid) * 100) / 100;

    const isValid = Math.abs(balance) <= 1.00;
    return {
      isValid,
      totalPaid: Math.round(totalPaid * 100) / 100,
      balance,
    };
  },

  calculateRecipeConsumption(soldItems, recipes) {
    const consumptionMap = new Map();

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
