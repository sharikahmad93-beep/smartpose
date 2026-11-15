'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export interface MenuItemDisplay {
  id: string;
  name: string;
  category: string;
  base_price: number;
  is_veg: boolean;
  is_available: boolean;
  short_code: string;
  prep_time_minutes?: number;
  description?: string;
  portion_value?: number | '';
  portion_unit?: string;
  portion_size?: string;
}

export interface ComboOffer {
  id: string;
  title: string;
  comboItems: string;
  comboPrice: number;
  originalPrice: number;
  discountBadge: string;
  isAvailable: boolean;
}

const DEFAULT_ITEMS: MenuItemDisplay[] = [
  { id: '1', name: 'Special Mutton Dum Biryani', category: 'Hyderabadi Dum Biryani', base_price: 380, is_veg: false, is_available: true, short_code: 'MB01', prep_time_minutes: 20, portion_value: 750, portion_unit: 'gm', portion_size: '750 gm' },
  { id: '2', name: 'Royal Chicken Dum Biryani', category: 'Hyderabadi Dum Biryani', base_price: 290, is_veg: false, is_available: true, short_code: 'CB01', prep_time_minutes: 15, portion_value: 650, portion_unit: 'gm', portion_size: '650 gm' },
  { id: '3', name: 'Nawabi Paneer Dum Biryani', category: 'Hyderabadi Dum Biryani', base_price: 240, is_veg: true, is_available: true, short_code: 'PB01', prep_time_minutes: 15, portion_value: 500, portion_unit: 'gm', portion_size: '500 gm' },
  { id: '4', name: 'Chicken 65 (Crispy Andhra Style)', category: 'Tandoori & Starters', base_price: 260, is_veg: false, is_available: true, short_code: 'C65', prep_time_minutes: 12, portion_value: 8, portion_unit: 'pcs', portion_size: '8 Pcs' },
  { id: '5', name: 'Tandoori Paneer Tikka', category: 'Tandoori & Starters', base_price: 230, is_veg: true, is_available: true, short_code: 'PT01', prep_time_minutes: 15, portion_value: 6, portion_unit: 'pcs', portion_size: '6 Pcs' },
  { id: '6', name: 'Murgh Malai Kebab', category: 'Tandoori & Starters', base_price: 280, is_veg: false, is_available: false, short_code: 'MMK01', prep_time_minutes: 18, portion_value: 6, portion_unit: 'pcs', portion_size: '6 Pcs' },
  { id: '7', name: 'Butter Naan', category: 'Indian Breads & Curries', base_price: 50, is_veg: true, is_available: true, short_code: 'BN01', prep_time_minutes: 5, portion_value: 1, portion_unit: 'pcs', portion_size: '1 Pc' },
  { id: '8', name: 'Garlic Herb Naan', category: 'Indian Breads & Curries', base_price: 65, is_veg: true, is_available: true, short_code: 'GN01', prep_time_minutes: 6, portion_value: 1, portion_unit: 'pcs', portion_size: '1 Pc' },
  { id: '9', name: 'Hot Gulab Jamun (2 Pcs)', category: 'Beverages & Desserts', base_price: 80, is_veg: true, is_available: true, short_code: 'GJ01', prep_time_minutes: 5, portion_value: 2, portion_unit: 'pcs', portion_size: '2 Pcs' },
  { id: '10', name: 'Irani Masala Chai', category: 'Beverages & Desserts', base_price: 40, is_veg: true, is_available: true, short_code: 'MC01', prep_time_minutes: 5, portion_value: 150, portion_unit: 'ml', portion_size: '150 ml' },
  { id: '11', name: 'Fresh Lime Soda', category: 'Beverages & Desserts', base_price: 60, is_veg: true, is_available: true, short_code: 'FLS01', prep_time_minutes: 4, portion_value: 300, portion_unit: 'ml', portion_size: '300 ml' },
  { id: '12', name: 'Tandoori Roti', category: 'Indian Breads & Curries', base_price: 35, is_veg: true, is_available: true, short_code: 'TR01', prep_time_minutes: 5, portion_value: 1, portion_unit: 'pcs', portion_size: '1 Pc' },
];

