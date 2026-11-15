'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  short_code: string;
  category: string;
  price: number;
  is_veg: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  portion?: 'Regular' | 'Large';
}

const CATALOG_ITEMS: MenuItem[] = [
  { id: '1', name: 'Special Mutton Dum Biryani', short_code: 'MB01', category: 'Biryani', price: 380, is_veg: false },
  { id: '2', name: 'Royal Chicken Dum Biryani', short_code: 'CB01', category: 'Biryani', price: 290, is_veg: false },
  { id: '3', name: 'Nawabi Paneer Dum Biryani', short_code: 'PB01', category: 'Biryani', price: 240, is_veg: true },
  { id: '4', name: 'Chicken 65 (Crispy Andhra)', short_code: 'C65', category: 'Starters', price: 260, is_veg: false },
  { id: '5', name: 'Tandoori Paneer Tikka', short_code: 'PT01', category: 'Starters', price: 230, is_veg: true },
  { id: '6', name: 'Murgh Malai Kebab', short_code: 'MMK01', category: 'Starters', price: 280, is_veg: false },
  { id: '7', name: 'Butter Naan', short_code: 'BN01', category: 'Breads', price: 50, is_veg: true },
  { id: '8', name: 'Garlic Herb Naan', short_code: 'GN01', category: 'Breads', price: 65, is_veg: true },
  { id: '9', name: 'Tandoori Roti', short_code: 'TR01', category: 'Breads', price: 35, is_veg: true },
  { id: '10', name: 'Hot Gulab Jamun (2 Pcs)', short_code: 'GJ01', category: 'Desserts', price: 80, is_veg: true },
  { id: '11', name: 'Irani Masala Chai', short_code: 'MC01', category: 'Drinks', price: 40, is_veg: true },
  { id: '12', name: 'Fresh Lime Soda', short_code: 'FLS01', category: 'Drinks', price: 60, is_veg: true },
];

const TABLES = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'T-09', 'T-10'];

