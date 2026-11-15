'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface QrDish {
  id: string;
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
  description: string;
  badge?: string;
}

const QR_MENU: QrDish[] = [
  { id: 'd1', name: 'Royal Chicken Dum Biryani', category: 'Biryani Specials', price: 340, isVeg: false, description: 'Fragrant aged basmati rice cooked with saffron marinated tender chicken pieces & secret spices.', badge: 'Bestseller' },
  { id: 'd2', name: 'Special Mutton Dum Biryani', category: 'Biryani Specials', price: 460, isVeg: false, description: 'Tender baby goat pieces cooked in sealed earthen pot on charcoal heat.', badge: 'Chef Special' },
  { id: 'd3', name: 'Hyderabadi Veg Dum Biryani', category: 'Biryani Specials', price: 280, isVeg: true, description: 'Fresh seasonal vegetables, spiced paneer cubes, and roasted cashews.' },
  { id: 'd4', name: 'Crispy Andhra Chicken 65', category: 'Starters', price: 310, isVeg: false, description: 'Spiced crispy fried boneless chicken tossed with green chillies & fresh curry leaves.' },
  { id: 'd5', name: 'Paneer Malai Tikka (6 Pcs)', category: 'Starters', price: 290, isVeg: true, description: 'Cottage cheese cubes marinated with hung curd, cream, and green cardamom roasted in tandoor.' },
  { id: 'd6', name: 'Butter Chicken Grand Mehfil', category: 'Main Curries', price: 360, isVeg: false, description: 'Rich velvet tomato makhani gravy with churned butter and dried fenugreek leaves.' },
  { id: 'd7', name: 'Dal Bukhara (24-Hour Simmered)', category: 'Main Curries', price: 260, isVeg: true, description: 'Black lentils slow cooked overnight on charcoal embers with butter & mild spices.' },
  { id: 'd8', name: 'Garlic Butter Naan', category: 'Breads', price: 65, isVeg: true, description: 'Tandoor baked refined flour bread brushed with garlic & fresh butter.' },
  { id: 'd9', name: 'Mango Lassi (Malai Topped)', category: 'Drinks & Desserts', price: 120, isVeg: true, description: 'Thick alphonso mango blended curd served chilled in kulhad.' },
  { id: 'd10', name: 'Matka Phirni (Royal Saffron)', category: 'Drinks & Desserts', price: 110, isVeg: true, description: 'Traditional ground rice pudding infused with saffron, pistachio and cardamom in clay pot.' },
];

function CustomerQrContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table') || 'T-03';

  const [cart, setCart] = useState<{ dish: QrDish; qty: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  const addToCart = (dish: QrDish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { dish, qty: 1 }];
    });
  };

  const updateQty = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { dish: QrDish; qty: number }[]
    );
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.dish.price * item.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + gst;

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const generatedId = `QR-${Math.floor(100 + Math.random() * 900)}`;
    setOrderId(generatedId);
    setOrderPlaced(true);
  };

  const filteredDishes = QR_MENU.filter((d) => {
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesVeg = !vegOnly || d.isVeg;
    return matchesCat && matchesVeg;
  });

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-2xl relative pb-28">
        {/* Brand & Table Header */}
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sticky top-0 z-30 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-base shadow-md">
                BE
              </div>
              <div>
                <h1 className="font-extrabold text-base leading-tight">Biryani Express</h1>
                <p className="text-[11px] text-orange-400 font-medium">Digital Dine-In Menu</p>
              </div>
            </div>

            <div className="bg-orange-600/90 text-white px-3 py-1 rounded-xl text-xs font-mono font-bold border border-orange-400/40 shadow-xs">
              Table {tableParam}
            </div>
          </div>
        </header>

        {/* ORDER SUCCESS SCREEN */}
        {orderPlaced ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl shadow-inner animate-pulse">
              🍳
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Order Sent to Kitchen!
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Order #{orderId}</h2>
              <p className="text-xs text-slate-500 mt-1">Table: <strong className="text-slate-900">{tableParam}</strong></p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full text-left space-y-2 text-xs">
              <span className="font-bold text-slate-700 block border-b border-slate-200 pb-1">Items Ordered:</span>
              {cart.map((c) => (
                <div key={c.dish.id} className="flex justify-between">
                  <span>{c.qty}x {c.dish.name}</span>
                  <span className="font-mono font-bold">₹{c.dish.price * c.qty}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Bill (Incl. GST)</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Our chef is preparing your fresh meal. You can pay via UPI or Cash once your meal is served!
            </p>

            <button
              onClick={() => {
                setCart([]);
                setOrderPlaced(false);
              }}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-slate-800"
            >
              + Order More Items
            </button>
          </div>
        ) : (
          /* DIGITAL MENU SCREEN */
          <main className="flex-1 p-3.5 space-y-4">
            {/* Veg / Non-Veg Banner */}
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span>🍽️</span>
                <span>Order directly from your seat</span>
              </div>
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                  vegOnly
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Veg Only
              </button>
            </div>

            {/* Category Slider */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['ALL', 'Biryani Specials', 'Starters', 'Main Curries', 'Breads', 'Drinks & Desserts'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dish List */}
            <div className="space-y-3">
              {filteredDishes.map((dish) => {
                const inCart = cart.find((c) => c.dish.id === dish.id);

                return (
                  <div
                    key={dish.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] font-black ${
                            dish.isVeg ? 'border-emerald-600 text-emerald-600' : 'border-red-600 text-red-600'
                          }`}
                        >
                          ●
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{dish.name}</h4>
                        {dish.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {dish.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                      <span className="font-extrabold text-sm text-slate-900 mt-2 inline-block">
                        ₹{dish.price}
                      </span>
                    </div>

                    {/* Add / Qty buttons */}
                    <div className="shrink-0 pt-1">
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
          </main>
        )}

        {/* STICKY BOTTOM CART BAR */}
        {totalItemsCount > 0 && !orderPlaced && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 p-3.5 z-40 shadow-2xl">
            <div className="space-y-2 mb-2">
              <input
                type="text"
                placeholder="Notes for chef (e.g. less spice, extra raita)..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <button
              onClick={handlePlaceOrder}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-between px-4 transition active:scale-98"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-mono font-bold text-xs">
                  {totalItemsCount}
                </span>
                <span>Send to Kitchen ({tableParam})</span>
              </div>
              <span className="text-sm font-black">₹{grandTotal} →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerQrPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Menu...</div>}>
      <CustomerQrContent />
    </Suspense>
  );
}
