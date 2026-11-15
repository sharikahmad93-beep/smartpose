'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  pin: string;
}

const STAFF_MEMBERS: StaffMember[] = [
  { id: 'st-1', name: 'Priya Sundaram', role: 'Head Cashier', email: 'cashier1@biryaniexpress.test', initials: 'PS', pin: '1234' },
  { id: 'st-2', name: 'Vikramaditya Rao', role: 'General Manager', email: 'manager@biryaniexpress.test', initials: 'VR', pin: '9999' },
  { id: 'st-3', name: 'Rahul Sharma', role: 'Floor Captain', email: 'captain.rahul@biryaniexpress.test', initials: 'RS', pin: '2222' },
  { id: 'st-4', name: 'Chef Imran', role: 'Kitchen Master', email: 'kitchen@biryaniexpress.test', initials: 'CI', pin: '5555' },
];

export default function TopBar({ title, subtitle }: TopBarProps) {
  const [selectedOutlet, setSelectedOutlet] = useState('Flagship Indiranagar');
  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Staff & Lock Screen State
  const [activeStaff, setActiveStaff] = useState<StaffMember>(STAFF_MEMBERS[0]);
  const [isTerminalLocked, setIsTerminalLocked] = useState(false);
  const [isSwitchStaffModalOpen, setIsSwitchStaffModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedStaffToSwitch, setSelectedStaffToSwitch] = useState<StaffMember>(STAFF_MEMBERS[0]);

  const outlets = [
    { id: 'out-1', name: 'Flagship Indiranagar', code: 'IND-01', status: 'Primary Outlet' },
    { id: 'out-2', name: 'Whitefield High Street', code: 'WHF-02', status: 'Branch Outlet' },
    { id: 'out-3', name: 'Koramangala Cloud Kitchen', code: 'KOR-03', status: 'Delivery Only' },
  ];

  const notifications = [
    { id: '1', title: 'New Zomato Order #ZOM-4567', time: '2m ago', type: 'order', icon: '🛵' },
    { id: '2', title: 'Low Stock Alert: Baby Mutton (4 kg)', time: '12m ago', type: 'alert', icon: '⚠️' },
    { id: '3', title: 'Shift #104 Float ₹2,000 Verified', time: '1h ago', type: 'cash', icon: '💵' },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle PIN input click
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setPinError('');
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const verifyPin = (pin: string) => {
    const target = isSwitchStaffModalOpen ? selectedStaffToSwitch : activeStaff;
    if (pin === target.pin) {
      if (isSwitchStaffModalOpen) {
        setActiveStaff(selectedStaffToSwitch);
        setIsSwitchStaffModalOpen(false);
      }
      setIsTerminalLocked(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect 4-Digit PIN. Try again.');
      setPinInput('');
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        {/* Left: Page Title or Outlet Switcher */}
        <div className="flex items-center gap-4">
          {title ? (
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">{title}</h1>
              {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsOutletDropdownOpen(!isOutletDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>🏢 {selectedOutlet}</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              {isOutletDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <span className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Switch Active Outlet
                  </span>
                  {outlets.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setSelectedOutlet(o.name);
                        setIsOutletDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                        selectedOutlet === o.name ? 'font-bold text-orange-600 bg-orange-50/50' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{o.name}</p>
                        <span className="text-[10px] text-slate-400">{o.code} &bull; {o.status}</span>
                      </div>
                      {selectedOutlet === o.name && <span className="text-orange-600 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Business Day & Shift Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
            <span>📅 Today: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono font-bold text-slate-800">{currentTime || '09:00:00'}</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
              Shift #104: OPEN
            </span>
          </div>
        </div>

        {/* Right: Cloud Sync, Notification, New Order F2, User */}
        <div className="flex items-center gap-3">
          {/* Cloud Sync Status */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800"
            title="Supabase PostgreSQL Live Sync — AWS ap-south-1 (Mumbai)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud Live</span>
          </div>

          {/* Quick New Order Action Button (F2) */}
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30 transition active:scale-95"
            title="Instant POS Speed Billing"
          >
            <span>⚡</span>
            <span>New Order</span>
            <span className="hidden md:inline bg-orange-700 text-orange-200 text-[10px] px-1.5 py-0.2 rounded font-mono">
              F2
            </span>
          </Link>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 relative transition"
              title="Notifications"
            >
              <span className="text-sm">🔔</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="font-extrabold text-xs text-slate-900">Notifications</span>
                  <span className="text-[10px] font-bold text-orange-600 cursor-pointer">Mark all read</span>
                </div>
                <div className="space-y-1.5">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 text-xs">
                      <span className="text-base">{n.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 leading-tight">{n.title}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role with PIN Quick Switch */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {activeStaff.initials}
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <div className="font-bold text-slate-900">{activeStaff.name}</div>
                <span className="text-[10px] text-orange-600 font-medium">{activeStaff.role}</span>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in text-xs">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{activeStaff.name}</p>
                  <p className="text-[10px] text-slate-500">{activeStaff.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                    {activeStaff.role} &bull; Active
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsSwitchStaffModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-orange-50 text-orange-700 font-bold flex items-center justify-between"
                >
                  <span>🔄 Switch Staff Member</span>
                  <span className="text-[10px] font-mono">PIN</span>
                </button>

                <Link href="/cash-drawer" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium">
                  💵 Day Shift #104 Ledger
                </Link>

                <Link href="/settings" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium">
                  ⚙️ Restaurant Configurations
                </Link>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsTerminalLocked(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-bold flex items-center gap-1.5"
                >
                  <span>🔒</span>
                  <span>Quick Lock Terminal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* FULL SCREEN MODAL: Terminal PIN Lock Screen (PetPooja Style) */}
      {(isTerminalLocked || isSwitchStaffModalOpen) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center text-white shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-500 border border-orange-500/30 flex items-center justify-center mx-auto text-xl font-bold mb-3">
              🔒
            </div>

            <h3 className="font-extrabold text-lg text-white">
              {isSwitchStaffModalOpen ? 'Staff Quick PIN Switch' : 'Terminal Locked'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter 4-digit staff security PIN to authorize terminal
            </p>

            {/* If switching staff, show profile selector */}
            {isSwitchStaffModalOpen && (
              <div className="my-3 grid grid-cols-2 gap-1.5 text-left">
                {STAFF_MEMBERS.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSelectedStaffToSwitch(st);
                      setPinInput('');
                      setPinError('');
                    }}
                    className={`p-2 rounded-xl border text-xs transition ${
                      selectedStaffToSwitch.id === st.id
                        ? 'bg-orange-600 text-white border-orange-500 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <p className="font-bold truncate">{st.name}</p>
                    <span className="text-[10px] opacity-80">{st.role}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 text-xs font-semibold text-slate-300">
              User: <span className="text-amber-400 font-bold">{isSwitchStaffModalOpen ? selectedStaffToSwitch.name : activeStaff.name}</span>
              <span className="text-slate-500 text-[10px] ml-1">({isSwitchStaffModalOpen ? selectedStaffToSwitch.role : activeStaff.role})</span>
            </div>

            {/* PIN Dots Display */}
            <div className="my-4 flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    pinInput.length > idx
                      ? 'bg-orange-500 border-orange-500 scale-110 shadow-sm shadow-orange-500/50'
                      : 'border-slate-600 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {pinError && <p className="text-xs text-rose-400 font-bold mb-3">{pinError}</p>}

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinDigit(digit)}
                  className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-orange-600 font-bold text-lg text-white transition active:scale-95 shadow-sm"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                }}
                className="h-12 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-400"
              >
                Clear
              </button>
              <button
                onClick={() => handlePinDigit('0')}
                className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-orange-600 font-bold text-lg text-white transition active:scale-95 shadow-sm"
              >
                0
              </button>
              <button
                onClick={handlePinBackspace}
                className="h-12 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-sm font-bold text-slate-300"
              >
                ⌫
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Default PIN: 1234 / 9999</span>
              {isSwitchStaffModalOpen && (
                <button
                  onClick={() => {
                    setIsSwitchStaffModalOpen(false);
                    setPinInput('');
                  }}
                  className="text-orange-400 font-bold hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
