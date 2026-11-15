'use client';

import React, { useState } from 'react';
import SuperSidebar from '@/components/SuperSidebar';

interface RestaurantTenant {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  outletsCount: number;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  mrrAmount: number;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  joinedDate: string;
}

const INITIAL_TENANTS: RestaurantTenant[] = [
  { id: 't-1', name: 'Biryani Express Cloud Kitchens', ownerName: 'Vikramaditya Rao', phone: '+91 98450 11223', outletsCount: 6, plan: 'Enterprise', mrrAmount: 18000, status: 'ACTIVE', joinedDate: '12 Jan 2026' },
  { id: 't-2', name: 'Rolls & Bowls Co.', ownerName: 'Sameer Sen', phone: '+91 99120 44551', outletsCount: 3, plan: 'Pro', mrrAmount: 8997, status: 'ACTIVE', joinedDate: '04 Feb 2026' },
  { id: 't-3', name: 'The Kebab & Tikka House', ownerName: 'Ananya Sharma', phone: '+91 97722 33110', outletsCount: 2, plan: 'Pro', mrrAmount: 5998, status: 'ACTIVE', joinedDate: '18 Mar 2026' },
  { id: 't-4', name: 'Chai & Mithaas Artisan Cafe', ownerName: 'Rahul Mehta', phone: '+91 98110 99887', outletsCount: 1, plan: 'Starter', mrrAmount: 1499, status: 'TRIAL', joinedDate: '10 Nov 2026' },
  { id: 't-5', name: 'Punjab Grill & Curry Central', ownerName: 'Harpreet Singh', phone: '+91 99881 22334', outletsCount: 4, plan: 'Enterprise', mrrAmount: 12000, status: 'ACTIVE', joinedDate: '22 Apr 2026' },
  { id: 't-6', name: 'Coastal Spice Seafood Shack', ownerName: 'Kiran Kamath', phone: '+91 97330 66778', outletsCount: 2, plan: 'Pro', mrrAmount: 5998, status: 'SUSPENDED', joinedDate: '15 May 2026' },
];

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<RestaurantTenant[]>(INITIAL_TENANTS);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPlan, setNewPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOnboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName || !newOwner) return;

    const newTenant: RestaurantTenant = {
      id: `t-${Date.now()}`,
      name: newBrandName,
      ownerName: newOwner,
      phone: newPhone || '+91 98000 00000',
      outletsCount: 1,
      plan: newPlan,
      mrrAmount: newPlan === 'Enterprise' ? 5999 : newPlan === 'Pro' ? 2999 : 1499,
      status: 'ACTIVE',
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setTenants([newTenant, ...tenants]);
    setShowOnboardModal(false);
    setNewBrandName('');
    setNewOwner('');
    setNewPhone('');
    showToast(`New Tenant "${newTenant.name}" onboarded successfully! Dedicated database tenant provisioned.`);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <SuperSidebar activeTab="dashboard" />

      <main className="flex-1 p-8 overflow-y-auto pb-24">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">SaaS Platform Executive Dashboard</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                Multi-Tenant SaaS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Petpooja-scale cloud architecture. Manage tenants, subscriptions, payment collection, and global feature flags.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOnboardModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-600/30 transition active:scale-95"
            >
              <span>+ Onboard New Restaurant Brand</span>
            </button>
          </div>
        </header>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-emerald-500 flex items-center gap-2 animate-bounce">
            <span>✅</span>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Global SaaS Platform Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
            <span className="text-xs font-medium text-slate-400">Monthly Recurring Revenue (MRR)</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-black text-white font-mono">₹14,82,500</h3>
              <span className="text-xs font-bold text-emerald-400">+22.4% MoM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Annualized Run Rate (ARR): ₹1.77 Cr</p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
            <span className="text-xs font-medium text-slate-400">Total Active Tenants / Brands</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-black text-white font-mono">142 Brands</h3>
              <span className="text-xs font-bold text-amber-400">389 Outlets</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Average 2.7 outlets per restaurant brand</p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
            <span className="text-xs font-medium text-slate-400">Platform GMV Processed (30D)</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-black text-white font-mono">₹4.28 Crore</h3>
              <span className="text-xs font-bold text-emerald-400">1.8M Bills</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Average ticket size: ₹430</p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
            <span className="text-xs font-medium text-slate-400">Platform Cloud Health</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-black text-emerald-400 font-mono">99.98%</h3>
              <span className="text-xs font-bold text-slate-400">12ms Latency</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Supabase PostgreSQL Mumbai (ap-south-1)</p>
          </div>
        </div>

        {/* Plan Breakdown Progress Bar */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl my-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">SaaS Plan Distribution</h4>
            <span className="text-xs text-slate-400">Churn Rate: &lt; 0.8%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden">
            <div className="bg-orange-500 h-full" style={{ width: '52%' }} title="Enterprise (52%)"></div>
            <div className="bg-amber-500 h-full" style={{ width: '34%' }} title="Pro (34%)"></div>
            <div className="bg-blue-500 h-full" style={{ width: '14%' }} title="Starter (14%)"></div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Enterprise (₹5,999/mo) • 52%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Pro (₹2,999/mo) • 34%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Starter (₹1,499/mo) • 14%</span>
            </div>
          </div>
        </div>

        {/* Master Tenants Table */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-white">Onboarded Restaurant Chains &amp; Tenants</h3>
              <p className="text-xs text-slate-400">Manage tenant accounts, subscription renewal dates, and status</p>
            </div>
            <button
              onClick={() => showToast('Tenant database exported as CSV!')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Brand / Chain Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Owner &amp; Contact</th>
                  <th className="px-6 py-4 whitespace-nowrap">Active Outlets</th>
                  <th className="px-6 py-4 whitespace-nowrap">Plan Tier</th>
                  <th className="px-6 py-4 whitespace-nowrap">MRR Contribution</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-white">{t.name}</div>
                      <span className="text-[11px] text-slate-500 font-mono">ID: {t.id} • Joined: {t.joinedDate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{t.ownerName}</div>
                      <span className="text-[11px] text-slate-400 font-mono">{t.phone}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-sm text-slate-200 whitespace-nowrap">
                      {t.outletsCount} Outlets
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          t.plan === 'Enterprise'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : t.plan === 'Pro'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white whitespace-nowrap">
                      ₹{t.mrrAmount.toLocaleString('en-IN')}/mo
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'TRIAL'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <a
                        href="https://smart-restaurant-pos-admin.netlify.app"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold rounded-lg border border-slate-700 transition whitespace-nowrap leading-none shadow-sm"
                      >
                        <span>Impersonate Tenant</span>
                        <span className="text-sm">&rarr;</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: ONBOARD NEW TENANT */}
        {showOnboardModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base text-white">Onboard New Restaurant Tenant</h3>
                <button
                  onClick={() => setShowOnboardModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleOnboard} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Restaurant Chain / Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Biryani & Kababs"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Owner Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Owner Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98450 12345"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Select SaaS Subscription Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as 'Starter' | 'Pro' | 'Enterprise')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Starter">Starter Plan — ₹1,499/mo (1 Outlet, POS & QR)</option>
                    <option value="Pro">Pro Plan — ₹2,999/mo (Up to 3 Outlets, POS, KDS & Inventory)</option>
                    <option value="Enterprise">Enterprise Plan — ₹5,999/mo (Unlimited Outlets, Aggregators, AI)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOnboardModal(false)}
                    className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-600/30"
                  >
                    Provision Tenant Database
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
