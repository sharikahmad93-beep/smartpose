'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { ordersService } from '@/lib/ordersService';

type TableStatus = 'VACANT' | 'OCCUPIED' | 'RUNNING_KOT' | 'BILLED' | 'RESERVED' | 'NEEDS_CLEANING';

interface Reservation {
  guest_name: string;
  phone: string;
  time: string;
  date: string;
  advance: number;
  notes?: string;
}

interface DiningTable {
  id: string;
  table_number: string;
  section: string;
  capacity: number;
  status: TableStatus;
  active_bill?: number;
  covers?: number;
  captain?: string;
  time_elapsed?: string;
  merged_with?: string[];
  reservation?: Reservation;
}

const INITIAL_TABLES: DiningTable[] = [
  { id: '1', table_number: 'T-01', section: 'AC Main Hall', capacity: 4, status: 'RUNNING_KOT', active_bill: 1450, covers: 3, captain: 'Vikram R.', time_elapsed: '24m' },
  { id: '2', table_number: 'T-02', section: 'AC Main Hall', capacity: 4, status: 'OCCUPIED', active_bill: 2180, covers: 4, captain: 'Rahul K.', time_elapsed: '42m' },
  { id: '3', table_number: 'T-03', section: 'AC Main Hall', capacity: 2, status: 'VACANT' },
  { id: '4', table_number: 'T-04', section: 'AC Main Hall', capacity: 6, status: 'BILLED', active_bill: 3820, covers: 5, captain: 'Vikram R.', time_elapsed: '58m' },
  { id: '5', table_number: 'T-05', section: 'Family Section', capacity: 8, status: 'RUNNING_KOT', active_bill: 4950, covers: 7, captain: 'Ananya S.', time_elapsed: '18m', merged_with: ['T-05b'] },
  { id: '6', table_number: 'T-06', section: 'Family Section', capacity: 6, status: 'RESERVED', reservation: { guest_name: 'Dr. Alok Verma', phone: '+91 98450 11223', date: 'Today', time: '08:30 PM', advance: 1000, notes: 'Anniversary celebration. Near window.' } },
  { id: '7', table_number: 'T-07', section: 'Garden Patio', capacity: 4, status: 'NEEDS_CLEANING', captain: 'Sameer M.', time_elapsed: 'Bussed' },
  { id: '8', table_number: 'T-08', section: 'Garden Patio', capacity: 2, status: 'VACANT' },
  { id: '9', table_number: 'T-09', section: 'Rooftop Lounge', capacity: 6, status: 'OCCUPIED', active_bill: 3400, covers: 4, captain: 'Deepak T.', time_elapsed: '35m' },
  { id: '10', table_number: 'T-10', section: 'Rooftop Lounge', capacity: 4, status: 'RUNNING_KOT', active_bill: 1890, covers: 3, captain: 'Deepak T.', time_elapsed: '12m' },
  { id: '11', table_number: 'T-11', section: 'Rooftop Lounge', capacity: 2, status: 'VACANT' },
  { id: '12', table_number: 'T-12', section: 'Bar Counter', capacity: 2, status: 'OCCUPIED', active_bill: 850, covers: 2, captain: 'Vikram R.', time_elapsed: '15m' },
];

const SECTIONS = ['All Sections', 'AC Main Hall', 'Family Section', 'Garden Patio', 'Rooftop Lounge', 'Bar Counter'];

