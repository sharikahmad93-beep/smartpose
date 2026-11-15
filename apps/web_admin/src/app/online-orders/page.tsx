'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export type MarketplaceChannel = 'SWIGGY' | 'ZOMATO' | 'ONDC' | 'MAGICPIN' | 'DOTPE' | 'THRIVE';

export interface RestaurantBrand {
  id: string;
  name: string;
  tagline: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}

export interface MarketplaceAccount {
  id: string;
  brandId: string;
  brandName: string;
  outletName: string;
  platform: MarketplaceChannel;
  storeNameOnPlatform: string;
  storeId: string; // e.g. ResID 18429103 or Swiggy RB-9014
  apiKey: string;
  partnerEmail: string;
  isOnline: boolean;
  autoAccept: boolean;
  prepTime: number;
  commissionRate: number;
  webhookUrl: string;
  lastPingTime: string;
}

export interface OnlineOrder {
  id: string;
  brandId: string;
  brandName: string;
  brandBadge: string;
  channel: MarketplaceChannel;
  channelName: string;
  orderRef: string;
  buyerApp?: string; // e.g. 'Paytm' or 'PhonePe Pincode' for ONDC
  customerName: string;
  customerArea: string;
  items: Array<{ name: string; quantity: number; price: number; notes?: string }>;
  billTotal: number;
  commissionRate: number;
  status: 'PENDING' | 'ACCEPTED' | 'FOOD_READY' | 'DISPATCHED';
  riderName?: string;
  riderEta?: string;
  createdAt: string;
  prepTimeMinutes: number;
  storeId: string;
}

const DEFAULT_BRANDS: RestaurantBrand[] = [
  {
    id: 'brand-1',
    name: 'Biryani Express',
    tagline: 'Authentic Dum Biryani & Kebabs',
    color: 'bg-orange-600',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-200',
    badgeText: 'text-orange-600',
    icon: '🍛',
  },
  {
    id: 'brand-2',
    name: 'Rolls & Bowls Co.',
    tagline: 'Kathi Rolls, Rice Bowls & Combos',
    color: 'bg-teal-600',
    badgeBg: 'bg-teal-100 text-teal-900 border-teal-200',
    badgeText: 'text-teal-600',
    icon: '🌯',
  },
  {
    id: 'brand-3',
    name: 'The Kebab & Tikka House',
    tagline: 'Charcoal Tandoori & Mughlai Starters',
    color: 'bg-rose-600',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
    badgeText: 'text-rose-600',
    icon: '🍢',
  },
  {
    id: 'brand-4',
    name: 'Chai & Mithaas',
    tagline: 'Irani Chai, Samosas & Desserts',
    color: 'bg-amber-600',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    badgeText: 'text-amber-600',
    icon: '☕',
  },
];

