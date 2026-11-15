'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  short_code: string;
  category: string;
  price: number;
  is_veg: boolean;
  portion_size?: string;
  portion_value?: number | '';
  portion_unit?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  portion?: 'Regular' | 'Large';
  kotSentQty?: number; // Tracks quantity already fired to KDS for Incremental KOT
}

interface HeldOrder {
  id: string;
  table: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  customerName: string;
  customerPhone: string;
  cart: CartItem[];
  heldAt: string;
  grandTotal: number;
}

interface RestaurantProfile {
  restaurantName: string;
  branchName: string;
  addressLine1: string;
  addressLine2: string;
  cityPincode: string;
  mobile: string;
  secondaryPhone?: string;
  email?: string;
  gstin: string;
  fssai: string;
  receiptFooter: string;
}

interface VoiceBillOrder {
  id: string;
  orderRef: string;
  channel: 'ZOMATO' | 'SWIGGY' | 'DINE_IN' | 'TAKEAWAY' | 'ONDC';
  channelName: string;
  brandName: string;
  customerName: string;
  customerPhone: string;
  customerArea: string;
  riderName?: string;
  riderPhone?: string;
  items: Array<{ name: string; quantity: number; price: number; portion?: string }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'PENDING' | 'COOKING' | 'FOOD_READY' | 'DISPATCHED';
  time: string;
  table?: string;
  paymentMode: string;
}

interface RegisteredCustomer {
  phone: string;
  name: string;
  loyaltyPoints: number;
  tier: string;
}

const REGISTERED_CUSTOMERS: RegisteredCustomer[] = [
  { phone: '9845099881', name: 'Dr. Rohan Deshmukh', loyaltyPoints: 450, tier: 'VIP Gold' },
  { phone: '9912033441', name: 'Pooja Sundaram', loyaltyPoints: 320, tier: 'VIP Gold' },
  { phone: '9772288112', name: 'Arjun Nambiar', loyaltyPoints: 180, tier: 'Silver Regular' },
  { phone: '9876543210', name: 'Vikram Aditya', loyaltyPoints: 260, tier: 'VIP Gold' },
];

const DEFAULT_PROFILE: RestaurantProfile = {
  restaurantName: 'Biryani Express',
  branchName: 'Flagship Indiranagar',
  addressLine1: 'Plot #42, 100ft Road, HAL 2nd Stage',
  addressLine2: 'Near 12th Main Junction, Indiranagar',
  cityPincode: 'Bengaluru, Karnataka - 560038',
  mobile: '+91 98765 43210',
  secondaryPhone: '+91 80 2520 0001',
  email: 'orders@biryaniexpress.in',
  gstin: '29AAAAA0000A1Z5',
  fssai: '11223334000561',
  receiptFooter: '*** THANK YOU! VISIT AGAIN ***',
};

const INITIAL_VOICE_BILLS: VoiceBillOrder[] = [
  {
    id: 'ord-zom-4567',
    orderRef: 'ZOM-4567',
    channel: 'ZOMATO',
    channelName: 'Zomato',
    brandName: 'Biryani Express',
    customerName: 'Vikram Aditya',
    customerPhone: '+91 98765 43210',
    customerArea: 'Indiranagar 100ft Rd (1.2 km)',
    riderName: 'Rajesh K. (Zomato Valet KA03-EA-4567)',
    riderPhone: '+91 98112 34567',
    items: [
      { name: 'Royal Chicken Dum Biryani', quantity: 2, price: 290, portion: '650 gm' },
      { name: 'Chicken 65 (Crispy Andhra)', quantity: 1, price: 260, portion: '8 Pcs' },
      { name: 'Fresh Lime Soda', quantity: 2, price: 60, portion: '300 ml' },
    ],
    subtotal: 960,
    tax: 48,
    total: 1008,
    status: 'COOKING',
    time: '13:58',
    paymentMode: 'PAID ONLINE (Zomato Pay)',
  },
  {
    id: 'ord-swg-2091',
    orderRef: 'SWG-2091',
    channel: 'SWIGGY',
    channelName: 'Swiggy',
    brandName: 'Biryani Express',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 99120 44551',
    customerArea: 'HAL 2nd Stage (0.8 km)',
    riderName: 'Manoj Kumar (Swiggy Fleet)',
    riderPhone: '+91 97722 33110',
    items: [
      { name: 'Special Mutton Dum Biryani', quantity: 2, price: 380, portion: '750 gm' },
      { name: 'Irani Masala Chai', quantity: 2, price: 40, portion: '150 ml' },
    ],
    subtotal: 840,
    tax: 42,
    total: 882,
    status: 'COOKING',
    time: '13:50',
    paymentMode: 'PAID ONLINE (Swiggy UPI)',
  },
  {
    id: 'ord-inv-8492',
    orderRef: 'INV-8492',
    channel: 'DINE_IN',
    channelName: 'Dine-In',
    brandName: 'Biryani Express',
    customerName: 'Table T-01 Dine In Guest',
    customerPhone: '+91 94480 11223',
    customerArea: 'AC Hall — Table T-01',
    table: 'T-01',
    items: [
      { name: 'Special Mutton Dum Biryani', quantity: 2, price: 380, portion: '750 gm' },
      { name: 'Chicken 65 (Crispy Andhra)', quantity: 1, price: 260, portion: '8 Pcs' },
      { name: 'Butter Naan', quantity: 3, price: 50, portion: '1 Pc' },
    ],
    subtotal: 1170,
    tax: 58.5,
    total: 1229,
    status: 'FOOD_READY',
    time: '13:45',
    paymentMode: 'UPI / CASH',
  },
];

