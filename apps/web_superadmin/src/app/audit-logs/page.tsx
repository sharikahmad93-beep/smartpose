'use client';

import React, { useState } from 'react';
import SuperSidebar from '@/components/SuperSidebar';

interface AuditEntry {
  id: string;
  timestamp: string;
  tenantName: string;
  userEmail: string;
  action: string;
  device: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'BLOCKED';
}

const AUDIT_DATA: AuditEntry[] = [
  { id: 'aud-1', timestamp: '12:04:18 PM', tenantName: 'Biryani Express', userEmail: 'cashier.rohan@biryani.com', action: 'Settled Bill #104 (UPI ₹785)', device: 'Chrome Windows POS (F2)', ipAddress: '192.168.0.103', status: 'SUCCESS' },
  { id: 'aud-2', timestamp: '11:58:02 AM', tenantName: 'Rolls & Bowls Co.', userEmail: 'owner@rollsandbowls.in', action: 'Updated Menu Item #34 Price to ₹240', device: 'Admin Web Portal', ipAddress: '49.207.214.12', status: 'SUCCESS' },
  { id: 'aud-3', timestamp: '11:42:55 AM', tenantName: 'Biryani Express', userEmail: 'chef.karan@biryani.com', action: 'KDS Ticket #201 Bumped to Ready', device: 'Android Tablet KDS', ipAddress: '192.168.0.115', status: 'SUCCESS' },
  { id: 'aud-4', timestamp: '10:30:11 AM', tenantName: 'The Kebab & Tikka House', userEmail: 'unknown.attempt@gmail.com', action: 'Failed Manager PIN Attempt (3x)', device: 'Unknown Device', ipAddress: '103.21.58.9', status: 'BLOCKED' },
  { id: 'aud-5', timestamp: '09:15:00 AM', tenantName: 'Punjab Grill', userEmail: 'manager@punjabgrill.com', action: 'Cash Drawer Shift #208 Opened (₹5,000 float)', device: 'POS Desktop Windows', ipAddress: '192.168.1.4', status: 'SUCCESS' },
];

export default function AuditLogsPage() {
  const [logs] = useState<AuditEntry[]>(AUDIT_DATA);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <SuperSidebar activeTab="audit-logs" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Platform Security &amp; Audit Logs</h1>
            <p className="text-xs text-slate-400 mt-1">
              Immutable platform activity ledger, login security, device authorizations, and financial event trails.
            </p>
          </div>
        </header>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden my-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Tenant / Brand</th>
                <th className="px-6 py-4">User Identity</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">Device &amp; IP</th>
                <th className="px-6 py-4 text-right">Security Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-mono text-slate-400">{log.timestamp}</td>
                  <td className="px-6 py-4 font-bold text-white">{log.tenantName}</td>
                  <td className="px-6 py-4 font-mono text-slate-300">{log.userEmail}</td>
                  <td className="px-6 py-4 text-slate-200">{log.action}</td>
                  <td className="px-6 py-4 text-slate-400">
                    <div>{log.device}</div>
                    <span className="font-mono text-[10px] text-slate-500">{log.ipAddress}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