const DEFAULT_ACCOUNTS: MarketplaceAccount[] = [
  // 1. Biryani Express accounts
  {
    id: 'acc-1',
    brandId: 'brand-1',
    brandName: 'Biryani Express',
    outletName: 'Indiranagar Flagship',
    platform: 'ZOMATO',
    storeNameOnPlatform: 'Biryani Express - Indiranagar',
    storeId: '18429103',
    apiKey: 'zom_live_sec_99381a8b29f0012c44',
    partnerEmail: 'partner.biryani@zomatomerchant.com',
    isOnline: true,
    autoAccept: false,
    prepTime: 20,
    commissionRate: 0.20,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/zomato/be-ind',
    lastPingTime: '13:52:10',
  },
  {
    id: 'acc-2',
    brandId: 'brand-1',
    brandName: 'Biryani Express',
    outletName: 'Indiranagar Flagship',
    platform: 'SWIGGY',
    storeNameOnPlatform: 'Biryani Express - Indiranagar',
    storeId: 'SWG-BLR-IND-5520',
    apiKey: 'swg_live_auth_88491bb0203f7a11',
    partnerEmail: 'owner.blr@swiggypartner.in',
    isOnline: true,
    autoAccept: true,
    prepTime: 15,
    commissionRate: 0.22,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/swiggy/be-ind',
    lastPingTime: '13:50:44',
  },
  {
    id: 'acc-3',
    brandId: 'brand-1',
    brandName: 'Biryani Express',
    outletName: 'Indiranagar Flagship',
    platform: 'ONDC',
    storeNameOnPlatform: 'Biryani Express (ONDC Seller)',
    storeId: 'ONDC-IND-BIRYANI-01',
    apiKey: 'ondc_np_pub_key_88204910398',
    partnerEmail: 'ondc-seller@biryaniexpress.in',
    isOnline: true,
    autoAccept: true,
    prepTime: 15,
    commissionRate: 0.035,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/ondc/be-ind',
    lastPingTime: '13:48:20',
  },

  // 2. Rolls & Bowls Co. (Virtual Brand in same kitchen)
  {
    id: 'acc-4',
    brandId: 'brand-2',
    brandName: 'Rolls & Bowls Co.',
    outletName: 'Indiranagar Cloud Kitchen',
    platform: 'ZOMATO',
    storeNameOnPlatform: 'Rolls & Bowls Co. - Indiranagar',
    storeId: '22019481',
    apiKey: 'zom_rb_sec_77192834bba',
    partnerEmail: 'rolls.bowls@zomatomerchant.com',
    isOnline: true,
    autoAccept: true,
    prepTime: 15,
    commissionRate: 0.20,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/zomato/rb-ind',
    lastPingTime: '13:51:30',
  },
  {
    id: 'acc-5',
    brandId: 'brand-2',
    brandName: 'Rolls & Bowls Co.',
    outletName: 'Indiranagar Cloud Kitchen',
    platform: 'SWIGGY',
    storeNameOnPlatform: 'Rolls & Bowls Co. - Indiranagar',
    storeId: 'SWG-BLR-RB-9014',
    apiKey: 'swg_rb_auth_99182374bb',
    partnerEmail: 'rolls.bowls@swiggypartner.in',
    isOnline: true,
    autoAccept: true,
    prepTime: 15,
    commissionRate: 0.22,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/swiggy/rb-ind',
    lastPingTime: '13:49:15',
  },

  // 3. The Kebab & Tikka House (Virtual Brand)
  {
    id: 'acc-6',
    brandId: 'brand-3',
    brandName: 'The Kebab & Tikka House',
    outletName: 'Indiranagar Cloud Kitchen',
    platform: 'ZOMATO',
    storeNameOnPlatform: 'The Kebab & Tikka House - Indiranagar',
    storeId: '31940219',
    apiKey: 'zom_kb_sec_4482910398',
    partnerEmail: 'kebabhouse@zomatomerchant.com',
    isOnline: true,
    autoAccept: false,
    prepTime: 20,
    commissionRate: 0.20,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/zomato/kb-ind',
    lastPingTime: '13:46:12',
  },
  {
    id: 'acc-7',
    brandId: 'brand-3',
    brandName: 'The Kebab & Tikka House',
    outletName: 'Indiranagar Cloud Kitchen',
    platform: 'SWIGGY',
    storeNameOnPlatform: 'The Kebab & Tikka House - Indiranagar',
    storeId: 'SWG-BLR-KB-3310',
    apiKey: 'swg_kb_auth_119284771',
    partnerEmail: 'kebabhouse@swiggypartner.in',
    isOnline: true,
    autoAccept: true,
    prepTime: 15,
    commissionRate: 0.22,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/swiggy/kb-ind',
    lastPingTime: '13:45:00',
  },
  {
    id: 'acc-8',
    brandId: 'brand-3',
    brandName: 'The Kebab & Tikka House',
    outletName: 'Indiranagar Cloud Kitchen',
    platform: 'MAGICPIN',
    storeNameOnPlatform: 'The Kebab & Tikka House - Indiranagar',
    storeId: 'MP-KB-4412',
    apiKey: 'mp_sec_kb_992182',
    partnerEmail: 'kebabhouse@magicpin.in',
    isOnline: true,
    autoAccept: false,
    prepTime: 20,
    commissionRate: 0.12,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/magicpin/kb-ind',
    lastPingTime: '13:40:00',
  },

  // 4. Chai & Mithaas (Desserts & Beverages)
  {
    id: 'acc-9',
    brandId: 'brand-4',
    brandName: 'Chai & Mithaas',
    outletName: 'Indiranagar Cloud Kitchen',
    platform: 'DOTPE',
    storeNameOnPlatform: 'Chai & Mithaas (WhatsApp Direct Store)',
    storeId: 'DOT-CHAI-881',
    apiKey: 'dotpe_live_chai_991823',
    partnerEmail: 'orders@chai-mithaas.in',
    isOnline: true,
    autoAccept: true,
    prepTime: 12,
    commissionRate: 0.0,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/dotpe/chai-ind',
    lastPingTime: '13:42:15',
  },
  {
    id: 'acc-10',
    brandId: 'brand-1',
    brandName: 'Biryani Express',
    outletName: 'Indiranagar Flagship',
    platform: 'THRIVE',
    storeNameOnPlatform: 'Biryani Express D2C Online',
    storeId: 'thrive-biryani-express-ind',
    apiKey: 'thrive_auth_token_771923',
    partnerEmail: 'blr@thrivenow.in',
    isOnline: true,
    autoAccept: true,
    prepTime: 15,
    commissionRate: 0.03,
    webhookUrl: 'https://api.biryaniexpress.com/api/v1/webhooks/thrive/webhook',
    lastPingTime: '13:38:40',
  },
];