const CATALOG_ITEMS: MenuItem[] = [
  { id: '1', name: 'Special Mutton Dum Biryani', short_code: 'MB01', category: 'Biryani', price: 380, is_veg: false, portion_size: '750 gm', portion_value: 750, portion_unit: 'gm' },
  { id: '2', name: 'Royal Chicken Dum Biryani', short_code: 'CB01', category: 'Biryani', price: 290, is_veg: false, portion_size: '650 gm', portion_value: 650, portion_unit: 'gm' },
  { id: '3', name: 'Nawabi Paneer Dum Biryani', short_code: 'PB01', category: 'Biryani', price: 240, is_veg: true, portion_size: '500 gm', portion_value: 500, portion_unit: 'gm' },
  { id: '4', name: 'Chicken 65 (Crispy Andhra)', short_code: 'C65', category: 'Starters', price: 260, is_veg: false, portion_size: '8 Pcs', portion_value: 8, portion_unit: 'pcs' },
  { id: '5', name: 'Tandoori Paneer Tikka', short_code: 'PT01', category: 'Starters', price: 230, is_veg: true, portion_size: '6 Pcs', portion_value: 6, portion_unit: 'pcs' },
  { id: '6', name: 'Murgh Malai Kebab', short_code: 'MMK01', category: 'Starters', price: 280, is_veg: false, portion_size: '6 Pcs', portion_value: 6, portion_unit: 'pcs' },
  { id: '7', name: 'Butter Naan', short_code: 'BN01', category: 'Breads', price: 50, is_veg: true, portion_size: '1 Pc', portion_value: 1, portion_unit: 'pcs' },
  { id: '8', name: 'Garlic Herb Naan', short_code: 'GN01', category: 'Breads', price: 65, is_veg: true, portion_size: '1 Pc', portion_value: 1, portion_unit: 'pcs' },
  { id: '9', name: 'Tandoori Roti', short_code: 'TR01', category: 'Breads', price: 35, is_veg: true, portion_size: '1 Pc', portion_value: 1, portion_unit: 'pcs' },
  { id: '10', name: 'Hot Gulab Jamun (2 Pcs)', short_code: 'GJ01', category: 'Desserts', price: 80, is_veg: true, portion_size: '2 Pcs', portion_value: 2, portion_unit: 'pcs' },
  { id: '11', name: 'Irani Masala Chai', short_code: 'MC01', category: 'Drinks', price: 40, is_veg: true, portion_size: '150 ml', portion_value: 150, portion_unit: 'ml' },
  { id: '12', name: 'Fresh Lime Soda', short_code: 'FLS01', category: 'Drinks', price: 60, is_veg: true, portion_size: '300 ml', portion_value: 300, portion_unit: 'ml' },
];

const TABLES = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'T-09', 'T-10'];

const CATEGORY_ICONS: Record<string, string> = {
  All: '🍽️',
  Biryani: '🍛',
  Starters: '🍢',
  Breads: '🫓',
  Drinks: '🥤',
  Desserts: '🍨',
  'Main Course': '🥘',
  'Fast Food': '🍔',
};

