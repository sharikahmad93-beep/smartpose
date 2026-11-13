# Smart Restaurant POS SaaS Platform

An enterprise-grade, offline-first Smart Restaurant POS SaaS platform designed for restaurants, cafes, quick-service eateries, and multi-outlet food chains.

---

## 🏛️ Architecture Overview

* **Desktop POS (Windows):** Flutter Desktop — Offline-first billing, local SQLite database, thermal printer support.
* **Mobile POS (Android):** Flutter Mobile — Captain / Waiter order taking, table management.
* **Kitchen Display System (KDS):** Flutter — Real-time kitchen order tickets (KOT) with Supabase Realtime synchronization.
* **Owner Companion App:** Flutter Mobile — Real-time sales metrics, analytics, table status.
* **Web Admin Portal:** Next.js 15 (TypeScript) — Restaurant owner management dashboard (menu, staff, reports, inventory).
* **Web Super Admin:** Next.js 15 (TypeScript) — Platform operator portal for multi-tenant billing, subscriptions, and metrics.
* **Central Backend:** Supabase Cloud (PostgreSQL, Auth, Row Level Security, Realtime, Storage, Edge Functions).
* **Background Worker:** Node.js + TypeScript — Cloud sync engine, webhook processing, asynchronous integrations.

---

## 📁 Repository Structure

```
smart-restaurant-pos/
├── apps/
│   ├── pos_desktop/          # Flutter Windows POS app (Offline-first, SQLite, Printer)
│   ├── pos_mobile/           # Flutter Android POS app (Handheld captain ordering)
│   ├── kds_app/              # Flutter Kitchen Display System (Realtime orders)
│   ├── owner_app/            # Flutter Mobile App for Restaurant Owners
│   ├── web_admin/            # Next.js + TypeScript (Restaurant Owner / Manager Portal)
│   └── web_superadmin/       # Next.js + TypeScript (SaaS Platform Super Admin)
├── packages/
│   ├── pos_core/             # Shared Dart core models, sync engine, calculation logic
│   ├── pos_ui/               # Shared Flutter widgets, themes, receipt templates
│   └── shared_types/         # Shared TypeScript interfaces & DTOs for web & worker
├── backend/
│   ├── supabase/             # Supabase schema, SQL migrations, seed data, RLS policies
│   │   ├── migrations/
│   │   ├── seed.sql
│   │   └── functions/        # Supabase Edge Functions (Deno / TypeScript)
│   └── worker/               # Node.js + TypeScript background worker
├── docs/                     # Architecture blueprints, database ER diagrams, API specs
├── .gitignore
└── README.md
```

---

## 🔒 Security & Data Isolation
* Multi-tenant data segregation enforced at the database level using Supabase Row Level Security (RLS).
* Environment variables and API secrets are never committed to version control.