const INITIAL_UNIFIED_ORDERS: OnlineOrder[] = [
  // Order 1: Biryani Express on Swiggy
  {
    id: 'ord-1',
    brandId: 'brand-1',
    brandName: 'Biryani Express',
    brandBadge: 'bg-orange-100 text-orange-900 border-orange-200',
    channel: 'SWIGGY',
    channelName: 'Swiggy',
    orderRef: 'SWG-984210',
    storeId: 'SWG-BLR-IND-5520',
    customerName: 'Ananya Sharma',
    customerArea: 'Indiranagar 12th Main (1.4 km)',
    items: [
      { name: 'Royal Chicken Dum Biryani', quantity: 2, price: 290, notes: 'Extra spicy, salan separately' },
      { name: 'Chicken 65 (Crispy Andhra)', quantity: 1, price: 260 },
      { name: 'Fresh Lime Soda', quantity: 2, price: 60 },
    ],
    billTotal: 960,
    commissionRate: 0.22,
    status: 'PENDING',
    riderName: 'Manoj Kumar (KA03-EU-8921)',
    riderEta: 'Arriving in 6 mins',
    createdAt: '13:52',
    prepTimeMinutes: 15,
  },
  // Order 2: Biryani Express on Zomato (Voice Search Order #4567)
  {
    id: 'ord-2',
    brandId: 'brand-1',
    brandName: 'Biryani Express',
    brandBadge: 'bg-orange-100 text-orange-900 border-orange-200',
    channel: 'ZOMATO',
    channelName: 'Zomato',
    orderRef: 'ZOM-4567',
    storeId: 'ResID: 18429103',
    customerName: 'Vikram Aditya',
    customerArea: 'Indiranagar 100ft Rd (1.2 km)',
    items: [
      { name: 'Royal Chicken Dum Biryani (650 gm)', quantity: 2, price: 290, notes: 'Extra spicy salan' },
      { name: 'Chicken 65 (Crispy Andhra 8 Pcs)', quantity: 1, price: 260 },
      { name: 'Fresh Lime Soda (300 ml)', quantity: 2, price: 60 },
    ],
    billTotal: 960,
    commissionRate: 0.20,
    status: 'ACCEPTED',
    riderName: 'Rajesh K. (Zomato Valet KA03-EA-4567)',
    riderEta: 'Arrived at restaurant',
    createdAt: '13:58',
    prepTimeMinutes: 15,
  },
  // Order 3: The Kebab & Tikka House on Swiggy
  {
    id: 'ord-3',
    brandId: 'brand-3',
    brandName: 'The Kebab & Tikka House',
    brandBadge: 'bg-rose-100 text-rose-900 border-rose-200',
    channel: 'SWIGGY',
    channelName: 'Swiggy',
    orderRef: 'SWG-KB-11029',
    storeId: 'SWG-BLR-KB-3310',
    customerName: 'Megha Singhania',
    customerArea: 'HAL 2nd Stage, 100ft Road (0.8 km)',
    items: [
      { name: 'Murgh Malai Kebab (6 Pcs)', quantity: 2, price: 280, notes: 'Extra rumali roti and onion rings' },
      { name: 'Tandoori Paneer Tikka Platter', quantity: 1, price: 240 },
    ],
    billTotal: 800,
    commissionRate: 0.22,
    status: 'ACCEPTED',
    riderName: 'Sunil Rao (KA03-TR-9002)',
    riderEta: 'Arriving in 3 mins',
    createdAt: '13:48',
    prepTimeMinutes: 15,
  },
  // Order 4: Biryani Express on ONDC
  {
    id: 'ord-4',
    brandId: 'brand-1',
    brandName: 'Biryani Express',
    brandBadge: 'bg-orange-100 text-orange-900 border-orange-200',
    channel: 'ONDC',
    channelName: 'ONDC Network',
    orderRef: 'ONDC-7749102',
    buyerApp: 'PhonePe Pincode App',
    storeId: 'ONDC-BE-01',
    customerName: 'Rohit Kulkarni',
    customerArea: 'Domlur Layout, 4th Cross (2.8 km)',
    items: [
      { name: 'Royal Chicken Dum Biryani', quantity: 1, price: 290 },
      { name: 'Butter Naan', quantity: 2, price: 50 },
      { name: 'Irani Masala Chai', quantity: 1, price: 40 },
    ],
    billTotal: 430,
    commissionRate: 0.035,
    status: 'ACCEPTED',
    riderName: 'Shadowfax Rider (ONDC Logistics)',
    riderEta: 'Arriving in 5 mins',
    createdAt: '13:45',
    prepTimeMinutes: 15,
  },
  // Order 5: Chai & Mithaas on DotPe WhatsApp
  {
    id: 'ord-5',
    brandId: 'brand-4',
    brandName: 'Chai & Mithaas',
    brandBadge: 'bg-amber-100 text-amber-900 border-amber-200',
    channel: 'DOTPE',
    channelName: 'DotPe WhatsApp',
    orderRef: 'DOT-CHAI-992',
    storeId: 'DOT-CHAI-881',
    customerName: 'Karthik Subbaraj',
    customerArea: 'Direct Counter Pickup (Indiranagar)',
    items: [
      { name: 'Irani Masala Chai Flask (500ml)', quantity: 1, price: 120 },
      { name: 'Hot Gulab Jamun (4 Pcs)', quantity: 2, price: 150 },
    ],
    billTotal: 420,
    commissionRate: 0.0,
    status: 'FOOD_READY',
    riderName: 'Self Pickup by Customer',
    riderEta: 'At Counter',
    createdAt: '13:35',
    prepTimeMinutes: 10,
  },
  // Order 6: The Kebab & Tikka House on Magicpin
  {
    id: 'ord-6',
    brandId: 'brand-3',
    brandName: 'The Kebab & Tikka House',
    brandBadge: 'bg-rose-100 text-rose-900 border-rose-200',
    channel: 'MAGICPIN',
    channelName: 'Magicpin',
    orderRef: 'MP-88310',
    storeId: 'MP-KB-4412',
    customerName: 'Divya Nair',
    customerArea: 'Koramangala 1st Block (3.2 km)',
    items: [
      { name: 'Nawabi Paneer Dum Biryani', quantity: 1, price: 240 },
      { name: 'Tandoori Paneer Tikka', quantity: 1, price: 230 },
      { name: 'Fresh Lime Soda', quantity: 1, price: 60 },
    ],
    billTotal: 530,
    commissionRate: 0.12,
    status: 'DISPATCHED',
    riderName: 'Dunzo Rider (KA05-MN-2210)',
    riderEta: 'Delivered',
    createdAt: '13:25',
    prepTimeMinutes: 15,
  },
];

