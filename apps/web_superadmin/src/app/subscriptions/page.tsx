'use client';

import React, { useState } from 'react';
import SuperSidebar from '@/components/SuperSidebar';

export default function SubscriptionsPage() {
  const [activePlanCategory, setActivePlanCategory] = useState<'ALL' | 'BASE' | 'OPERATIONS' | 'MARKETING'>('ALL');
  const [selectedPlanModal, setSelectedPlanModal] = useState<string | null>(null);

  // 1. BASE PLAN FEATURES
  const basePlanFeatures = [
    'Cloud Billing',
    'Customized Reporting Module (Dynamic Reports)',
    'Inventory',
    'Menu Management',
    '90+ Reports',
    'Food Aggregators Integrations',
    'Unlimited Users & Terminals',
    'Purchase Manager - Integrations with Hyperpure, Swiggy Assure & DeliverIT (DIY)',
    'Smart-Stock Manager',
    'AI Agent (Unlimited queries)',
    'Installation & Training* (Online)',
    'Support 24x7 (Online)',
  ];

  // 2. OPERATIONS MANAGER COMPARISON
  const operationsRows = [
    { feature: 'Base Plan', growth: '✓', scale: '✓' },
    { feature: 'Captain App', growth: '✓', scale: '✓' },
    { feature: 'Token Management', growth: '✓', scale: '✓' },
    { feature: 'Zomato/Swiggy Reconciliation', growth: '✓', scale: '✓' },
    { feature: 'Tally Integration', growth: '✓', scale: '✓' },
    { feature: 'Scan & QR Order', growth: '✓', scale: '✓' },
    { feature: 'Waiter Calling System (AMC)', growth: '✓', scale: '✓' },
    { feature: 'Kitchen Display System', growth: '✓', scale: '✓' },
    { feature: 'API Integration', growth: '✓', scale: '✓' },
    { feature: 'SAP/ERP Integration', growth: '✓', scale: '✓' },
    { feature: 'Call Centre Module', growth: '✓', scale: '✓' },
    { feature: 'Table Reservation Manager (TRM)', growth: '✕', scale: '✓' },
    { feature: 'Kiosk Software', growth: '✕', scale: '✓' },
    { feature: 'E-Invoice', growth: '✕', scale: '1000 Credits' },
    { feature: 'Installation & Training*', growth: '1/visit', scale: '2/visit' },
  ];

  // 3. MARKETING MANAGER COMPARISON
  const marketingRows = [
    { feature: 'Base Plan', core: '✓', growth: '✓', scale: '✓' },
    { feature: 'CRM + Loyalty', core: '✓', growth: '✓', scale: '✓' },
    { feature: 'Virtual Wallet', core: '✓', growth: '✓', scale: '✓' },
    { feature: 'Feedback App / QR', core: '✓', growth: '✓', scale: '✓' },
    { feature: 'Reputation Management', core: '✓', growth: '✓', scale: '✓' },
    { feature: 'E-Bill', core: '✓', growth: '✓', scale: '✓' },
    { feature: 'WABA', core: '4,000 Credits', growth: '8,000 Credits', scale: '10,000 Credits' },
    { feature: 'AI Marketing Agent', core: '✓', growth: '✓', scale: '✓' },
    { feature: 'My Website / OOW', core: '✕', growth: '✓', scale: '✓' },
    { feature: 'Digital Display', core: '✕', growth: '✓', scale: '✓' },
    { feature: 'Meta Ads or 2 Influencers', core: '✕', growth: '✕', scale: '✓' },
  ];

  const renderValue = (val: string) => {
    if (val === '✓') {
      return <span className="text-rose-500 font-extrabold text-base leading-none">✓</span>;
    }
    if (val === '✕') {
      return <span className="text-slate-500 text-xs font-semibold">✕</span>;
    }
    return (
      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-slate-200 border border-slate-700 whitespace-nowrap">
        {val}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <SuperSidebar activeTab="subscriptions" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto pb-24">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">SaaS Plans &amp; Feature Comparison</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider font-mono">
                Petpooja Standard Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Complete restaurant software pricing breakdown across Base Plan, Operations Suite, and Marketing Automation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Pricing catalogue exported successfully as official PDF!')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition shadow-sm"
            >
              Export Pricing PDF
            </button>
            <button
              onClick={() => setSelectedPlanModal('Custom Enterprise Franchise')}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
            >
              + Create Custom Quote
            </button>
          </div>
        </header>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800/80 rounded-2xl p-4 my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0 border border-rose-500/30">
              ₹
            </span>
            <div>
              <span className="font-bold text-white">All prices mentioned are per outlet / annum (ex. taxes).</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Dynamic reporting, GST billing, KOT, and 24x7 online support included by default in all tiers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
            <span>Billing Cycle:</span>
            <span className="text-emerald-400 font-bold">Annual (12 Months)</span>
          </div>
        </div>

        {/* 3-CARD PRICING MATRIX GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* ============================================================== */}
          {/* CARD 1: BASE PLAN (col-span-3)                                 */}
          {/* ============================================================== */}
          <div className="xl:col-span-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              {/* Header block with dark slate */}
              <div className="bg-slate-900 border-b border-slate-800 p-5 text-center">
                <h2 className="text-lg font-black text-white">Base Plan</h2>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Everything you need to run your restaurant efficiently.
                </p>
              </div>

              {/* Subheader */}
              <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 text-xs font-bold text-slate-300">
                Features
              </div>

              {/* Feature Rows */}
              <div className="divide-y divide-slate-800/60 text-xs">
                {basePlanFeatures.map((feat, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-800/30 transition">
                    <span className="text-rose-500 font-extrabold text-sm shrink-0 mt-0.5">✓</span>
                    <span className="text-slate-200 text-[11px] leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Price Block */}
            <div className="p-5 bg-slate-900/95 border-t border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Price (ex tax)*
              </div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                ₹12,000<span className="text-xs text-rose-400 font-bold">*</span>
              </div>
              <button
                onClick={() => setSelectedPlanModal('Base Plan (₹12,000/yr)')}
                className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition"
              >
                Select Base Plan
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CARD 2: OPERATIONS MANAGER (col-span-4)                         */}
          {/* ============================================================== */}
          <div className="xl:col-span-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              {/* Header block */}
              <div className="bg-slate-900 border-b border-slate-800 p-5 text-center">
                <h2 className="text-lg font-black text-white">Operations Manager</h2>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Power up your restaurant operations with advanced tools.
                </p>
              </div>

              {/* Table with Growth & Scale */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/40 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-300 w-1/2">Features</th>
                      <th className="px-3 py-3 text-center font-bold text-rose-500">Growth</th>
                      <th className="px-3 py-3 text-center font-bold text-rose-500">Scale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {operationsRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-2.5 text-slate-200 font-medium leading-snug">
                          {row.feature}
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium">
                          {renderValue(row.growth)}
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium">
                          {renderValue(row.scale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Price Block */}
            <div className="p-5 bg-slate-900/95 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider text-center">
                Price (ex tax)*
              </div>
              <div className="grid grid-cols-2 gap-3 mt-1.5 text-center">
                <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Growth</span>
                  <span className="text-base font-black text-white font-mono mt-0.5 block">₹20,000*</span>
                  <button
                    onClick={() => setSelectedPlanModal('Operations Manager - Growth (₹20,000/yr)')}
                    className="mt-2 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg border border-slate-700 transition"
                  >
                    Select
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950/70 rounded-xl border border-rose-500/30 ring-1 ring-rose-500/20">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Scale</span>
                  <span className="text-base font-black text-white font-mono mt-0.5 block">₹30,000*</span>
                  <button
                    onClick={() => setSelectedPlanModal('Operations Manager - Scale (₹30,000/yr)')}
                    className="mt-2 w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg transition"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CARD 3: MARKETING MANAGER (col-span-5)                          */}
          {/* ============================================================== */}
          <div className="xl:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              {/* Header block */}
              <div className="bg-slate-900 border-b border-slate-800 p-5 text-center">
                <h2 className="text-lg font-black text-white">Marketing Manager</h2>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Build stronger relationships and grow your brand.
                </p>
              </div>

              {/* Table with Core, Growth & Scale */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/40 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-300 w-2/5">Features</th>
                      <th className="px-2 py-3 text-center font-bold text-rose-500">Core</th>
                      <th className="px-2 py-3 text-center font-bold text-rose-500">Growth</th>
                      <th className="px-2 py-3 text-center font-bold text-rose-500">Scale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {marketingRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-2.5 text-slate-200 font-medium leading-snug">
                          {row.feature}
                        </td>
                        <td className="px-2 py-2.5 text-center font-medium">
                          {renderValue(row.core)}
                        </td>
                        <td className="px-2 py-2.5 text-center font-medium">
                          {renderValue(row.growth)}
                        </td>
                        <td className="px-2 py-2.5 text-center font-medium">
                          {renderValue(row.scale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Price Block */}
            <div className="p-5 bg-slate-900/95 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider text-center">
                Price (ex tax)*
              </div>
              <div className="grid grid-cols-3 gap-2.5 mt-1.5 text-center">
                <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">Core</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">₹10,000*</span>
                  <button
                    onClick={() => setSelectedPlanModal('Marketing Manager - Core (₹10,000/yr)')}
                    className="mt-2 w-full py-1 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-bold rounded-lg border border-slate-700 transition"
                  >
                    Select
                  </button>
                </div>
                <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">Growth</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">₹20,000*</span>
                  <button
                    onClick={() => setSelectedPlanModal('Marketing Manager - Growth (₹20,000/yr)')}
                    className="mt-2 w-full py-1 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-bold rounded-lg border border-slate-700 transition"
                  >
                    Select
                  </button>
                </div>
                <div className="p-2 bg-slate-950/70 rounded-xl border border-rose-500/30 ring-1 ring-rose-500/20">
                  <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">Scale</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">₹30,000*</span>
                  <button
                    onClick={() => setSelectedPlanModal('Marketing Manager - Scale (₹30,000/yr)')}
                    className="mt-2 w-full py-1 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold rounded-lg transition"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal: Selected Plan */}
        {selectedPlanModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base text-white">Subscribe Tenant to Plan</h3>
                <button
                  onClick={() => setSelectedPlanModal(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Selected SaaS Package:</span>
                <div className="font-bold text-rose-400 text-sm mt-0.5">{selectedPlanModal}</div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase">Select Target Restaurant Chain</label>
                <select className="mt-1.5 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500">
                  <option value="t-1">Biryani Express Cloud Kitchens (6 Outlets)</option>
                  <option value="t-2">Rolls &amp; Bowls Co. (3 Outlets)</option>
                  <option value="t-3">The Kebab &amp; Tikka House (2 Outlets)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPlanModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Plan "${selectedPlanModal}" activated successfully for tenant! Database license key regenerated.`);
                    setSelectedPlanModal(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Confirm &amp; Generate Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
