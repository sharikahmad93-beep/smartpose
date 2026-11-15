'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface DeliveryOrder {
  id: string;
  orderRef: string;
  customerName: string;
  phone: string;
  address: string;
  amount: number;
  riderName: string;
  riderPhone: string;
  status: 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  etaMinutes: number;
}

const INITIAL_DELIVERIES: DeliveryOrder[] = [
  { id: 'del-1', orderRef: 'DIR-8812', customerName: 'Arjun Menon', phone: '+91 98450 11992', address: 'Flat 402, Shanti Apts, 12th Main, HAL 2nd Stage', amount: 890, riderName: 'Ramesh Kumar', riderPhone: '+91 99001 22334', status: 'OUT_FOR_DELIVERY', etaMinutes: 12 },
  { id: 'del-2', orderRef: 'WA-4412', customerName: 'Deepa Hegde', phone: '+91 97711 44552', address: 'Villa 18, Palm Meadows, Whitefield', amount: 1450, riderName: 'Suresh Gowda', riderPhone: '+91 98822 55661', status: 'ASSIGNED', etaMinutes: 25 },
  { id: 'del-3', orderRef: 'DIR-7721', customerName: 'Karthik Rao', phone: '+91 98110 33221', address: '100 Feet Road, Indiranagar', amount: 620, riderName: 'Ramesh Kumar', riderPhone: '+91 99001 22334', status: 'DELIVERED', etaMinutes: 0 },
];

export default function DeliveryManagementPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(INITIAL_DELIVERIES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const markDelivered = (id: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'DELIVERED', etaMinutes: 0 } : d))
    );
    showToast('Order marked Delivered! Customer receipt sent on WhatsApp.');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="delivery" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Delivery Fleet &amp; Rider Dispatch</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                In-House Fleet Live
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Dispatch in-house riders for direct website &amp; WhatsApp orders with real-time ETA and status updates.
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

        <div className="space-y-4 my-6">
          {deliveries.map((d) => (
            <div
              key={d.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900">{d.orderRef}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      d.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : d.status === 'OUT_FOR_DELIVERY'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Customer: <strong>{d.customerName}</strong> ({d.phone})
                </div>
                <p className="text-xs text-slate-500">{d.address}</p>
                <div className="text-xs font-mono font-bold text-slate-900 pt-1">
                  Amount: ₹{d.amount} • Rider: <span className="text-blue-600">{d.riderName}</span> ({d.riderPhone})
                </div>
              </div>

              <div className="flex items-center gap-3">
                {d.status !== 'DELIVERED' && (
                  <button
                    onClick={() => markDelivered(d.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    ✓ Mark Delivered
                  </button>
                )}
                {d.etaMinutes > 0 && (
                  <span className="font-mono font-bold text-xs text-slate-500">
                    ETA: ~{d.etaMinutes} mins
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
