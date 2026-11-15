'use client';

import React from 'react';
import Link from 'next/link';

interface SidebarProps {
  activeTab?: 'overview' | 'pos' | 'mobile' | 'kds' | 'tables' | 'online-orders' | 'catalog' | 'inventory' | 'recipes' | 'qr-ordering' | 'whatsapp-ordering' | 'delivery' | 'crm' | 'accounting' | 'ai-insights' | 'cash-drawer' | 'reports' | 'staff' | 'settings';
}

export default function Sidebar({ activeTab = 'overview' }: SidebarProps) {
  const navSections = [
    {
      heading: 'Operations',
      items: [
        { id: 'overview', label: 'Overview', href: '/', icon: '📊', badge: null },
        { id: 'pos', label: 'POS Billing', href: '/pos', icon: '💻', badge: 'F2' },
        { id: 'mobile', label: 'Captain Mobile App', href: '/mobile', icon: '📱', badge: 'Captain' },
        { id: 'kds', label: 'Kitchen KDS', href: '/kds', icon: '🍳', badge: '5 Active' },
        { id: 'tables', label: 'Floor & Tables', href: '/tables', icon: '🪑', badge: '7/10' },
        { id: 'online-orders', label: 'Online Aggregators', href: '/online-orders', icon: '🛵', badge: 'Live' },
        { id: 'delivery', label: 'Delivery Dispatch', href: '/delivery', icon: '🚚', badge: null },
      ],
    },
    {
      heading: 'Kitchen & Stock',
      items: [
        { id: 'catalog', label: 'Menu & Dishes', href: '/catalog', icon: '🍛', badge: '+ Add' },
        { id: 'inventory', label: 'Inventory & GRN', href: '/inventory', icon: '📦', badge: 'Low Stock' },
        { id: 'recipes', label: 'Recipe & Food Cost', href: '/recipes', icon: '🥗', badge: 'BOM' },
      ],
    },
    {
      heading: 'Direct Channels',
      items: [
        { id: 'qr-ordering', label: 'QR Table Ordering', href: '/qr-ordering', icon: '📱', badge: 'Self-Order' },
        { id: 'whatsapp-ordering', label: 'WhatsApp & e-Bill', href: '/whatsapp-ordering', icon: '💬', badge: '0% Comm' },
      ],
    },
    {
      heading: 'Growth & Intelligence',
      items: [
        { id: 'crm', label: 'CRM & Loyalty', href: '/crm', icon: '💎', badge: 'Rewards' },
        { id: 'ai-insights', label: 'AI Forecasting', href: '/ai-insights', icon: '🧠', badge: 'AI' },
        { id: 'accounting', label: 'Accounting & P&L', href: '/accounting', icon: '📑', badge: null },
        { id: 'cash-drawer', label: 'Cash Drawer & Shift', href: '/cash-drawer', icon: '💵', badge: 'Shift #104' },
        { id: 'reports', label: 'Reports & GST', href: '/reports', icon: '📈', badge: null },
        { id: 'staff', label: 'Staff & Roles', href: '/staff', icon: '👥', badge: null },
        { id: 'settings', label: 'Restaurant Settings', href: '/settings', icon: '⚙️', badge: null },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-4 shrink-0 shadow-xl border-r border-slate-800 h-screen sticky top-0 overflow-y-auto">
      <div>
        {/* Brand & Outlet */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-xl text-white shadow-md shadow-orange-600/30">
            BE
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-white tracking-tight">Biryani Express</h1>
            <span className="text-xs text-orange-400 font-medium">Flagship Indiranagar</span>
          </div>
        </div>

        {/* Quick Launch Terminal Button */}
        <div className="mt-4 px-1">
          <Link
            href="/pos"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-orange-500/20 transition active:scale-[0.98]"
          >
            <span>⚡ Open POS Terminal</span>
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded">F2</span>
          </Link>
        </div>

        {/* Navigation Groups */}
        <div className="mt-4 space-y-4">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {section.heading}
              </span>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-orange-600 text-white shadow-sm font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            item.badge === 'Low Stock'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : item.badge === 'AI'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : item.badge === 'Rewards'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
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
          ))}
        </div>
      </div>

      {/* Switch to Super Admin Portal */}
      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
        <a
          href="http://localhost:3001/"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold border border-slate-700 transition"
        >
          <span>👑 Open Super Admin Panel</span>
          <span>↗</span>
        </a>
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>SaaS v2.4.0</span>
          <span className="text-emerald-400 font-mono">Cloud Active</span>
        </div>
      </div>
    </aside>
  );
}