export default function OnlineOrdersHubPage() {
  const [brands, setBrands] = useState<RestaurantBrand[]>(DEFAULT_BRANDS);
  const [accounts, setAccounts] = useState<MarketplaceAccount[]>(DEFAULT_ACCOUNTS);
  const [orders, setOrders] = useState<OnlineOrder[]>(INITIAL_UNIFIED_ORDERS);

  // Filters
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<'ALL' | string>('ALL');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<'ALL' | MarketplaceChannel>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'FOOD_READY' | 'DISPATCHED'>('ALL');

  // Inspector & Modal States
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [activeInspectorAccountId, setActiveInspectorAccountId] = useState<string>('acc-1');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // New Account Form State
  const [newAccBrandId, setNewAccBrandId] = useState<string>('brand-1');
  const [newAccPlatform, setNewAccPlatform] = useState<MarketplaceChannel>('ZOMATO');
  const [newAccStoreName, setNewAccStoreName] = useState<string>('');
  const [newAccStoreId, setNewAccStoreId] = useState<string>('');
  const [newAccEmail, setNewAccEmail] = useState<string>('');
  const [newAccApiKey, setNewAccApiKey] = useState<string>('');

  const toggleAccountOnline = (accId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accId ? { ...acc, isOnline: !acc.isOnline } : acc))
    );
  };

  const updateOrderStatus = (orderId: string, nextStatus: OnlineOrder['status']) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: nextStatus } : ord))
    );
  };

  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccStoreId || !newAccStoreName) return;

    const brand = brands.find((b) => b.id === newAccBrandId);
    const newAcc: MarketplaceAccount = {
      id: `acc-${Date.now()}`,
      brandId: newAccBrandId,
      brandName: brand ? brand.name : 'Virtual Restaurant',
      outletName: 'Indiranagar Kitchen',
      platform: newAccPlatform,
      storeNameOnPlatform: newAccStoreName,
      storeId: newAccStoreId,
      apiKey: newAccApiKey || `live_key_${Date.now()}`,
      partnerEmail: newAccEmail || 'manager@biryaniexpress.test',
      isOnline: true,
      autoAccept: true,
      prepTime: 15,
      commissionRate: newAccPlatform === 'SWIGGY' ? 0.22 : newAccPlatform === 'ZOMATO' ? 0.20 : 0.05,
      webhookUrl: `https://api.biryaniexpress.com/api/v1/webhooks/${newAccPlatform.toLowerCase()}/${Date.now()}`,
      lastPingTime: 'Just now',
    };

    setAccounts([newAcc, ...accounts]);
    setActiveInspectorAccountId(newAcc.id);
    setIsAddAccountModalOpen(false);
    setNewAccStoreName('');
    setNewAccStoreId('');
    setNewAccEmail('');
    setNewAccApiKey('');

    setFeedbackToast(`✓ Account Successfully Linked! "${newAcc.storeNameOnPlatform}" added to multi-ID feed.`);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Filtered orders across all multi-brands & platforms
  const filteredOrders = orders.filter((o) => {
    const matchesBrand = selectedBrandFilter === 'ALL' || o.brandId === selectedBrandFilter;
    const matchesPlatform = selectedPlatformFilter === 'ALL' || o.channel === selectedPlatformFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || o.status === selectedStatusFilter;
    return matchesBrand && matchesPlatform && matchesStatus;
  });

  const totalGrossRevenue = orders.reduce((acc, o) => acc + o.billTotal, 0);
  const totalCommission = orders.reduce((acc, o) => acc + o.billTotal * o.commissionRate, 0);
  const totalNetPayout = totalGrossRevenue - totalCommission;

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const activeInspectorAccount = accounts.find((a) => a.id === activeInspectorAccountId) || accounts[0];

  const triggerHandshake = (acc: MarketplaceAccount) => {
    setFeedbackToast(`⚡ Handshaking ${acc.platform} API for ${acc.brandName} (${acc.storeId})...`);
    setTimeout(() => {
      setFeedbackToast(`✓ 200 OK! Connection active for ${acc.storeNameOnPlatform} (Latency 32ms)`);
      setTimeout(() => setFeedbackToast(null), 4000);
    }, 600);
  };

  const triggerMenuSync = (acc: MarketplaceAccount) => {
    setFeedbackToast(`🔄 Pushing catalog & pricing to ${acc.platform} for ${acc.brandName}...`);
    setTimeout(() => {
      setFeedbackToast(`✓ Menu Synced! 12 dishes & variants updated for ${acc.storeNameOnPlatform}.`);
      setTimeout(() => setFeedbackToast(null), 4000);
    }, 1000);
  };

  const getPlatformBadge = (platform: MarketplaceChannel) => {
    switch (platform) {
      case 'SWIGGY':
        return <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded">SWIGGY</span>;
      case 'ZOMATO':
        return <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded">ZOMATO</span>;
      case 'ONDC':
        return <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded">ONDC</span>;
      case 'MAGICPIN':
        return <span className="bg-pink-600 text-white text-[10px] font-black px-2 py-0.5 rounded">MAGICPIN</span>;
      case 'DOTPE':
        return <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded">DOTPE</span>;
      case 'THRIVE':
        return <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded">THRIVE</span>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* 1. Global Left Navigation */}
      <Sidebar activeTab="online-orders" />

      {/* 2. DEDICATED MULTI-BRAND & MULTI-ID LEFT PANEL */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 shadow-sm z-10 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header & Add Button */}
          <div className="pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <span>🏢 Multi-Restaurant IDs</span>
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {accounts.length} Linked
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Cloud Kitchens &amp; Multi-ResIDs</p>

            <button
              onClick={() => setIsAddAccountModalOpen(true)}
              className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
            >
              <span>+ Add Restaurant / ResID</span>
            </button>
          </div>

          {/* Filter All Accounts */}
          <div className="pt-3 pb-2 shrink-0">
            <button
              onClick={() => {
                setSelectedBrandFilter('ALL');
                setSelectedPlatformFilter('ALL');
              }}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold text-xs transition flex items-center justify-between ${
                selectedBrandFilter === 'ALL' && selectedPlatformFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🌐</span>
                <span>All Brands &amp; Accounts</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedBrandFilter === 'ALL' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {orders.length}
              </span>
            </button>
          </div>

          {/* Virtual Brands & Accounts Grouped List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {brands.map((brand) => {
              const brandAccounts = accounts.filter((a) => a.brandId === brand.id);
              const brandOrderCount = orders.filter((o) => o.brandId === brand.id).length;
              const isBrandActive = selectedBrandFilter === brand.id;

              return (
                <div key={brand.id} className="space-y-1.5">
                  {/* Brand Header */}
                  <div
                    onClick={() => {
                      setSelectedBrandFilter(isBrandActive ? 'ALL' : brand.id);
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isBrandActive
                        ? `${brand.badgeBg} font-black shadow-sm`
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{brand.icon}</span>
                      <span className="font-extrabold text-xs">{brand.name}</span>
                    </div>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white/70">
                      {brandOrderCount} ord
                    </span>
                  </div>

                  {/* Linked IDs under this Brand */}
                  <div className="pl-2 space-y-1">
                    {brandAccounts.map((acc) => {
                      const isInspecting = activeInspectorAccountId === acc.id;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => {
                            setActiveInspectorAccountId(acc.id);
                            setIsRightPanelOpen(true);
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                            isInspecting
                              ? 'border-orange-500 bg-orange-50/70 font-bold'
                              : 'border-slate-100 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-[10px] font-black">{acc.platform}</span>
                            <span className="font-mono text-[10px] text-slate-500 truncate max-w-[90px]">
                              {acc.storeId}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAccountOnline(acc.id);
                            }}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              acc.isOnline
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {acc.isOnline ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Inspector launcher footer */}
          <div className="pt-3 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
            >
              <span>⚙️ Inspect Active ID Settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 3. CENTER: UNIFIED MULTI-RESTAURANT ORDERS FEED */}
      <main className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Top Filter Bar */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  {selectedBrandFilter === 'ALL'
                    ? 'Unified Multi-Restaurant Feed'
                    : brands.find((b) => b.id === selectedBrandFilter)?.name}
                </h2>
                <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-0.5 rounded-full">
                  {filteredOrders.length} Orders Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized cloud kitchen intake &bull; Zomato, Swiggy, ONDC, Magicpin, DotPe, Thrive
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5"
              >
                <span>+ Add ResID / Outlet</span>
              </button>
              <button
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl transition shadow-sm"
              >
                {isRightPanelOpen ? '👉 Hide Side Panel' : '👈 Show Side Panel'}
              </button>
            </div>
          </header>

          {/* Feedback Toast */}
          {feedbackToast && (
            <div className="mt-4 p-3 bg-slate-900 text-white text-xs rounded-xl flex items-center gap-2 font-mono shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{feedbackToast}</span>
            </div>
          )}

          {/* Pending Alerts Banner */}
          {pendingCount > 0 && (
            <div className="mt-4 p-3.5 bg-orange-500 text-white rounded-xl flex items-center justify-between shadow-md shadow-orange-500/20 animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔔</span>
                <div>
                  <h4 className="font-bold text-xs">
                    {pendingCount} Multi-Brand Order(s) Awaiting Acceptance!
                  </h4>
                  <p className="text-[11px] text-orange-100">
                    Auto-routes with branded packaging tags to Kitchen KDS
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  orders.forEach((o) => {
                    if (o.status === 'PENDING') updateOrderStatus(o.id, 'ACCEPTED');
                  });
                }}
                className="bg-white text-orange-600 hover:bg-orange-50 font-black text-xs px-3.5 py-1.5 rounded-lg transition shadow"
              >
                Accept All
              </button>
            </div>
          )}

          {/* Financial Aggregation across all multi-accounts */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Revenue (All Brands)</span>
              <div className="text-xl font-black text-slate-900 mt-1">₹{totalGrossRevenue.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400 block">{orders.length} orders total</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Commission Cut</span>
              <div className="text-xl font-black text-red-600 mt-1">-₹{Math.round(totalCommission).toLocaleString()}</div>
              <span className="text-[10px] text-slate-400 block">Blended marketplace fees</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Net Kitchen Payout</span>
              <div className="text-xl font-black text-emerald-600 mt-1">₹{Math.round(totalNetPayout).toLocaleString()}</div>
              <span className="text-[10px] text-emerald-600 font-semibold block">Consolidated settlement</span>
            </div>
          </div>

          {/* Quick Platform Filter Pills */}
          <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Platform:</span>
            {['ALL', 'SWIGGY', 'ZOMATO', 'ONDC', 'MAGICPIN', 'DOTPE', 'THRIVE'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatformFilter(p as any)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  selectedPlatformFilter === p
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status Filter Tabs */}
          <div className="mt-3 flex items-center gap-2 border-b border-slate-200 pb-2">
            {(
              [
                { key: 'ALL', label: 'All Orders' },
                { key: 'PENDING', label: 'Pending' },
                { key: 'ACCEPTED', label: 'In Kitchen' },
                { key: 'FOOD_READY', label: 'Food Ready' },
                { key: 'DISPATCHED', label: 'Dispatched' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setSelectedStatusFilter(t.key)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  selectedStatusFilter === t.key
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Unified Orders Cards Grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Brand Badge & Platform */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${ord.brandBadge}`}>
                        🏷️ {ord.brandName}
                      </span>
                      {getPlatformBadge(ord.channel)}
                      <span className="font-mono text-[10px] text-slate-500">{ord.storeId}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{ord.createdAt}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{ord.orderRef}</span>
                    {ord.buyerApp && (
                      <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                        {ord.buyerApp}
                      </span>
                    )}
                  </div>

                  {/* Customer & Amounts */}
                  <div className="mt-2 flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{ord.customerName}</h4>
                      <p className="text-[11px] text-slate-500">{ord.customerArea}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-slate-900">₹{ord.billTotal}</span>
                      <p className="text-[10px] text-slate-400">
                        Net: ₹{Math.round(ord.billTotal * (1 - ord.commissionRate))}
                      </p>
                    </div>
                  </div>

                  {/* Itemized list */}
                  <div className="mt-2 bg-slate-50 rounded-lg p-2.5 space-y-1 border border-slate-100 text-xs">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          <strong className="text-slate-800">{item.quantity}x</strong> {item.name}
                        </span>
                        <span className="text-slate-600 font-mono">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Rider info */}
                  {ord.riderName && (
                    <div className="mt-2 bg-blue-50/70 border border-blue-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span>🛵</span>
                        <span className="text-[11px] font-semibold text-slate-800">{ord.riderName}</span>
                      </div>
                      <span className="text-[9px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                        {ord.riderEta}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex gap-2">
                  {ord.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'ACCEPTED')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
                      >
                        ✓ Accept &amp; KOT
                      </button>
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'DISPATCHED')}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-500 hover:text-red-600 font-bold text-xs rounded-lg"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {ord.status === 'ACCEPTED' && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'FOOD_READY')}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition"
                    >
                      🔔 Food Ready (Pack as {ord.brandName})
                    </button>
                  )}

                  {ord.status === 'FOOD_READY' && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'DISPATCHED')}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition"
                    >
                      🚀 Handover to Rider
                    </button>
                  )}

                  {ord.status === 'DISPATCHED' && (
                    <div className="w-full py-1 text-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                      ✓ Dispatched to Customer
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 4. DEDICATED MULTI-ACCOUNT RIGHT INSPECTOR */}
      {isRightPanelOpen && activeInspectorAccount && (
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col justify-between p-5 shrink-0 shadow-sm overflow-y-auto">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">⚙️</span>
                <h3 className="font-black text-sm text-slate-900">Account Inspector</h3>
              </div>
              <button
                onClick={() => setIsRightPanelOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Account Quick Selector Switcher */}
            <div className="mt-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Active Inspected Account:
              </label>
              <select
                value={activeInspectorAccountId}
                onChange={(e) => setActiveInspectorAccountId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-xs text-slate-800 bg-slate-50 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.platform}] {a.brandName} - {a.storeId}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Account Status Card */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-xs text-slate-900">{activeInspectorAccount.brandName}</h4>
                  <p className="text-[10px] text-slate-500">{activeInspectorAccount.storeNameOnPlatform}</p>
                </div>
                {getPlatformBadge(activeInspectorAccount.platform)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="font-mono text-slate-400">ID: {activeInspectorAccount.storeId}</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  ● 200 OK Handshake
                </span>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Restaurant Store / ResID</label>
                <input
                  type="text"
                  value={activeInspectorAccount.storeId}
                  onChange={(e) =>
                    setAccounts((prev) =>
                      prev.map((a) =>
                        a.id === activeInspectorAccount.id ? { ...a, storeId: e.target.value } : a
                      )
                    )
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Partner Email / Portal Login</label>
                <input
                  type="text"
                  value={activeInspectorAccount.partnerEmail}
                  onChange={(e) =>
                    setAccounts((prev) =>
                      prev.map((a) =>
                        a.id === activeInspectorAccount.id ? { ...a, partnerEmail: e.target.value } : a
                      )
                    )
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">API Key / Merchant Token</label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-orange-600 hover:underline font-semibold"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={activeInspectorAccount.apiKey}
                  onChange={(e) =>
                    setAccounts((prev) =>
                      prev.map((a) =>
                        a.id === activeInspectorAccount.id ? { ...a, apiKey: e.target.value } : a
                      )
                    )
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prep Time</label>
                  <select
                    value={activeInspectorAccount.prepTime}
                    onChange={(e) =>
                      setAccounts((prev) =>
                        prev.map((a) =>
                          a.id === activeInspectorAccount.id
                            ? { ...a, prepTime: parseInt(e.target.value) }
                            : a
                        )
                      )
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value={15}>15 Mins</option>
                    <option value={20}>20 Mins</option>
                    <option value={30}>30 Mins</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Auto KOT</label>
                  <button
                    type="button"
                    onClick={() =>
                      setAccounts((prev) =>
                        prev.map((a) =>
                          a.id === activeInspectorAccount.id
                            ? { ...a, autoAccept: !a.autoAccept }
                            : a
                        )
                      )
                    }
                    className={`w-full py-1.5 rounded-lg font-bold text-[11px] transition ${
                      activeInspectorAccount.autoAccept ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {activeInspectorAccount.autoAccept ? 'AUTO' : 'MANUAL'}
                  </button>
                </div>
              </div>

              {/* Webhook endpoint */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                <span className="font-bold text-slate-600 block mb-0.5">Webhook Ingestion Endpoint:</span>
                <code className="block font-mono text-slate-700 break-all bg-white p-1 rounded border border-slate-200 select-all">
                  {activeInspectorAccount.webhookUrl}
                </code>
              </div>
            </div>
          </div>

          {/* Right Panel Actions */}
          <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => triggerHandshake(activeInspectorAccount)}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition"
              >
                ⚡ Ping Test
              </button>
              <button
                type="button"
                onClick={() => triggerMenuSync(activeInspectorAccount)}
                className="py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-lg text-xs transition border border-orange-200"
              >
                🔄 Sync Menu
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                alert(`Settings saved for ${activeInspectorAccount.storeNameOnPlatform}!`);
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition shadow"
            >
              Save Configuration
            </button>
          </div>
        </aside>
      )}

      {/* 5. MODAL: ADD MULTI-ID RESTAURANT ACCOUNT */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  + Link New Restaurant / Multi-ID Account
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add another Zomato ResID, Swiggy Outlet, or virtual cloud kitchen brand
                </p>
              </div>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewAccount} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Virtual Brand / Restaurant</label>
                <select
                  value={newAccBrandId}
                  onChange={(e) => setNewAccBrandId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.icon} {b.name} ({b.tagline})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Marketplace Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ZOMATO', 'SWIGGY', 'ONDC', 'MAGICPIN', 'DOTPE', 'THRIVE'] as MarketplaceChannel[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewAccPlatform(p)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        newAccPlatform === p
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Platform Store / Listing Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rolls & Bowls Co. - Whitefield Outlet"
                  value={newAccStoreName}
                  onChange={(e) => setNewAccStoreName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {newAccPlatform === 'ZOMATO'
                      ? 'Zomato ResID'
                      : newAccPlatform === 'SWIGGY'
                      ? 'Swiggy Outlet ID'
                      : 'Merchant ID / Store ID'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 29014820"
                    value={newAccStoreId}
                    onChange={(e) => setNewAccStoreId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partner Email / Login</label>
                  <input
                    type="text"
                    placeholder="partner@cloudkitchen.test"
                    value={newAccEmail}
                    onChange={(e) => setNewAccEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">API Secret / Merchant Auth Key (Optional)</label>
                <input
                  type="password"
                  placeholder="Optional or auto-generated"
                  value={newAccApiKey}
                  onChange={(e) => setNewAccApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Save &amp; Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
