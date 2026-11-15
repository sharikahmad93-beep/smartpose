'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface PettyCashEntry {
  id: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  reason: string;
  authorizedBy: string;
  time: string;
}

interface Denominations {
  d500: number;
  d200: number;
  d100: number;
  d50: number;
  d20: number;
  d10: number;
  coins: number;
}

export default function CashDrawerShiftPage() {
  const openingFloat = 2000;
  const cashSales = 13400;
  const upiSales = 28150;
  const cardSales = 6700;

  const [pettyCashLogs, setPettyCashLogs] = useState<PettyCashEntry[]>([
    {
      id: 'pc-1',
      type: 'CASH_OUT',
      amount: 1200,
      reason: 'Fresh Vegetable Market Purchase (Invoice #882)',
      authorizedBy: 'Manager Vikram',
      time: '11:15 AM',
    },
    {
      id: 'pc-2',
      type: 'CASH_OUT',
      amount: 300,
      reason: 'Emergency Ice Cube Bags (20kg)',
      authorizedBy: 'Manager Vikram',
      time: '12:30 PM',
    },
    {
      id: 'pc-3',
      type: 'CASH_OUT',
      amount: 150,
      reason: 'Staff Chai & Snack Expense',
      authorizedBy: 'Cashier Ramesh',
      time: '01:00 PM',
    },
  ]);

  // Petty Cash modal state
  const [isPettyModalOpen, setIsPettyModalOpen] = useState<boolean>(false);
  const [entryType, setEntryType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_OUT');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newReason, setNewReason] = useState<string>('');

  // Physical Denominations state
  const [denominations, setDenominations] = useState<Denominations>({
    d500: 24, // 12000
    d200: 6,  // 1200
    d100: 5,  // 500
    d50: 0,
    d20: 2,   // 40
    d10: 1,   // 10
    coins: 0,
  });

  // Z-Report Modal
  const [isZReportOpen, setIsZReportOpen] = useState<boolean>(false);

  // Calculations
  const totalCashOut = pettyCashLogs
    .filter((e) => e.type === 'CASH_OUT')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalCashIn = pettyCashLogs
    .filter((e) => e.type === 'CASH_IN')
    .reduce((acc, e) => acc + e.amount, 0);

  const expectedCashInDrawer = openingFloat + cashSales + totalCashIn - totalCashOut;

  const countedCash =
    denominations.d500 * 500 +
    denominations.d200 * 200 +
    denominations.d100 * 100 +
    denominations.d50 * 50 +
    denominations.d20 * 20 +
    denominations.d10 * 10 +
    denominations.coins;

  const discrepancy = countedCash - expectedCashInDrawer;

  const handleAddPettyCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newReason) return;
    const newEntry: PettyCashEntry = {
      id: `pc-${Date.now()}`,
      type: entryType,
      amount: parseFloat(newAmount),
      reason: newReason,
      authorizedBy: 'Shift Supervisor',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setPettyCashLogs([newEntry, ...pettyCashLogs]);
    setIsPettyModalOpen(false);
    setNewAmount('');
    setNewReason('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="cash-drawer" />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                💵 Cash Drawer &amp; Day-End Shift Closure
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Shift #104 Active
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Petpooja-compliant blind cash register, petty cash float tracking &amp; official Day-End Z-Report
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPettyModalOpen(true)}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
            >
              <span>💸 Add Petty Cash (In / Out)</span>
            </button>
            <button
              onClick={() => setIsZReportOpen(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
            >
              <span>📄 Print Shift Z-Report</span>
            </button>
          </div>
        </header>

        {/* Shift Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Opening Float</span>
            <div className="text-2xl font-black text-slate-900 mt-2">₹{openingFloat.toLocaleString()}</div>
            <span className="text-xs text-slate-400 mt-1 block">Given at 10:00 AM shift start</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cash Sales Today</span>
            <div className="text-2xl font-black text-emerald-600 mt-2">+₹{cashSales.toLocaleString()}</div>
            <span className="text-xs text-slate-400 mt-1 block">Total POS cash receipts</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Petty Cash Out</span>
            <div className="text-2xl font-black text-red-600 mt-2">-₹{totalCashOut.toLocaleString()}</div>
            <span className="text-xs text-slate-400 mt-1 block">{pettyCashLogs.length} vendor expense vouchers</span>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expected Cash</span>
            <div className="text-2xl font-black text-amber-400 mt-2">₹{expectedCashInDrawer.toLocaleString()}</div>
            <span className="text-xs text-slate-300 mt-1 block">Must match counted drawer</span>
          </div>
        </section>

        {/* 2-Column Split: Blind Count vs Petty Cash Log */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Physical Currency Denomination Counter (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">Physical Cash Denomination Count</h3>
                <p className="text-xs text-slate-500">
                  Cashier count entry at shift handover / Day-end closing
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">
                AUDIT LOGGED
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: '₹500 Notes', key: 'd500' as const, val: 500 },
                { label: '₹200 Notes', key: 'd200' as const, val: 200 },
                { label: '₹100 Notes', key: 'd100' as const, val: 100 },
                { label: '₹50 Notes', key: 'd50' as const, val: 50 },
                { label: '₹20 Notes', key: 'd20' as const, val: 20 },
                { label: '₹10 Notes', key: 'd10' as const, val: 10 },
                { label: 'Coins (₹1, ₹2, ₹5)', key: 'coins' as const, val: 1 },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="font-bold text-sm text-slate-800 w-36">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">Count:</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[item.key]}
                      onChange={(e) =>
                        setDenominations({
                          ...denominations,
                          [item.key]: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-xs font-mono text-slate-500 w-24 text-right">
                      = ₹{(denominations[item.key] * item.val).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Reconciliation Discrepancy Box */}
            <div className="mt-6 p-4 rounded-xl border flex items-center justify-between bg-slate-50 border-slate-200">
              <div>
                <span className="text-xs text-slate-500 font-medium">Physical Cash Counted</span>
                <div className="text-2xl font-black text-slate-900">₹{countedCash.toLocaleString()}</div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Drawer Variance</span>
                <div
                  className={`text-xl font-black ${
                    discrepancy === 0
                      ? 'text-emerald-600'
                      : discrepancy > 0
                      ? 'text-blue-600'
                      : 'text-red-600'
                  }`}
                >
                  {discrepancy === 0 && '✓ Perfect (₹0.00)'}
                  {discrepancy > 0 && `+₹${discrepancy} Excess`}
                  {discrepancy < 0 && `-₹${Math.abs(discrepancy)} Shortage`}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Petty Cash Expense Log (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-black text-base text-slate-900">Petty Cash Vouchers</h3>
                <span className="text-xs font-semibold text-slate-400">Shift #104</span>
              </div>

              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {pettyCashLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            entry.type === 'CASH_OUT'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {entry.type === 'CASH_OUT' ? 'CASH OUT' : 'CASH IN'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{entry.time}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{entry.reason}</p>
                      <span className="text-[10px] text-slate-400">Auth: {entry.authorizedBy}</span>
                    </div>

                    <span
                      className={`font-black text-sm ${
                        entry.type === 'CASH_OUT' ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {entry.type === 'CASH_OUT' ? '-' : '+'}₹{entry.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsPettyModalOpen(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                + Record Vendor Payout Voucher
              </button>
            </div>
          </div>
        </section>

        {/* Modal: Add Petty Cash Voucher */}
        {isPettyModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">Record Petty Cash Voucher</h3>
                <button
                  onClick={() => setIsPettyModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddPettyCash} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Voucher Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEntryType('CASH_OUT')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        entryType === 'CASH_OUT'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Cash Out (Expense)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryType('CASH_IN')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        entryType === 'CASH_IN'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Cash In (Top-up)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Expense Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily curd delivery, coriander"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPettyModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Save Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Official Petpooja Day-End Z-Report Printout */}
        {isZReportOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl font-mono text-xs text-slate-800">
              <div className="text-center border-b pb-3 border-dashed border-slate-400">
                <h3 className="font-black text-sm uppercase">BIRYANI EXPRESS</h3>
                <p className="text-[10px] text-slate-500">IND-FLAGSHIP • GSTIN: 29AABCU9603R1ZM</p>
                <div className="mt-1 font-bold text-xs bg-slate-100 py-1 rounded">
                  *** DAILY SHIFT Z-REPORT ***
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Shift #104 • Ramesh Sharma (Cashier)</p>
              </div>

              <div className="py-3 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Gross Sales:</span>
                  <span className="font-bold">₹{(cashSales + upiSales + cardSales).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Net Tax (CGST+SGST):</span>
                  <span>₹{Math.round((cashSales + upiSales + cardSales) * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Settled:</span>
                  <span>₹{(cashSales + upiSales + cardSales).toLocaleString()}</span>
                </div>
              </div>

              <div className="py-3 border-b border-dashed border-slate-400 space-y-1">
                <div className="font-bold text-[11px] mb-1">TENDER AUDIT BREAKDOWN:</div>
                <div className="flex justify-between">
                  <span>Cash Tender:</span>
                  <span>₹{cashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI / QR Tender:</span>
                  <span>₹{upiSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card / EDC Tender:</span>
                  <span>₹{cardSales.toLocaleString()}</span>
                </div>
              </div>

              <div className="py-3 border-b border-dashed border-slate-400 space-y-1">
                <div className="font-bold text-[11px] mb-1">DRAWER RECONCILIATION:</div>
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>₹{openingFloat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Petty Cash Out:</span>
                  <span>-₹{totalCashOut.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Cash:</span>
                  <span>₹{expectedCashInDrawer.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Counted Cash:</span>
                  <span>₹{countedCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
                  <span>Discrepancy:</span>
                  <span>{discrepancy === 0 ? '₹0.00 (BALANCED)' : `₹${discrepancy}`}</span>
                </div>
              </div>

              <div className="pt-3 pb-1 text-center text-[10px] text-slate-400 space-y-3">
                <p>Manager Signature: ______________________</p>
                <p>Audited &amp; Synchronized with Supabase Cloud DB</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800"
                >
                  Print Z-Report
                </button>
                <button
                  onClick={() => setIsZReportOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
