'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function ReportsAndAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH'>('TODAY');
  const [outletFilter, setOutletFilter] = useState<'ALL' | 'INDIRANAGAR' | 'WHITEFIELD'>('ALL');

  const grossSales = 48250;
  const discounts = 2298;
  const taxableValue = 45952;
  const cgst = 1149;
  const sgst = 1149;
  const netSales = taxableValue + cgst + sgst;
  const totalOrders = 112;
  const aov = Math.round(netSales / totalOrders);

  const paymentBreakdown = [
    { mode: 'UPI (QR / PhonePe / GPay)', amount: 28150, percentage: 58.3, color: 'bg-emerald-500' },
    { mode: 'Cash', amount: 13400, percentage: 27.8, color: 'bg-amber-500' },
    { mode: 'Credit / Debit Cards (EDC)', amount: 6700, percentage: 13.9, color: 'bg-blue-500' },
  ];

  const topDishes = [
    { name: 'Royal Chicken Dum Biryani', category: 'Biryani', qty: 62, revenue: 17980, margin: '72%' },
    { name: 'Special Mutton Dum Biryani', category: 'Biryani', qty: 48, revenue: 18240, margin: '68%' },
    { name: 'Chicken 65 (Crispy Andhra)', category: 'Starters', qty: 34, revenue: 8840, margin: '74%' },
    { name: 'Butter Naan', category: 'Breads', qty: 92, revenue: 4600, margin: '85%' },
    { name: 'Hot Gulab Jamun (2 Pcs)', category: 'Desserts', qty: 30, revenue: 2400, margin: '78%' },
    { name: 'Nawabi Paneer Dum Biryani', category: 'Biryani', qty: 18, revenue: 4320, margin: '70%' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar activeTab="reports" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>📈 Petpooja Financial &amp; GST Analytics</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                GSTR-1 Ready
              </span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Multi-outlet revenue audit, tax liability ledger, tender breakdown &amp; dish profitability
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-xs font-bold text-slate-600">
              {(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'THIS_MONTH'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateRange === r ? 'bg-orange-600 text-white shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  {r === 'TODAY' && 'Today'}
                  {r === 'YESTERDAY' && 'Yesterday'}
                  {r === 'LAST_7_DAYS' && '7 Days'}
                  {r === 'THIS_MONTH' && 'This Month'}
                </button>
              ))}
            </div>

            <button
              onClick={() => alert('Exporting GSTR-1 & Sales Ledger in CSV format...')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
            >
              <span>📥 Export GST CSV</span>
            </button>
          </div>
        </header>

        {/* Executive KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Revenue</span>
            <div className="text-3xl font-black text-slate-900 mt-2">₹{netSales.toLocaleString()}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Gross: ₹{grossSales.toLocaleString()}</span>
              <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">+18.2%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total GST Collected</span>
            <div className="text-3xl font-black text-orange-600 mt-2">₹{(cgst + sgst).toLocaleString()}</div>
            <div className="mt-2 text-xs text-slate-500">
              CGST: ₹{cgst.toLocaleString()} | SGST: ₹{sgst.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Orders &amp; AOV</span>
            <div className="text-3xl font-black text-blue-600 mt-2">{totalOrders} Bills</div>
            <div className="mt-2 text-xs text-slate-500">
              Avg Order Value: <strong className="text-slate-800 font-bold">₹{aov}</strong>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Discounts Given</span>
            <div className="text-3xl font-black text-purple-600 mt-2">₹{discounts.toLocaleString()}</div>
            <div className="mt-2 text-xs text-slate-500">
              Coupons + Owner Comp: <strong className="text-slate-800">4.7% of GMV</strong>
            </div>
          </div>
        </section>

        {/* 2-Column Split: Payment Tender Analysis vs Hourly Heatmap */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Tender Breakdown (6 Cols) */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-lg text-slate-900 pb-3 border-b border-slate-100">
              💳 Payment Mode &amp; Tender Distribution
            </h3>

            <div className="mt-6 space-y-5">
              {paymentBreakdown.map((item) => (
                <div key={item.mode}>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-800 mb-1.5">
                    <span>{item.mode}</span>
                    <span>₹{item.amount.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Settled Collections:</span>
              <span className="font-extrabold text-sm text-slate-900">₹{netSales.toLocaleString()}</span>
            </div>
          </div>

          {/* Right: Hourly Rush Heatmap (6 Cols) */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-lg text-slate-900 pb-3 border-b border-slate-100">
              🕒 Rush Hour Sales Heatmap
            </h3>

            <div className="mt-5 space-y-3">
              {[
                { slot: '12:00 PM – 02:00 PM (Lunch Rush 1)', orders: 38, revenue: 16400, pct: 85 },
                { slot: '02:00 PM – 04:00 PM (Lunch Rush 2)', orders: 24, revenue: 9800, pct: 55 },
                { slot: '04:00 PM – 07:00 PM (Tea & Snacks)', orders: 12, revenue: 3600, pct: 25 },
                { slot: '07:00 PM – 09:30 PM (Dinner Peak)', orders: 42, revenue: 18450, pct: 95 },
              ].map((slot) => (
                <div key={slot.slot} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>{slot.slot}</span>
                    <span className="text-orange-600">₹{slot.revenue.toLocaleString()} ({slot.orders} orders)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${slot.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GSTR-1 Tax Ledger Table */}
        <section className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-lg text-slate-900">Official GSTR-1 Tax Ledger</h3>
              <p className="text-xs text-slate-500">
                Statutory GST audit trail under Section 9(1) of CGST Act (Restaurant 5% Composite/Regular)
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              GSTIN: 29AABCU9603R1ZM
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice Period</th>
                  <th className="py-3 px-4">Branch / Outlet</th>
                  <th className="py-3 px-4 text-center">Billed Invoices</th>
                  <th className="py-3 px-4 text-right">Taxable Turnover (₹)</th>
                  <th className="py-3 px-4 text-right">CGST @ 2.5% (₹)</th>
                  <th className="py-3 px-4 text-right">SGST @ 2.5% (₹)</th>
                  <th className="py-3 px-4 text-right">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Today (Live)</td>
                  <td className="py-3.5 px-4">Indiranagar Flagship (BLR-IND-01)</td>
                  <td className="py-3.5 px-4 text-center font-mono">76</td>
                  <td className="py-3.5 px-4 text-right font-mono">₹30,857.14</td>
                  <td className="py-3.5 px-4 text-right font-mono text-orange-600">₹771.43</td>
                  <td className="py-3.5 px-4 text-right font-mono text-orange-600">₹771.43</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">₹1,542.86</td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Today (Live)</td>
                  <td className="py-3.5 px-4">Whitefield ITPL (BLR-WHF-01)</td>
                  <td className="py-3.5 px-4 text-center font-mono">36</td>
                  <td className="py-3.5 px-4 text-right font-mono">₹15,095.24</td>
                  <td className="py-3.5 px-4 text-right font-mono text-orange-600">₹377.38</td>
                  <td className="py-3.5 px-4 text-right font-mono text-orange-600">₹377.38</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">₹754.76</td>
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="py-3 px-4" colSpan={2}>CONSOLIDATED TOTAL</td>
                  <td className="py-3 px-4 text-center font-mono font-black">{totalOrders}</td>
                  <td className="py-3 px-4 text-right font-mono">₹{taxableValue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono text-orange-600">₹{cgst.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono text-orange-600">₹{sgst.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">₹{(cgst + sgst).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Top-Selling Dishes Table */}
        <section className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-black text-lg text-slate-900">Top-Selling Dishes &amp; Profitability</h3>
            <span className="text-xs text-slate-500">Sorted by Volume &amp; Revenue</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Dish Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Portions Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topDishes.map((dish) => (
                  <tr key={dish.name} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{dish.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {dish.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{dish.qty}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{dish.revenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{dish.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
