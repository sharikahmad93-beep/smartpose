'use client';

import React, { useState } from 'react';
import SuperSidebar from '@/components/SuperSidebar';

interface DetailedRestaurant {
  id: string;
  name: string;
  primaryCity: string;
  outlets: number;
  tablesTotal: number;
  owner: string;
  contact: string;
  plan: string;
  monthlyRevenue: number;
  status: 'ACTIVE' | 'ONBOARDING' | 'OVERDUE';
}

const RESTAURANTS: DetailedRestaurant[] = [
  { id: 'res-101', name: 'Biryani Express Cloud Kitchens', primaryCity: 'Bengaluru', outlets: 6, tablesTotal: 42, owner: 'Vikramaditya Rao', contact: 'vikram@biryaniexpress.com', plan: 'Enterprise', monthlyRevenue: 18000, status: 'ACTIVE' },
  { id: 'res-102', name: 'Rolls & Bowls Co.', primaryCity: 'Bengaluru', outlets: 3, tablesTotal: 18, owner: 'Sameer Sen', contact: 'sameer@rollsandbowls.in', plan: 'Pro', monthlyRevenue: 8997, status: 'ACTIVE' },
  { id: 'res-103', name: 'The Kebab & Tikka House', primaryCity: 'Hyderabad', outlets: 2, tablesTotal: 24, owner: 'Ananya Sharma', contact: 'ananya@kebabs.co', plan: 'Pro', monthlyRevenue: 5998, status: 'ACTIVE' },
  { id: 'res-104', name: 'Chai & Mithaas Artisan Cafe', primaryCity: 'Mumbai', outlets: 1, tablesTotal: 8, owner: 'Rahul Mehta', contact: 'rahul@chaimithaas.com', plan: 'Starter', monthlyRevenue: 1499, status: 'ONBOARDING' },
  { id: 'res-105', name: 'Punjab Grill & Curry Central', primaryCity: 'Delhi NCR', outlets: 4, tablesTotal: 36, owner: 'Harpreet Singh', contact: 'harpreet@punjabgrill.com', plan: 'Enterprise', monthlyRevenue: 12000, status: 'ACTIVE' },
];

export default function RestaurantsListPage() {
  const [restaurants] = useState<DetailedRestaurant[]>(RESTAURANTS);
  const [search, setSearch] = useState('');

  const filtered = restaurants.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.primaryCity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <SuperSidebar activeTab="restaurants" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Restaurant Tenants &amp; Chains Directory</h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-tenant isolation status, database partitions, and brand outlet management.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search restaurant or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </header>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden my-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Restaurant Brand</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Outlets &amp; Tables</th>
                <th className="px-6 py-4">Owner Contact</th>
                <th className="px-6 py-4">Plan Tier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-white">{r.name}</div>
                    <span className="text-[11px] text-slate-500 font-mono">{r.id}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{r.primaryCity}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-200">
                    {r.outlets} Outlets • {r.tablesTotal} Tables
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-200">{r.owner}</div>
                    <span className="text-[11px] text-slate-400 font-mono">{r.contact}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {r.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href="http://localhost:3000/"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold rounded-lg border border-slate-700 transition"
                    >
                      Login to POS &rarr;
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
