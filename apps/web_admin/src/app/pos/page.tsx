'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  short_code: string;
  category: string;
  price: number;
  is_veg: boolean;
  portion_size?: string;
  portion_value?: number | '';
  portion_unit?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  portion?: 'Regular' | 'Large';
}

const CATALOG_ITEMS: MenuItem[] = [
  { id: '1', name: 'Special Mutton Dum Biryani', short_code: 'MB01', category: 'Biryani', price: 380, is_veg: false, portion_size: '750 gm', portion_value: 750, portion_unit: 'gm' },
  { id: '2', name: 'Royal Chicken Dum Biryani', short_code: 'CB01', category: 'Biryani', price: 290, is_veg: false, portion_size: '650 gm', portion_value: 650, portion_unit: 'gm' },
  { id: '3', name: 'Nawabi Paneer Dum Biryani', short_code: 'PB01', category: 'Biryani', price: 240, is_veg: true, portion_size: '500 gm', portion_value: 500, portion_unit: 'gm' },
  { id: '4', name: 'Chicken 65 (Crispy Andhra)', short_code: 'C65', category: 'Starters', price: 260, is_veg: false, portion_size: '8 Pcs', portion_value: 8, portion_unit: 'pcs' },
  { id: '5', name: 'Tandoori Paneer Tikka', short_code: 'PT01', category: 'Starters', price: 230, is_veg: true, portion_size: '6 Pcs', portion_value: 6, portion_unit: 'pcs' },
  { id: '6', name: 'Murgh Malai Kebab', short_code: 'MMK01', category: 'Starters', price: 280, is_veg: false, portion_size: '6 Pcs', portion_value: 6, portion_unit: 'pcs' },
  { id: '7', name: 'Butter Naan', short_code: 'BN01', category: 'Breads', price: 50, is_veg: true, portion_size: '1 Pc', portion_value: 1, portion_unit: 'pcs' },
  { id: '8', name: 'Garlic Herb Naan', short_code: 'GN01', category: 'Breads', price: 65, is_veg: true, portion_size: '1 Pc', portion_value: 1, portion_unit: 'pcs' },
  { id: '9', name: 'Tandoori Roti', short_code: 'TR01', category: 'Breads', price: 35, is_veg: true, portion_size: '1 Pc', portion_value: 1, portion_unit: 'pcs' },
  { id: '10', name: 'Hot Gulab Jamun (2 Pcs)', short_code: 'GJ01', category: 'Desserts', price: 80, is_veg: true, portion_size: '2 Pcs', portion_value: 2, portion_unit: 'pcs' },
  { id: '11', name: 'Irani Masala Chai', short_code: 'MC01', category: 'Drinks', price: 40, is_veg: true, portion_size: '150 ml', portion_value: 150, portion_unit: 'ml' },
  { id: '12', name: 'Fresh Lime Soda', short_code: 'FLS01', category: 'Drinks', price: 60, is_veg: true, portion_size: '300 ml', portion_value: 300, portion_unit: 'ml' },
];

const TABLES = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'T-09', 'T-10'];

