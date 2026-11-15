'use client';

import React from 'react';
import Link from 'next/link';

interface SuperSidebarProps {
  activeTab?: 'dashboard' | 'restaurants' | 'subscriptions' | 'feature-toggles' | 'audit-logs' | 'system-health';
}

export default function SuperSidebar({ activeTab = 'dashboard' }: SuperSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Platform Executive', href: '/', icon: '📊', badge: 'Live' },
    { id: 'restaurants', label: 'Restaurant Tenants', href: '/restaurants', icon: '🏪', badge: '142 Active' },
    { id: 'subscriptions', label: 'SaaS Plans & MRR', href: '/subscriptions', icon: '💳', badge: '₹14.8L MRR' },
    { id: 'feature-toggles', label: 'Global Feature Flags', href: '/feature-toggles', icon: '🎛️', badge: null },
    { id: 'audit-logs', label: 'Audit Logs & Security', href: '/audit-logs', icon: '🛡️', badge: null },
    { id: 'system-health', label: 'System & DB Health', href: '/system-health', icon: '⚡', badge: '99.98%' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between p-4 shrink-0 shadow-2xl min-h-screen">
      <div>
        {/* Super Admin Branding */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-orange-600/30">
            👑
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-white tracking-tight">Super Admin SaaS</h1>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Platform Master Control</span>
          </div>
        </div>

        {/* Global Live Stats Widget */}
        <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Global Monthly MRR</span>
            <span className="text-emerald-400 font-bold font-mono">₹14,82,500</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Live Restaurants</span>
            <span className="text-white font-bold font-mono">142 Outlets</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="mt-5 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      item.badge === 'Live'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Switch to Client Restaurant POS */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <a
          href="http://localhost:3000/"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
        >
          <span>🏪 Open Restaurant Admin</span>
          <span>↗</span>
        </a>
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>SaaS Engine v2.4.0</span>
          <span className="text-emerald-400 font-mono">Cloud Active</span>
        </div>
      </div>
    </aside>
  );
}
