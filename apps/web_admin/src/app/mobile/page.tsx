'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
type MobileTab = 'tables' | 'order' | 'kds' | 'online' | 'owner';

interface Table {
  id: string;
  name: string;
  section: 'Main Dining' | 'Garden Terrace' | 'Rooftop';
  capacity: number;
  status: 'VACANT' | 'OCCUPIED' | 'BILLING';
  currentOrderId?: string;
  activeGuests?: number;
  runningAmount?: number;
  elapsedMinutes?: number;
}

interface MenuItem {
  id: string;
  name: string;
  category: 'Biryani' | 'Tandoor' | 'Curries' | 'Breads' | 'Beverages';
  price: number;
  isVeg: boolean;
  inStock: boolean;
  description: string;
}

interface CartItem {
  dish: MenuItem;
  quantity: number;
  notes?: string;
}

interface MobileKot {
  id: string;
  kotNo: number;
  table: string;
  brand: string;
  time: string;
  items: { name: string; qty: number; notes?: string }[];
  status: 'COOKING' | 'READY';
}

const INITIAL_TABLES: Table[] = [
  { id: 't1', name: 'T-01', section: 'Main Dining', capacity: 2, status: 'OCCUPIED', activeGuests: 2, runningAmount: 640, elapsedMinutes: 24 },
  { id: 't2', name: 'T-02', section: 'Main Dining', capacity: 4, status: 'VACANT' },
  { id: 't3', name: 'T-03', section: 'Main Dining', capacity: 4, status: 'OCCUPIED', activeGuests: 4, runningAmount: 1850, elapsedMinutes: 42 },
  { id: 't4', name: 'T-04', section: 'Main Dining', capacity: 6, status: 'BILLING', activeGuests: 5, runningAmount: 3200, elapsedMinutes: 65 },
  { id: 't5', name: 'T-05', section: 'Main Dining', capacity: 2, status: 'VACANT' },
  { id: 'g1', name: 'G-01', section: 'Garden Terrace', capacity: 4, status: 'OCCUPIED', activeGuests: 3, runningAmount: 1120, elapsedMinutes: 18 },
  { id: 'g2', name: 'G-02', section: 'Garden Terrace', capacity: 4, status: 'VACANT' },
  { id: 'g3', name: 'G-03', section: 'Garden Terrace', capacity: 6, status: 'VACANT' },
  { id: 'r1', name: 'R-01', section: 'Rooftop', capacity: 8, status: 'OCCUPIED', activeGuests: 7, runningAmount: 4950, elapsedMinutes: 55 },
  { id: 'r2', name: 'R-02', section: 'Rooftop', capacity: 4, status: 'VACANT' },
];

const MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Royal Chicken Dum Biryani', category: 'Biryani', price: 340, isVeg: false, inStock: true, description: 'Slow cooked aromatic basmati with saffron & tender chicken' },
  { id: 'm2', name: 'Special Mutton Dum Biryani', category: 'Biryani', price: 460, isVeg: false, inStock: true, description: 'Tender baby goat pieces cooked in sealed handi' },
  { id: 'm3', name: 'Hyderabadi Veg Dum Biryani', category: 'Biryani', price: 280, isVeg: true, inStock: true, description: 'Fresh veggies, paneer & fragrant herbs' },
  { id: 'm4', name: 'Chicken Tikka Kebab (8 Pcs)', category: 'Tandoor', price: 320, isVeg: false, inStock: true, description: 'Clay-oven charred spiced boneless chicken' },
  { id: 'm5', name: 'Paneer Malai Tikka', category: 'Tandoor', price: 290, isVeg: true, inStock: true, description: 'Creamy soft cottage cheese marinated with green cardamom' },
  { id: 'm6', name: 'Crispy Andhra Chicken 65', category: 'Tandoor', price: 310, isVeg: false, inStock: true, description: 'Deep fried spicy boneless chicken with curry leaves' },
  { id: 'm7', name: 'Butter Chicken Grand Mehfil', category: 'Curries', price: 360, isVeg: false, inStock: true, description: 'Rich velvet tomato gravy with churned butter & fenugreek' },
  { id: 'm8', name: 'Paneer Butter Masala', category: 'Curries', price: 310, isVeg: true, inStock: true, description: 'Diced paneer in mild spiced makhani gravy' },
  { id: 'm9', name: 'Dal Makhani Bukhara', category: 'Curries', price: 260, isVeg: true, inStock: true, description: '24-hour slow simmered black lentils with cream' },
  { id: 'm10', name: 'Garlic Butter Naan', category: 'Breads', price: 65, isVeg: true, inStock: true, description: 'Refined flour tandoori bread with crushed garlic & butter' },
  { id: 'm11', name: 'Tandoori Roti (Butter)', category: 'Breads', price: 35, isVeg: true, inStock: true, description: 'Whole wheat bread baked in clay oven' },
  { id: 'm12', name: 'Mango Lassi (Malai Topped)', category: 'Beverages', price: 120, isVeg: true, inStock: true, description: 'Thick alphonso mango yogurt shake' },
  { id: 'm13', name: 'Royal Masala Chai (Kulhad)', category: 'Beverages', price: 60, isVeg: true, inStock: true, description: 'Ginger & cardamom infused steaming tea' },
];