export default function PosBillingPage() {
  const [catalogItems, setCatalogItems] = useState<MenuItem[]>(CATALOG_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegFilterOnly, setVegFilterOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('T-01');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');

  // Running Cart
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Special Mutton Dum Biryani', short_code: 'MB01', category: 'Biryani', price: 380, is_veg: false, quantity: 2, portion: 'Regular', portion_size: '750 gm', kotSentQty: 2 },
    { id: '4', name: 'Chicken 65 (Crispy Andhra)', short_code: 'C65', category: 'Starters', price: 260, is_veg: false, quantity: 1, portion: 'Regular', portion_size: '8 Pcs', kotSentQty: 1 },
    { id: '7', name: 'Butter Naan', short_code: 'BN01', category: 'Breads', price: 50, is_veg: true, quantity: 3, portion: 'Regular', portion_size: '1 Pc', kotSentQty: 0 }, // 3 un-fired incremental!
  ]);

  // Customer Capture & Loyalty
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState<number>(0);
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Financial calculations
  const [packagingCharge] = useState<number>(20);
  const isPackagingApplicable = orderType !== 'DINE_IN';

  // Hold & Resume Orders Queue
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);

  // Incremental KOT status
  const [kotTicketNo, setKotTicketNo] = useState(108);
  const [incrementalKotAlert, setIncrementalKotAlert] = useState<string | null>(null);

  // Item Notes modal state
  const [editingNotesItem, setEditingNotesItem] = useState<CartItem | null>(null);
  const [customNoteText, setCustomNoteText] = useState('');

  // Multi-Tender Split Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [tenderCash, setTenderCash] = useState<number | ''>('');
  const [tenderUpi, setTenderUpi] = useState<number | ''>('');
  const [tenderCard, setTenderCard] = useState<number | ''>('');
  const [tenderDue, setTenderDue] = useState<number | ''>('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Quick Add Dish Modal in POS
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickDishName, setQuickDishName] = useState('');
  const [quickDishPrice, setQuickDishPrice] = useState<number | ''>('');
  const [quickDishPortionVal, setQuickDishPortionVal] = useState<number | ''>('');
  const [quickDishPortionUnit, setQuickDishPortionUnit] = useState('ml');
  const [quickDishCat, setQuickDishCat] = useState('Biryani');
  const [quickDishVeg, setQuickDishVeg] = useState(true);
  const [quickDishCode, setQuickDishCode] = useState('');

  // Restaurant Profile State
  const [profile, setProfile] = useState<RestaurantProfile>(DEFAULT_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileSavedToast, setProfileSavedToast] = useState<boolean>(false);

  // Voice Command & Bill Search State
  const [voiceOrders, setVoiceOrders] = useState<VoiceBillOrder[]>(INITIAL_VOICE_BILLS);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceFeedbackMsg, setVoiceFeedbackMsg] = useState<string>('');
  const [activeVoiceBill, setActiveVoiceBill] = useState<VoiceBillOrder | null>(null);
  const [manualVoiceInput, setManualVoiceInput] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Keyboard Shortcuts cheat sheet modal
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('smart_pos_restaurant_profile');
      if (savedProfile) {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) });
      }

      const savedOrders = localStorage.getItem('smart_pos_voice_bills');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVoiceOrders(parsed);
        }
      }

      const savedHeld = localStorage.getItem('smart_pos_held_orders');
      if (savedHeld) {
        const parsed = JSON.parse(savedHeld);
        if (Array.isArray(parsed)) {
          setHeldOrders(parsed);
        }
      }

      const savedMenu = localStorage.getItem('smart_pos_menu_items');
      if (savedMenu) {
        const parsed = JSON.parse(savedMenu);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: MenuItem[] = parsed.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            short_code: p.short_code,
            category: p.category.includes('Biryani') ? 'Biryani' : p.category.includes('Starter') ? 'Starters' : p.category.includes('Bread') ? 'Breads' : p.category.includes('Beverage') ? 'Drinks' : p.category,
            price: Number(p.base_price || p.price),
            is_veg: Boolean(p.is_veg),
            portion_size: p.portion_size,
            portion_value: p.portion_value,
            portion_unit: p.portion_unit,
          }));
          setCatalogItems(mapped);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Global Keyboard Shortcuts (F2, F4, F7, F8, Esc, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside a form input (except F-keys)
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          openPaymentModal();
        }
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (cart.length > 0) {
          handleFireIncrementalKot();
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldOrder();
        }
      } else if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
        setIsReceiptModalOpen(false);
        setIsHeldOrdersModalOpen(false);
        setIsVoiceModalOpen(false);
        setIsProfileModalOpen(false);
        setIsShortcutsModalOpen(false);
        setEditingNotesItem(null);
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Phone lookup for loyalty
  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    const clean = val.replace(/\D/g, '');
    const matched = REGISTERED_CUSTOMERS.find((c) => c.phone.includes(clean) || clean.includes(c.phone));
    if (matched && clean.length >= 7) {
      setCustomerName(matched.name);
      setCustomerLoyaltyPoints(matched.loyaltyPoints);
    } else if (clean.length === 0) {
      setCustomerName('');
      setCustomerLoyaltyPoints(0);
      setIsRedeemingPoints(false);
    }
  };

  // Financial Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
  const discountAmount = useMemo(() => (subtotal * discountPercent) / 100, [subtotal, discountPercent]);
  // 1 loyalty point = ₹0.50 discount
  const loyaltyDiscount = isRedeemingPoints ? Math.min(subtotal - discountAmount, customerLoyaltyPoints * 0.5) : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount - loyaltyDiscount);
  const packagingFee = isPackagingApplicable ? packagingCharge : 0;
  const cgst = taxableAmount * 0.025; // 2.5% CGST
  const sgst = taxableAmount * 0.025; // 2.5% SGST
  const grandTotal = Math.round(taxableAmount + packagingFee + cgst + sgst);

  // Multi-Tender Split Calculation
  const totalTendered = (Number(tenderCash) || 0) + (Number(tenderUpi) || 0) + (Number(tenderCard) || 0) + (Number(tenderDue) || 0);
  const balanceRemaining = grandTotal - totalTendered;
  const changeDue = Math.max(0, (Number(tenderCash) || 0) - (grandTotal - (Number(tenderUpi) || 0) - (Number(tenderCard) || 0)));

  // Cart Operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) => (ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
      }
      return [...prev, { ...item, quantity: 1, portion: 'Regular', kotSentQty: 0 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.id === id) {
            const nextQty = ci.quantity + delta;
            return nextQty > 0 ? { ...ci, quantity: nextQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setIsRedeemingPoints(false);
    setDiscountPercent(0);
  };

  // 1. INCREMENTAL KOT ENGINE (PetPooja Core Rule)
  const unSentKotCount = cart.reduce((acc, item) => acc + (item.quantity - (item.kotSentQty || 0)), 0);

  const handleFireIncrementalKot = () => {
    if (cart.length === 0) return;

    const newItemsToFire = cart
      .map((item) => {
        const delta = item.quantity - (item.kotSentQty || 0);
        return delta > 0 ? { ...item, incrementalQty: delta } : null;
      })
      .filter(Boolean);

    if (newItemsToFire.length === 0) {
      setIncrementalKotAlert('All items have already been fired to Kitchen!');
      setTimeout(() => setIncrementalKotAlert(null), 3000);
      return;
    }

    const nextKot = kotTicketNo + 1;
    setKotTicketNo(nextKot);

    // Update cart to mark current quantities as sent
    setCart((prev) => prev.map((item) => ({ ...item, kotSentQty: item.quantity })));

    setIncrementalKotAlert(
      `✓ Incremental KOT #${nextKot} fired for kitchen (${newItemsToFire.length} new items dispatched to station)!`
    );
    setTimeout(() => setIncrementalKotAlert(null), 4000);
  };

  // 2. HOLD & RESUME ORDERS (PetPooja Busy Counter)
  const handleHoldOrder = () => {
    if (cart.length === 0) return;

    const newHold: HeldOrder = {
      id: `hold-${Date.now()}`,
      table: orderType === 'DINE_IN' ? selectedTable : `Takeaway #${Date.now().toString().slice(-3)}`,
      orderType: orderType,
      customerName: customerName || 'Walk-in Guest',
      customerPhone: customerPhone,
      cart: [...cart],
      heldAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      grandTotal: grandTotal,
    };

    const updated = [newHold, ...heldOrders];
    setHeldOrders(updated);
    try {
      localStorage.setItem('smart_pos_held_orders', JSON.stringify(updated));
    } catch {
      // ignore
    }

    clearCart();
    setIncrementalKotAlert(`⏸️ Order held in queue (${newHold.table}). Ready for next customer.`);
    setTimeout(() => setIncrementalKotAlert(null), 3500);
  };

  const handleResumeOrder = (hold: HeldOrder) => {
    setCart(hold.cart);
    setOrderType(hold.orderType);
    if (hold.orderType === 'DINE_IN') {
      setSelectedTable(hold.table);
    }
    setCustomerName(hold.customerName);
    setCustomerPhone(hold.customerPhone);

    const remaining = heldOrders.filter((h) => h.id !== hold.id);
    setHeldOrders(remaining);
    try {
      localStorage.setItem('smart_pos_held_orders', JSON.stringify(remaining));
    } catch {
      // ignore
    }

    setIsHeldOrdersModalOpen(false);
    setIncrementalKotAlert(`▶ Resumed order for ${hold.table}!`);
    setTimeout(() => setIncrementalKotAlert(null), 3000);
  };

  // 3. MULTI-TENDER SPLIT PAYMENT
  const openPaymentModal = () => {
    setTenderCash(grandTotal);
    setTenderUpi('');
    setTenderCard('');
    setTenderDue('');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmSplitPayment = () => {
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: catalogItems.length };
    catalogItems.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [catalogItems]);

  const allCategories = ['All', ...Array.from(new Set(catalogItems.map((i) => i.category)))];

  // Filtered menu items
  const filteredItems = catalogItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesVeg = !vegFilterOnly || item.is_veg;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.short_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesVeg && matchesSearch;
  });

  // Voice Search Handler
  const startVoiceListening = () => {
    setIsVoiceModalOpen(true);
    setVoiceFeedbackMsg('Listening... Say e.g. "Zomato 4567" or "Swiggy 2091"');
    setVoiceTranscript('');

    const SpeechRecognition =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setVoiceFeedbackMsg('Web Speech API is not supported in this browser. Use quick voice buttons below.');
      return;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.abort();
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedbackMsg('🎙️ Mic is Active! Say "Zomato 4567" or "Mark Ready"...');
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setVoiceTranscript(speechResult);
        processVoiceCommand(speechResult);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceFeedbackMsg(`Mic event (${event.error || 'stopped'}). Click voice presets below.`);
      };

      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceFeedbackMsg('Microphone permission or hardware busy. Click voice test presets below.');
    }
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceCommand = (spokenText: string) => {
    const text = spokenText.toLowerCase().trim();
    setVoiceTranscript(spokenText);

    if (text.includes('ready') || text.includes('mark ready') || text.includes('food ready')) {
      if (activeVoiceBill) {
        markOrderReady(activeVoiceBill.id);
        return;
      }
      const numMatch = text.match(/\d{3,5}/);
      if (numMatch) {
        const digits = numMatch[0];
        const target = voiceOrders.find((o) => o.orderRef.includes(digits));
        if (target) {
          markOrderReady(target.id);
          return;
        }
      }
      const pending = voiceOrders.find((o) => o.status === 'COOKING' || o.status === 'PENDING');
      if (pending) {
        markOrderReady(pending.id);
        return;
      }
    }

    let digits = '';
    const digitMatch = text.match(/\b\d{3,5}\b/);
    if (digitMatch) {
      digits = digitMatch[0];
    } else {
      const wordMap: Record<string, string> = {
        zero: '0', one: '1', two: '2', three: '3', four: '4',
        five: '5', six: '6', seven: '7', eight: '8', nine: '9'
      };
      const found: string[] = [];
      text.split(/\s+/).forEach((w) => {
        if (wordMap[w]) found.push(wordMap[w]);
      });
      if (found.length >= 3) digits = found.join('');
    }

    if (digits) {
      const matched = voiceOrders.find((o) => o.orderRef.toLowerCase().includes(digits));
      if (matched) {
        setActiveVoiceBill(matched);
        setVoiceFeedbackMsg(`✓ Found ${matched.channelName} Bill #${matched.orderRef} for ${matched.customerName}! Speak "Ready" to mark ready.`);
        return;
      } else {
        const isSwiggy = text.includes('swiggy');
        const channel = isSwiggy ? 'SWIGGY' : 'ZOMATO';
        const prefix = isSwiggy ? 'SWG' : 'ZOM';
        const newMatchedOrder: VoiceBillOrder = {
          id: `ord-voice-${digits}`,
          orderRef: `${prefix}-${digits}`,
          channel: channel,
          channelName: channel === 'ZOMATO' ? 'Zomato' : 'Swiggy',
          brandName: profile.restaurantName || 'Biryani Express',
          customerName: 'Online Customer',
          customerPhone: '+91 98765 00000',
          customerArea: 'Local Delivery Area (1.5 km)',
          riderName: `${channel === 'ZOMATO' ? 'Zomato Valet' : 'Swiggy Fleet'} (ID #${digits})`,
          riderPhone: '+91 98450 12345',
          items: [
            { name: 'Royal Chicken Dum Biryani', quantity: 2, price: 290, portion: '650 gm' },
            { name: 'Chicken 65 (Crispy Andhra)', quantity: 1, price: 260, portion: '8 Pcs' },
            { name: 'Fresh Lime Soda', quantity: 2, price: 60, portion: '300 ml' },
          ],
          subtotal: 960,
          tax: 48,
          total: 1008,
          status: 'COOKING',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          paymentMode: `PAID ONLINE (${channel} Pay)`,
        };

        const updated = [newMatchedOrder, ...voiceOrders];
        setVoiceOrders(updated);
        try {
          localStorage.setItem('smart_pos_voice_bills', JSON.stringify(updated));
        } catch {
          // ignore
        }
        setActiveVoiceBill(newMatchedOrder);
        setVoiceFeedbackMsg(`✓ Found ${newMatchedOrder.channelName} Bill #${newMatchedOrder.orderRef}! Speak "Ready" to mark ready.`);
        return;
      }
    }

    if (text.includes('table')) {
      const tMatch = text.match(/t?-?0?([1-9]|10)/);
      if (tMatch) {
        const num = tMatch[1].padStart(2, '0');
        const tbl = `T-${num}`;
        if (TABLES.includes(tbl)) {
          setSelectedTable(tbl);
          setOrderType('DINE_IN');
          setVoiceFeedbackMsg(`✓ Switched to Table ${tbl}`);
          return;
        }
      }
    }

    setVoiceFeedbackMsg(`Recognized: "${spokenText}". Say "Zomato 4567" or "Mark Ready".`);
  };

  const markOrderReady = (orderId: string) => {
    const updated = voiceOrders.map((o) => (o.id === orderId ? { ...o, status: 'FOOD_READY' as const } : o));
    setVoiceOrders(updated);
    try {
      localStorage.setItem('smart_pos_voice_bills', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (activeVoiceBill && activeVoiceBill.id === orderId) {
      setActiveVoiceBill({ ...activeVoiceBill, status: 'FOOD_READY' });
    }
    setVoiceFeedbackMsg(`✅ Order #${activeVoiceBill?.orderRef || '4567'} marked FOOD READY!`);
    setIncrementalKotAlert(`✅ Order #${activeVoiceBill?.orderRef || '4567'} marked FOOD READY!`);
    setTimeout(() => setIncrementalKotAlert(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('smart_pos_restaurant_profile', JSON.stringify(profile));
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 3500);
      setIsProfileModalOpen(false);
    } catch {
      // ignore
    }
  };

  const handleSaveQuickDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDishName.trim() || !quickDishPrice) return;
    const finalPortion = quickDishPortionVal ? `${quickDishPortionVal} ${quickDishPortionUnit}` : undefined;

    const newItem: MenuItem = {
      id: `dish-${Date.now()}`,
      name: quickDishName.trim(),
      short_code: quickDishCode.trim() || `D${Date.now().toString().slice(-3)}`,
      category: quickDishCat,
      price: Number(quickDishPrice),
      is_veg: quickDishVeg,
      portion_size: finalPortion,
      portion_value: quickDishPortionVal,
      portion_unit: quickDishPortionUnit,
    };

    setCatalogItems([newItem, ...catalogItems]);
    addToCart(newItem);
    setIsQuickAddModalOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Mini App Strip */}
      <aside className="w-16 bg-slate-900 text-white flex flex-col items-center py-3 border-r border-slate-800 shrink-0">
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-lg text-white mb-5 shadow-lg shadow-orange-600/30"
          title="Back to Dashboard Overview"
        >
          BE
        </Link>
        <nav className="flex-1 space-y-3.5 text-center">
          <Link href="/pos" className="flex flex-col items-center p-2 rounded-xl bg-orange-600 text-white font-bold text-[10px]" title="POS Speed Billing">
            <span className="text-lg leading-none mb-0.5">⚡</span>
            <span>POS</span>
          </Link>
          <Link href="/tables" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-[10px]" title="Floor Plan & Tables">
            <span className="text-lg leading-none mb-0.5">🪑</span>
            <span>Tables</span>
          </Link>
          <Link href="/kds" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-[10px]" title="Kitchen KDS">
            <span className="text-lg leading-none mb-0.5">🍳</span>
            <span>KDS</span>
          </Link>
          <Link href="/online-orders" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-[10px]" title="Online Aggregators">
            <span className="text-lg leading-none mb-0.5">🛵</span>
            <span>Orders</span>
          </Link>
          <Link href="/catalog" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-[10px]" title="Menu Catalog">
            <span className="text-lg leading-none mb-0.5">🍛</span>
            <span>Menu</span>
          </Link>
          <Link href="/cash-drawer" className="flex flex-col items-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-[10px]" title="Cash Drawer">
            <span className="text-lg leading-none mb-0.5">💵</span>
            <span>Cash</span>
          </Link>
        </nav>
        <div className="space-y-2">
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 flex items-center justify-center text-xs font-bold font-mono"
            title="Keyboard Shortcuts Cheat Sheet (?)"
          >
            ?
          </button>
          <Link href="/settings" className="text-slate-400 hover:text-white p-2 block text-center" title="Settings">
            <span className="text-lg">⚙️</span>
          </Link>
        </div>
      </aside>

      {/* PETPOOJA 3-PANE SPEED BILLING WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANE 1 (LEFT): Vertical Category List (PetPooja Touch) */}
        <section className="w-48 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Categories</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {catalogItems.length} Dishes
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {allCategories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{CATEGORY_ICONS[cat] || '🍽️'}</span>
                    <span className="truncate">{cat}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isSelected ? 'bg-slate-800 text-orange-400' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Veg Filter Switcher at Bottom of Categories */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setVegFilterOnly(!vegFilterOnly)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black border transition ${
                vegFilterOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white"></span>
              <span>{vegFilterOnly ? 'Veg Only Active' : 'Filter Veg Only'}</span>
            </button>
          </div>
        </section>

        {/* PANE 2 (CENTER): Dish Search & Interactive Grid */}
        <section className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Top Control Bar */}
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-3 shrink-0">
            {/* Search input with autofocus ref (F2) */}
            <div className="flex-1 max-w-md relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search dish name or punch code (F2)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Voice Search Button ("Zomato 4567") */}
            <button
              onClick={startVoiceListening}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold transition shadow-xs border ${
                isListening
                  ? 'bg-red-600 text-white border-red-700 animate-pulse ring-2 ring-red-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
              }`}
              title="Voice Search: Say 'Zomato 4567' or 'Mark Ready'"
            >
              <span>🎙️</span>
              <span className="hidden md:inline">Voice Search</span>
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                &quot;Zomato 4567&quot;
              </span>
            </button>

            {/* Held Orders Drawer Toggle */}
            <button
              onClick={() => setIsHeldOrdersModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                heldOrders.length > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 border-amber-600 font-black shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="View & Resume Parked Orders (F8)"
            >
              <span>📋</span>
              <span>Held ({heldOrders.length})</span>
            </button>

            {/* Restaurant Profile Edit */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition shrink-0"
              title="Edit Restaurant Name, Address & Mobile for Bill Print"
            >
              <span>🏢</span>
              <span className="hidden lg:inline">Receipt Details</span>
            </button>

            {/* Quick Add Dish Button */}
            <button
              onClick={() => {
                setQuickDishName(searchQuery);
                setQuickDishPrice('');
                setQuickDishPortionVal('');
                setQuickDishPortionUnit('ml');
                setQuickDishCode('');
                setQuickDishCat('Biryani');
                setQuickDishVeg(true);
                setIsQuickAddModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition shrink-0"
            >
              <span className="text-base leading-none">＋</span>
              <span>Dish</span>
            </button>
          </header>

          {/* Incremental KOT Alert Notification */}
          {incrementalKotAlert && (
            <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in">
              <span>{incrementalKotAlert}</span>
              <span className="text-emerald-200 font-mono">KOT Synchronized</span>
            </div>
          )}

          {/* Dish Grid */}
          <div className="flex-1 p-5 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-dashed border-slate-300">
                <span className="text-4xl mb-2">🍽️</span>
                <h4 className="text-sm font-bold text-slate-700">No dishes matching &quot;{searchQuery}&quot;</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Add this item instantly to the menu</p>
                <button
                  onClick={() => {
                    setQuickDishName(searchQuery);
                    setIsQuickAddModalOpen(true);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 transition"
                >
                  ＋ Add &quot;{searchQuery}&quot; to Menu &amp; Punch
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-orange-500 hover:shadow-md transition text-left flex flex-col justify-between h-36 group active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-orange-600">
                          {item.short_code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.portion_size && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {item.portion_size}
                            </span>
                          )}
                          <span className={`w-3 h-3 rounded-sm flex items-center justify-center border ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                          </span>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 mt-1 line-clamp-2 leading-tight">
                        {item.name}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                      <span className="text-sm font-black text-slate-900 font-mono">₹{item.price}</span>
                      <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md group-hover:bg-orange-600 group-hover:text-white transition">
                        + Add
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* PANE 3 (RIGHT): PetPooja Running Order / Cart (Width 380px) */}
        <aside className="w-96 bg-white border-l border-slate-200 flex flex-col justify-between shadow-2xl shrink-0">
          {/* Order Header & Mode Switcher */}
          <div className="p-3.5 border-b border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setOrderType(mode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      orderType === mode
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'DINE_IN' ? '🍽️ Dine' : mode === 'TAKEAWAY' ? '🥡 Parcel' : '🛵 Delivery'}
                  </button>
                ))}
              </div>

              {orderType === 'DINE_IN' && (
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-black text-slate-800"
                >
                  {TABLES.map((t) => (
                    <option key={t} value={t}>{t} (Hall)</option>
                  ))}
                </select>
              )}

              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-red-500 hover:text-red-700"
                title="Clear Active Cart"
              >
                Clear
              </button>
            </div>

            {/* Customer Phone Capture & Loyalty Bar */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  placeholder="Customer Phone (e.g. 9845099881)..."
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {customerName && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-800 truncate">
                    👤 {customerName}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-orange-600 font-extrabold">
                      ⭐ {customerLoyaltyPoints} Pts
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRedeemingPoints(!isRedeemingPoints)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                        isRedeemingPoints
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-emerald-700 border-emerald-300'
                      }`}
                    >
                      {isRedeemingPoints ? 'Redeemed' : 'Redeem'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Running Order Items List with Incremental KOT Status */}
          <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <span className="text-4xl mb-2">🛒</span>
                <p className="text-xs font-bold text-slate-600">Active Order is Empty</p>
                <p className="text-[11px] mt-1">Tap dishes on the center grid to add</p>
              </div>
            ) : (
              cart.map((item) => {
                const isSent = (item.kotSentQty || 0) >= item.quantity;
                const isIncremental = item.quantity > (item.kotSentQty || 0);

                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-xs shrink-0 ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                        <span className="font-bold text-xs text-slate-900 truncate leading-tight">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span>₹{item.price}</span>
                        {item.portion_size && (
                          <span className="font-bold text-blue-700 bg-blue-50 px-1 rounded text-[10px]">
                            {item.portion_size}
                          </span>
                        )}

                        {/* Incremental KOT status pill */}
                        {isIncremental ? (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-300">
                            New KOT
                          </span>
                        ) : isSent ? (
                          <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            ✓ KOT Fired
                          </span>
                        ) : null}
                      </div>

                      {/* Item Note */}
                      {item.notes && (
                        <p className="text-[10px] text-orange-600 italic mt-0.5 truncate">
                          &quot;{item.notes}&quot;
                        </p>
                      )}
                    </div>

                    {/* Quantity Counter & Note action */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingNotesItem(item);
                          setCustomNoteText(item.notes || '');
                        }}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]"
                        title="Add cooking note (e.g. Extra spicy)"
                      >
                        ✏️
                      </button>

                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded bg-white font-bold text-xs hover:bg-slate-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-black text-xs text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 rounded bg-white font-bold text-xs hover:bg-slate-200 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-14 text-right font-black text-xs text-slate-900 font-mono">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Calculations & PetPooja Action Toolbar */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 shrink-0">
            <div className="space-y-1 text-xs text-slate-600 pb-2.5 border-b border-slate-200">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
                <span className="font-bold text-slate-800 font-mono">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Presets */}
              <div className="flex justify-between items-center text-xs">
                <span>Discount</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDiscountPercent(d)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        discountPercent === d ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 text-[11px]">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 text-[11px]">
                  <span>Loyalty Points Discount</span>
                  <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}

              {packagingFee > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>Packaging &amp; Bag Fee</span>
                  <span>₹{packagingFee.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px]">
                <span>CGST (2.5%) + SGST (2.5%)</span>
                <span>₹{(cgst + sgst).toFixed(2)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="font-black text-sm text-slate-900 block">Grand Total</span>
                {unSentKotCount > 0 && (
                  <span className="text-[10px] font-bold text-amber-600">
                    🔥 {unSentKotCount} items awaiting KOT
                  </span>
                )}
              </div>
              <span className="font-black text-2xl text-orange-600 font-mono">₹{grandTotal}</span>
            </div>

            {/* PETPOOJA ACTION BUTTONS: KOT (F7), Hold (F8), Settle (F4) */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              {/* Fire Incremental KOT Button */}
              <button
                onClick={handleFireIncrementalKot}
                disabled={cart.length === 0}
                className={`py-2.5 rounded-xl text-white font-extrabold text-xs transition flex flex-col items-center justify-center leading-tight ${
                  unSentKotCount > 0
                    ? 'bg-slate-900 hover:bg-slate-800 ring-2 ring-orange-500'
                    : 'bg-slate-700 opacity-60'
                }`}
                title="Send Incremental KOT to Kitchen (F7)"
              >
                <span>🍳 Fire KOT</span>
                <span className="text-[9px] text-slate-300 font-mono">F7</span>
              </button>

              {/* Hold Order Button */}
              <button
                onClick={handleHoldOrder}
                disabled={cart.length === 0}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs transition flex flex-col items-center justify-center leading-tight disabled:opacity-50"
                title="Park active order in Hold Queue (F8)"
              >
                <span>⏸️ Hold</span>
                <span className="text-[9px] text-amber-900 font-mono">F8</span>
              </button>

              {/* Settle Bill (Multi-Tender) */}
              <button
                onClick={openPaymentModal}
                disabled={cart.length === 0}
                className="py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-600/30 transition flex flex-col items-center justify-center leading-tight disabled:opacity-50"
                title="Settle Bill with Multi-Tender Split (F4)"
              >
                <span>💳 Settle</span>
                <span className="text-[9px] text-orange-200 font-mono">F4</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL 1: MULTI-TENDER SPLIT PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Multi-Tender Settle &amp; Close Bill</h3>
                <p className="text-[11px] text-slate-500">
                  {orderType} &bull; {orderType === 'DINE_IN' ? selectedTable : 'Direct Parcel'}
                </p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            {/* Total Payable Banner */}
            <div className="my-4 p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">Payable Grand Total</span>
                <p className="text-3xl font-black text-orange-600 font-mono">₹{grandTotal}</p>
              </div>
              {/* Quick Split Presets */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setTenderCash(grandTotal);
                    setTenderUpi('');
                    setTenderCard('');
                    setTenderDue('');
                  }}
                  className="px-2 py-1 bg-white border border-orange-300 text-orange-800 font-bold text-[10px] rounded-lg"
                >
                  Full Cash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTenderUpi(grandTotal);
                    setTenderCash('');
                    setTenderCard('');
                    setTenderDue('');
                  }}
                  className="px-2 py-1 bg-white border border-orange-300 text-orange-800 font-bold text-[10px] rounded-lg"
                >
                  Full UPI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const half = Math.round(grandTotal / 2);
                    setTenderCash(half);
                    setTenderUpi(grandTotal - half);
                    setTenderCard('');
                    setTenderDue('');
                  }}
                  className="px-2 py-1 bg-white border border-orange-300 text-orange-800 font-bold text-[10px] rounded-lg"
                >
                  50-50 Split
                </button>
              </div>
            </div>

            {/* Multi-Tender Inputs */}
            <div className="space-y-3 text-xs mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>💵</span> Cash Tendered (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tenderCash}
                    onChange={(e) => setTenderCash(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 500"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-black text-slate-900 font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>📱</span> UPI / QR Payment (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tenderUpi}
                    onChange={(e) => setTenderUpi(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 508"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-black text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>💳</span> Card / POS Swipe (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tenderCard}
                    onChange={(e) => setTenderCard(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-black text-slate-900 font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>⚖️</span> Customer Credit / Due (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tenderDue}
                    onChange={(e) => setTenderDue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-black text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Split Balance Status Indicator */}
            <div className="p-3 rounded-xl mb-4 text-xs font-bold flex items-center justify-between border bg-slate-50 border-slate-200">
              <div>
                <span>Total Tendered: </span>
                <span className="font-mono font-black text-slate-900">₹{totalTendered}</span>
              </div>
              <div>
                {balanceRemaining === 0 ? (
                  <span className="text-emerald-700 font-black">✓ Exact Amount Tendered</span>
                ) : balanceRemaining > 0 ? (
                  <span className="text-red-600 font-black">₹{balanceRemaining} Remaining to Settle</span>
                ) : (
                  <span className="text-emerald-700 font-black">Change Due: ₹{Math.abs(balanceRemaining)}</span>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmSplitPayment}
              disabled={balanceRemaining > 0}
              className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-orange-600/30 transition"
            >
              ✓ Confirm Settle &amp; Print 80mm Thermal Receipt
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: HELD ORDERS QUEUE (RESUME PARKED ORDERS) */}
      {isHeldOrdersModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Parked / Held Orders Queue</h3>
                  <p className="text-[11px] text-slate-500">Resume any customer order to active POS billing</p>
                </div>
              </div>
              <button onClick={() => setIsHeldOrdersModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                ✕
              </button>
            </div>

            <div className="my-4 max-h-80 overflow-y-auto space-y-2.5">
              {heldOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <span className="text-3xl mb-1 block">☕</span>
                  <p className="text-xs font-bold text-slate-600">No Orders Currently on Hold</p>
                  <p className="text-[10px]">Use F8 to hold an order during rush hour</p>
                </div>
              ) : (
                heldOrders.map((h) => (
                  <div key={h.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{h.table}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Held at {h.heldAt}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {h.customerName} {h.customerPhone ? `(${h.customerPhone})` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {h.cart.map((c) => `${c.name} x${c.quantity}`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 font-mono block">₹{h.grandTotal}</span>
                      <button
                        onClick={() => handleResumeOrder(h)}
                        className="mt-1 px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-xs transition"
                      >
                        ▶ Resume
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ITEM NOTES / INSTRUCTIONS */}
      {editingNotesItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              Cooking Instructions: {editingNotesItem.name}
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">Kitchen slip will print these specific notes</p>

            {/* Quick Note Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {['Extra Spicy', 'Less Oil', 'No Onion/Garlic', 'Separate Salan', 'Pack Separately', 'Make it Crispy'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCustomNoteText(preset)}
                  className="px-2 py-1 bg-slate-100 hover:bg-orange-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200"
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={customNoteText}
              onChange={(e) => setCustomNoteText(e.target.value)}
              placeholder="e.g. Extra mint raita, less spicy..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-orange-500 mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingNotesItem(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCart((prev) =>
                    prev.map((c) => (c.id === editingNotesItem.id ? { ...c, notes: customNoteText } : c))
                  );
                  setEditingNotesItem(null);
                }}
                className="flex-1 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KEYBOARD SHORTCUTS CHEAT SHEET */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">PetPooja Keyboard Shortcuts</h3>
              <button onClick={() => setIsShortcutsModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <div className="space-y-2.5 my-4 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-bold text-slate-800">F2</span>
                <span className="text-slate-500">Focus Dish Search</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-bold text-slate-800">F4</span>
                <span className="text-slate-500">Settle &amp; Close Bill</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-bold text-slate-800">F7</span>
                <span className="text-slate-500">Fire Incremental KOT</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-bold text-slate-800">F8</span>
                <span className="text-slate-500">Hold Active Order</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-bold text-slate-800">Esc</span>
                <span className="text-slate-500">Close Open Modal</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-bold text-slate-800">?</span>
                <span className="text-slate-500">Open this Shortcuts Dialog</span>
              </div>
            </div>
            <button
              onClick={() => setIsShortcutsModalOpen(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: 80MM THERMAL RECEIPT PREVIEW (DYNAMIC ADDRESS, MOBILE & MULTI-TENDER LEDGER) */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-300 font-mono text-xs">
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h2 className="text-base font-extrabold tracking-wider">{profile.restaurantName.toUpperCase()}</h2>
              {profile.branchName && <p className="text-[10px] text-slate-700 font-bold">{profile.branchName}</p>}
              <p className="text-[10px] text-slate-600">{profile.addressLine1}</p>
              {profile.addressLine2 && <p className="text-[10px] text-slate-600">{profile.addressLine2}</p>}
              <p className="text-[10px] text-slate-600">{profile.cityPincode}</p>
              <p className="text-[10px] font-bold text-slate-900 mt-0.5">Mobile: {profile.mobile}</p>
              {profile.secondaryPhone && <p className="text-[10px] text-slate-600">Ph: {profile.secondaryPhone}</p>}
              {profile.gstin && <p className="text-[10px] text-slate-600">GSTIN: {profile.gstin}</p>}
            </div>

            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Bill #: INV-8492</span>
                <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Table: {selectedTable}</span>
                <span>Type: {orderType}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer: {customerName || 'Direct Diner'}</span>
                <span>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="truncate pr-2">
                    {item.name} {item.portion_size ? `(${item.portion_size})` : ''} x {item.quantity}
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Financials & Multi-Tender Breakdown */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between">
                  <span>Loyalty Discount:</span>
                  <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                <span>GRAND TOTAL:</span>
                <span>₹{grandTotal}</span>
              </div>

              {/* Multi-Tender Payment Breakdown */}
              <div className="pt-1 text-[10px] text-slate-600 space-y-0.5">
                {Number(tenderCash) > 0 && <div className="flex justify-between"><span>Paid via Cash:</span><span>₹{tenderCash}</span></div>}
                {Number(tenderUpi) > 0 && <div className="flex justify-between"><span>Paid via UPI:</span><span>₹{tenderUpi}</span></div>}
                {Number(tenderCard) > 0 && <div className="flex justify-between"><span>Paid via Card:</span><span>₹{tenderCard}</span></div>}
                {Number(tenderDue) > 0 && <div className="flex justify-between"><span>Customer Credit (Due):</span><span>₹{tenderDue}</span></div>}
              </div>
            </div>

            <div className="text-center pt-3 text-[10px] text-slate-500">
              <p>{profile.receiptFooter}</p>
              <p className="mt-1">Powered by Smart Restaurant POS</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs"
              >
                ✏️ Edit Receipt
              </button>
              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  clearCart();
                }}
                className="flex-1 py-2 rounded-lg bg-orange-600 text-white font-bold text-xs hover:bg-orange-700"
              >
                Done &amp; Next Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTAURANT PROFILE EDIT MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Restaurant Details &amp; Bill Receipt Header</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Restaurant Brand Name *</label>
                <input
                  type="text"
                  required
                  value={profile.restaurantName}
                  onChange={(e) => setProfile({ ...profile, restaurantName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={profile.branchName}
                    onChange={(e) => setProfile({ ...profile, branchName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={profile.addressLine1}
                  onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City &amp; Pincode *</label>
                  <input
                    type="text"
                    required
                    value={profile.cityPincode}
                    onChange={(e) => setProfile({ ...profile, cityPincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={profile.gstin}
                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt Footer Note</label>
                <input
                  type="text"
                  value={profile.receiptFooter}
                  onChange={(e) => setProfile({ ...profile, receiptFooter: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-600 text-white rounded-xl font-bold shadow-xs"
                >
                  Save &amp; Update All Bills
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD DISH MODAL (WITH PORTIONS ML/GM/PCS) */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Add New Dish to Menu</h3>
              <button onClick={() => setIsQuickAddModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveQuickDish} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={quickDishName}
                  onChange={(e) => setQuickDishName(e.target.value)}
                  placeholder="e.g. Chicken Dum Handi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quickDishPrice}
                    onChange={(e) => setQuickDishPrice(Number(e.target.value))}
                    placeholder="320"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Short Code</label>
                  <input
                    type="text"
                    value={quickDishCode}
                    onChange={(e) => setQuickDishCode(e.target.value.toUpperCase())}
                    placeholder="CDH01"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700">Portion / Serving Size (ml / gm / pcs)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={quickDishPortionVal}
                    onChange={(e) => setQuickDishPortionVal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold"
                  />
                  <select
                    value={quickDishPortionUnit}
                    onChange={(e) => setQuickDishPortionUnit(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold"
                  >
                    <option value="ml">ml (Milliliters)</option>
                    <option value="L">L (Litres)</option>
                    <option value="gm">gm (Grams)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="pcs">Pcs (Pieces)</option>
                    <option value="Plate">Plate (Full)</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-600 text-white rounded-xl font-bold shadow-xs"
                >
                  + Save &amp; Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOICE COMMAND & BILL SEARCH MODAL */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎙️</span>
                <h3 className="font-extrabold text-base text-slate-900">Voice Command Assistant</h3>
              </div>
              <button onClick={() => { stopVoiceListening(); setIsVoiceModalOpen(false); }} className="text-slate-400 font-bold">✕</button>
            </div>
            <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs font-bold text-slate-700">{voiceFeedbackMsg}</p>
              {voiceTranscript && (
                <p className="mt-2 text-xs font-mono font-bold text-red-600">&quot;{voiceTranscript}&quot;</p>
              )}
              <div className="mt-3 flex justify-center">
                {isListening ? (
                  <button onClick={stopVoiceListening} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl">
                    ⏹️ Stop Mic
                  </button>
                ) : (
                  <button onClick={startVoiceListening} className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl">
                    🎙️ Tap to Speak
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {['zomato 4567', 'mark ready', 'swiggy 2091', 'table t-02'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => processVoiceCommand(chip)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 text-slate-700 rounded-lg text-xs font-bold border"
                >
                  🎙️ &quot;{chip}&quot;
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or type 4-digit number (e.g. 4567)..."
                value={manualVoiceInput}
                onChange={(e) => setManualVoiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualVoiceInput.trim()) {
                    processVoiceCommand(manualVoiceInput.trim());
                    setManualVoiceInput('');
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
              />
              <button
                onClick={() => {
                  if (manualVoiceInput.trim()) {
                    processVoiceCommand(manualVoiceInput.trim());
                    setManualVoiceInput('');
                  }
                }}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOICE-MATCHED BILL MODAL */}
      {activeVoiceBill && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black text-white ${activeVoiceBill.channel === 'ZOMATO' ? 'bg-red-600' : 'bg-orange-600'}`}>
                  {activeVoiceBill.channelName}
                </span>
                <span className="font-mono font-black text-slate-900 text-base">#{activeVoiceBill.orderRef}</span>
              </div>
              <button onClick={() => setActiveVoiceBill(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <div className="my-3 p-3 rounded-xl bg-slate-50 border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400">Order Status:</span>
                <p className="font-extrabold text-xs text-slate-800">{activeVoiceBill.status}</p>
              </div>
              {activeVoiceBill.status !== 'FOOD_READY' && (
                <button
                  onClick={() => markOrderReady(activeVoiceBill.id)}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  ✓ Mark Ready (Voice / Click)
                </button>
              )}
            </div>
            <div className="border border-slate-200 rounded-xl p-3 divide-y text-xs">
              {activeVoiceBill.items.map((it, idx) => (
                <div key={idx} className="py-1.5 flex justify-between">
                  <span>{it.name} x{it.quantity}</span>
                  <span className="font-bold">₹{it.price * it.quantity}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span className="text-orange-600">₹{activeVoiceBill.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
