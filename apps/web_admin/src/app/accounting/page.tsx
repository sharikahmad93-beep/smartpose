'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface ExpenseEntry {
  id: string;
  category: 'Kitchen Supplies' | 'Utilities & Gas' | 'Staff Wages' | 'Packaging' | 'Store Rent';
  description: string;
  amount: number;
  date: string;
  paymentMode: 'Bank Transfer' | 'Cash' | 'UPI';
}

const EXPENSES: ExpenseEntry[] = [
  { id: 'exp-1', category: 'Kitchen Supplies', description: 'Fresh chicken & vegetables daily procurement', amount: 4850, date: '14 Nov 2026', paymentMode: 'UPI' },
  { id: 'exp-2', category: 'Utilities & Gas', description: 'Commercial LPG Cylinder (2x 19kg refill)', amount: 3600, date: '12 Nov 2026', paymentMode: 'Bank Transfer' },
  { id: 'exp-3', category: 'Packaging', description: 'Double-wall handi takeaway boxes & thermal rolls', amount: 2400, date: '11 Nov 2026', paymentMode: 'Bank Transfer' },
  { id: 'exp-4', category: 'Staff Wages', description: 'Weekly kitchen helper & cleaning overtime', amount: 3500, date: '10 Nov 2026', paymentMode: 'Cash' },
  { id: 'exp-5', category: 'Store Rent', description: 'Indiranagar Flagship Outlet monthly space advance', amount: 65000, date: '01 Nov 2026', paymentMode: 'Bank Transfer' },
];

export default function AccountingPage() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(EXPENSES);
  const [activeTab, setActiveTab] = useState<'pnl' | 'expenses' | 'gst'>('pnl');

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="accounting" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Accounting, Expenses &amp; P&amp;L</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                GST Ready Ledger
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Profit &amp; Loss statements, store operational expenses, cash-in/cash-out, and GST tax liability.
            </p>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 my-6">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'pnl' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📊 Profit &amp; Loss (P&amp;L)
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'expenses' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🧾 Store Operational Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('gst')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'gst' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📑 GST Tax Liability &amp; ITC
          </button>
        </div>

        {/* TAB 1: P&L STATEMENT */}
        {activeTab === 'pnl' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400">Total Gross Revenue (Nov 2026)</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">₹4,82,500</h3>
                <span className="text-xs text-emerald-600 font-bold">+18.2% vs Last Month</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400">Cost of Goods Sold (COGS - 28%)</span>
                <h3 className="text-2xl font-black text-orange-600 mt-1">₹1,35,100</h3>
                <span className="text-xs text-slate-400 font-medium">Raw Ingredients &amp; Spices</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400">Operating Expenses (OPEX)</span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">₹79,350</h3>
                <span className="text-xs text-slate-400 font-medium">Rent, Utilities, Wages</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400">Net Profit (EBITDA Margin 55%)</span>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">₹2,68,050</h3>
                <span className="text-xs text-emerald-600 font-bold">55.5% Healthy Net Margin</span>
              </div>
            </div>

            {/* P&L Statement Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900">Summary Profit &amp; Loss Statement</h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between font-bold text-slate-900">
                  <span>1. Gross Restaurant Sales (POS + Aggregators + QR)</span>
                  <span className="font-mono">₹4,82,500</span>
                </div>
                <div className="py-2.5 flex justify-between text-slate-600 pl-4">
                  <span>Less: Raw Material Consumption (Chicken, Meat, Rice, Ghee)</span>
                  <span className="font-mono text-red-600">- ₹1,35,100</span>
                </div>
                <div className="py-2.5 flex justify-between font-bold text-slate-900 bg-slate-50 px-3 rounded-lg">
                  <span>Gross Profit</span>
                  <span className="font-mono text-emerald-700">₹3,47,400 (72.0%)</span>
                </div>
                <div className="py-2.5 flex justify-between text-slate-600 pl-4">
                  <span>Less: Store Space Rent (Indiranagar)</span>
                  <span className="font-mono text-red-600">- ₹65,000</span>
                </div>
                <div className="py-2.5 flex justify-between text-slate-600 pl-4">
                  <span>Less: Kitchen Utilities (Gas, Water, Power)</span>
                  <span className="font-mono text-red-600">- ₹6,950</span>
                </div>
                <div className="py-2.5 flex justify-between text-slate-600 pl-4">
                  <span>Less: Packaging Handis &amp; Delivery Materials</span>
                  <span className="font-mono text-red-600">- ₹7,400</span>
                </div>
                <div className="py-3 flex justify-between font-black text-sm text-slate-900 bg-emerald-50 px-3 rounded-xl border border-emerald-200">
                  <span>Net Operating Profit</span>
                  <span className="font-mono text-emerald-700">₹2,68,050 (55.5%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Store Expense Ledger</h3>
                <p className="text-xs text-slate-500">Total logged operational expenses: ₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Payment Mode</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{e.category}</td>
                    <td className="px-5 py-3.5 text-slate-600">{e.description}</td>
                    <td className="px-5 py-3.5 text-slate-400">{e.date}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{e.paymentMode}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-right">
                      ₹{e.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: GST */}
        {activeTab === 'gst' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">GST Tax Liability Summary (GSTR-3B Ready)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">Total Output Tax Collected (5%)</span>
                <p className="font-mono font-bold text-lg text-slate-900 mt-1">₹24,125</p>
                <p className="text-[11px] text-slate-500 mt-1">CGST ₹12,062.50 + SGST ₹12,062.50</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">Input Tax Credit (ITC Eligible Purchases)</span>
                <p className="font-mono font-bold text-lg text-emerald-600 mt-1">₹6,755</p>
                <p className="text-[11px] text-slate-500 mt-1">Packaging &amp; Equipment GRN invoices</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">Net GST Payable to Govt</span>
                <p className="font-mono font-bold text-lg text-orange-600 mt-1">₹17,370</p>
                <p className="text-[11px] text-slate-500 mt-1">Filing due on 20th of this month</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
