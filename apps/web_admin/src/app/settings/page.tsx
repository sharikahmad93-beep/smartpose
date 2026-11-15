'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface RestaurantProfile {
  restaurantName: string;
  branchName: string;
  addressLine1: string;
  addressLine2: string;
  cityPincode: string;
  mobile: string;
  secondaryPhone?: string;
  email?: string;
  gstin: string;
  fssai: string;
  receiptFooter: string;
}

const DEFAULT_RESTAURANT_PROFILE: RestaurantProfile = {
  restaurantName: 'Biryani Express',
  branchName: 'Flagship Indiranagar',
  addressLine1: 'Plot #42, 100ft Road, HAL 2nd Stage',
  addressLine2: 'Near 12th Main Junction, Indiranagar',
  cityPincode: 'Bengaluru, Karnataka - 560038',
  mobile: '+91 98765 43210',
  secondaryPhone: '+91 80 2520 0001',
  email: 'orders@biryaniexpress.in',
  gstin: '29AAAAA0000A1Z5',
  fssai: '11223334000561',
  receiptFooter: '*** THANK YOU! VISIT AGAIN ***',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<RestaurantProfile>(DEFAULT_RESTAURANT_PROFILE);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smart_pos_restaurant_profile');
      if (saved) {
        setProfile({ ...DEFAULT_RESTAURANT_PROFILE, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('smart_pos_restaurant_profile', JSON.stringify(profile));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="settings" />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Brand &amp; System Configurations</h2>
            <p className="text-sm text-slate-500">Configure restaurant profile, address, mobile number, GSTIN, printer setups &amp; cloud database</p>
          </div>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/30 transition self-start md:self-auto"
          >
            <span>⚡ Open POS Terminal</span>
          </Link>
        </header>

        {saveSuccess && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Restaurant Details &amp; Address updated successfully! All bill receipts will now reflect these details.</span>
            </div>
            <span className="text-xs text-emerald-200 font-mono">Saved to LocalStorage &amp; POS</span>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Brand Details & Editable Profile */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Restaurant Profile &amp; Bill Header</h3>
                <p className="text-xs text-slate-500">New restaurants can enter address, phone number &amp; GSTIN here</p>
              </div>
              <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2.5 py-1 rounded-lg">
                Prints on Bill
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Restaurant Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.restaurantName}
                  onChange={(e) => setProfile({ ...profile, restaurantName: e.target.value })}
                  placeholder="e.g. Biryani Express"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Branch / Outlet Name
                </label>
                <input
                  type="text"
                  value={profile.branchName}
                  onChange={(e) => setProfile({ ...profile, branchName: e.target.value })}
                  placeholder="e.g. Flagship Indiranagar / Main Market"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Address Line 1 (Street / Building) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.addressLine1}
                  onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })}
                  placeholder="e.g. Plot #42, 100ft Road, HAL 2nd Stage"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Address Line 2 (Area / Landmark)
                </label>
                <input
                  type="text"
                  value={profile.addressLine2}
                  onChange={(e) => setProfile({ ...profile, addressLine2: e.target.value })}
                  placeholder="e.g. Near 12th Main Signal, Opposite Metro Pillar 44"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City &amp; Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.cityPincode}
                    onChange={(e) => setProfile({ ...profile, cityPincode: e.target.value })}
                    placeholder="e.g. Bengaluru - 560038"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Phone (Prints on Bill) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={profile.gstin}
                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    FSSAI License
                  </label>
                  <input
                    type="text"
                    value={profile.fssai}
                    onChange={(e) => setProfile({ ...profile, fssai: e.target.value })}
                    placeholder="e.g. 11223334000561"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-medium focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Receipt Footer Message
                </label>
                <input
                  type="text"
                  value={profile.receiptFooter}
                  onChange={(e) => setProfile({ ...profile, receiptFooter: e.target.value })}
                  placeholder="e.g. *** THANK YOU! VISIT AGAIN ***"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2"
              >
                <span>💾 Save Restaurant Details (Updates All Bills)</span>
              </button>
            </form>

            {/* Hardware & Printer Configurations */}
            <h3 className="text-lg font-black text-slate-900 mt-8 mb-4">Hardware &amp; Thermal Printers</h3>
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
              <h3 className="text-lg font-black text-slate-900 mb-4">Live Thermal Bill Preview</h3>
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300">
                <div className="bg-white p-4 rounded-xl border border-dashed border-slate-400 font-mono text-[11px] text-slate-800 shadow-inner">
                  <div className="text-center pb-2 border-b border-dashed border-slate-400">
                    <p className="font-black text-xs uppercase">{profile.restaurantName || 'RESTAURANT NAME'}</p>
                    <p className="text-[10px] text-slate-600">{profile.branchName}</p>
                    <p className="text-[10px] text-slate-600">{profile.addressLine1}</p>
                    {profile.addressLine2 && <p className="text-[10px] text-slate-600">{profile.addressLine2}</p>}
                    <p className="text-[10px] text-slate-600">{profile.cityPincode}</p>
                    <p className="text-[10px] font-bold text-slate-800 mt-1">Mobile: {profile.mobile}</p>
                    {profile.gstin && <p className="text-[10px] text-slate-600">GSTIN: {profile.gstin}</p>}
                    {profile.fssai && <p className="text-[10px] text-slate-600">FSSAI: {profile.fssai}</p>}
                  </div>
                  <div className="py-2 text-[10px] text-slate-500 border-b border-dashed border-slate-400 flex justify-between">
                    <span>Sample Receipt</span>
                    <span>INV-8492</span>
                  </div>
                  <div className="py-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Chicken Dum Biryani (650 gm) x 1</span>
                      <span className="font-bold">₹290.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Irani Masala Chai (150 ml) x 2</span>
                      <span className="font-bold">₹80.00</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-dashed border-slate-400 flex justify-between font-bold">
                    <span>GRAND TOTAL</span>
                    <span className="text-orange-600">₹388.50</span>
                  </div>
                  <div className="text-center pt-2 text-[10px] text-slate-400">
                    {profile.receiptFooter}
                  </div>
                </div>
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
