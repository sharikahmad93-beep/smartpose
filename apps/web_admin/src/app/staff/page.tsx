'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  outlets: string[];
  status: 'ACTIVE' | 'INVITED';
  phone: string;
}

const DEMO_STAFF: StaffMember[] = [
  { id: '1', name: 'Vikramaditya Rao', email: 'owner@biryaniexpress.test', role: 'Restaurant Owner', outlets: ['Indiranagar', 'Whitefield'], status: 'ACTIVE', phone: '+91 98450 11001' },
  { id: '2', name: 'Karthik Subbaraj', email: 'manager.blr@biryaniexpress.test', role: 'Branch Manager', outlets: ['Indiranagar'], status: 'ACTIVE', phone: '+91 98450 22002' },
  { id: '3', name: 'Priya Sundaram', email: 'cashier1@biryaniexpress.test', role: 'Cashier / Billing', outlets: ['Indiranagar'], status: 'ACTIVE', phone: '+91 98450 33003' },
  { id: '4', name: 'Ramesh Gowda', email: 'waiter1@biryaniexpress.test', role: 'Captain / Waiter', outlets: ['Indiranagar'], status: 'ACTIVE', phone: '+91 98450 44004' },
  { id: '5', name: 'Suresh Kumar', email: 'waiter2@biryaniexpress.test', role: 'Captain / Waiter', outlets: ['Indiranagar'], status: 'ACTIVE', phone: '+91 98450 55005' },
  { id: '6', name: 'Chef Imtiaz Qureshi', email: 'headchef@biryaniexpress.test', role: 'Kitchen Staff / Chef', outlets: ['Indiranagar'], status: 'ACTIVE', phone: '+91 98450 66006' },
  { id: '7', name: 'Ananya Sharma', email: 'manager.whf@biryaniexpress.test', role: 'Branch Manager', outlets: ['Whitefield'], status: 'ACTIVE', phone: '+91 98450 77007' },
];

export default function StaffPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="staff" />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Staff Management &amp; Role-Based Access</h2>
            <p className="text-sm text-slate-500">Manage employee memberships, branch permissions, and terminal access</p>
          </div>
          <button
            onClick={() => alert('Invite staff modal: enter phone number, role and assigned outlet.')}
            className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-500 transition shadow"
          >
            + Invite Staff Member
          </button>
        </header>

        {/* Staff Table */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">System Role</th>
                <th className="py-3.5 px-6">Assigned Outlet(s)</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {DEMO_STAFF.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{staff.name}</div>
                    <div className="text-xs text-slate-400">{staff.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-1.5 flex-wrap">
                      {staff.outlets.map((o) => (
                        <span key={o} className="text-xs font-medium px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                          {o}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-mono text-xs">{staff.phone}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => alert(`Editing permissions for ${staff.name}`)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-800 mr-3"
                    >
                      Edit Role
                    </button>
                    <button
                      onClick={() => alert(`RLS Permission matrix: 27 policies granted for ${staff.role}`)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Permissions
                    </button>
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