export default function PosBillingPage() {
  const [catalogItems, setCatalogItems] = useState<MenuItem[]>(CATALOG_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegFilterOnly, setVegFilterOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('T-01');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Special Mutton Dum Biryani', short_code: 'MB01', category: 'Biryani', price: 380, is_veg: false, quantity: 2, portion: 'Regular', portion_size: '750 gm' },
    { id: '4', name: 'Chicken 65 (Crispy Andhra)', short_code: 'C65', category: 'Starters', price: 260, is_veg: false, quantity: 1, portion: 'Regular', portion_size: '8 Pcs' },
    { id: '7', name: 'Butter Naan', short_code: 'BN01', category: 'Breads', price: 50, is_veg: true, quantity: 3, portion: 'Regular', portion_size: '1 Pc' }
  ]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('UPI');
  const [cashTendered, setCashTendered] = useState<number>(1500);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [kotSentAlert, setKotSentAlert] = useState<boolean>(false);

  // Quick Add Dish Modal in POS
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickDishName, setQuickDishName] = useState('');
  const [quickDishPrice, setQuickDishPrice] = useState<number | ''>('');
  const [quickDishPortionVal, setQuickDishPortionVal] = useState<number | ''>('');
  const [quickDishPortionUnit, setQuickDishPortionUnit] = useState('ml');
  const [quickDishCat, setQuickDishCat] = useState('Biryani');
  const [quickDishVeg, setQuickDishVeg] = useState(true);
  const [quickDishCode, setQuickDishCode] = useState('');

  // Load persisted items from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smart_pos_menu_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: MenuItem[] = parsed.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            short_code: p.short_code,
            category: p.category.includes('Biryani') ? 'Biryani' : p.category.includes('Starter') ? 'Starters' : p.category.includes('Bread') ? 'Breads' : p.category.includes('Beverage') ? 'Drinks' : p.category,
            price: Number(p.base_price || p.price),
            is_veg: Boolean(p.is_veg),
            portion_size: p.portion_size,
            portion_value: p.portion_value,
            portion_unit: p.portion_unit,
          }));
          setCatalogItems(mapped);
        }
      }
    } catch {
      // ignore
    }
  }, []);

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

  // Filtered menu items from dynamic catalogItems state
  const filteredItems = catalogItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesVeg = !vegFilterOnly || item.is_veg;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.short_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesVeg && matchesSearch;
  });

  // Dynamically extract categories
  const allCategories = ['All', ...Array.from(new Set(catalogItems.map((i) => i.category)))];

  const handleSendKot = () => {
    setKotSentAlert(true);
    setTimeout(() => setKotSentAlert(false), 3000);
  };

  const handleSettle = () => {
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  const handleSaveQuickDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDishName.trim() || !quickDishPrice) return;

    const finalPortion = quickDishPortionVal ? `${quickDishPortionVal} ${quickDishPortionUnit}` : undefined;

    const newItem: MenuItem = {
      id: `dish-${Date.now()}`,
      name: quickDishName.trim(),
      short_code: quickDishCode.trim() || `D${Date.now().toString().slice(-3)}`,
      category: quickDishCat,
      price: Number(quickDishPrice),
      is_veg: quickDishVeg,
      portion_size: finalPortion,
      portion_value: quickDishPortionVal,
      portion_unit: quickDishPortionUnit,
    };

    const updated = [newItem, ...catalogItems];
    setCatalogItems(updated);

    // Save to localStorage so /catalog also gets it
    try {
      const saved = localStorage.getItem('smart_pos_menu_items');
      const existing = saved ? JSON.parse(saved) : [];
      const forCatalog = {
        id: newItem.id,
        name: newItem.name,
        category: newItem.category,
        base_price: newItem.price,
        is_veg: newItem.is_veg,
        is_available: true,
        short_code: newItem.short_code,
        prep_time_minutes: 15,
        portion_size: newItem.portion_size,
        portion_value: newItem.portion_value,
        portion_unit: newItem.portion_unit,
      };
      localStorage.setItem('smart_pos_menu_items', JSON.stringify([forCatalog, ...existing]));
    } catch {
      // ignore
    }

    // Automatically punch into current cart
    addToCart(newItem);
    setIsQuickAddModalOpen(false);
    setKotSentAlert(true);
    setTimeout(() => setKotSentAlert(false), 3000);
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

          {/* Quick Add Dish Button */}
          <button
            onClick={() => {
              setQuickDishName('');
              setQuickDishPrice('');
              setQuickDishPortionVal('');
              setQuickDishPortionUnit('ml');
              setQuickDishCode('');
              setQuickDishCat('Biryani');
              setQuickDishVeg(true);
              setIsQuickAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm shrink-0"
          >
            <span className="text-base leading-none">＋</span>
            <span>Add Dish</span>
          </button>
        </header>

        {/* Category Pill Tabs */}
        <div className="bg-white px-6 py-3 border-b border-slate-200 flex gap-2 overflow-x-auto">
          {allCategories.map((cat) => (
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
              <span>✓ Action updated & Kitchen Order Ticket fired!</span>
              <span className="text-emerald-200">POS Synchronized</span>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-slate-300">
              <span className="text-4xl mb-2">🍽️</span>
              <h4 className="text-sm font-bold text-slate-700">No dishes found matching &quot;{searchQuery}&quot;</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">You can quickly add this new dish to the menu now</p>
              <button
                onClick={() => {
                  setQuickDishName(searchQuery);
                  setQuickDishPrice('');
                  setQuickDishPortionVal('');
                  setQuickDishPortionUnit('ml');
                  setQuickDishCode('');
                  setQuickDishCat('Biryani');
                  setQuickDishVeg(true);
                  setIsQuickAddModalOpen(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 transition"
              >
                ＋ Add &quot;{searchQuery}&quot; to Menu &amp; Punch
              </button>
            </div>
          ) : (
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
                      <div className="flex items-center gap-1.5">
                        {item.portion_size && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {item.portion_size}
                          </span>
                        )}
                        <span className={`w-3 h-3 rounded-sm flex items-center justify-center border ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                        </span>
                      </div>
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
          )}
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

      {/* Quick Add Dish Modal in POS */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Add New Dish to Menu</h3>
                <p className="text-[11px] text-slate-500">Quickly add an off-menu dish or new specialty</p>
              </div>
              <button
                onClick={() => setIsQuickAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickDish} className="space-y-3.5 mt-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dish Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickDishName}
                  onChange={(e) => {
                    setQuickDishName(e.target.value);
                    if (!quickDishCode) {
                      const initials = e.target.value
                        .split(' ')
                        .filter(Boolean)
                        .map((w) => w[0].toUpperCase())
                        .join('');
                      if (initials) setQuickDishCode(`${initials}01`);
                    }
                  }}
                  placeholder="e.g. Mutton Rogan Josh"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              {/* Short Code & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Short Code</label>
                  <input
                    type="text"
                    value={quickDishCode}
                    onChange={(e) => setQuickDishCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MRJ01"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quickDishPrice}
                    onChange={(e) => setQuickDishPrice(Number(e.target.value))}
                    placeholder="e.g. 320"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Quantity / Serving Size (ml, gm, pcs, plate) */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <span>📏</span>
                    <span>Quantity / Unit (ml / gm / pcs)</span>
                  </span>
                  <span className="text-[10px] text-orange-600 font-extrabold">
                    {quickDishPortionVal ? `${quickDishPortionVal} ${quickDishPortionUnit}` : 'Optional'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 250, 500, 1"
                    value={quickDishPortionVal}
                    onChange={(e) => setQuickDishPortionVal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
                  />
                  <select
                    value={quickDishPortionUnit}
                    onChange={(e) => setQuickDishPortionUnit(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ml">ml (Milliliters)</option>
                    <option value="L">L (Litres)</option>
                    <option value="gm">gm (Grams)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="pcs">Pcs (Pieces)</option>
                    <option value="Plate">Plate (Full)</option>
                    <option value="Half">Half Plate</option>
                    <option value="Glass">Glass</option>
                    <option value="Cup">Cup</option>
                    <option value="Bottle">Bottle</option>
                  </select>
                </div>
                {/* 1-click Quick Unit Presets */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[
                    { val: 250, unit: 'ml', label: '250 ml' },
                    { val: 500, unit: 'ml', label: '500 ml' },
                    { val: 250, unit: 'gm', label: '250 gm' },
                    { val: 500, unit: 'gm', label: '500 gm' },
                    { val: 2, unit: 'pcs', label: '2 Pcs' },
                    { val: 1, unit: 'Plate', label: '1 Plate' },
                    { val: 1, unit: 'Half', label: 'Half' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setQuickDishPortionVal(p.val);
                        setQuickDishPortionUnit(p.unit);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                        quickDishPortionVal === p.val && quickDishPortionUnit === p.unit
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Dietary */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={quickDishCat}
                    onChange={(e) => setQuickDishCat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  >
                    <option value="Biryani">Biryani</option>
                    <option value="Starters">Starters</option>
                    <option value="Breads">Breads</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Fast Food">Fast Food</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dietary Tag</label>
                  <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQuickDishVeg(true)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        quickDishVeg ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDishVeg(false)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        !quickDishVeg ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      Non-Veg
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 transition flex items-center justify-center gap-1"
                >
                  <span>+ Save &amp; Add to Cart</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
