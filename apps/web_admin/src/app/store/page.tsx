'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface StoreItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  isVeg: boolean;
  description: string;
  badge?: string;
}

const STORE_ITEMS: StoreItem[] = [
  { id: 'st-1', name: 'Royal Chicken Dum Biryani', category: 'Biryani Combos', price: 340, originalPrice: 380, isVeg: false, description: 'Slow cooked aromatic basmati with saffron & tender chicken. Served with raita & mirchi ka salan.', badge: '⚡ 10% OFF' },
  { id: 'st-2', name: 'Special Mutton Dum Biryani Feast', category: 'Biryani Combos', price: 460, originalPrice: 520, isVeg: false, description: 'Tender baby goat pieces cooked in sealed handi with fragrant spices.', badge: 'Best Seller' },
  { id: 'st-3', name: 'Hyderabadi Veg Dum Biryani Meal', category: 'Biryani Combos', price: 280, isVeg: true, description: 'Fresh veggies, cottage cheese & fragrant basmati with royal dry fruits.' },
  { id: 'st-4', name: 'Chicken Tikka & Naan Value Combo', category: 'Value Meals', price: 420, originalPrice: 480, isVeg: false, description: '4 pcs Chicken Tikka + 2 Garlic Butter Naan + Chilled Coke (250ml).', badge: 'Popular' },
  { id: 'st-5', name: 'Paneer Makhani & Roti Box', category: 'Value Meals', price: 350, isVeg: true, description: 'Fresh Paneer Butter Masala + 3 Butter Rotis + Gulab Jamun (1 pc).' },
  { id: 'st-6', name: 'Crispy Andhra Chicken 65', category: 'Starters', price: 310, isVeg: false, description: 'Deep fried spicy boneless chicken with roasted curry leaves.' },
  { id: 'st-7', name: 'Paneer Malai Tikka', category: 'Starters', price: 290, isVeg: true, description: 'Creamy soft cottage cheese roasted with green cardamom.' },
  { id: 'st-8', name: 'Mango Lassi (Chilled Kulhad)', category: 'Drinks & Desserts', price: 120, isVeg: true, description: 'Thick alphonso mango yogurt shake.' },
  { id: 'st-9', name: 'Royal Kulhad Masala Chai', category: 'Drinks & Desserts', price: 60, isVeg: true, description: 'Steaming hot ginger & cardamom tea.' },
];

