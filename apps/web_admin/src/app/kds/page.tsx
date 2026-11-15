'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface KotItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  station: 'Biryani' | 'Tandoor' | 'Curry' | 'Breads' | 'Beverages';
  status: 'PENDING' | 'COOKING' | 'DONE';
}

interface KotTicket {
  id: string;
  kotNumber: number;
  orderSource: 'DINE_IN' | 'SWIGGY' | 'ZOMATO' | 'TAKEAWAY' | 'ONDC' | 'MAGICPIN' | 'DOTPE' | 'THRIVE';
  brandName?: string;
  sourceReference: string; // 'Table T-03' or 'SWG-8942'
  elapsedMinutes: number;
  items: KotItem[];
  status: 'NEW' | 'COOKING' | 'READY' | 'BUMPED';
  createdAt: string;
  specialInstructions?: string;
}

const INITIAL_KOTS: KotTicket[] = [
  {
    id: 'kot-1',
    kotNumber: 201,
    orderSource: 'DINE_IN',
    brandName: 'Biryani Express',
    sourceReference: 'Table T-03',
    elapsedMinutes: 4,
    createdAt: '13:42',
    specialInstructions: 'Serve starters first, extra raita',
    status: 'COOKING',
    items: [
      { id: 'i1', name: 'Royal Chicken Dum Biryani', quantity: 2, notes: 'Spicy, leg piece', station: 'Biryani', status: 'COOKING' },
      { id: 'i2', name: 'Chicken 65 (Crispy Andhra)', quantity: 1, station: 'Tandoor', status: 'DONE' },
    ],
  },
  {
    id: 'kot-2',
    kotNumber: 202,
    orderSource: 'SWIGGY',
    brandName: 'Biryani Express',
    sourceReference: 'SWG-8942',
    elapsedMinutes: 11,
    createdAt: '13:35',
    specialInstructions: 'Packing seal mandatory, plastic spoons',
    status: 'COOKING',
    items: [
      { id: 'i3', name: 'Special Mutton Dum Biryani', quantity: 1, notes: 'Medium spice', station: 'Biryani', status: 'COOKING' },
      { id: 'i4', name: 'Garlic Herb Naan', quantity: 2, station: 'Breads', status: 'DONE' },
    ],
  },
  {
    id: 'kot-3',
    kotNumber: 203,
    orderSource: 'ZOMATO',
    brandName: 'Rolls & Bowls Co.',
    sourceReference: 'ZOM-3319',
    elapsedMinutes: 16,
    createdAt: '13:30',
    specialInstructions: 'Jain preparation, absolutely no garlic/onion',
    status: 'READY',
    items: [
      { id: 'i5', name: 'Nawabi Paneer Dum Biryani', quantity: 2, station: 'Biryani', status: 'DONE' },
      { id: 'i6', name: 'Tandoori Paneer Tikka', quantity: 1, station: 'Tandoor', status: 'DONE' },
    ],
  },
  {
    id: 'kot-4',
    kotNumber: 204,
    orderSource: 'TAKEAWAY',
    sourceReference: 'Token #18',
    elapsedMinutes: 7,
    createdAt: '13:39',
    status: 'COOKING',
    items: [
      { id: 'i7', name: 'Murgh Malai Kebab', quantity: 1, notes: 'Extra mint chutney', station: 'Tandoor', status: 'COOKING' },
      { id: 'i8', name: 'Butter Naan', quantity: 3, station: 'Breads', status: 'COOKING' },
    ],
  },
  {
    id: 'kot-5',
    kotNumber: 205,
    orderSource: 'DINE_IN',
    sourceReference: 'Table T-07',
    elapsedMinutes: 2,
    createdAt: '13:44',
    status: 'NEW',
    items: [
      { id: 'i9', name: 'Hot Gulab Jamun (2 Pcs)', quantity: 2, station: 'Beverages', status: 'PENDING' },
      { id: 'i10', name: 'Irani Masala Chai', quantity: 2, station: 'Beverages', status: 'PENDING' },
    ],
  },
  {
    id: 'kot-6',
    kotNumber: 206,
    orderSource: 'ONDC',
    sourceReference: 'ONDC-7749102',
    elapsedMinutes: 3,
    createdAt: '13:48',
    specialInstructions: 'ONDC Buyer: PhonePe Pincode - pack securely',
    status: 'NEW',
    items: [
      { id: 'i11', name: 'Royal Chicken Dum Biryani', quantity: 1, notes: 'Spicy', station: 'Biryani', status: 'PENDING' },
      { id: 'i12', name: 'Butter Naan', quantity: 2, station: 'Breads', status: 'PENDING' },
    ],
  },
  {
    id: 'kot-7',
    kotNumber: 207,
    orderSource: 'MAGICPIN',
    sourceReference: 'MP-88310',
    elapsedMinutes: 5,
    createdAt: '13:40',
    status: 'COOKING',
    items: [
      { id: 'i13', name: 'Nawabi Paneer Dum Biryani', quantity: 1, station: 'Biryani', status: 'COOKING' },
      { id: 'i14', name: 'Tandoori Paneer Tikka', quantity: 1, station: 'Tandoor', status: 'DONE' },
    ],
  },
];

