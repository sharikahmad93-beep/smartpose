'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface StockItem {
  id: string;
  name: string;
  category: 'Grains & Rice' | 'Meat & Poultry' | 'Dairy' | 'Spices & Oils' | 'Packaging';
  currentStock: number;
  unit: string;
  minThreshold: number;
  unitCost: number;
  lastSuppliedDate: string;
  vendorName: string;
  status: 'OPTIMAL' | 'LOW_STOCK' | 'CRITICAL';
}

interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  vendor: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'CREDIT' | 'PARTIAL';
}

const INITIAL_INVENTORY: StockItem[] = [
  { id: 'inv-1', name: 'Daawat Devaaya Basmati Rice (XXL)', category: 'Grains & Rice', currentStock: 120, unit: 'kg', minThreshold: 40, unitCost: 110, lastSuppliedDate: '12 Nov 2026', vendorName: 'Metro Cash & Carry', status: 'OPTIMAL' },
  { id: 'inv-2', name: 'Fresh Farm Broiler Chicken (Curry Cut)', category: 'Meat & Poultry', currentStock: 18, unit: 'kg', minThreshold: 25, unitCost: 180, lastSuppliedDate: '14 Nov 2026', vendorName: 'FreshToHome Wholesale', status: 'LOW_STOCK' },
  { id: 'inv-3', name: 'Fresh Tender Baby Mutton (Biryani Cut)', category: 'Meat & Poultry', currentStock: 4, unit: 'kg', minThreshold: 15, unitCost: 650, lastSuppliedDate: '13 Nov 2026', vendorName: 'Bengaluru Meat Traders', status: 'CRITICAL' },
  { id: 'inv-4', name: 'Malai Paneer Block (Fresh)', category: 'Dairy', currentStock: 22, unit: 'kg', minThreshold: 10, unitCost: 320, lastSuppliedDate: '14 Nov 2026', vendorName: 'Mother Dairy B2B', status: 'OPTIMAL' },
  { id: 'inv-5', name: 'Pure Desi Cow Ghee (Tins)', category: 'Dairy', currentStock: 35, unit: 'Ltr', minThreshold: 15, unitCost: 580, lastSuppliedDate: '10 Nov 2026', vendorName: 'Nandini Dairy Coop', status: 'OPTIMAL' },
  { id: 'inv-6', name: 'Kashmir Mogra Saffron (Kesar)', category: 'Spices & Oils', currentStock: 12, unit: 'gm', minThreshold: 30, unitCost: 280, lastSuppliedDate: '01 Nov 2026', vendorName: 'Royal Spice Importers', status: 'CRITICAL' },
  { id: 'inv-7', name: 'Royal Biryani Whole Spice Blend', category: 'Spices & Oils', currentStock: 14, unit: 'kg', minThreshold: 10, unitCost: 440, lastSuppliedDate: '08 Nov 2026', vendorName: 'MDH Wholesale', status: 'OPTIMAL' },
  { id: 'inv-8', name: 'Heavy Double-Wall Biryani Handi (Boxes)', category: 'Packaging', currentStock: 450, unit: 'Pcs', minThreshold: 150, unitCost: 14, lastSuppliedDate: '11 Nov 2026', vendorName: 'PackPro Food Containers', status: 'OPTIMAL' },
  { id: 'inv-9', name: 'Clay Kulhads (Matka Chai & Phirni)', category: 'Packaging', currentStock: 60, unit: 'Pcs', minThreshold: 100, unitCost: 4.5, lastSuppliedDate: '05 Nov 2026', vendorName: 'Khurja Pottery Depot', status: 'LOW_STOCK' },
];