export default function PosBillingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegFilterOnly, setVegFilterOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('T-01');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Special Mutton Dum Biryani', short_code: 'MB01', category: 'Biryani', price: 380, is_veg: false, quantity: 2, portion: 'Regular' },
    { id: '4', name: 'Chicken 65 (Crispy Andhra)', short_code: 'C65', category: 'Starters', price: 260, is_veg: false, quantity: 1, portion: 'Regular' },
    { id: '7', name: 'Butter Naan', short_code: 'BN01', category: 'Breads', price: 50, is_veg: true, quantity: 3, portion: 'Regular' }
  ]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('UPI');
  const [cashTendered, setCashTendered] = useState<number>(1500);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [kotSentAlert, setKotSentAlert] = useState<boolean>(false);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) => (ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
      }
      return [...prev, { ...item, quantity: 1, portion: 'Regular' }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => (ci.id === id ? { ...ci, quantity: ci.quantity + delta } : ci))
        .filter((ci) => ci.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  // Financial calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const cgst = taxableAmount * 0.025; // 2.5% CGST
  const sgst = taxableAmount * 0.025; // 2.5% SGST
  const grandTotal = Math.round(taxableAmount + cgst + sgst);
  const changeDue = Math.max(0, cashTendered - grandTotal);

  // Filtered menu items
  const filteredItems = CATALOG_ITEMS.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesVeg = !vegFilterOnly || item.is_veg;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.short_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesVeg && matchesSearch;
  });

  const handleSendKot = () => {
    setKotSentAlert(true);
    setTimeout(() => setKotSentAlert(false), 3000);
  };

  const handleSettle = () => {
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Mini Sidebar */}
      <aside className="w-20 bg-slate-900 text-white flex flex-col items-center py-4 border-r border-slate-800">
        <Link href="/" className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-xl text-white mb-6 shadow-lg shadow-orange-600/30">
          BE
        </Link>
        <nav className="flex-1 space-y-4 text-center">
          <Link href="/pos" className="flex flex-col items-center p-2 rounded-xl bg-orange-600 text-white font-medium text-xs">
            <span className="text-xl mb-0.5">⚡</span>
            <span>POS</span>
          </Link>
          <Link href="/kds" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs">
            <span className="text-xl mb-0.5">🍳</span>
            <span>KDS</span>
          </Link>
          <Link href="/tables" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs">
            <span className="text-xl mb-0.5">🪑</span>
            <span>Tables</span>
          </Link>
          <Link href="/catalog" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs">
            <span className="text-xl mb-0.5">🍛</span>
            <span>Menu</span>
          </Link>
          <Link href="/online-orders" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs">
            <span className="text-xl mb-0.5">🛵</span>
            <span>Orders</span>
          </Link>
          <Link href="/cash-drawer" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs">
            <span className="text-xl mb-0.5">💵</span>
            <span>Cash</span>
          </Link>
          <Link href="/reports" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs">
            <span className="text-xl mb-0.5">📈</span>
            <span>Reports</span>
          </Link>
        </nav>
        <Link href="/settings" className="text-slate-400 hover:text-white p-2">
          <span>⚙️</span>
        </Link>
      </aside>

      {/* Center POS Catalog Area */}
      <section className="flex-1 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${orderType === 'DINE_IN' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600'}`}
              >
                🍽️ Dine In
              </button>
              <button
                onClick={() => setOrderType('TAKEAWAY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${orderType === 'TAKEAWAY' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600'}`}
              >
                🥡 Takeaway
              </button>
              <button
                onClick={() => setOrderType('DELIVERY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${orderType === 'DELIVERY' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600'}`}
              >
                🛵 Delivery
              </button>
            </div>

            {orderType === 'DINE_IN' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Table:</span>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {TABLES.map((t) => (
                    <option key={t} value={t}>{t} (AC Hall)</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search by name or code */}
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search dishes or punch code (e.g., MB01, CB01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Veg Filter Toggle */}
          <button
            onClick={() => setVegFilterOnly(!vegFilterOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              vegFilterOnly ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white"></span>
            <span>Veg Only</span>
          </button>
        </header>

        {/* Category Pill Tabs */}
        <div className="bg-white px-6 py-3 border-b border-slate-200 flex gap-2 overflow-x-auto">
          {['All', 'Biryani', 'Starters', 'Breads', 'Desserts', 'Drinks'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {kotSentAlert && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-md">
              <span>✓ Kitchen Order Ticket (KOT #108) fired to Kitchen Display System!</span>
              <span className="text-emerald-200">Printed 80mm</span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-500 hover:shadow-md transition text-left flex flex-col justify-between h-36 group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-orange-600 font-bold">{item.short_code}</span>
                    <span className={`w-3 h-3 rounded-sm flex items-center justify-center border ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-2 leading-tight">{item.name}</h4>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                  <span className="text-base font-extrabold text-slate-900">₹{item.price}</span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md group-hover:bg-orange-600 group-hover:text-white transition">
                    + Add
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Right Petpooja-Style Cart & Bill Summary */}
      <aside className="w-96 bg-white border-l border-slate-200 flex flex-col justify-between shadow-xl">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">{orderType}</span>
              <h3 className="text-lg font-extrabold text-slate-900">
                {orderType === 'DINE_IN' ? `Table: ${selectedTable}` : 'Direct Order'}
              </h3>
            </div>
            <button onClick={clearCart} className="text-xs font-semibold text-red-500 hover:text-red-700">
              Clear All
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">KOT #108 &bull; Capt. Ramesh Gowda</p>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-4 overflow-y-auto divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-sm font-semibold">Order is Empty</p>
              <p className="text-xs">Click items on the left to punch an order</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm inline-block border ${item.is_veg ? 'border-emerald-600 bg-emerald-100' : 'border-red-600 bg-red-100'}`}></span>
                    <span className="font-bold text-xs text-slate-900 leading-tight">{item.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">₹{item.price} each</span>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded bg-white font-bold text-xs hover:bg-slate-200">
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded bg-white font-bold text-xs hover:bg-slate-200">
                    +
                  </button>
                </div>

                <div className="w-16 text-right font-extrabold text-xs text-slate-900">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculations & Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="space-y-1.5 text-xs text-slate-600 pb-3 border-b border-slate-200">
            <div className="flex justify-between">
              <span>Item Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
              <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="flex justify-between items-center text-xs">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                {[0, 5, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscountPercent(d)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${discountPercent === d ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-600 text-xs">
                <span>Discount Amount ({discountPercent}%)</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>CGST (2.5%)</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (2.5%)</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center py-3">
            <span className="font-extrabold text-base text-slate-900">Grand Total</span>
            <span className="font-black text-2xl text-orange-600">₹{grandTotal}</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleSendKot}
              disabled={cart.length === 0}
              className="py-3 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <span>🍳</span>
              <span>Fire KOT</span>
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="py-3 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 shadow-md shadow-orange-600/30 transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <span>💳</span>
              <span>Settle Bill</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">Settle & Close Bill — {selectedTable}</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="text-center py-4 bg-orange-50 rounded-2xl my-4 border border-orange-200">
              <span className="text-xs text-orange-700 font-bold uppercase tracking-wider">Payable Amount</span>
              <p className="text-4xl font-black text-orange-600">₹{grandTotal}</p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { mode: 'UPI', icon: '📱', label: 'UPI / QR' },
                { mode: 'CASH', icon: '💵', label: 'Cash' },
                { mode: 'CARD', icon: '💳', label: 'Card' },
                { mode: 'SPLIT', icon: '⚖️', label: 'Split' },
              ].map((m) => (
                <button
                  key={m.mode}
                  onClick={() => setPaymentMode(m.mode as any)}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center font-bold text-xs border transition ${
                    paymentMode === m.mode
                      ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl mb-1">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Payment Mode View */}
            {paymentMode === 'UPI' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center mb-4">
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center justify-center">
                  <div className="grid grid-cols-5 gap-1.5 p-2 bg-slate-900 rounded">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <span key={i} className={`w-3 h-3 ${i % 2 === 0 ? 'bg-white' : 'bg-transparent'}`}></span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 font-bold">UPI ID: biryani@upi</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Scan with GPay, PhonePe, Paytm</p>
              </div>
            )}

            {paymentMode === 'CASH' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Tendered Cash Amount:</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-32 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-right font-extrabold text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2 font-bold">
                  <span className="text-slate-600">Change Due to Customer:</span>
                  <span className="text-base text-emerald-600 font-extrabold">₹{changeDue}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSettle}
              className="w-full py-3.5 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 shadow-lg shadow-orange-600/30 transition"
            >
              ✓ Confirm Payment & Print Thermal Receipt
            </button>
          </div>
        </div>
      )}

      {/* 80mm Thermal Receipt Preview Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-300 font-mono text-xs">
            {/* Thermal Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h2 className="text-base font-extrabold tracking-wider">BIRYANI EXPRESS</h2>
              <p className="text-[10px] text-slate-600">Flagship Indiranagar, 100ft Rd, BLR</p>
              <p className="text-[10px] text-slate-600">GSTIN: 29AAAAA0000A1Z5</p>
              <p className="text-[10px] text-slate-600">Ph: +91 80 2520 0001</p>
            </div>

            {/* Bill Meta */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Bill #: INV-8492</span>
                <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Table: {selectedTable}</span>
                <span>Type: {orderType}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier: Priya S.</span>
                <span>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="truncate pr-2">{item.name} x {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                <span>GRAND TOTAL:</span>
                <span>₹{grandTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paid via {paymentMode}:</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500">
              <p>*** THANK YOU! VISIT AGAIN ***</p>
              <p className="mt-1">Powered by Smart Restaurant POS</p>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  clearCart();
                }}
                className="flex-1 py-2 rounded-lg bg-orange-600 text-white font-bold text-xs hover:bg-orange-700"
              >
                Done & Next Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
