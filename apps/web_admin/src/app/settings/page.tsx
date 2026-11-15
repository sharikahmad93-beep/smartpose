'use client';

import React from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="settings" />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="pb-6 border-b border-slate-200">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Brand &amp; System Configurations</h2>
          <p className="text-sm text-slate-500">Manage tax regimes, currency, localized GST rules, printer setups, and cloud sync</p>
        </header>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Brand Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">Brand &amp; Legal Entity</h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Restaurant Brand Name</label>
                <input
                  type="text"
                  readOnly
                  value="Biryani Express"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Legal Registered Entity</label>
                <input
                  type="text"
                  readOnly
                  value="Biryani Express Hospitality Private Limited"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    readOnly
                    value="29AABCU9603R1ZM"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-bold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">FSSAI License</label>
                  <input
                    type="text"
                    readOnly
                    value="11223334000561"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Hardware & Printer Configurations */}
            <h3 className="text-lg font-black text-slate-900 mt-6 mb-4">Hardware &amp; Thermal Printers</h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">Front Cashier Printer (80mm)</div>
                  <div className="text-[11px] text-slate-500">Epson TM-T82X &bull; USB / Ethernet &bull; Auto-Cut</div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Connected</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">Kitchen KOT Network Printer</div>
                  <div className="text-[11px] text-slate-500">IP: 192.168.1.200:9100 &bull; Kitchen Station</div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Connected</span>
              </div>
            </div>

            {/* Zomato & Swiggy Merchant IDs */}
            <h3 className="text-lg font-black text-slate-900 mt-6 mb-4">Online Aggregator Accounts (IDs)</h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs">
                    Z
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Zomato Merchant Partner</div>
                    <div className="text-[11px] text-slate-500 font-mono">ResID: 18429103 &bull; Auto-Accept: Off</div>
                  </div>
                </div>
                <Link
                  href="/online-orders"
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200"
                >
                  Configure &rarr;
                </Link>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-xs">
                    S
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Swiggy Partner Portal</div>
                    <div className="text-[11px] text-slate-500 font-mono">Outlet: SWG-BLR-IND-5520 &bull; Auto-Accept: On</div>
                  </div>
                </div>
                <Link
                  href="/online-orders"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200"
                >
                  Configure &rarr;
                </Link>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                    O
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">ONDC Network (Pincode / Paytm)</div>
                    <div className="text-[11px] text-slate-500 font-mono">ID: ONDC-IND-BIRYANI-01 &bull; 3.5% Fee</div>
                  </div>
                </div>
                <Link
                  href="/online-orders"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200"
                >
                  Configure &rarr;
                </Link>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center font-black text-xs">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Magicpin Delivery</div>
                    <div className="text-[11px] text-slate-500 font-mono">Merchant: MP-MCH-99412 &bull; 12% Fee</div>
                  </div>
                </div>
                <Link
                  href="/online-orders"
                  className="text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-lg border border-pink-200"
                >
                  Configure &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Tax & GST Setup & Cloud DB */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">Taxation &amp; GST Regimes</h3>
              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">GST 5% (Restaurant Regular/Composite)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">CGST 2.5% + SGST 2.5% applied across all orders</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span>Discretionary Service Charge (0%):</span>
                <span className="font-bold text-slate-800">Disabled as per CCPA guidelines</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">Supabase Cloud Connection</h3>
              <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2.5">
                <div className="flex justify-between text-slate-400">
                  <span>Target Project Reference:</span>
                  <span className="text-orange-400 font-mono font-bold">hptreskxtbbxxzhuokbo</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hosting Region:</span>
                  <span className="text-slate-200 font-medium">AWS ap-south-1 (Mumbai)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Row Level Security (RLS):</span>
                  <span className="text-emerald-400 font-semibold">Enabled (21 Tables)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Database Engine:</span>
                  <span className="text-slate-200 font-medium">PostgreSQL 15+</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Multi-Tenant Isolation:</span>
                  <span className="text-emerald-400 font-semibold">Verified via RLS Test Suite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
