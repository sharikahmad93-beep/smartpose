'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Shared Petpooja Sidebar Navigation */}
      <Sidebar activeTab="overview" />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Restaurant Operations</h2>
            <p className="text-sm text-slate-500">Real-time status, dining layout, and POS revenue sync</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
            >
              <span>⚡ POS Terminal (F2)</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase Cloud Live (RLS Active)
            </span>
          </div>
        </header>

        {/* Operational Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Today&apos;s Gross Sales</span>
              <span className="text-emerald-600 bg-emerald-50 p-1 rounded-md text-xs font-semibold">+18%</span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">₹48,250</span>
              <p className="text-xs text-slate-400 mt-1">112 orders settled across 2 outlets</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Active Dining Tables</span>
              <span className="text-orange-600 bg-orange-50 p-1 rounded-md text-xs font-semibold">Live Floor</span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">7 / 10</span>
              <p className="text-xs text-slate-400 mt-1">70% current occupancy in Indiranagar</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Live KOT Queue</span>
              <span className="text-blue-600 bg-blue-50 p-1 rounded-md text-xs font-semibold">Kitchen Display</span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">5 Tickets</span>
              <p className="text-xs text-slate-400 mt-1">Avg cooking prep time: 14 mins</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Online Orders</span>
              <span className="text-purple-600 bg-purple-50 p-1 rounded-md text-xs font-semibold">Aggregators</span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">4 Active</span>
              <p className="text-xs text-slate-400 mt-1">Swiggy (2), Zomato (1), Direct (1)</p>
            </div>
          </div>
        </section>

        {/* Petpooja Module Hub Grid */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg text-slate-900">Petpooja Core Operational Modules</h3>
            <span className="text-xs text-slate-400">Complete restaurant workflow suite</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/pos"
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-500 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl">💻</span>
                <h4 className="font-bold text-slate-900 mt-3 group-hover:text-orange-600 transition">
                  POS Billing Terminal
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Speed billing, Dine-In / Takeaway, dynamic discounts, and thermal receipts
                </p>
              </div>
              <span className="text-xs text-orange-600 font-bold mt-4 block">Launch Terminal →</span>
            </Link>

            <Link
              href="/kds"
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl">🍳</span>
                <h4 className="font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition">
                  Kitchen Display (KDS)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Station timers, KOT prep tracking, bump bar, and 86&apos;d item stock-out
                </p>
              </div>
              <span className="text-xs text-blue-600 font-bold mt-4 block">Open Kitchen Screen →</span>
            </Link>

            <Link
              href="/online-orders"
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-500 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl">🛵</span>
                <h4 className="font-bold text-slate-900 mt-3 group-hover:text-red-600 transition">
                  Online Aggregators
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Swiggy &amp; Zomato auto-sync, rider dispatch &amp; commission analytics
                </p>
              </div>
              <span className="text-xs text-red-600 font-bold mt-4 block">Manage Aggregators →</span>
            </Link>

            <Link
              href="/cash-drawer"
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl">💵</span>
                <h4 className="font-bold text-slate-900 mt-3 group-hover:text-emerald-600 transition">
                  Cash Drawer &amp; Shifts
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Petty cash vouchers, physical currency counter &amp; Day-End Z-Report
                </p>
              </div>
              <span className="text-xs text-emerald-600 font-bold mt-4 block">Close Shift / Z-Report →</span>
            </Link>
          </div>
        </section>

        {/* Outlets Performance & Cloud Infrastructure */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">Outlets &amp; Branch Performance</h3>
              <Link href="/settings" className="text-xs font-medium text-orange-600 hover:underline">
                Manage Outlets &rarr;
              </Link>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">Indiranagar Flagship Outlet</h4>
                  <p className="text-xs text-slate-500">100 Feet Road, HAL 2nd Stage &bull; Code: BLR-IND-01</p>
                  <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Main Branch &bull; Online
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900">₹32,400</span>
                  <p className="text-xs text-slate-400">76 orders today</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">Whitefield ITPL Outlet</h4>
                  <p className="text-xs text-slate-500">ITPB Main Road &bull; Code: BLR-WHF-01</p>
                  <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active Outlet &bull; Online
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900">₹15,850</span>
                  <p className="text-xs text-slate-400">36 orders today</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Quick POS Actions</h3>
                <span className="text-xs text-slate-400">Multi-device sync</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/tables"
                  className="p-4 rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-100/50 transition flex flex-col items-center justify-center text-center"
                >
                  <span className="text-3xl mb-1">🪑</span>
                  <span className="font-semibold text-slate-900 text-sm">Floor Seating</span>
                  <span className="text-xs text-slate-500">Real-time table occupancy</span>
                </Link>
                <Link
                  href="/catalog"
                  className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/50 transition flex flex-col items-center justify-center text-center"
                >
                  <span className="text-3xl mb-1">🍛</span>
                  <span className="font-semibold text-slate-900 text-sm">Menu Catalog</span>
                  <span className="text-xs text-slate-500">Toggle 86d stock &amp; prices</span>
                </Link>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-900 text-white">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Database Cloud Status</span>
                <span className="text-emerald-400 font-semibold">PostgreSQL 15+</span>
              </div>
              <p className="text-xs text-slate-300">
                Connected to Supabase Project: <code className="text-orange-400 font-mono">hptreskxtbbxxzhuokbo</code> (Mumbai, ap-south-1).
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