const INITIAL_PURCHASES: PurchaseInvoice[] = [
  { id: 'p-101', invoiceNo: 'INV-2026-904', vendor: 'FreshToHome Wholesale', date: '14 Nov 2026', itemsCount: 3, totalAmount: 14200, paymentStatus: 'PAID' },
  { id: 'p-102', invoiceNo: 'MTR-88192', vendor: 'Metro Cash & Carry', date: '12 Nov 2026', itemsCount: 8, totalAmount: 32450, paymentStatus: 'PAID' },
  { id: 'p-103', invoiceNo: 'NDN-0412', vendor: 'Nandini Dairy Coop', date: '10 Nov 2026', itemsCount: 2, totalAmount: 18560, paymentStatus: 'CREDIT' },
  { id: 'p-104', invoiceNo: 'PCK-771', vendor: 'PackPro Food Containers', date: '11 Nov 2026', itemsCount: 4, totalAmount: 9800, paymentStatus: 'PAID' },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<StockItem[]>(INITIAL_INVENTORY);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(INITIAL_PURCHASES);
  const [activeTab, setActiveTab] = useState<'stock' | 'purchases' | 'wastage'>('stock');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [selectedStockForWastage, setSelectedStockForWastage] = useState<StockItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Purchase Form state
  const [newVendor, setNewVendor] = useState('Metro Cash & Carry');
  const [newInvoiceNo, setNewInvoiceNo] = useState('');
  const [newTotalAmount, setNewTotalAmount] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState<'PAID' | 'CREDIT'>('PAID');

  // Wastage state
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('Expired / Spoiled');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.currentStock * item.unitCost, 0);
  const lowStockCount = inventory.filter((i) => i.status !== 'OPTIMAL').length;

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceNo || !newTotalAmount) return;

    const newInvoice: PurchaseInvoice = {
      id: `p-${Date.now()}`,
      invoiceNo: newInvoiceNo,
      vendor: newVendor,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      itemsCount: 1,
      totalAmount: parseFloat(newTotalAmount),
      paymentStatus: newPaymentStatus,
    };

    setPurchases([newInvoice, ...purchases]);
    setShowPurchaseModal(false);
    setNewInvoiceNo('');
    setNewTotalAmount('');
    showToast(`Purchase Invoice ${newInvoice.invoiceNo} logged successfully! Stock updated.`);
  };

  const handleLogWastage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForWastage || !wasteQty) return;

    const qty = parseFloat(wasteQty);
    setInventory((prev) =>
      prev.map((item) =>
        item.id === selectedStockForWastage.id
          ? {
              ...item,
              currentStock: Math.max(0, item.currentStock - qty),
              status: item.currentStock - qty <= item.minThreshold ? 'LOW_STOCK' : 'OPTIMAL',
            }
          : item
      )
    );

    setShowWastageModal(false);
    setWasteQty('');
    showToast(`Wastage of ${qty} ${selectedStockForWastage.unit} logged for ${selectedStockForWastage.name}!`);
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="inventory" />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory & Raw Materials</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                Live Stock Sync
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Recipe consumption, raw ingredients, vendor purchases (GRN) and low-stock alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-orange-600/20 transition active:scale-95"
            >
              <span>+ Add Purchase (GRN)</span>
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-emerald-500 flex items-center gap-2 animate-bounce">
            <span>✅</span>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Total Stock Asset Value</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900">₹{totalInventoryValue.toLocaleString('en-IN')}</h3>
              <span className="text-xs font-semibold text-emerald-600">Optimal</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Across 9 raw ingredients & packaging items</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Low Stock / Reorder Alerts</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-red-600">{lowStockCount} Items</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800">Action Needed</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Mutton Cuts (4 kg), Saffron (12 gm)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Monthly Purchase Invoices</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900">₹75,010</h3>
              <span className="text-xs font-semibold text-slate-500">4 Vendors</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">₹18,560 currently in credit balance</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Kitchen Wastage Rate</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-emerald-600">1.2%</h3>
              <span className="text-xs font-semibold text-emerald-600">Low & Controlled</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Industry standard benchmark: &lt; 3.0%</p>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-bold text-sm text-amber-900">Low Raw Material Alert Detected!</h4>
                <p className="text-xs text-amber-700">
                  Mutton, Chicken, and Saffron stocks have dropped below kitchen minimum prep thresholds. Order now to prevent kitchen stockout during peak dinner service.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                showToast('Automatic Purchase Order (PO) draft generated and sent to Vendors!');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
            >
              ⚡ Auto-Generate PO to Vendors
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-6">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'stock'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📦 Raw Material Stock ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'purchases'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🧾 Purchase Invoices (GRN)
          </button>
        </div>

        {/* TAB 1: STOCK LEDGER */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                {['ALL', 'Grains & Rice', 'Meat & Poultry', 'Dairy', 'Spices & Oils', 'Packaging'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      categoryFilter === cat
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search raw material or vendor..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Raw Material / Item</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Current Stock</th>
                      <th className="px-5 py-3.5">Threshold Alert</th>
                      <th className="px-5 py-3.5">Unit Cost</th>
                      <th className="px-5 py-3.5">Asset Value</th>
                      <th className="px-5 py-3.5">Preferred Vendor</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item) => {
                      const isCritical = item.status === 'CRITICAL';
                      const isLow = item.status === 'LOW_STOCK';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">{item.category}</td>
                          <td className="px-5 py-3.5 font-mono font-bold text-sm text-slate-900">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-mono">
                            Min {item.minThreshold} {item.unit}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-700">
                            ₹{item.unitCost} / {item.unit}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                            ₹{(item.currentStock * item.unitCost).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">{item.vendorName}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                isCritical
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isCritical ? '🔴 CRITICAL' : isLow ? '🟡 LOW STOCK' : '🟢 IN STOCK'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedStockForWastage(item);
                                setShowWastageModal(true);
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                            >
                              Log Waste
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PURCHASES / GRN */}
        {activeTab === 'purchases' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Vendor Purchase Orders & Goods Received Notes</h3>
                <p className="text-xs text-slate-500">Every purchase automatically credits raw material stocks.</p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-3.5 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 shadow-sm"
              >
                + New Purchase Entry
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Vendor Name</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Payment Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{p.invoiceNo}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{p.vendor}</td>
                    <td className="px-5 py-3.5 text-slate-500">{p.date}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.itemsCount} Items</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      ₹{p.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => showToast(`Invoice ${p.invoiceNo} receipt exported!`)}
                        className="text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL: ADD PURCHASE ENTRY */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">New Goods Received Note (GRN Purchase)</h3>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePurchase} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Supplier / Vendor</label>
                  <select
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Metro Cash & Carry">Metro Cash & Carry (Groceries & Staples)</option>
                    <option value="FreshToHome Wholesale">FreshToHome Wholesale (Poultry & Meat)</option>
                    <option value="Mother Dairy B2B">Mother Dairy B2B (Milk, Cream, Paneer)</option>
                    <option value="Nandini Dairy Coop">Nandini Dairy Coop (Pure Cow Ghee)</option>
                    <option value="Royal Spice Importers">Royal Spice Importers (Kesar & Spices)</option>
                    <option value="PackPro Food Containers">PackPro Food Containers (Boxes & Bags)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Vendor Invoice / Bill #</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MTR-2026-991"
                      value={newInvoiceNo}
                      onChange={(e) => setNewInvoiceNo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Total Bill Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 18500"
                      value={newTotalAmount}
                      onChange={(e) => setNewTotalAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method / Status</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                      <input
                        type="radio"
                        checked={newPaymentStatus === 'PAID'}
                        onChange={() => setNewPaymentStatus('PAID')}
                      />
                      <span>Paid Immediately (Cash / Bank)</span>
                    </label>
                    <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                      <input
                        type="radio"
                        checked={newPaymentStatus === 'CREDIT'}
                        onChange={() => setNewPaymentStatus('CREDIT')}
                      />
                      <span>Supplier Credit (Pending Settlement)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPurchaseModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20"
                  >
                    Save & Update Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: LOG WASTAGE */}
        {showWastageModal && selectedStockForWastage && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Log Kitchen Spoilage / Wastage</h3>
                <button
                  onClick={() => setShowWastageModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleLogWastage} className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500">Item:</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedStockForWastage.name}</p>
                  <p className="text-[11px] text-slate-400">Available: {selectedStockForWastage.currentStock} {selectedStockForWastage.unit}</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wasted Quantity ({selectedStockForWastage.unit})</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder={`e.g. 1.5 ${selectedStockForWastage.unit}`}
                    value={wasteQty}
                    onChange={(e) => setWasteQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason for Wastage</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Expired / Spoiled">Expired / Shelf Life Exceeded</option>
                    <option value="Kitchen Preparation Spillage">Kitchen Preparation Spillage</option>
                    <option value="Burnt in Tandoor / Pot">Burnt in Tandoor / Handi</option>
                    <option value="Quality Inspection Rejection">Quality Inspection Rejection</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWastageModal(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Deduct Stock
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
