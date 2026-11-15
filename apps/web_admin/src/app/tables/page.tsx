'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface DemoTable {
  id: string;
  table_number: string;
  section: string;
  capacity: number;
  status: 'VACANT' | 'OCCUPIED' | 'BILLED';
  active_bill?: number;
  covers?: number;
}

const DEMO_TABLES: DemoTable[] = [
  { id: '1', table_number: 'T-01', section: 'AC Main Hall', capacity: 4, status: 'OCCUPIED', active_bill: 1450, covers: 3 },
  { id: '2', table_number: 'T-02', section: 'AC Main Hall', capacity: 4, status: 'OCCUPIED', active_bill: 2180, covers: 4 },
  { id: '3', table_number: 'T-03', section: 'AC Main Hall', capacity: 2, status: 'VACANT' },
  { id: '4', table_number: 'T-04', section: 'AC Main Hall', capacity: 6, status: 'BILLED', active_bill: 3820, covers: 5 },
  { id: '5', table_number: 'T-05', section: 'Family Section', capacity: 8, status: 'OCCUPIED', active_bill: 4950, covers: 7 },
  { id: '6', table_number: 'T-06', section: 'Garden Patio', capacity: 4, status: 'VACANT' },
  { id: '7', table_number: 'T-07', section: 'Garden Patio', capacity: 4, status: 'OCCUPIED', active_bill: 1120, covers: 2 },
  { id: '8', table_number: 'T-08', section: 'Garden Patio', capacity: 2, status: 'VACANT' },
  { id: '9', table_number: 'T-09', section: 'Rooftop Lounge', capacity: 6, status: 'OCCUPIED', active_bill: 3400, covers: 4 },
  { id: '10', table_number: 'T-10', section: 'Rooftop Lounge', capacity: 4, status: 'OCCUPIED', active_bill: 1890, covers: 3 },
];

export default function TablesPage() {
  const statusColors = {
    VACANT: 'bg-white border-emerald-300 text-emerald-800 hover:border-emerald-500',
    OCCUPIED: 'bg-white border-orange-300 text-orange-800 hover:border-orange-500',
    BILLED: 'bg-white border-purple-300 text-purple-800 hover:border-purple-500',
  };

  const statusBadge = {
    VACANT: 'bg-emerald-100 text-emerald-800',
    OCCUPIED: 'bg-orange-100 text-orange-800',
    BILLED: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="tables" />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Live Dining Tables &amp; Floor Plan</h2>
            <p className="text-sm text-slate-500">Real-time table occupancy synced via Supabase Realtime</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">Vacant: 3</span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800">Occupied: 6</span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800">Billed: 1</span>
            </div>
            <Link
              href="/pos"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow"
            >
              + New Table Bill (F2)
            </Link>
          </div>
        </header>

        {/* Section Filters */}
        <div className="mt-6 flex items-center gap-2">
          {['All Sections', 'AC Main Hall', 'Family Section', 'Garden Patio', 'Rooftop Lounge'].map((sec, idx) => (
            <button
              key={sec}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${
                idx === 0
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mt-6">
          {DEMO_TABLES.map((t) => (
            <Link
              key={t.id}
              href={`/pos`}
              className={`p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between h-52 group cursor-pointer ${statusColors[t.status]}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition">
                    {t.table_number}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge[t.status]}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">{t.section}</p>
                <p className="text-xs text-slate-400 mt-0.5">Capacity: {t.capacity} Seats</p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                {t.status !== 'VACANT' ? (
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">Running Bill</span>
                    <p className="text-lg font-black text-slate-900">₹{t.active_bill?.toLocaleString()}</p>
                    <span className="text-[11px] text-slate-500">{t.covers} Guests Seated &bull; KOT Fired</span>
                  </div>
                ) : (
                  <div className="text-center py-2 bg-emerald-50 rounded-xl">
                    <p className="text-xs font-bold text-emerald-700">+ Click to Seat</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
