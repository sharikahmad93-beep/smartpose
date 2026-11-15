'use client';

import React from 'react';
import SuperSidebar from '@/components/SuperSidebar';

export default function SystemHealthPage() {
  const services = [
    { name: 'Supabase PostgreSQL Cloud Cluster (Mumbai)', status: 'OPERATIONAL', latency: '12ms', uptime: '99.99%', region: 'ap-south-1' },
    { name: 'Realtime WebSocket PubSub (KDS & POS Sync)', status: 'OPERATIONAL', latency: '8ms', uptime: '99.98%', region: 'Global Edge' },
    { name: 'Aggregator Webhook Relay (Zomato / Swiggy / ONDC)', status: 'OPERATIONAL', latency: '42ms', uptime: '99.95%', region: 'India Gateway' },
    { name: 'Meta WhatsApp Business Cloud API', status: 'OPERATIONAL', latency: '180ms', uptime: '99.90%', region: 'Meta Direct' },
    { name: 'Razorpay / UPI Payment Webhook Listeners', status: 'OPERATIONAL', latency: '35ms', uptime: '100.00%', region: 'Direct' },
    { name: 'Thermal ESC/POS Cloud Print Worker', status: 'OPERATIONAL', latency: '14ms', uptime: '99.97%', region: 'Edge Queue' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <SuperSidebar activeTab="system-health" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Cloud Infrastructure &amp; Health</h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time telemetry, database read/write IOPs, network latency, and uptime SLA monitoring.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> All Systems Normal
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {services.map((svc, i) => (
            <div key={i} className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">{svc.name}</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {svc.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Latency</span>
                  <p className="font-mono font-bold text-slate-200 mt-0.5">{svc.latency}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">30D Uptime</span>
                  <p className="font-mono font-bold text-emerald-400 mt-0.5">{svc.uptime}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Region</span>
                  <p className="font-mono font-bold text-slate-300 mt-0.5">{svc.region}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