const DEFAULT_COMBOS: ComboOffer[] = [
  { id: 'c1', title: 'Royal Biryani & Kebab Solo Feast', comboItems: '1x Chicken Dum Biryani + 1x Chicken Tikka (4 pcs) + 1x Cold Drink', comboPrice: 489, originalPrice: 590, discountBadge: 'Save ₹101', isAvailable: true },
  { id: 'c2', title: 'Family Weekend Dum Handi Combo', comboItems: '2x Mutton Dum Biryani + 1x Chicken 65 + 4x Butter Naan + 4x Gulab Jamun', comboPrice: 1199, originalPrice: 1460, discountBadge: 'Save ₹261', isAvailable: true },
  { id: 'c3', title: 'Veg Nawabi Shahi Thali Deal', comboItems: '1x Paneer Biryani + 1x Dal Makhani + 2x Garlic Naan + 1x Mango Lassi', comboPrice: 449, originalPrice: 540, discountBadge: 'Save ₹91', isAvailable: true },
];

const CATEGORIES = [
  'Hyderabadi Dum Biryani',
  'Tandoori & Starters',
  'Indian Breads & Curries',
  'Beverages & Desserts',
  'Chinese & Fast Food',
  'Main Course',
  'Rolls & Wraps'
];

export default function CatalogPage() {
  const [items, setItems] = useState<MenuItemDisplay[]>(DEFAULT_ITEMS);
  const [combos, setCombos] = useState<ComboOffer[]>(DEFAULT_COMBOS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [activeCatalogTab, setActiveCatalogTab] = useState<'dishes' | 'combos'>('dishes');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDisplay | null>(null);
  const [isAddComboModalOpen, setIsAddComboModalOpen] = useState(false);

  // New Dish Form State
  const [dishName, setDishName] = useState('');
  const [dishShortCode, setDishShortCode] = useState('');
  const [dishCategory, setDishCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [dishPrice, setDishPrice] = useState<number | ''>('');
  const [dishPortionValue, setDishPortionValue] = useState<number | ''>('');
  const [dishPortionUnit, setDishPortionUnit] = useState<string>('ml');
  const [dishIsVeg, setDishIsVeg] = useState(true);
  const [dishPrepTime, setDishPrepTime] = useState<number>(15);
  const [dishIsAvailable, setDishIsAvailable] = useState(true);
  const [dishDescription, setDishDescription] = useState('');

  // New Combo Form State
  const [comboTitle, setComboTitle] = useState('');
  const [comboItemsText, setComboItemsText] = useState('');
  const [comboPrice, setComboPrice] = useState<number | ''>('');
  const [comboOrigPrice, setComboOrigPrice] = useState<number | ''>('');
  const [comboBadge, setComboBadge] = useState('');

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('smart_pos_menu_items');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
      const savedCombos = localStorage.getItem('smart_pos_combos');
      if (savedCombos) {
        setCombos(JSON.parse(savedCombos));
      }
    } catch {
      // fallback to defaults
    }
  }, []);

  // Save items whenever changed
  const saveItems = (updated: MenuItemDisplay[]) => {
    setItems(updated);
    try {
      localStorage.setItem('smart_pos_menu_items', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Save combos whenever changed
  const saveCombos = (updated: ComboOffer[]) => {
    setCombos(updated);
    try {
      localStorage.setItem('smart_pos_combos', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-generate short code from dish name
  const handleDishNameChange = (name: string) => {
    setDishName(name);
    if (!editingItem && !dishShortCode) {
      const initials = name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0].toUpperCase())
        .join('');
      if (initials) {
        setDishShortCode(`${initials}01`);
      }
    }
  };

  // Open modal for adding a new dish
  const openAddDishModal = () => {
    setEditingItem(null);
    setDishName('');
    setDishShortCode('');
    setDishCategory(CATEGORIES[0]);
    setCustomCategory('');
    setDishPrice('');
    setDishPortionValue('');
    setDishPortionUnit('ml');
    setDishIsVeg(true);
    setDishPrepTime(15);
    setDishIsAvailable(true);
    setDishDescription('');
    setIsAddDishModalOpen(true);
  };

  // Open modal for editing an existing dish
  const openEditDishModal = (item: MenuItemDisplay) => {
    setEditingItem(item);
    setDishName(item.name);
    setDishShortCode(item.short_code);
    setDishCategory(CATEGORIES.includes(item.category) ? item.category : 'Other');
    if (!CATEGORIES.includes(item.category)) {
      setCustomCategory(item.category);
    } else {
      setCustomCategory('');
    }
    setDishPrice(item.base_price);
    setDishPortionValue(item.portion_value !== undefined ? item.portion_value : '');
    setDishPortionUnit(item.portion_unit || 'ml');
    setDishIsVeg(item.is_veg);
    setDishPrepTime(item.prep_time_minutes || 15);
    setDishIsAvailable(item.is_available);
    setDishDescription(item.description || '');
    setIsAddDishModalOpen(true);
  };

  // Handle Save (Add or Update) Dish
  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      alert('Please enter a dish name');
      return;
    }
    const finalPrice = Number(dishPrice) || 0;
    if (finalPrice <= 0) {
      alert('Please enter a valid price in ₹');
      return;
    }

    const finalCategory = dishCategory === 'Other' && customCategory.trim() 
      ? customCategory.trim() 
      : dishCategory;

    const finalShortCode = dishShortCode.trim() || `D${Date.now().toString().slice(-3)}`;
    const finalPortionSize = dishPortionValue ? `${dishPortionValue} ${dishPortionUnit}` : undefined;

    if (editingItem) {
      // Update existing item
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              name: dishName.trim(),
              short_code: finalShortCode,
              category: finalCategory,
              base_price: finalPrice,
              portion_value: dishPortionValue,
              portion_unit: dishPortionUnit,
              portion_size: finalPortionSize,
              is_veg: dishIsVeg,
              is_available: dishIsAvailable,
              prep_time_minutes: Number(dishPrepTime) || 15,
              description: dishDescription.trim(),
            }
          : it
      );
      saveItems(updated);
      showToast(`Dish "${dishName}" updated successfully!`);
    } else {
      // Add new item
      const newItem: MenuItemDisplay = {
        id: `dish-${Date.now()}`,
        name: dishName.trim(),
        short_code: finalShortCode,
        category: finalCategory,
        base_price: finalPrice,
        portion_value: dishPortionValue,
        portion_unit: dishPortionUnit,
        portion_size: finalPortionSize,
        is_veg: dishIsVeg,
        is_available: dishIsAvailable,
        prep_time_minutes: Number(dishPrepTime) || 15,
        description: dishDescription.trim(),
      };
      const updated = [newItem, ...items];
      saveItems(updated);
      showToast(`New dish "${dishName}" added to menu! Ready for POS billing.`);
    }

    setIsAddDishModalOpen(false);
  };

  // Handle Save Combo
  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboTitle.trim() || !comboPrice) return;

    const newCombo: ComboOffer = {
      id: `combo-${Date.now()}`,
      title: comboTitle.trim(),
      comboItems: comboItemsText.trim() || 'Custom curated items bundle',
      comboPrice: Number(comboPrice),
      originalPrice: Number(comboOrigPrice) || Math.round(Number(comboPrice) * 1.25),
      discountBadge: comboBadge.trim() || `Save ₹${Math.max(0, (Number(comboOrigPrice) || 0) - Number(comboPrice))}`,
      isAvailable: true,
    };

    const updated = [newCombo, ...combos];
    saveCombos(updated);
    showToast(`Combo offer "${comboTitle}" created successfully!`);
    setIsAddComboModalOpen(false);
    setComboTitle('');
    setComboItemsText('');
    setComboPrice('');
    setComboOrigPrice('');
    setComboBadge('');
  };

  // Delete Dish
  const handleDeleteDish = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the menu?`)) {
      const updated = items.filter((it) => it.id !== id);
      saveItems(updated);
      showToast(`Dish "${name}" removed from menu.`);
    }
  };

  const toggleAvailability = (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, is_available: !i.is_available } : i
    );
    saveItems(updated);
  };

  const toggleComboAvailability = (id: string) => {
    const updated = combos.map((c) =>
      c.id === id ? { ...c, isAvailable: !c.isAvailable } : c
    );
    saveCombos(updated);
  };

  // Filtered dishes
  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.short_code.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar activeTab="catalog" />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto pb-24">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <span className="text-emerald-400 font-bold text-base">✓</span>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Master Menu &amp; Catalog</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                {items.length} Dishes Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add new dishes, manage categories, customize portion pricing, combo bundles, and live 86 stock availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Action Button: Add New Dish */}
            <button
              onClick={openAddDishModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-md shadow-orange-600/30 shrink-0"
            >
              <span className="text-base leading-none">＋</span>
              <span>Add New Dish</span>
            </button>

            {/* Test in POS Button */}
            <Link
              href="/pos"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm shrink-0"
            >
              Open POS Terminal &rarr;
            </Link>
          </div>
        </header>

        {/* Tab Selector: Standard Dishes vs Combo Deals */}
        <div className="mt-6 flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCatalogTab('dishes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeCatalogTab === 'dishes'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span>🍛 Standard Dishes</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {items.length}
              </span>
            </button>
            <button
              onClick={() => setActiveCatalogTab('combos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeCatalogTab === 'combos'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span>🎁 Combo Deals &amp; Value Offers</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {combos.length}
              </span>
            </button>
          </div>

          {activeCatalogTab === 'combos' && (
            <button
              onClick={() => setIsAddComboModalOpen(true)}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              ＋ Add Combo Offer
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: STANDARD DISHES                                         */}
        {/* ============================================================== */}
        {activeCatalogTab === 'dishes' && (
          <div className="space-y-4 mt-5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
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

              {/* Search Bar + Quick Add Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-72 relative">
                  <input
                    type="text"
                    placeholder="Search dish, code (MB01), or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                </div>

                <button
                  onClick={openAddDishModal}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold whitespace-nowrap transition shadow-sm shrink-0"
                >
                  ＋ Add Dish
                </button>
              </div>
            </div>

            {/* Catalog Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6 whitespace-nowrap">Dish Name &amp; Code</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">Quantity (ml / gm / pcs)</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">Category</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">Dietary</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">Price</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">Stock Status</th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="text-3xl mb-2">🍽️</div>
                        <p className="font-bold text-slate-700">No dishes found matching &quot;{search}&quot;</p>
                        <button
                          onClick={openAddDishModal}
                          className="mt-3 px-4 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-xl shadow"
                        >
                          + Add &quot;{search}&quot; to Menu
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-mono">Code: {item.short_code}</span>
                            {item.prep_time_minutes && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                ⏱️ {item.prep_time_minutes}m
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {item.portion_size ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                              <span>📏</span>
                              <span>{item.portion_size}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {item.is_veg ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Veg
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                              <span className="w-2 h-2 rounded-full bg-red-600"></span> Non-Veg
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{item.base_price.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {item.is_available ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100/70 px-2.5 py-1 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              86&apos;d (Sold Out)
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle 86 Availability */}
                            <button
                              onClick={() => toggleAvailability(item.id)}
                              className={`text-xs font-bold px-3 py-1 rounded-lg border transition ${
                                item.is_available
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={item.is_available ? 'Mark as Out of Stock (86)' : 'Mark as In Stock'}
                            >
                              {item.is_available ? 'Set 86 Stock-Out' : 'Enable In-Stock'}
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditDishModal(item)}
                              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                              title="Edit Dish Details"
                            >
                              ✏️ Edit
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteDish(item.id, item.name)}
                              className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition"
                              title="Delete Dish"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: COMBO DEALS & OFFERS                                    */}
        {/* ============================================================== */}
        {activeCatalogTab === 'combos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      {combo.discountBadge}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
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

        {/* ============================================================== */}
        {/* MODAL: ADD / EDIT DISH                                         */}
        {/* ============================================================== */}
        {isAddDishModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-slate-800 border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍛</span>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingItem ? 'Edit Dish Details' : 'Add New Dish to Menu'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDishModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDish} className="space-y-4 text-xs">
                {/* Dish Name */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Dish Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paneer Butter Masala, Chicken Tikka Biryani"
                    value={dishName}
                    onChange={(e) => handleDishNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
                  />
                </div>

                {/* Short Code & Price Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      KOT Short Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PBM01"
                      value={dishShortCode}
                      onChange={(e) => setDishShortCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 uppercase"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Base Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 280"
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                {/* Serving Quantity / Measurement Unit (ml, gm, pcs, plate) */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="text-sm">📏</span>
                      <span>Portion Quantity &amp; Unit (ml / gm / pcs)</span>
                      <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-orange-600 font-bold">
                      {dishPortionValue ? `Selected: ${dishPortionValue} ${dishPortionUnit}` : 'e.g. 250 ml, 500 gm'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Quantity / Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="e.g. 250, 500, 1"
                        value={dishPortionValue}
                        onChange={(e) => setDishPortionValue(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Serving Unit</label>
                      <select
                        value={dishPortionUnit}
                        onChange={(e) => setDishPortionUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="ml">ml (Milliliters - Drinks/Soups)</option>
                        <option value="L">L (Litres - Bulk/Beverages)</option>
                        <option value="gm">gm (Grams - Biryani/Curry)</option>
                        <option value="kg">kg (Kilograms - Handi/Combos)</option>
                        <option value="pcs">Pcs (Pieces - Kebabs/Rotis)</option>
                        <option value="Plate">Plate (Full / Single)</option>
                        <option value="Half">Half Plate</option>
                        <option value="Glass">Glass</option>
                        <option value="Cup">Cup</option>
                        <option value="Bottle">Bottle / Can</option>
                        <option value="Portion">Portion</option>
                      </select>
                    </div>
                  </div>

                  {/* 1-Click Quick Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-bold">Quick Units:</span>
                    {[
                      { val: 250, unit: 'ml', label: '250 ml' },
                      { val: 500, unit: 'ml', label: '500 ml' },
                      { val: 750, unit: 'ml', label: '750 ml' },
                      { val: 1000, unit: 'ml', label: '1 Litre' },
                      { val: 250, unit: 'gm', label: '250 gm' },
                      { val: 500, unit: 'gm', label: '500 gm' },
                      { val: 750, unit: 'gm', label: '750 gm' },
                      { val: 1, unit: 'kg', label: '1 kg' },
                      { val: 2, unit: 'pcs', label: '2 Pcs' },
                      { val: 4, unit: 'pcs', label: '4 Pcs' },
                      { val: 8, unit: 'pcs', label: '8 Pcs' },
                      { val: 1, unit: 'Plate', label: '1 Plate' },
                      { val: 1, unit: 'Half', label: 'Half Plate' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setDishPortionValue(preset.val);
                          setDishPortionUnit(preset.unit);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                          dishPortionValue === preset.val && dishPortionUnit === preset.unit
                            ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Menu Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Other">+ Create New Category...</option>
                  </select>

                  {dishCategory === 'Other' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter new custom category name..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2 w-full px-3.5 py-2 bg-slate-50 border border-orange-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-900"
                    />
                  )}
                </div>

                {/* Dietary Flag (Veg / Non-Veg) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Dietary Classification</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDishIsVeg(true)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        dishIsVeg
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span>Vegetarian (Veg)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDishIsVeg(false)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        !dishIsVeg
                          ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                      <span>Non-Vegetarian</span>
                    </button>
                  </div>
                </div>

                {/* Prep Time & Availability */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kitchen Prep Time (mins)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="15"
                      value={dishPrepTime}
                      onChange={(e) => setDishPrepTime(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stock Status</label>
                    <select
                      value={dishIsAvailable ? 'IN_STOCK' : 'OUT_OF_STOCK'}
                      onChange={(e) => setDishIsAvailable(e.target.value === 'IN_STOCK')}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="IN_STOCK">🟢 In Stock (Available for POS)</option>
                      <option value="OUT_OF_STOCK">🚫 86&apos;d (Out of Stock)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Description */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description / Recipe Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of flavors, ingredients, or allergens..."
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDishModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md transition"
                  >
                    {editingItem ? 'Save Changes' : 'Publish Dish to Menu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: ADD COMBO OFFER                                         */}
        {/* ============================================================== */}
        {isAddComboModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-slate-800 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎁</span>
                  <h3 className="font-bold text-lg text-slate-900">Create New Combo Offer</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddComboModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCombo} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Combo Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Biryani & Kebab Weekend Duo"
                    value={comboTitle}
                    onChange={(e) => setComboTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Items Included in Combo</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1x Chicken Biryani + 1x Chicken 65 + 2x Cold Drinks"
                    value={comboItemsText}
                    onChange={(e) => setComboItemsText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Combo Offer Price (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="499"
                      value={comboPrice}
                      onChange={(e) => setComboPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      placeholder="620"
                      value={comboOrigPrice}
                      onChange={(e) => setComboOrigPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Tag Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Save ₹121 or 20% OFF"
                    value={comboBadge}
                    onChange={(e) => setComboBadge(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddComboModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md"
                  >
                    Publish Combo Deal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