export default function TablesPage() {
  const [tables, setTables] = useState<DiningTable[]>(INITIAL_TABLES);
  const [selectedSection, setSelectedSection] = useState<string>('All Sections');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [activeTableForAction, setActiveTableForAction] = useState<DiningTable | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form state: Reservation
  const [resGuestName, setResGuestName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resDate, setResDate] = useState('Today');
  const [resTime, setResTime] = useState('08:00 PM');
  const [resCovers, setResCovers] = useState(4);
  const [resAdvance, setResAdvance] = useState<number | ''>(500);
  const [resNotes, setResNotes] = useState('');
  const [targetTableId, setTargetTableId] = useState('');

  // Form state: Merge & Transfer
  const [mergePrimaryId, setMergePrimaryId] = useState('');
  const [mergeSecondaryId, setMergeSecondaryId] = useState('');
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Live Supabase Tables & Realtime Sync
  useEffect(() => {
    async function loadTables() {
      try {
        const liveTables = await ordersService.fetchTables();
        if (liveTables && liveTables.length > 0) {
          const mapped: DiningTable[] = liveTables.map((t: any) => ({
            id: t.id,
            table_number: t.table_number,
            section: t.floor_section || 'AC Main Hall',
            capacity: t.seating_capacity || 4,
            status: t.status as TableStatus,
            active_bill: t.status === 'RUNNING_KOT' ? 1250 : (t.status === 'OCCUPIED' ? 890 : 0),
            covers: t.seating_capacity || 4,
            captain: 'Staff',
          }));
          setTables((prev) => {
            const merged = [...mapped];
            for (const p of prev) {
              if (!merged.some((m) => m.table_number === p.table_number)) {
                merged.push(p);
              }
            }
            return merged;
          });
        }
      } catch (e) {
        console.warn('Error loading live dining tables', e);
      }
    }
    loadTables();

    const unsubscribe = ordersService.subscribeToTables(() => {
      loadTables();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Status style dictionary (PetPooja standard 6 states)
  const statusConfig: Record<TableStatus, { border: string; bg: string; text: string; badge: string; label: string; dot: string }> = {
    VACANT: {
      border: 'border-emerald-300 hover:border-emerald-500',
      bg: 'bg-white',
      text: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800',
      label: 'Vacant',
      dot: 'bg-emerald-500',
    },
    OCCUPIED: {
      border: 'border-orange-300 hover:border-orange-500',
      bg: 'bg-white',
      text: 'text-orange-800',
      badge: 'bg-orange-100 text-orange-800',
      label: 'Occupied',
      dot: 'bg-orange-500',
    },
    RUNNING_KOT: {
      border: 'border-sky-300 hover:border-sky-500',
      bg: 'bg-white',
      text: 'text-sky-800',
      badge: 'bg-sky-100 text-sky-800',
      label: 'Running KOT',
      dot: 'bg-sky-500 animate-pulse',
    },
    BILLED: {
      border: 'border-purple-300 hover:border-purple-500',
      bg: 'bg-white',
      text: 'text-purple-800',
      badge: 'bg-purple-100 text-purple-800',
      label: 'Bill Printed',
      dot: 'bg-purple-500',
    },
    RESERVED: {
      border: 'border-amber-300 hover:border-amber-500',
      bg: 'bg-amber-50/40',
      text: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-800',
      label: 'Reserved',
      dot: 'bg-amber-500',
    },
    NEEDS_CLEANING: {
      border: 'border-rose-300 hover:border-rose-500',
      bg: 'bg-rose-50/30',
      text: 'text-rose-800',
      badge: 'bg-rose-100 text-rose-800',
      label: 'Needs Cleaning',
      dot: 'bg-rose-500',
    },
  };

  // Quick action: update table status
  const updateTableStatus = (id: string, newStatus: TableStatus) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, status: newStatus };
          if (newStatus === 'VACANT') {
            updated.active_bill = undefined;
            updated.covers = undefined;
            updated.time_elapsed = undefined;
            updated.reservation = undefined;
            updated.merged_with = undefined;
          }
          return updated;
        }
        return t;
      })
    );
    showToast(`Table status updated to ${newStatus}`);
    setActiveTableForAction(null);
  };

  // Save Reservation
  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTableId || !resGuestName || !resPhone) {
      alert('Please fill Guest Name, Phone and select a Table');
      return;
    }

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === targetTableId) {
          return {
            ...t,
            status: 'RESERVED',
            reservation: {
              guest_name: resGuestName,
              phone: resPhone,
              date: resDate,
              time: resTime,
              advance: Number(resAdvance) || 0,
              notes: resNotes,
            },
          };
        }
        return t;
      })
    );

    showToast(`Table successfully reserved for ${resGuestName} (${resTime})`);
    setIsReserveModalOpen(false);
    setResGuestName('');
    setResPhone('');
    setResNotes('');
  };

  // Handle Merge Tables
  const handleMergeTables = () => {
    if (!mergePrimaryId || !mergeSecondaryId || mergePrimaryId === mergeSecondaryId) {
      alert('Please select two distinct tables to merge');
      return;
    }
    const secTable = tables.find((t) => t.id === mergeSecondaryId);
    if (!secTable) return;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === mergePrimaryId) {
          const existingMerged = t.merged_with || [];
          return {
            ...t,
            status: 'OCCUPIED',
            active_bill: (t.active_bill || 0) + (secTable.active_bill || 0),
            covers: (t.covers || 2) + (secTable.covers || 2),
            merged_with: Array.from(new Set([...existingMerged, secTable.table_number])),
          };
        }
        if (t.id === mergeSecondaryId) {
          return {
            ...t,
            status: 'OCCUPIED',
            merged_with: [tables.find((p) => p.id === mergePrimaryId)?.table_number || 'Merged'],
          };
        }
        return t;
      })
    );

    if (mergePrimaryId.length > 20 && mergeSecondaryId.length > 20) {
      ordersService.mergeTables(mergePrimaryId, mergeSecondaryId, 'Merged by floor captain', 'CAPTAIN').catch(console.error);
    }

    showToast(`Tables merged successfully into single running order`);
    setIsMergeModalOpen(false);
  };

  // Handle Transfer Table
  const handleTransferTable = () => {
    if (!transferFromId || !transferToId || transferFromId === transferToId) {
      alert('Please select valid From and To tables');
      return;
    }
    const fromTable = tables.find((t) => t.id === transferFromId);
    if (!fromTable) return;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === transferToId) {
          return {
            ...t,
            status: fromTable.status,
            active_bill: fromTable.active_bill,
            covers: fromTable.covers,
            captain: fromTable.captain,
            time_elapsed: fromTable.time_elapsed,
          };
        }
        if (t.id === transferFromId) {
          return {
            ...t,
            status: 'NEEDS_CLEANING',
            active_bill: undefined,
            covers: undefined,
            time_elapsed: undefined,
          };
        }
        return t;
      })
    );

    if (transferFromId.length > 20 && transferToId.length > 20) {
      ordersService.transferTable(fromTable.id, transferFromId, transferToId, 'Transferred by floor captain', 'CAPTAIN').catch(console.error);
    }

    showToast(`Order transferred from ${fromTable.table_number} to target table`);
    setIsTransferModalOpen(false);
  };

  // Filtered tables
  const filteredTables = tables.filter((t) => {
    const matchSection = selectedSection === 'All Sections' || t.section === selectedSection;
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSection && matchStatus;
  });

  // Counts
  const counts = {
    ALL: tables.length,
    VACANT: tables.filter((t) => t.status === 'VACANT').length,
    OCCUPIED: tables.filter((t) => t.status === 'OCCUPIED').length,
    RUNNING_KOT: tables.filter((t) => t.status === 'RUNNING_KOT').length,
    BILLED: tables.filter((t) => t.status === 'BILLED').length,
    RESERVED: tables.filter((t) => t.status === 'RESERVED').length,
    NEEDS_CLEANING: tables.filter((t) => t.status === 'NEEDS_CLEANING').length,
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar activeTab="tables" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪑</span>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Live Dining Tables &amp; Floor Plan</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  PetPooja Floor View
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time table occupancy, section filters, table merge/split, and table reservation manager.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsReserveModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <span>📅</span>
                <span>Book Table</span>
              </button>

              <button
                onClick={() => setIsMergeModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <span>🔗</span>
                <span>Merge Tables</span>
              </button>

              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>Transfer Table</span>
              </button>

              <Link
                href="/pos"
                className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-orange-600/20 flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>POS Speed Billing (F2)</span>
              </Link>
            </div>
          </header>

          {/* Status Color Key / Metric Pills */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { key: 'VACANT', label: 'Vacant', count: counts.VACANT, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { key: 'OCCUPIED', label: 'Occupied', count: counts.OCCUPIED, bg: 'bg-orange-50 text-orange-700 border-orange-200' },
              { key: 'RUNNING_KOT', label: 'Running KOT', count: counts.RUNNING_KOT, bg: 'bg-sky-50 text-sky-700 border-sky-200' },
              { key: 'BILLED', label: 'Bill Printed', count: counts.BILLED, bg: 'bg-purple-50 text-purple-700 border-purple-200' },
              { key: 'RESERVED', label: 'Reserved', count: counts.RESERVED, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
              { key: 'NEEDS_CLEANING', label: 'Needs Clean', count: counts.NEEDS_CLEANING, bg: 'bg-rose-50 text-rose-700 border-rose-200' },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(statusFilter === st.key ? 'ALL' : st.key)}
                className={`p-2.5 rounded-xl border transition text-left flex items-center justify-between ${st.bg} ${
                  statusFilter === st.key ? 'ring-2 ring-slate-900 shadow-sm font-black' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[st.key as TableStatus].dot}`}></span>
                  <span className="text-xs font-bold">{st.label}</span>
                </div>
                <span className="font-mono text-sm font-black">{st.count}</span>
              </button>
            ))}
          </div>

          {/* Section Filters */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-black uppercase text-slate-400 px-2">Floor:</span>
              {SECTIONS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${
                    selectedSection === sec
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="text-xs text-orange-600 font-bold hover:underline px-2"
              >
                Clear Filter ({statusFilter}) ✕
              </button>
            )}
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-6">
            {filteredTables.map((t) => {
              const cfg = statusConfig[t.status];
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md flex flex-col justify-between h-56 select-none relative group ${cfg.bg} ${cfg.border}`}
                >
                  {/* Top Bar inside card */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-900">{t.table_number}</span>
                          {t.merged_with && (
                            <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-1.5 py-0.5 rounded" title={`Merged with: ${t.merged_with.join(', ')}`}>
                              🔗 Merged
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{t.section}</p>
                      </div>

                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👥 {t.capacity} Max</span>
                      {t.time_elapsed && <span className="font-mono text-slate-600 font-semibold">⏱️ {t.time_elapsed}</span>}
                    </div>
                  </div>

                  {/* Middle Content: Reservation vs Running Bill */}
                  <div className="my-2">
                    {t.status === 'RESERVED' && t.reservation && (
                      <div className="p-2 rounded-xl bg-amber-100/70 text-amber-900 text-xs">
                        <p className="font-bold truncate">👤 {t.reservation.guest_name}</p>
                        <p className="text-[10px] text-amber-800">{t.reservation.time} &bull; Adv: ₹{t.reservation.advance}</p>
                      </div>
                    )}

                    {t.status !== 'VACANT' && t.status !== 'RESERVED' && t.status !== 'NEEDS_CLEANING' && (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Running Bill</span>
                          <span className="text-xs font-black text-slate-900 font-mono">₹{t.active_bill?.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {t.covers || 2} covers &bull; {t.captain || 'Staff'}
                        </p>
                      </div>
                    )}

                    {t.status === 'NEEDS_CLEANING' && (
                      <div className="p-2 rounded-xl bg-rose-100/60 text-rose-800 text-xs text-center font-bold">
                        🧹 Bussing Required
                      </div>
                    )}

                    {t.status === 'VACANT' && (
                      <div className="text-center py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-700">Ready to Seat</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between gap-1">
                    {t.status === 'VACANT' ? (
                      <Link
                        href={`/pos`}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center transition"
                      >
                        + Punch Bill
                      </Link>
                    ) : t.status === 'RESERVED' ? (
                      <div className="flex items-center gap-1 w-full">
                        <Link
                          href={`/pos`}
                          className="flex-1 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold text-center"
                        >
                          Seat Guest
                        </Link>
                        <button
                          onClick={() => updateTableStatus(t.id, 'VACANT')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold"
                          title="Cancel Reservation"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : t.status === 'NEEDS_CLEANING' ? (
                      <button
                        onClick={() => updateTableStatus(t.id, 'VACANT')}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        ✓ Mark Cleaned
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 w-full">
                        <Link
                          href={`/pos`}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold text-center transition"
                        >
                          View Order →
                        </Link>
                        <button
                          onClick={() => setActiveTableForAction(t)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                          title="More Table Options"
                        >
                          ⚙️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* MODAL 1: Table Quick Action Dropdown Modal */}
      {activeTableForAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {activeTableForAction.table_number} Options
                </h3>
                <p className="text-xs text-slate-500">{activeTableForAction.section} &bull; Capacity {activeTableForAction.capacity}</p>
              </div>
              <button
                onClick={() => setActiveTableForAction(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <Link
                href="/pos"
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 text-xs font-bold transition"
              >
                <span>⚡</span>
                <span>Open in POS Terminal</span>
              </Link>

              <button
                onClick={() => {
                  setTargetTableId(activeTableForAction.id);
                  setActiveTableForAction(null);
                  setIsQrModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition"
              >
                <span>📱</span>
                <span>View Customer Scan QR Code</span>
              </button>

              <button
                onClick={() => {
                  setTransferFromId(activeTableForAction.id);
                  setActiveTableForAction(null);
                  setIsTransferModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition"
              >
                <span>🔄</span>
                <span>Transfer Bill to Another Table</span>
              </button>

              <button
                onClick={() => updateTableStatus(activeTableForAction.id, 'BILLED')}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition"
              >
                <span>🧾</span>
                <span>Mark as Bill Printed</span>
              </button>

              <button
                onClick={() => updateTableStatus(activeTableForAction.id, 'NEEDS_CLEANING')}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold transition"
              >
                <span>🧹</span>
                <span>Mark as Needs Cleaning</span>
              </button>

              <button
                onClick={() => updateTableStatus(activeTableForAction.id, 'VACANT')}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition"
              >
                <span>✓</span>
                <span>Force Vacate / Free Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Table Reservation Booking Drawer */}
      {isReserveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="font-extrabold text-slate-900 text-lg">New Table Reservation</h3>
              </div>
              <button
                onClick={() => setIsReserveModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReservation} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Dining Table *</label>
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                  required
                >
                  <option value="">-- Choose Vacant Table --</option>
                  {tables
                    .filter((t) => t.status === 'VACANT' || t.status === 'RESERVED')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.section} - {t.capacity} Seats) {t.status === 'RESERVED' ? '[Currently Reserved]' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    value={resGuestName}
                    onChange={(e) => setResGuestName(e.target.value)}
                    placeholder="e.g. Vikramaditya Rao"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={resPhone}
                    onChange={(e) => setResPhone(e.target.value)}
                    placeholder="+91 98450 11223"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Booking Date</label>
                  <select
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Weekend">This Weekend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    placeholder="08:30 PM"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guests (Covers)</label>
                  <input
                    type="number"
                    value={resCovers}
                    onChange={(e) => setResCovers(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Advance Deposit (₹)</label>
                <input
                  type="number"
                  value={resAdvance}
                  onChange={(e) => setResAdvance(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="500"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Occasion / Guest Notes</label>
                <textarea
                  value={resNotes}
                  onChange={(e) => setResNotes(e.target.value)}
                  placeholder="e.g. Birthday decoration requested, window seat preference."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Merge Tables Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔗</span>
                <h3 className="font-extrabold text-slate-900 text-lg">Merge Running Tables</h3>
              </div>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Combine orders and guests from two tables into a single consolidated running bill.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Table (Master Bill)</label>
                <select
                  value={mergePrimaryId}
                  onChange={(e) => setMergePrimaryId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="">-- Choose Primary Table --</option>
                  {tables
                    .filter((t) => t.status !== 'VACANT')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.section}) - ₹{t.active_bill || 0}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Secondary Table (Merge into Primary)</label>
                <select
                  value={mergeSecondaryId}
                  onChange={(e) => setMergeSecondaryId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="">-- Choose Secondary Table --</option>
                  {tables
                    .filter((t) => t.status !== 'VACANT' && t.id !== mergePrimaryId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.section}) - ₹{t.active_bill || 0}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMergeTables}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow"
                >
                  Merge Tables Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Transfer Table Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <h3 className="font-extrabold text-slate-900 text-lg">Transfer Order to Table</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer From (Current Table)</label>
                <select
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="">-- Choose Source Table --</option>
                  {tables
                    .filter((t) => t.status !== 'VACANT')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.section}) - Running: ₹{t.active_bill || 0}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer To (Destination Table)</label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="">-- Choose Vacant Destination Table --</option>
                  {tables
                    .filter((t) => t.status === 'VACANT')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.section} - {t.capacity} Seats)
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferTable}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  Transfer Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Table QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center shadow-2xl border border-slate-200">
            <span className="text-3xl">📱</span>
            <h3 className="font-extrabold text-slate-900 text-base mt-2">Dine-In Self Order QR</h3>
            <p className="text-xs text-slate-500">Scan to browse digital menu &amp; order</p>

            {/* QR Mockup */}
            <div className="my-5 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block">
              <div className="w-36 h-36 bg-slate-900 text-white flex flex-col items-center justify-center rounded-xl p-2 font-mono text-[9px] text-center">
                <span className="text-2xl mb-1">🏁</span>
                <span>TABLE {targetTableId ? tables.find((t) => t.id === targetTableId)?.table_number : 'T-01'}</span>
                <span className="text-[8px] text-amber-400 mt-1">smartpose.workers.dev/qr</span>
              </div>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Live Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-bounce">
          <span className="text-emerald-400">✓</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