export default function KitchenDisplaySystemPage() {
  const [tickets, setTickets] = useState<KotTicket[]>(INITIAL_KOTS);
  const [stationFilter, setStationFilter] = useState<string>('All');
  const [viewFilter, setViewFilter] = useState<'ACTIVE' | 'READY' | 'ALL'>('ACTIVE');
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [stockOutList, setStockOutList] = useState<string[]>(['Irani Masala Chai']);

  // Timer simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) => ({ ...t, elapsedMinutes: t.elapsedMinutes + 1 }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const advanceTicketStatus = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        if (t.status === 'NEW') return { ...t, status: 'COOKING' };
        if (t.status === 'COOKING') return { ...t, status: 'READY' };
        if (t.status === 'READY') return { ...t, status: 'BUMPED' };
        return t;
      })
    );
  };

  const toggleItemDone = (ticketId: string, itemId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const newItems = t.items.map((item) =>
          item.id === itemId
            ? { ...item, status: (item.status === 'DONE' ? 'COOKING' : 'DONE') as 'DONE' | 'COOKING' }
            : item
        );
        const allDone = newItems.every((item) => item.status === 'DONE');
        return {
          ...t,
          items: newItems,
          status: allDone ? 'READY' : t.status,
        };
      })
    );
  };

  const toggle86Stock = (dishName: string) => {
    setStockOutList((prev) =>
      prev.includes(dishName) ? prev.filter((d) => d !== dishName) : [...prev, dishName]
    );
  };

  const filteredTickets = tickets.filter((t) => {
    if (viewFilter === 'ACTIVE') return t.status === 'NEW' || t.status === 'COOKING';
    if (viewFilter === 'READY') return t.status === 'READY';
    return true; // ALL
  });

  const getSourceBadge = (source: KotTicket['orderSource']) => {
    switch (source) {
      case 'DINE_IN':
        return <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-bold">DINE-IN</span>;
      case 'SWIGGY':
        return <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded font-bold">SWIGGY</span>;
      case 'ZOMATO':
        return <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold">ZOMATO</span>;
      case 'TAKEAWAY':
        return <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded font-bold">TAKEAWAY</span>;
      case 'ONDC':
        return <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded font-bold">ONDC</span>;
      case 'MAGICPIN':
        return <span className="bg-pink-600 text-white text-xs px-2 py-0.5 rounded font-bold">MAGICPIN</span>;
      case 'DOTPE':
        return <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded font-bold">DOTPE</span>;
      case 'THRIVE':
        return <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded font-bold">THRIVE</span>;
    }
  };

  const getTimerColor = (mins: number) => {
    if (mins < 8) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
    if (mins < 15) return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse';
    return 'bg-red-500/30 text-red-300 border border-red-500 animate-pulse font-black';
  };

  const activeCount = tickets.filter((t) => t.status === 'NEW' || t.status === 'COOKING').length;
  const readyCount = tickets.filter((t) => t.status === 'READY').length;
  const delayedCount = tickets.filter((t) => t.elapsedMinutes >= 15 && t.status !== 'BUMPED').length;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top KDS Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition"
          >
            <span>← Back to Portal</span>
          </Link>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍳</span>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              KITCHEN DISPLAY SYSTEM (KDS)
            </h1>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Indiranagar Main Line
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">Active Prep:</span>
            <span className="font-bold text-amber-400 text-sm">{activeCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">Ready for Pickup:</span>
            <span className="font-bold text-emerald-400 text-sm">{readyCount}</span>
          </div>
          {delayedCount > 0 && (
            <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/60 px-3 py-1.5 rounded-lg text-xs text-red-300 animate-pulse">
              <span>⚠️ Overdue (&gt;15m):</span>
              <span className="font-extrabold text-red-200 text-sm">{delayedCount}</span>
            </div>
          )}

          {/* 86 Stock Button */}
          <button
            onClick={() => setIsStockModalOpen(true)}
            className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 transition shadow-md"
          >
            <span>🚫 86 Item (Stock Out)</span>
            {stockOutList.length > 0 && (
              <span className="bg-red-950 px-1.5 py-0.5 rounded-full text-[10px] text-red-200">
                {stockOutList.length}
              </span>
            )}
          </button>

          <Link
            href="/pos"
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <span>💻 POS Terminal</span>
          </Link>
        </div>
      </header>

      {/* Sub-bar Filter Controls */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mr-1">View:</span>
          {(['ACTIVE', 'READY', 'ALL'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setViewFilter(view)}
              className={`text-xs px-3 py-1 rounded font-bold transition ${
                viewFilter === view
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {view === 'ACTIVE' && `🔥 In Cooking (${activeCount})`}
              {view === 'READY' && `✅ Ready to Serve (${readyCount})`}
              {view === 'ALL' && `📋 All Tickets (${tickets.length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mr-1">Station:</span>
          {['All', 'Biryani', 'Tandoor', 'Breads', 'Beverages'].map((st) => (
            <button
              key={st}
              onClick={() => setStationFilter(st)}
              className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                stationFilter === st
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main KOT Ticket Board */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-5 h-full items-start">
          {filteredTickets.map((ticket) => {
            const isDelayed = ticket.elapsedMinutes >= 15;
            const isReady = ticket.status === 'READY';
            const isCooking = ticket.status === 'COOKING';

            return (
              <div
                key={ticket.id}
                className={`w-80 shrink-0 flex flex-col rounded-xl overflow-hidden border shadow-2xl transition-all h-[calc(100vh-145px)] ${
                  isReady
                    ? 'bg-slate-900 border-emerald-500/80 shadow-emerald-950/40'
                    : isDelayed
                    ? 'bg-slate-900 border-red-500 shadow-red-950/40'
                    : 'bg-slate-900 border-slate-700 shadow-black/50'
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-3.5 flex items-center justify-between border-b ${
                    isReady
                      ? 'bg-emerald-950/80 border-emerald-800'
                      : isDelayed
                      ? 'bg-red-950/90 border-red-800'
                      : 'bg-slate-850 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-lg text-white">#{ticket.kotNumber}</span>
                      {getSourceBadge(ticket.orderSource)}
                      {ticket.brandName && (
                        <span className="bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          🏷️ {ticket.brandName}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-300 mt-0.5">
                      {ticket.sourceReference} • {ticket.createdAt}
                    </div>
                  </div>

                  <div className={`text-xs px-2 py-1 rounded-md font-mono font-bold ${getTimerColor(ticket.elapsedMinutes)}`}>
                    ⏱ {ticket.elapsedMinutes}m
                  </div>
                </div>

                {/* Special Chef Instructions */}
                {ticket.specialInstructions && (
                  <div className="bg-amber-950/40 border-b border-amber-800/40 px-3.5 py-1.5 text-xs text-amber-300 flex items-start gap-1.5 font-medium">
                    <span className="text-amber-400 shrink-0">⚠️</span>
                    <span>{ticket.specialInstructions}</span>
                  </div>
                )}

                {/* Items List */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 divide-y divide-slate-800/60">
                  {ticket.items.map((item) => {
                    const isDone = item.status === 'DONE';
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemDone(ticket.id, item.id)}
                        className={`pt-2 first:pt-0 cursor-pointer group flex items-start justify-between select-none ${
                          isDone ? 'opacity-40 line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-orange-400 border border-slate-700'
                            }`}
                          >
                            {isDone ? '✓' : `${item.quantity}x`}
                          </span>
                          <div>
                            <div className="font-semibold text-sm leading-tight group-hover:text-amber-300 transition">
                              {item.name}
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-orange-300/90 font-medium mt-0.5">
                                → {item.notes}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              [{item.station}]
                            </div>
                          </div>
                        </div>

                        <span className="text-xs text-slate-500 group-hover:text-slate-300">
                          {isDone ? 'DONE' : 'PREP'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Ticket Action Button */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
                  {ticket.status === 'NEW' && (
                    <button
                      onClick={() => advanceTicketStatus(ticket.id)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-md"
                    >
                      🍳 Start Cooking
                    </button>
                  )}

                  {ticket.status === 'COOKING' && (
                    <button
                      onClick={() => advanceTicketStatus(ticket.id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>🔔 Mark Order Ready</span>
                    </button>
                  )}

                  {ticket.status === 'READY' && (
                    <button
                      onClick={() => advanceTicketStatus(ticket.id)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>🚀 Bump / Food Picked Up</span>
                    </button>
                  )}

                  {ticket.status === 'BUMPED' && (
                    <div className="text-center text-xs text-slate-500 py-1 font-mono">
                      Ticket Completed &amp; Cleared
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 86 Stock Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-white">Kitchen 86 Stock (Item Off)</h3>
                <p className="text-xs text-slate-400">
                  Toggle items unavailable in real-time across POS &amp; Swiggy/Zomato
                </p>
              </div>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
              {[
                'Special Mutton Dum Biryani',
                'Royal Chicken Dum Biryani',
                'Nawabi Paneer Dum Biryani',
                'Chicken 65 (Crispy Andhra)',
                'Tandoori Paneer Tikka',
                'Murgh Malai Kebab',
                'Butter Naan',
                'Garlic Herb Naan',
                'Tandoori Roti',
                'Hot Gulab Jamun (2 Pcs)',
                'Irani Masala Chai',
                'Fresh Lime Soda',
              ].map((dish) => {
                const isOff = stockOutList.includes(dish);
                return (
                  <div
                    key={dish}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60"
                  >
                    <span className="font-semibold text-sm text-slate-200">{dish}</span>
                    <button
                      onClick={() => toggle86Stock(dish)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                        isOff
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {isOff ? '🚫 86 (Stock Out)' : '🟢 In Stock'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
              >
                Save &amp; Sync Across Stations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