export default function MobilePosApp() {
  const [activeTab, setActiveTab] = useState<MobileTab>('tables');
  const [selectedTable, setSelectedTable] = useState<Table | null>(INITIAL_TABLES[1]); // default T-02
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [menu, setMenu] = useState<MenuItem[]>(MENU_ITEMS);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyVeg, setOnlyVeg] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [specialNote, setSpecialNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // KOT state
  const [kots, setKots] = useState<MobileKot[]>([
    {
      id: 'kot-101',
      kotNo: 201,
      table: 'T-03',
      brand: 'Biryani Express',
      time: '13:42',
      status: 'COOKING',
      items: [
        { name: 'Royal Chicken Dum Biryani', qty: 2, notes: 'Spicy' },
        { name: 'Crispy Andhra Chicken 65', qty: 1 },
      ],
    },
    {
      id: 'kot-102',
      kotNo: 202,
      table: 'G-01',
      brand: 'Biryani Express',
      time: '13:48',
      status: 'COOKING',
      items: [
        { name: 'Hyderabadi Veg Dum Biryani', qty: 1 },
        { name: 'Garlic Butter Naan', qty: 2 },
      ],
    },
  ]);

  // Online Orders State for Mobile
  const [onlineOrders, setOnlineOrders] = useState([
    {
      id: 'swg-1',
      platform: 'SWIGGY',
      brand: 'Rolls & Bowls Co.',
      badgeColor: 'bg-orange-500',
      orderId: 'SWG-8942',
      amount: 480,
      items: '2x Double Egg Roll, 1x Coke',
      status: 'NEW',
      time: '2 mins ago',
    },
    {
      id: 'zom-1',
      platform: 'ZOMATO',
      brand: 'Biryani Express',
      badgeColor: 'bg-red-600',
      orderId: 'ZOM-4419',
      amount: 820,
      items: '1x Mutton Biryani, 1x Butter Naan',
      status: 'COOKING',
      time: '8 mins ago',
    },
    {
      id: 'ondc-1',
      platform: 'ONDC',
      brand: 'Biryani Express',
      badgeColor: 'bg-blue-600',
      orderId: 'ONDC-9120',
      amount: 690,
      items: '2x Chicken Tikka, 2x Roomali',
      status: 'NEW',
      time: '1 min ago',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio not permitted without interaction
    }
  };

  const addToCart = (dish: MenuItem) => {
    playChime();
    setCart((prev) => {
      const exists = prev.find((item) => item.dish.id === dish.id);
      if (exists) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const updateCartQuantity = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const gstAmount = Math.round(cartSubtotal * 0.05);
  const grandTotal = cartSubtotal + gstAmount;

  // Punch KOT Action
  const punchKot = () => {
    if (cart.length === 0 || !selectedTable) return;
    playChime();

    const newKot: MobileKot = {
      id: `kot-${Date.now()}`,
      kotNo: 200 + kots.length + 1,
      table: selectedTable.name,
      brand: 'Biryani Express',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'COOKING',
      items: cart.map((c) => ({
        name: c.dish.name,
        qty: c.quantity,
        notes: specialNote || undefined,
      })),
    };

    setKots([newKot, ...kots]);

    // Update table status to occupied with running amount
    setTables((prev) =>
      prev.map((t) =>
        t.id === selectedTable.id
          ? {
              ...t,
              status: 'OCCUPIED',
              runningAmount: (t.runningAmount || 0) + grandTotal,
              activeGuests: t.activeGuests || 2,
              elapsedMinutes: 1,
            }
          : t
      )
    );

    setCart([]);
    setSpecialNote('');
    setShowCartDrawer(false);
    showToast(`✅ KOT #${newKot.kotNo} sent to Kitchen for ${selectedTable.name}!`);
  };

  const filteredMenu = menu.filter((item) => {
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = !onlyVeg || item.isVeg;
    return matchesCat && matchesSearch && matchesVeg;
  });

  return (
    <div className="flex justify-center bg-slate-900 min-h-screen">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col shadow-2xl relative select-none pb-20">
        
        {/* Top App Header */}
        <header className="bg-slate-900 text-white px-4 pt-3 pb-3 border-b border-slate-800 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-sm text-white shadow-md">
                BE
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-sm tracking-tight leading-tight">Biryani Express</h1>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Captain App • <span className="text-orange-400 font-medium">Indiranagar</span>
                </p>
              </div>
            </div>

            {/* Switch to Full Desktop Admin Link */}
            <div className="flex items-center gap-2">
              <Link
                href="/pos"
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
              >
                🖥️ Desktop
              </Link>
            </div>
          </div>

          {/* Active Table Selector Pill */}
          {selectedTable && (
            <div className="mt-2.5 flex items-center justify-between bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-bold">Table:</span>
                <span className="font-mono font-black text-white bg-slate-700 px-2 py-0.5 rounded text-xs">
                  {selectedTable.name}
                </span>
                <span className="text-[11px] text-slate-400">({selectedTable.section})</span>
              </div>
              <button
                onClick={() => setActiveTab('tables')}
                className="text-orange-400 hover:text-orange-300 text-[11px] font-semibold underline"
              >
                Change
              </button>
            </div>
          )}
        </header>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-2 animate-bounce">
            <span>🔔</span>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* MAIN BODY TABS */}
        <main className="flex-1 overflow-y-auto p-3.5 space-y-4">
          
          {/* TAB 1: FLOOR & TABLES */}
          {activeTab === 'tables' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Floor Layout</h2>
                  <p className="text-xs text-slate-500">Tap a table to take order or view bill</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Vacant
                  </span>
                  <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Occupied
                  </span>
                </div>
              </div>

              {/* Sections & Tables */}
              {(['Main Dining', 'Garden Terrace', 'Rooftop'] as const).map((sec) => (
                <div key={sec} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{sec}</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {tables.filter((t) => t.section === sec && t.status === 'OCCUPIED').length} /{' '}
                      {tables.filter((t) => t.section === sec).length} Busy
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {tables
                      .filter((t) => t.section === sec)
                      .map((table) => {
                        const isSelected = selectedTable?.id === table.id;
                        const isOccupied = table.status === 'OCCUPIED';
                        const isBilling = table.status === 'BILLING';

                        return (
                          <button
                            key={table.id}
                            onClick={() => {
                              setSelectedTable(table);
                              setActiveTab('order');
                            }}
                            className={`p-3 rounded-xl border text-left transition relative active:scale-95 flex flex-col justify-between min-h-[92px] ${
                              isSelected
                                ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/60'
                                : isOccupied
                                ? 'bg-red-50/70 border-red-200'
                                : isBilling
                                ? 'bg-amber-50/70 border-amber-200'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-sm text-slate-900">{table.name}</span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isOccupied ? 'bg-red-500' : isBilling ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                              ></span>
                            </div>

                            {isOccupied || isBilling ? (
                              <div className="mt-1">
                                <span className="font-bold text-xs text-slate-900">₹{table.runningAmount}</span>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                                  <span>👥 {table.activeGuests}</span>
                                  <span>⏱️ {table.elapsedMinutes}m</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-medium mt-1">
                                <span>Cap: {table.capacity}</span>
                                <p className="text-emerald-600 font-semibold mt-0.5">Ready</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: TAKE ORDER (MENU & CART) */}
          {activeTab === 'order' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Search & Veg toggle */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search biryani, naan, tikka..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
                </div>
                <button
                  onClick={() => setOnlyVeg(!onlyVeg)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    onlyVeg
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Veg
                </button>
              </div>

              {/* Category Chips Scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'Biryani', 'Tandoor', 'Curries', 'Breads', 'Beverages'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu List */}
              <div className="space-y-2 pt-1">
                {filteredMenu.map((dish) => {
                  const inCartItem = cart.find((c) => c.dish.id === dish.id);

                  return (
                    <div
                      key={dish.id}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] font-black ${
                              dish.isVeg ? 'border-emerald-600 text-emerald-600' : 'border-red-600 text-red-600'
                            }`}
                          >
                            ●
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 leading-tight">{dish.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{dish.description}</p>
                        <span className="font-bold text-xs text-slate-900 mt-1 inline-block">₹{dish.price}</span>
                      </div>

                      {/* Add or Counter */}
                      {inCartItem ? (
                        <div className="flex items-center bg-orange-50 border border-orange-300 rounded-xl px-1 py-1 gap-2 shadow-sm">
                          <button
                            onClick={() => updateCartQuantity(dish.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white text-orange-600 font-bold text-sm flex items-center justify-center shadow-xs"
                          >
                            −
                          </button>
                          <span className="font-bold text-xs text-orange-950 font-mono w-4 text-center">
                            {inCartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(dish.id, 1)}
                            className="w-6 h-6 rounded-lg bg-orange-600 text-white font-bold text-sm flex items-center justify-center shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(dish)}
                          className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: KITCHEN KDS TICKETS */}
          {activeTab === 'kds' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Live Kitchen Queue</h2>
                  <p className="text-xs text-slate-500">KOTs dispatched from mobile captain & POS</p>
                </div>
                <span className="bg-red-100 text-red-700 font-mono font-bold text-xs px-2 py-0.5 rounded-full">
                  {kots.length} Active
                </span>
              </div>

              <div className="space-y-3">
                {kots.map((kot) => (
                  <div
                    key={kot.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                          KOT #{kot.kotNo}
                        </span>
                        <span className="font-bold text-xs text-orange-600">{kot.table}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">⏱️ {kot.time}</span>
                    </div>

                    <div className="space-y-1.5">
                      {kot.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-800 font-medium">
                            <strong className="text-slate-900">{item.qty}x</strong> {item.name}
                          </span>
                          {item.notes && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          kot.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {kot.status}
                      </span>
                      <button
                        onClick={() => {
                          showToast(`KOT #${kot.kotNo} bumped to Food Ready!`);
                          setKots((prev) =>
                            prev.map((k) => (k.id === kot.id ? { ...k, status: 'READY' } : k))
                          );
                        }}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs hover:bg-emerald-700 transition"
                      >
                        ✓ Mark Ready
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ONLINE AGGREGATORS (SWIGGY / ZOMATO / ONDC) */}
          {activeTab === 'online' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Marketplace Feed</h2>
                  <p className="text-xs text-slate-500">Swiggy, Zomato, ONDC Multi-ID orders</p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  ● 3 Active IDs
                </span>
              </div>

              <div className="space-y-2.5">
                {onlineOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded ${ord.badgeColor}`}>
                          {ord.platform}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900">{ord.orderId}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{ord.time}</span>
                    </div>

                    <div className="text-xs">
                      <p className="text-slate-500 text-[11px]">Brand: <strong className="text-slate-800">{ord.brand}</strong></p>
                      <p className="font-medium text-slate-900 mt-0.5">{ord.items}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="font-bold text-xs text-slate-900">₹{ord.amount}</span>
                      {ord.status === 'NEW' ? (
                        <button
                          onClick={() => {
                            showToast(`Order ${ord.orderId} accepted & sent to kitchen!`);
                            setOnlineOrders((prev) =>
                              prev.map((o) => (o.id === ord.id ? { ...o, status: 'COOKING' } : o))
                            );
                          }}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-sm"
                        >
                          ⚡ Accept Order
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Cooking (KDS Synced)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: OWNER DASHBOARD & 86 STOCK TOGGLE */}
          {activeTab === 'owner' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-lg border border-slate-700">
                <span className="text-[11px] text-slate-400 font-medium">Today&apos;s Live Business</span>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="text-2xl font-black text-white tracking-tight">₹48,250</h3>
                  <span className="text-xs font-bold text-emerald-400">+18% vs Yesterday</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400">Total Bills</span>
                    <p className="font-mono font-bold text-sm text-white">112</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Avg Ticket</span>
                    <p className="font-mono font-bold text-sm text-white">₹430</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Active Tables</span>
                    <p className="font-mono font-bold text-sm text-orange-400">7 / 10</p>
                  </div>
                </div>
              </div>

              {/* 86 Dish Out of Stock Fast Switch */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <h3 className="font-bold text-xs text-slate-900">Instant Item Stock Toggle (86 Dish)</h3>
                  <span className="text-[10px] text-slate-400">Syncs to Zomato & POS</span>
                </div>
                <p className="text-[11px] text-slate-500">Toggle switch to immediately stop online orders for sold-out dishes:</p>
                <div className="space-y-2">
                  {menu.slice(0, 5).map((dish) => (
                    <div key={dish.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                      <span className="font-medium text-slate-800">{dish.name}</span>
                      <button
                        onClick={() => {
                          setMenu((prev) =>
                            prev.map((d) => (d.id === dish.id ? { ...d, inStock: !d.inStock } : d))
                          );
                          showToast(`${dish.name} is now ${dish.inStock ? 'OUT OF STOCK' : 'IN STOCK'}`);
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          dish.inStock
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {dish.inStock ? 'IN STOCK' : '86 / SOLD OUT'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* STICKY BOTTOM CART BAR (When items in cart) */}
        {totalCartCount > 0 && !showCartDrawer && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-3 z-30">
            <button
              onClick={() => setShowCartDrawer(true)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                  {totalCartCount}
                </span>
                <span className="font-bold text-xs">Table {selectedTable?.name || 'Walk-In'}</span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm">
                <span>View Cart • ₹{grandTotal}</span>
                <span>→</span>
              </div>
            </button>
          </div>
        )}

        {/* BOTTOM CART SLIDE-OVER DRAWER */}
        {showCartDrawer && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-4 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Cart for {selectedTable?.name}</span>
                  <span className="text-xs text-slate-400">({totalCartCount} items)</span>
                </div>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Items in Cart */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                {cart.map((c) => (
                  <div key={c.dish.id} className="flex items-center justify-between text-xs py-1">
                    <div className="flex-1">
                      <span className="font-bold text-slate-900">{c.dish.name}</span>
                      <p className="text-[11px] text-slate-400">₹{c.dish.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(c.dish.id, -1)}
                        className="w-6 h-6 rounded bg-slate-100 font-bold text-slate-700 flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="font-mono font-bold text-xs w-4 text-center">{c.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(c.dish.id, 1)}
                        className="w-6 h-6 rounded bg-orange-600 font-bold text-white flex items-center justify-center"
                      >
                        +
                      </button>
                      <span className="font-bold text-slate-900 w-12 text-right">
                        ₹{c.dish.price * c.quantity}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Special Instructions */}
                <div className="mt-3">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Chef Instructions (Notes)
                  </label>
                  <input
                    type="text"
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    placeholder="e.g. Extra spicy, less oil, serve starter first..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Bill Breakdown */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs border border-slate-100 mt-2">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (5%)</span>
                    <span>₹{gstAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                    <span>Grand Total</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={punchKot}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <span>⚡ PUNCH KOT TO KITCHEN</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM TAB NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 py-1.5 px-3 z-40 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition ${
              activeTab === 'tables' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">🪑</span>
            <span className="text-[10px]">Tables</span>
          </button>

          <button
            onClick={() => setActiveTab('order')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition relative ${
              activeTab === 'order' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">📝</span>
            <span className="text-[10px]">Order</span>
            {totalCartCount > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('kds')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition relative ${
              activeTab === 'kds' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">🍳</span>
            <span className="text-[10px]">KDS</span>
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-red-500"></span>
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition relative ${
              activeTab === 'online' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">🛵</span>
            <span className="text-[10px]">Online</span>
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>

          <button
            onClick={() => setActiveTab('owner')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition ${
              activeTab === 'owner' ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">📊</span>
            <span className="text-[10px]">Owner</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
