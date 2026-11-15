'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: 'VIP Gold' | 'Silver Regular' | 'New Guest';
  totalVisits: number;
  lifetimeSpend: number;
  loyaltyPoints: number;
  cashbackBalance: number;
  favoriteDish: string;
  birthday: string;
  anniversary: string;
  lastVisit: string;
}

const INITIAL_CUSTOMERS: CustomerProfile[] = [
  { id: 'c-101', name: 'Dr. Rohan Deshmukh', phone: '+91 98450 99881', email: 'rohan.d@hospital.org', tier: 'VIP Gold', totalVisits: 28, lifetimeSpend: 34500, loyaltyPoints: 1725, cashbackBalance: 450, favoriteDish: 'Special Mutton Dum Biryani', birthday: '18 Nov', anniversary: '04 Dec', lastVisit: 'Yesterday' },
  { id: 'c-102', name: 'Pooja Sundaram', phone: '+91 99120 33441', email: 'pooja.s@techcorp.com', tier: 'VIP Gold', totalVisits: 19, lifetimeSpend: 22800, loyaltyPoints: 1140, cashbackBalance: 200, favoriteDish: 'Paneer Malai Tikka', birthday: '24 Nov', anniversary: '15 Jan', lastVisit: '3 days ago' },
  { id: 'c-103', name: 'Arjun Nambiar', phone: '+91 97722 88112', email: 'arjun.n@venture.in', tier: 'Silver Regular', totalVisits: 11, lifetimeSpend: 13400, loyaltyPoints: 670, cashbackBalance: 100, favoriteDish: 'Chicken 65 & Garlic Naan', birthday: '05 Jan', anniversary: '22 Feb', lastVisit: '1 week ago' },
  { id: 'c-104', name: 'Meera Kulkarni', phone: '+91 98110 55223', email: 'meera.k@studio.com', tier: 'New Guest', totalVisits: 2, lifetimeSpend: 1850, loyaltyPoints: 90, cashbackBalance: 0, favoriteDish: 'Royal Chicken Dum Biryani', birthday: '12 Dec', anniversary: 'None', lastVisit: 'Today (Table T-03)' },
];

export default function CrmLoyaltyPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="crm" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">CRM &amp; Loyalty Rewards</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                Retention Engine
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Customer database, automated birthday/anniversary rewards, loyalty points (5% per bill), and VIP segmentation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast('Automated Birthday & Anniversary WhatsApp greetings dispatched!')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md transition flex items-center gap-2"
            >
              <span>🎂 Send Birthday WhatsApp Greetings</span>
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

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Total Registered Diners</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900">1,840 Guests</h3>
              <span className="text-xs font-semibold text-emerald-600">+14% MoM</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">68% repeat guest visit rate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Loyalty Points Balance</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-orange-600 font-mono">92,450 Pts</h3>
              <span className="text-xs font-semibold text-slate-500">Worth ₹46,225</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">1 Point = ₹0.50 redemption value</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Upcoming Birthdays This Week</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-900">12 Guests</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Auto-Offer Ready</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Free dessert on dining with family</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Average Spend (VIP vs Normal)</span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-emerald-600">₹1,230</h3>
              <span className="text-xs font-semibold text-emerald-600">2.8x Higher</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Regular walk-in ticket average: ₹430</p>
          </div>
        </div>

        {/* Customer Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden my-6">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Customer Profiles &amp; Loyalty Ledger</h3>
              <p className="text-xs text-slate-500">Track favorite dishes, visit history and reward points</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search guest by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Guest Profile</th>
                <th className="px-5 py-3.5">Membership Tier</th>
                <th className="px-5 py-3.5">Visits &amp; Spend</th>
                <th className="px-5 py-3.5">Loyalty Points</th>
                <th className="px-5 py-3.5">Favorite Dish</th>
                <th className="px-5 py-3.5">Celebrations</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <span className="text-[11px] text-slate-400 font-mono">{c.phone}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        c.tier === 'VIP Gold'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : c.tier === 'Silver Regular'
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {c.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900">{c.totalVisits} visits</span>
                    <p className="text-slate-500 font-mono text-[11px]">₹{c.lifetimeSpend.toLocaleString('en-IN')}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-orange-600">
                    {c.loyaltyPoints} Pts
                    <span className="text-[10px] text-slate-400 block font-normal">Cashback: ₹{c.cashbackBalance}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{c.favoriteDish}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-[11px]">
                    <div>🎂 {c.birthday}</div>
                    {c.anniversary !== 'None' && <div>💍 {c.anniversary}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => showToast(`Exclusive 15% discount coupon sent to ${c.name} on WhatsApp!`)}
                      className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg font-semibold text-xs transition"
                    >
                      Send Offer
                    </button>
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
