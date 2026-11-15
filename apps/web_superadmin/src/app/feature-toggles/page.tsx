'use client';

import React, { useState } from 'react';
import SuperSidebar from '@/components/SuperSidebar';

interface FeatureFlag {
  id: string;
  name: string;
  category: string;
  description: string;
  globalEnabled: boolean;
  activeTenantsPercent: number;
}

const INITIAL_FLAGS: FeatureFlag[] = [
  { id: 'flag-aggregator', name: 'Zomato & Swiggy Multi-ID Aggregator', category: 'Integrations', description: 'Real-time webhook order ingestion and KDS routing across brands', globalEnabled: true, activeTenantsPercent: 88 },
  { id: 'flag-ai-forecast', name: 'AI Demand & Sales Predictor', category: 'AI Intelligence', description: 'Machine learning forecasting for weekend stock & peak prep hours', globalEnabled: true, activeTenantsPercent: 52 },
  { id: 'flag-whatsapp', name: 'WhatsApp Cloud API e-Bills', category: 'Customer Comm', description: 'Paperless digital bill sending via Meta WhatsApp Business API', globalEnabled: true, activeTenantsPercent: 94 },
  { id: 'flag-qr-ordering', name: 'QR Table Contactless Ordering', category: 'Guest Experience', description: 'Self-ordering from dining tables directly to kitchen KDS', globalEnabled: true, activeTenantsPercent: 76 },
  { id: 'flag-recipe-costing', name: 'Recipe Ingredient Mapping & Yield', category: 'Inventory', description: 'Automatic raw ingredient deduction per sold portion', globalEnabled: true, activeTenantsPercent: 68 },
  { id: 'flag-split-bill', name: 'Advanced Split & Merge Bill Engine', category: 'POS Core', description: 'Item-wise and equal share table bill splits', globalEnabled: true, activeTenantsPercent: 100 },
];

export default function FeatureTogglesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, globalEnabled: !f.globalEnabled } : f))
    );
    const flag = flags.find((f) => f.id === id);
    setToastMessage(`Feature "${flag?.name}" toggle updated!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <SuperSidebar activeTab="feature-toggles" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Global Feature Flags &amp; Toggles</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enable or disable platform modules dynamically across all restaurant tenants or specific subscription tiers.
            </p>
          </div>
        </header>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-emerald-500 flex items-center gap-2 animate-bounce">
            <span>✅</span>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        <div className="space-y-3 my-6">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">{flag.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {flag.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{flag.description}</p>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
                  ● Used by {flag.activeTenantsPercent}% of active restaurants
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${flag.globalEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {flag.globalEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
                <button
                  onClick={() => toggleFlag(flag.id)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    flag.globalEnabled ? 'bg-orange-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
