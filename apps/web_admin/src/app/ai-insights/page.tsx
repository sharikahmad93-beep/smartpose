'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function AiInsightsPage() {
  const predictions = [
    {
      title: 'Weekend Sales Surge Prediction',
      icon: '📈',
      badge: 'High Confidence (94%)',
      desc: 'Projected sales for this Saturday & Sunday: ₹1,12,000 across Dine-in & Zomato.',
      action: 'Recommendation: Prep 45kg additional Basmati Rice & 35kg Chicken on Friday afternoon.',
    },
    {
      title: 'Smart Stock Depletion Warning',
      icon: '⚠️',
      badge: 'Inventory Prediction',
      desc: 'Baby Mutton stock will hit 0kg by Saturday 8:30 PM based on past 4 weekends burn velocity.',
      action: 'Recommendation: Trigger Purchase Order to Bengaluru Meat Traders before Friday 4 PM.',
    },
    {
      title: 'Peak Kitchen Prep Hour Forecast',
      icon: '🍳',
      badge: 'Staff Scheduling',
      desc: 'Peak rush expected between 8:15 PM - 10:00 PM with ~34 concurrent orders.',
      action: 'Recommendation: Deploy 2 additional line cooks on Tandoor & Breads station.',
    },
    {
      title: 'Menu Profitability Optimization',
      icon: '💡',
      badge: 'Menu Engineering',
      desc: 'Chicken Tikka Kebab has 76% margin but is ordered in only 14% of biryani orders.',
      action: 'Recommendation: Bundle as "Biryani + Kebab Solo Feast" to boost Average Order Value by ₹140.',
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="ai-insights" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Sales &amp; Demand Forecasting</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Future-Ready ML Engine
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Machine learning algorithms analyze order velocity, festival trends, weather, and inventory burn to predict sales and prevent stockouts.
            </p>
          </div>
        </header>

        {/* Prediction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {predictions.map((p, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.icon}</span>
                  <h3 className="font-bold text-base text-slate-900">{p.title}</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {p.badge}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>

              <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 font-medium">
                {p.action}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
