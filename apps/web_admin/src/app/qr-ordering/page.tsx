'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface TableQr {
  id: string;
  tableName: string;
  section: string;
  capacity: number;
  qrUrl: string;
  totalScansToday: number;
  activeSession: boolean;
}

const TABLES_DATA: TableQr[] = [
  { id: 't1', tableName: 'Table T-01', section: 'Main Hall', capacity: 2, qrUrl: '/customer-qr?table=T-01', totalScansToday: 8, activeSession: true },
  { id: 't2', tableName: 'Table T-02', section: 'Main Hall', capacity: 4, qrUrl: '/customer-qr?table=T-02', totalScansToday: 4, activeSession: false },
  { id: 't3', tableName: 'Table T-03', section: 'Main Hall', capacity: 4, qrUrl: '/customer-qr?table=T-03', totalScansToday: 12, activeSession: true },
  { id: 't4', tableName: 'Table T-04', section: 'Main Hall', capacity: 6, qrUrl: '/customer-qr?table=T-04', totalScansToday: 9, activeSession: true },
  { id: 'g1', tableName: 'Table G-01', section: 'Garden Terrace', capacity: 4, qrUrl: '/customer-qr?table=G-01', totalScansToday: 6, activeSession: false },
  { id: 'g2', tableName: 'Table G-02', section: 'Garden Terrace', capacity: 4, qrUrl: '/customer-qr?table=G-02', totalScansToday: 5, activeSession: true },
  { id: 'r1', tableName: 'Table R-01', section: 'Rooftop Lounge', capacity: 8, qrUrl: '/customer-qr?table=R-01', totalScansToday: 14, activeSession: true },
];

export default function QrOrderingPage() {
  const [tables] = useState<TableQr[]>(TABLES_DATA);
  const [selectedTable, setSelectedTable] = useState<TableQr>(TABLES_DATA[0]);
  const [autoAcceptQr, setAutoAcceptQr] = useState(true);
  const [requirePrepayment, setRequirePrepayment] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="qr-ordering" />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">QR Code Table Ordering</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Self-Service Live
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Contactless digital menu. Customers scan table QR code to browse, customize and place order directly to kitchen KDS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/customer-qr?table=T-03"
              target="_blank"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs shadow-sm transition flex items-center gap-2"
            >
              <span>📱 Test Customer Mobile View</span>
              <span>↗</span>
            </Link>
          </div>
        </header>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-emerald-500 flex items-center gap-2 animate-bounce">
            <span>✅</span>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
          {/* Left Column: QR Code Cards & Standee Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">
                Table Tent Standee Preview
              </span>
              <h3 className="font-bold text-lg text-slate-900">{selectedTable.tableName}</h3>
              <p className="text-xs text-slate-400 mb-4">{selectedTable.section} • Capacity {selectedTable.capacity} Guests</p>

              {/* Render High-res Visual QR Standee */}
              <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl max-w-xs w-full flex flex-col items-center border border-slate-700 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-base text-white shadow-md mb-2">
                  BE
                </div>
                <h4 className="font-black text-sm tracking-tight text-white">Biryani Express</h4>
                <p className="text-[10px] text-orange-400 font-medium">Scan to View Menu & Order</p>

                {/* Simulated SVG QR Graphic */}
                <div className="bg-white p-4 rounded-2xl my-4 shadow-inner flex flex-col items-center">
                  <svg className="w-44 h-44 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                    {/* Top Left Marker */}
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="#000" />
                    <rect x="10" y="10" width="18" height="18" fill="#fff" />
                    <rect x="14" y="14" width="10" height="10" fill="#000" />

                    {/* Top Right Marker */}
                    <rect x="67" y="5" width="28" height="28" rx="4" fill="#000" />
                    <rect x="72" y="10" width="18" height="18" fill="#fff" />
                    <rect x="76" y="14" width="10" height="10" fill="#000" />

                    {/* Bottom Left Marker */}
                    <rect x="5" y="67" width="28" height="28" rx="4" fill="#000" />
                    <rect x="10" y="72" width="18" height="18" fill="#fff" />
                    <rect x="14" y="76" width="10" height="10" fill="#000" />

                    {/* QR Matrix Grid Dots */}
                    <rect x="38" y="8" width="8" height="8" />
                    <rect x="50" y="8" width="6" height="6" />
                    <rect x="38" y="20" width="6" height="6" />
                    <rect x="48" y="20" width="8" height="8" />
                    <rect x="10" y="38" width="6" height="6" />
                    <rect x="22" y="44" width="6" height="6" />
                    <rect x="38" y="38" width="24" height="24" rx="2" fill="#ea580c" />
                    <rect x="70" y="38" width="8" height="8" />
                    <rect x="82" y="46" width="6" height="6" />
                    <rect x="38" y="70" width="6" height="6" />
                    <rect x="50" y="76" width="8" height="8" />
                    <rect x="70" y="70" width="10" height="10" />
                    <rect x="85" y="80" width="6" height="6" />
                  </svg>
                  <span className="font-mono font-black text-xs text-slate-900 mt-1">
                    {selectedTable.tableName}
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-[11px] text-slate-300 font-medium">No Waiter Needed • 1-Tap Ordering</p>
                  <span className="text-[9px] text-slate-500 font-mono">http://192.168.0.103:3000{selectedTable.qrUrl}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4 w-full">
                <button
                  onClick={() => showToast(`Print command sent for ${selectedTable.tableName} QR Tent Standee!`)}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  🖨️ Print Tent Card (PDF)
                </button>
                <Link
                  href={selectedTable.qrUrl}
                  target="_blank"
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  Open Link
                </Link>
              </div>
            </div>

            {/* QR Settings Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900">QR Ordering Automation Rules</h4>
              
              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Auto-Dispatch to Kitchen KDS</span>
                  <span className="text-slate-500 text-[11px]">Directly print KOT when customer hits submit</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoAcceptQr}
                  onChange={(e) => setAutoAcceptQr(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between py-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Require Pre-Payment (Pay Before Order)</span>
                  <span className="text-slate-500 text-[11px]">Force UPI / Card payment before order is confirmed</span>
                </div>
                <input
                  type="checkbox"
                  checked={requirePrepayment}
                  onChange={(e) => setRequirePrepayment(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Table QR Codes List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">All Tables QR Status</h3>
                  <p className="text-xs text-slate-500">Select any table to inspect QR or download printable cards</p>
                </div>
                <button
                  onClick={() => showToast('Batch print started for all 7 active table QR standees!')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Batch Print All QRs
                </button>
              </div>

              <div className="space-y-2.5">
                {tables.map((t) => {
                  const isSelected = selectedTable.id === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTable(t)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-orange-50/60 border-orange-500 ring-1 ring-orange-500'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg font-bold shadow-xs">
                          📱
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{t.tableName}</h4>
                            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {t.section}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t.totalScansToday} scans today • Capacity: {t.capacity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.activeSession
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {t.activeSession ? '● Active Guest' : '○ Vacant'}
                        </span>
                        <Link
                          href={t.qrUrl}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-xs"
                        >
                          Simulate Scan ↗
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
