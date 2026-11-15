'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SidebarProps {
  activeTab?: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string | null;
  badgeColor?: string;
}

interface NavGroup {
  number: number;
  title: string;
  icon: string;
  items: NavItem[];
}

export default function Sidebar({ activeTab = 'overview' }: SidebarProps) {
  // Sidebar collapsed state (icons only vs full menu)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});

  // 13 PetPooja Standard Functional Groups
  const petPoojaGroups: NavGroup[] = [
    {
      number: 1,
      title: 'Dashboard',
      icon: '📊',
      items: [
        { id: 'overview', label: 'Overview & Sales', href: '/', icon: '📊', badge: null },
      ],
    },
    {
      number: 2,
      title: 'Billing & POS',
      icon: '💻',
      items: [
        { id: 'pos', label: 'POS Billing Terminal', href: '/pos', icon: '⚡', badge: 'F2', badgeColor: 'bg-orange-500 text-white' },
        { id: 'online-orders', label: 'Online Aggregators', href: '/online-orders', icon: '🛵', badge: 'Live', badgeColor: 'bg-emerald-500 text-white' },
        { id: 'delivery', label: 'Delivery Dispatch', href: '/delivery', icon: '🚚', badge: null },
      ],
    },
    {
      number: 3,
      title: 'Kitchen (KOT / KDS)',
      icon: '🍳',
      items: [
        { id: 'kds', label: 'Kitchen KDS Display', href: '/kds', icon: '🍳', badge: '5 Active', badgeColor: 'bg-blue-500 text-white' },
      ],
    },
    {
      number: 4,
      title: 'Tables & Floor',
      icon: '🪑',
      items: [
        { id: 'tables', label: 'Floor Plan & Tables', href: '/tables', icon: '🪑', badge: '7/10' },
      ],
    },
    {
      number: 5,
      title: 'Menu Management',
      icon: '🍛',
      items: [
        { id: 'catalog', label: 'Dishes & Combos', href: '/catalog', icon: '🍛', badge: 'ml/gm' },
      ],
    },
    {
      number: 6,
      title: 'Inventory & Purchase',
      icon: '📦',
      items: [
        { id: 'inventory', label: 'Stock & Invoices (GRN)', href: '/inventory', icon: '📦', badge: 'Low Stock', badgeColor: 'bg-amber-500 text-slate-900' },
        { id: 'recipes', label: 'Recipe & Food Cost (BOM)', href: '/recipes', icon: '🥗', badge: 'BOM' },
      ],
    },
    {
      number: 7,
      title: 'Customers & CRM',
      icon: '💎',
      items: [
        { id: 'crm', label: 'CRM & Loyalty Points', href: '/crm', icon: '💎', badge: '5%' },
        { id: 'whatsapp-ordering', label: 'WhatsApp & e-Bill', href: '/whatsapp-ordering', icon: '💬', badge: '0% Comm' },
      ],
    },
    {
      number: 8,
      title: 'Staff & Access',
      icon: '👥',
      items: [
        { id: 'staff', label: 'Staff Roles & Access', href: '/staff', icon: '👥', badge: null },
      ],
    },
    {
      number: 9,
      title: 'Accounts & Finance',
      icon: '💵',
      items: [
        { id: 'cash-drawer', label: 'Cash Drawer & Shift', href: '/cash-drawer', icon: '💵', badge: 'Shift #104' },
        { id: 'accounting', label: 'Accounting & P&L', href: '/accounting', icon: '📑', badge: 'GST Ready' },
      ],
    },
    {
      number: 10,
      title: 'Reports & Analytics',
      icon: '📈',
      items: [
        { id: 'reports', label: 'Financial & GST Ledger', href: '/reports', icon: '📈', badge: 'GSTR-1' },
        { id: 'ai-insights', label: 'AI Demand Forecasting', href: '/ai-insights', icon: '🧠', badge: 'AI' },
      ],
    },
    {
      number: 11,
      title: 'Multi-Outlet / Franchise',
      icon: '🏢',
      items: [
        { id: 'store', label: 'Brand & Outlets Master', href: '/store', icon: '🏪', badge: null },
      ],
    },
    {
      number: 12,
      title: 'Integrations & Hardware',
      icon: '🔌',
      items: [
        { id: 'qr-ordering', label: 'QR Dine-In Ordering', href: '/qr-ordering', icon: '📱', badge: 'Dine-In' },
        { id: 'mobile', label: 'Captain Mobile App', href: '/mobile', icon: '📲', badge: 'Waiter' },
      ],
    },
    {
      number: 13,
      title: 'Settings',
      icon: '⚙️',
      items: [
        { id: 'settings', label: 'Restaurant & Tax Setup', href: '/settings', icon: '⚙️', badge: null },
      ],
    },
  ];

  // Load persistence
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('smart_pos_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('smart_pos_sidebar_collapsed', String(next));
    } catch {
      // ignore
    }
  };

  const toggleGroup = (num: number) => {
    setCollapsedGroups((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <aside
      className={`bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-2xl border-r border-slate-800 h-screen sticky top-0 transition-all duration-300 z-40 select-none ${isCollapsed ? 'w-20 p-2' : 'w-72 p-4'
        }`}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand & Outlet Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-11 h-11 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-orange-600/30 shrink-0">
              BE
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight truncate">
                  Biryani Express
                </h1>
                <span className="text-[11px] text-orange-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Flagship Indiranagar
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition shrink-0"
            title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar'}
          >
            {isCollapsed ? '⮞' : '⮜'}
          </button>
        </div>

        {/* Quick Launch POS Terminal Banner */}
        <div className="my-3">
          <Link
            href="/pos"
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-black text-xs shadow-lg shadow-orange-500/20 transition active:scale-[0.98] ${isCollapsed ? 'p-2' : ''
              }`}
            title="Open Speed Billing Terminal (F2)"
          >
            <span className="text-base leading-none">⚡</span>
            {!isCollapsed && (
              <>
                <span>POS Speed Billing</span>
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                  F2
                </span>
              </>
            )}
          </Link>
        </div>

        {/* 13 PetPooja Groups (Scrollable) */}
        <nav className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {petPoojaGroups.map((group) => {
            const isGroupOpen = !collapsedGroups[group.number];
            const hasActiveItem = group.items.some((i) => i.id === activeTab);

            return (
              <div key={group.number} className="space-y-1">
                {/* Group Title Accordion Header */}
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.number)}
                    className="w-full flex items-center justify-between px-2 py-1 text-slate-400 hover:text-slate-200 text-[10px] font-black uppercase tracking-wider transition rounded"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-xs">{group.icon}</span>
                      <span className="truncate">
                        {group.number}. {group.title}
                      </span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {isGroupOpen ? '▼' : '▶'}
                    </span>
                  </button>
                ) : (
                  <div className="text-center py-1 text-[10px] font-bold text-slate-500 border-t border-slate-800/60 mt-1">
                    {group.number}
                  </div>
                )}

                {/* Group Items */}
                {(isGroupOpen || isCollapsed || hasActiveItem) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`flex items-center rounded-xl text-xs font-semibold transition group min-h-[38px] ${isCollapsed
                            ? 'justify-center p-2.5'
                            : 'justify-between px-3 py-2'
                            } ${isActive
                              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 font-bold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          title={`${item.label} (${group.title})`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-sm shrink-0">{item.icon}</span>
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>

                          {!isCollapsed && item.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${item.badgeColor || 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: Super Admin Link & System Health */}
      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs shrink-0">
        <a
          href="https://smartpose2.sharikahmad93.workers.dev"
          target="_blank"
          rel="noreferrer"
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800/80 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold border border-slate-700 transition ${isCollapsed ? 'p-2' : ''
            }`}
          title="Open Super Admin Platform Console"
        >
          <span>👑</span>
          {!isCollapsed && (
            <>
              <span className="truncate">Super Admin</span>
              <span className="text-[10px]">↗</span>
            </>
          )}
        </a>

        {!isCollapsed && (
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
            <span>PetPooja Edition v3.0</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
