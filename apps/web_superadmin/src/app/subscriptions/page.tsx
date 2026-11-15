'use client';

import React, { useState } from 'react';
import SuperSidebar from '@/components/SuperSidebar';

interface PlanDetail {
  id: string;
  name: string;
  priceMonthly: number;
  outletsLimit: number;
  features: string[];
  activeTenantsCount: number;
  badge?: string;
}

const PLANS: PlanDetail[] = [
  {
    id: 'plan-starter',
    name: 'Starter Plan',
    priceMonthly: 1499,
    outletsLimit: 1,
    activeTenantsCount: 20,
    features: ['1 Outlet', 'POS Fast Billing', 'QR Contactless Menu', 'Daily Sales Report', 'Digital WhatsApp e-Bill'],
  },
  {
    id: 'plan-pro',
    name: 'Pro Growth Plan',
    priceMonthly: 2999,
    outletsLimit: 3,
    activeTenantsCount: 48,
    badge: 'Most Popular',
    features: ['Up to 3 Outlets', 'POS + Kitchen KDS', 'Raw Inventory & GRN', 'Captain Mobile App', 'Split & Merge Bill', 'Table Designer'],
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Cloud Kitchen',
    priceMonthly: 5999,
    outletsLimit: 15,
    activeTenantsCount: 74,
    badge: 'High Value',
    features: ['Unlimited Outlets', 'Multi-Brand Aggregators (Zomato/Swiggy)', 'AI Sales Forecasting', 'Recipe Costing & Yield', 'Franchise Central Inventory', 'Priority 24/7 SLA'],
  },
];

export default function SubscriptionsPage() {
  const [plans] = useState<PlanDetail[]>(PLANS);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <SuperSidebar activeTab="subscriptions" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">SaaS Plans, Pricing &amp; Billing</h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure subscription tiers, monthly pricing, feature entitlements, and payment gateway webhooks.
            </p>
          </div>
        </header>

        {/* Pricing Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between shadow-2xl relative ${
                p.badge
                  ? 'bg-gradient-to-b from-slate-900 to-slate-900/90 border-orange-500/60 ring-1 ring-orange-500/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
                  {p.badge}
                </span>
              )}

              <div>
                <h3 className="font-bold text-lg text-white">{p.name}</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-3xl font-black text-white font-mono">₹{p.priceMonthly.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{p.outletsLimit === 15 ? 'Unlimited Outlets' : `Up to ${p.outletsLimit} Outlets`}</p>

                <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{p.activeTenantsCount} Active Tenants</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{(p.priceMonthly * p.activeTenantsCount).toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
