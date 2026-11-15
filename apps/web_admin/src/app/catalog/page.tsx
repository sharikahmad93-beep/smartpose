'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface MenuItemDisplay {
  id: string;
  name: string;
  category: string;
  base_price: number;
  is_veg: boolean;
  is_available: boolean;
  short_code: string;
}

interface ComboOffer {
  id: string;
  title: string;
  comboItems: string;
  comboPrice: number;
  originalPrice: number;
  discountBadge: string;
  isAvailable: boolean;
}

const INITIAL_ITEMS: MenuItemDisplay[] = [
  { id: '1', name: 'Special Mutton Dum Biryani', category: 'Hyderabadi Dum Biryani', base_price: 380, is_veg: false, is_available: true, short_code: 'MB01' },
  { id: '2', name: 'Royal Chicken Dum Biryani', category: 'Hyderabadi Dum Biryani', base_price: 290, is_veg: false, is_available: true, short_code: 'CB01' },
  { id: '3', name: 'Nawabi Paneer Dum Biryani', category: 'Hyderabadi Dum Biryani', base_price: 240, is_veg: true, is_available: true, short_code: 'PB01' },
  { id: '4', name: 'Chicken 65 (Crispy Andhra Style)', category: 'Tandoori & Starters', base_price: 260, is_veg: false, is_available: true, short_code: 'C65' },
  { id: '5', name: 'Tandoori Paneer Tikka', category: 'Tandoori & Starters', base_price: 230, is_veg: true, is_available: true, short_code: 'PT01' },
  { id: '6', name: 'Murgh Malai Kebab', category: 'Tandoori & Starters', base_price: 280, is_veg: false, is_available: false, short_code: 'MMK01' },
  { id: '7', name: 'Butter Naan', category: 'Indian Breads & Curries', base_price: 50, is_veg: true, is_available: true, short_code: 'BN01' },
  { id: '8', name: 'Garlic Herb Naan', category: 'Indian Breads & Curries', base_price: 65, is_veg: true, is_available: true, short_code: 'GN01' },
  { id: '9', name: 'Hot Gulab Jamun (2 Pcs)', category: 'Beverages & Desserts', base_price: 80, is_veg: true, is_available: true, short_code: 'GJ01' },
  { id: '10', name: 'Irani Masala Chai', category: 'Beverages & Desserts', base_price: 40, is_veg: true, is_available: true, short_code: 'MC01' },
  { id: '11', name: 'Fresh Lime Soda', category: 'Beverages & Desserts', base_price: 60, is_veg: true, is_available: true, short_code: 'FLS01' },
  { id: '12', name: 'Tandoori Roti', category: 'Indian Breads & Curries', base_price: 35, is_veg: true, is_available: true, short_code: 'TR01' },
];

const INITIAL_COMBOS: ComboOffer[] = [
  { id: 'c1', title: 'Royal Biryani & Kebab Solo Feast', comboItems: '1x Chicken Dum Biryani + 1x Chicken Tikka (4 pcs) + 1x Cold Drink', comboPrice: 489, originalPrice: 590, discountBadge: 'Save ₹101', isAvailable: true },
  { id: 'c2', title: 'Family Weekend Dum Handi Combo', comboItems: '2x Mutton Dum Biryani + 1x Chicken 65 + 4x Butter Naan + 4x Gulab Jamun', comboPrice: 1199, originalPrice: 1460, discountBadge: 'Save ₹261', isAvailable: true },
  { id: 'c3', title: 'Veg Nawabi Shahi Thali Deal', comboItems: '1x Paneer Biryani + 1x Dal Makhani + 2x Garlic Naan + 1x Mango Lassi', comboPrice: 449, originalPrice: 540, discountBadge: 'Save ₹91', isAvailable: true },
];

export default function CatalogPage() {
  const [items, setItems] = useState<MenuItemDisplay[]>(INITIAL_ITEMS);
  const [combos, setCombos] = useState<ComboOffer[]>(INITIAL_COMBOS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [activeCatalogTab, setActiveCatalogTab] = useState<'dishes' | 'combos'>('dishes');

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_available: !i.is_available } : i))
    );
  };

  const toggleComboAvailability = (id: string) => {
    setCombos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isAvailable: !c.isAvailable } : c))
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category.includes(selectedCategory);
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.short_code.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="catalog" />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Master Menu &amp; Catalog</h2>
            <p className="text-sm text-slate-500">Manage categories, dish pricing, combo offers, and 86&apos;d availability</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-500 transition shadow"
            >
              Test in POS Terminal &rarr;
            </Link>
          </div>
        </header>

        {/* Tab Selector: Standard Dishes vs Combo Offers */}
        <div className="mt-6 flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveCatalogTab('dishes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeCatalogTab === 'dishes'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🍛 Standard Dishes ({items.length})
          </button>
          <button
            onClick={() => setActiveCatalogTab('combos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeCatalogTab === 'combos'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🎁 Combo Deals &amp; Value Offers ({combos.length})
          </button>
        </div>

        {/* TAB 1: STANDARD DISHES */}
        {activeCatalogTab === 'dishes' && (
          <div className="space-y-4 mt-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {['All', 'Biryani', 'Starters', 'Breads', 'Beverages'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search dish or code (e.g. MB01)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                />
              </div>
            </div>

            {/* Catalog Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Dish Name</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Dietary</th>
                    <th className="py-3.5 px-6">Price</th>
                    <th className="py-3.5 px-6">Stock Status</th>
                    <th className="py-3.5 px-6 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-400 font-mono">Code: {item.short_code}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 font-medium">{item.category}</td>
                      <td className="py-4 px-6">
                        {item.is_veg ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Veg
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Non-Veg
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">₹{item.base_price.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        {item.is_available ? (
                          <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                            🟢 In Stock (Available)
                          </span>
                        ) : (
                          <span className="inline-block text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                            🚫 86&apos;d (Out of Stock)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg border transition ${
                            item.is_available
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {item.is_available ? 'Set 86 Stock-Out' : 'Enable In-Stock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: COMBO OFFERS & DEALS */}
        {activeCatalogTab === 'combos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      {combo.discountBadge}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      combo.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {combo.isAvailable ? '● Active in POS' : '○ Disabled'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-2">{combo.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {combo.comboItems}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-lg text-slate-900">₹{combo.comboPrice}</span>
                    <span className="line-through text-xs text-slate-400">₹{combo.originalPrice}</span>
                  </div>

                  <button
                    onClick={() => toggleComboAvailability(combo.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      combo.isAvailable
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {combo.isAvailable ? 'Disable Combo' : 'Enable Combo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