export default function DirectStorefrontPage() {
  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('100 Feet Road, Indiranagar, Bengaluru');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState<{ item: StoreItem; qty: number }[]>([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [vegOnly, setVegOnly] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [placedOrderRef, setPlacedOrderRef] = useState('');

  const addToCart = (item: StoreItem) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.item.id === item.id);
      if (exists) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === id) {
            const next = c.qty + delta;
            return next > 0 ? { ...c, qty: next } : null;
          }
          return c;
        })
        .filter(Boolean) as { item: StoreItem; qty: number }[]
    );
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const deliveryFee = orderType === 'DELIVERY' ? 40 : 0;
  const grandTotal = subtotal + gst + deliveryFee;

  const handleCheckout = () => {
    if (cart.length === 0 || !customerPhone) return;
    const ref = `DIR-${Math.floor(1000 + Math.random() * 9000)}`;
    setPlacedOrderRef(ref);
    setOrderConfirmed(true);
  };

  const filteredItems = STORE_ITEMS.filter((i) => {
    const matchesCat = selectedCat === 'ALL' || i.category === selectedCat;
    const matchesVeg = !vegOnly || i.isVeg;
    return matchesCat && matchesVeg;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-base shadow-md">
              BE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base leading-tight">Biryani Express</h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Direct Store (0% Extra Fee)
                </span>
              </div>
              <p className="text-xs text-slate-400">Indiranagar Flagship Outlet • 25-35 min delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1">
        {orderConfirmed ? (
          <div className="bg-white rounded-3xl p-8 max-w-lg mx-auto border border-slate-200 shadow-xl text-center space-y-4 my-8 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl mx-auto">
              🎉
            </div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Direct Order Confirmed!
            </span>
            <h2 className="text-2xl font-black text-slate-900">Order #{placedOrderRef}</h2>
            <p className="text-xs text-slate-500">
              Thank you {customerName || 'Guest'}! Your order has been dispatched directly to the restaurant kitchen.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between text-slate-500">
                <span>Delivery To:</span>
                <span className="font-semibold text-slate-900">{deliveryAddress}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Phone:</span>
                <span className="font-mono text-slate-900">{customerPhone}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Paid:</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://wa.me/919876543210?text=Hello%20Biryani%20Express,%20I%20placed%20Order%20${placedOrderRef}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <span>💬 Track Order via WhatsApp</span>
              </a>
              <button
                onClick={() => {
                  setCart([]);
                  setOrderConfirmed(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Order Again
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 8 Cols: Menu and Selection */}
            <div className="lg:col-span-8 space-y-5">
              {/* Delivery vs Takeaway Switch */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setOrderType('DELIVERY')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      orderType === 'DELIVERY'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🛵 Home Delivery
                  </button>
                  <button
                    onClick={() => setOrderType('TAKEAWAY')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      orderType === 'TAKEAWAY'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🥡 Self Pickup / Takeaway
                  </button>
                </div>

                <button
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    vegOnly
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Veg Only
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'Biryani Combos', 'Value Meals', 'Starters', 'Drinks & Desserts'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCat === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((dish) => {
                  const inCart = cart.find((c) => c.item.id === dish.id);

                  return (
                    <div
                      key={dish.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] font-black ${
                                dish.isVeg ? 'border-emerald-600 text-emerald-600' : 'border-red-600 text-red-600'
                              }`}
                            >
                              ●
                            </span>
                            <h4 className="font-bold text-sm text-slate-900">{dish.name}</h4>
                          </div>
                          {dish.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                              {dish.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {dish.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                        <div className="flex items-baseline gap-2">
                          <span className="font-extrabold text-sm text-slate-900">₹{dish.price}</span>
                          {dish.originalPrice && (
                            <span className="line-through text-xs text-slate-400">
                              ₹{dish.originalPrice}
                            </span>
                          )}
                        </div>

                        {inCart ? (
                          <div className="flex items-center bg-orange-50 border border-orange-300 rounded-xl px-1 py-1 gap-2">
                            <button
                              onClick={() => updateQty(dish.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white text-orange-600 font-bold text-sm flex items-center justify-center shadow-xs"
                            >
                              −
                            </button>
                            <span className="font-bold text-xs text-orange-950 font-mono w-4 text-center">
                              {inCart.qty}
                            </span>
                            <button
                              onClick={() => updateQty(dish.id, 1)}
                              className="w-6 h-6 rounded-lg bg-orange-600 text-white font-bold text-sm flex items-center justify-center shadow-xs"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(dish)}
                            className="px-4 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-bold text-xs rounded-xl transition active:scale-95 shadow-xs"
                          >
                            + ADD
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 4 Cols: Sticky Checkout Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm sticky top-24 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">Order Summary</h3>
                  <span className="text-xs text-slate-400 font-mono">{totalItems} Items</span>
                </div>

                {/* Cart Items List */}
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <span className="text-3xl block mb-2">🛒</span>
                    Your cart is empty. Add dishes to place an order.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {cart.map((c) => (
                      <div key={c.item.id} className="flex justify-between items-center text-xs">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{c.item.name}</p>
                          <span className="text-slate-400 text-[11px] font-mono">₹{c.item.price} each</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">{c.qty}x</span>
                          <span className="font-bold font-mono text-slate-900 w-12 text-right">
                            ₹{c.item.price * c.qty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer Details */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Your Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9845012345 (for WhatsApp live updates)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                  </div>

                  {orderType === 'DELIVERY' && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Delivery Address</label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Bill Breakdown */}
                <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5 text-xs border border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (5%)</span>
                    <span>₹{gst}</span>
                  </div>
                  {orderType === 'DELIVERY' && (
                    <div className="flex justify-between text-slate-500">
                      <span>Delivery Fee</span>
                      <span>₹{deliveryFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
                    <span>To Pay</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  disabled={cart.length === 0 || !customerPhone}
                  onClick={handleCheckout}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>⚡ PLACE DIRECT ORDER (₹{grandTotal})</span>
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  🔒 Direct from restaurant kitchen. 0% aggregator surcharge.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-6 px-6 text-center text-xs text-slate-400 border-t border-slate-800">
        <p>© 2026 Biryani Express Flagship. Powered by Smart Restaurant POS Platform.</p>
      </footer>
    </div>
  );
}
