'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const [selectedOutlet, setSelectedOutlet] = useState('Flagship Indiranagar');
  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const outlets = [
    { id: 'out-1', name: 'Flagship Indiranagar', code: 'IND-01', status: 'Primary Outlet' },
    { id: 'out-2', name: 'Whitefield High Street', code: 'WHF-02', status: 'Branch Outlet' },
    { id: 'out-3', name: 'Koramangala Cloud Kitchen', code: 'KOR-03', status: 'Delivery Only' },
  ];

  const notifications = [
    { id: '1', title: 'New Zomato Order #ZOM-4567', time: '2m ago', type: 'order', icon: '🛵' },
    { id: '2', title: 'Low Stock Alert: Baby Mutton (4 kg)', time: '12m ago', type: 'alert', icon: '⚠️' },
    { id: '3', title: 'Shift #104 Float ₹2,000 Verified', time: '1h ago', type: 'cash', icon: '💵' },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left: Page Title or Outlet Switcher */}
      <div className="flex items-center gap-4">
        {title ? (
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">{title}</h1>
            {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsOutletDropdownOpen(!isOutletDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>🏢 {selectedOutlet}</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {isOutletDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                <span className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Switch Active Outlet
                </span>
                {outlets.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setSelectedOutlet(o.name);
                      setIsOutletDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                      selectedOutlet === o.name ? 'font-bold text-orange-600 bg-orange-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{o.name}</p>
                      <span className="text-[10px] text-slate-400">{o.code} &bull; {o.status}</span>
                    </div>
                    {selectedOutlet === o.name && <span className="text-orange-600 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Business Day & Shift Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
          <span>📅 Today: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono font-bold text-slate-800">{currentTime || '09:00:00'}</span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
            Shift #104: OPEN
          </span>
        </div>
      </div>

      {/* Right: Cloud Sync, Notification, New Order F2, User */}
      <div className="flex items-center gap-3">
        {/* Cloud Sync Status */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800"
          title="Supabase PostgreSQL Live Sync — AWS ap-south-1 (Mumbai)"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Cloud Live</span>
        </div>

        {/* Quick New Order Action Button (F2) */}
        <Link
          href="/pos"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30 transition active:scale-95"
          title="Instant POS Speed Billing"
        >
          <span>⚡</span>
          <span>New Order</span>
          <span className="hidden md:inline bg-orange-700 text-orange-200 text-[10px] px-1.5 py-0.2 rounded font-mono">
            F2
          </span>
        </Link>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 relative transition"
            title="Notifications"
          >
            <span className="text-sm">🔔</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="font-extrabold text-xs text-slate-900">Notifications</span>
                <span className="text-[10px] font-bold text-orange-600 cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-1.5">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 text-xs">
                    <span className="text-base">{n.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 leading-tight">{n.title}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              PS
            </div>
            <div className="hidden md:block text-left text-xs leading-tight">
              <div className="font-bold text-slate-900">Priya Sundaram</div>
              <span className="text-[10px] text-orange-600 font-medium">Head Cashier</span>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">Priya Sundaram</p>
                <p className="text-[10px] text-slate-500">cashier1@biryaniexpress.test</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                  Terminal #1 Authorized
                </span>
              </div>
              <Link href="/cash-drawer" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium">
                💵 Day Shift #104 Ledger
              </Link>
              <Link href="/settings" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium">
                ⚙️ Restaurant Configurations
              </Link>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => alert('Terminal Locked. Enter 4-digit Cashier PIN (e.g. 1234) to unlock.')}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-bold"
              >
                🔒 Quick Lock Terminal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
