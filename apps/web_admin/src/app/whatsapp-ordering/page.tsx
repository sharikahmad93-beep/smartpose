'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface WhatsAppTemplate {
  id: string;
  name: string;
  trigger: string;
  messageText: string;
  active: boolean;
}

export default function WhatsAppOrderingPage() {
  const [restaurantPhone, setRestaurantPhone] = useState('919876543210');
  const [cloudApiConnected, setCloudApiConnected] = useState(true);
  const [testCustomerPhone, setTestCustomerPhone] = useState('919845012345');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([
    {
      id: 'tpl-1',
      name: 'Digital Tax Invoice & Receipt',
      trigger: 'On Bill Settlement (POS / Cashier)',
      messageText:
        'Namaste {{CustomerName}}! 🙏 Thank you for dining with Biryani Express (Indiranagar). Your Bill #{{BillNo}} of ₹{{TotalAmount}} is settled. View e-Bill: {{BillLink}}',
      active: true,
    },
    {
      id: 'tpl-2',
      name: 'Order Confirmation & Live KDS Prep',
      trigger: 'On Online / QR Order Placement',
      messageText:
        '🥘 Your order #{{OrderNo}} is confirmed! Our head chef has started preparing your fresh dishes. Estimated prep time: {{PrepTime}} mins.',
      active: true,
    },
    {
      id: 'tpl-3',
      name: 'Dispatch & Delivery Rider Notification',
      trigger: 'On Rider Handover / Dispatch',
      messageText:
        '🛵 Hot & fresh! Your food is out for delivery with our rider {{RiderName}} (Phone: {{RiderPhone}}). Live GPS tracking: {{LiveTrackLink}}',
      active: true,
    },
    {
      id: 'tpl-4',
      name: 'Direct WhatsApp Food Ordering Bot',
      trigger: 'Customer sends "Hi / Menu"',
      messageText:
        'Welcome to Biryani Express Online! 🍛 Reply with your items or tap here to order directly with 0% platform fee: {{DirectStoreLink}}',
      active: true,
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const directOrderingLink = `https://wa.me/${restaurantPhone}?text=${encodeURIComponent(
    'Hi Biryani Express! I want to view today\'s special menu and order food.'
  )}`;

  const sendTestWhatsApp = () => {
    showToast(`Test WhatsApp Bill notification triggered to ${testCustomerPhone}!`);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="whatsapp-ordering" />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                WhatsApp Ordering & Digital e-Bills
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Meta Cloud API Active
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Zero-commission direct orders, automated GST receipt sending on WhatsApp, and real-time delivery notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/store"
              target="_blank"
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl font-semibold text-xs shadow-md transition flex items-center gap-2"
            >
              <span>🌐 Open Direct Web Storefront</span>
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

        {/* Top Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Direct Customer Channel</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">0% Commission Orders</h3>
            <p className="text-xs text-slate-500 mt-1">
              Save 22% - 28% aggregator commission by taking direct orders via WhatsApp & your custom store.
            </p>
            <a
              href={directOrderingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
            >
              Click-to-Chat Link →
            </a>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Digital Paperless Billing</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Instant WhatsApp Receipts</h3>
            <p className="text-xs text-slate-500 mt-1">
              Every settled bill sends a digital e-bill PDF link directly to customer&apos;s phone with GST breakdown.
            </p>
            <span className="inline-block mt-3 text-[11px] font-bold text-orange-600">
              Save ₹3,200/mo on thermal roll paper
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-400">Automated Bot Status</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Meta Business Cloud API</h3>
            <p className="text-xs text-slate-500 mt-1">
              Webhook: <code className="text-orange-600 font-mono text-[11px]">/api/v1/whatsapp/webhook</code>
            </p>
            <span className="inline-block mt-3 text-xs font-bold text-emerald-600">
              ● Connected: +{restaurantPhone}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Automation Templates */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">WhatsApp Notification Templates</h3>
                  <p className="text-xs text-slate-500">Auto-sent on POS actions and order triggers</p>
                </div>
                <button
                  onClick={() => showToast('New template submitted to Meta WhatsApp for 24-hr approval!')}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  + Create Template
                </button>
              </div>

              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold text-sm">💬</span>
                        <h4 className="font-bold text-xs text-slate-900">{tpl.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {tpl.trigger}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 font-sans leading-relaxed">
                      {tpl.messageText}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Status: Meta Approved (HSM)</span>
                      <button
                        onClick={() => {
                          setTemplates((prev) =>
                            prev.map((t) => (t.id === tpl.id ? { ...t, active: !t.active } : t))
                          );
                          showToast(`${tpl.name} status updated!`);
                        }}
                        className={`font-bold ${tpl.active ? 'text-emerald-600' : 'text-slate-400'}`}
                      >
                        {tpl.active ? '● Active' : '○ Paused'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: WhatsApp Phone Simulator & Test Sender */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900">Live WhatsApp e-Bill Dispatcher</h3>
              <p className="text-xs text-slate-500">Test sending an e-Bill receipt to any customer mobile number</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testCustomerPhone}
                      onChange={(e) => setTestCustomerPhone(e.target.value)}
                      placeholder="e.g. 919845012345"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                    <button
                      onClick={sendTestWhatsApp}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
                    >
                      🚀 Send e-Bill
                    </button>
                  </div>
                </div>

                {/* Simulated WhatsApp Phone Frame Preview */}
                <div className="mt-4 bg-[#e5ddd5] p-4 rounded-2xl shadow-inner border border-slate-300 space-y-3 text-xs">
                  <div className="flex items-center gap-2 bg-[#075e54] text-white p-2 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center font-black text-xs">
                      BE
                    </div>
                    <div>
                      <h5 className="font-bold text-xs leading-tight">Biryani Express Official</h5>
                      <span className="text-[10px] text-emerald-200">Verified Business Account ✓</span>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-xs text-slate-900 space-y-1.5 max-w-[90%]">
                    <p className="font-bold text-xs text-slate-900">
                      🧾 Biryani Express — Tax Invoice #104
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Dear Guest, thank you for your visit! Your bill for <strong>Table T-03</strong> is settled.
                    </p>
                    <div className="bg-slate-50 p-2 rounded-lg font-mono text-[11px] space-y-0.5 border border-slate-100">
                      <div className="flex justify-between">
                        <span>Chicken Dum Biryani (2x):</span>
                        <span>₹680</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (5%):</span>
                        <span>₹34</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-slate-200 pt-0.5 text-slate-900">
                        <span>Total Paid:</span>
                        <span>₹714</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right">13:52 ✓✓</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="font-bold text-slate-700 block mb-1">Restaurant Registered Phone (Sender)</label>
                  <input
                    type="text"
                    value={restaurantPhone}
                    onChange={(e) => setRestaurantPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
