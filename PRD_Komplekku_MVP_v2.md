# KOMPLEKKU — PRODUCT REQUIREMENTS DOCUMENT (MVP)
Version: 2.0
Status: READY FOR MVP IMPLEMENTATION
Platform: Expo / React Native
Backend: Supabase
Database: PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
Realtime: Supabase Realtime

---

## 1. PRODUCT DEFINITION

Komplekku adalah aplikasi digital untuk **satu komplek/perumahan tertentu**. Satu hasil deployment aplikasi hanya melayani satu komplek.

Komplekku bukan aplikasi yang meminta warga memilih komplek dari daftar publik. Tidak ada konsep "pilih komplek" di dalam aplikasi production.

Model produk:

```text
Komplekku Template
       ↓ clone
Komplek A → Supabase Project A
Komplek B → Supabase Project B
Komplek C → Supabase Project C
```

Setiap komplek mempunyai:
- source/config deployment sendiri;
- Supabase project/database sendiri;
- data warga sendiri;
- branding/config sendiri;
- fitur yang aktif sesuai paket yang dibeli.

**Paket A/B/C adalah paket penjualan kepada developer/pengelola, bukan entity yang harus terlihat oleh warga di aplikasi.**

Warga hanya melihat fitur yang tersedia di aplikasi kompleknya.

---

## 2. PRODUCT VISION

Komplekku menjadi "digital operating layer" untuk satu komplek:

1. Mengelola warga dan rumah.
2. Mengelola struktur RW/RT.
3. Menyampaikan pengumuman.
4. Mengelola iuran bulanan.
5. Menyediakan marketplace internal.
6. Menangani layanan/pengaduan warga.
7. Menyediakan notifikasi dan komunikasi.
8. Memberikan dashboard pengelolaan untuk developer/pengelola.

Prinsip utama:

> Satu komplek, satu aplikasi, satu database, satu ruang digital.

---

## 3. PRODUCT MODEL & DEPLOYMENT

### 3.1 Template

Repository/template utama adalah source of truth.

```text
komplekku-template/
├── app/
├── components/
├── services/
├── config/
├── database/
└── ...
```

Saat mendapat klien:

```text
template
   ↓
clone
   ↓
komplekku-client-x
   ↓
connect Supabase client-x
   ↓
configure branding + enabled modules
   ↓
build/deploy
```

Jangan membuat source code setiap komplek secara manual dari nol.

### 3.2 Database

**1 komplek = 1 Supabase project = 1 PostgreSQL database.**

Jangan mencampur data beberapa komplek ke dalam database production yang sama untuk model MVP ini.

Keuntungan:
- isolasi data kuat;
- backup/restore per klien;
- customisasi lebih aman;
- masalah satu komplek tidak langsung mempengaruhi komplek lain;
- deployment dan ownership lebih mudah.

### 3.3 Package Configuration

Paket tidak perlu disimpan sebagai `package_id` pada data warga.

Yang disimpan adalah **konfigurasi modul yang aktif** pada deployment, misalnya:

```ts
export const modules = {
  residents: true,
  announcements: true,
  dues: true,
  marketplace: true,
  complaints: true,
};
```

Jika diperlukan, konfigurasi dapat dipindahkan ke `app_settings`.

Paket A/B/C tetap menjadi dokumen/kontrak penjualan.

---

# 4. ROLE MODEL

MVP menggunakan empat role utama:

```text
DEVELOPER
RW
RT
WARGA
```

### Developer
Pemilik/pengelola aplikasi untuk komplek.

Akses:
- konfigurasi komplek;
- dashboard keseluruhan;
- kelola RW/RT;
- kelola warga;
- kelola rumah;
- kelola pengumuman;
- kelola iuran;
- kelola marketplace/moderasi;
- kelola pengaduan;
- melihat laporan operasional;
- mengelola admin/role.

### RW
Pengelola level RW.

Akses:
- melihat warga pada RW terkait;
- melihat rumah;
- mengelola pengumuman RW;
- memantau iuran;
- memantau pengaduan;
- melihat aktivitas RT di bawah RW.

RW tidak boleh mengelola data di luar scope RW.

### RT
Pengelola level RT.

Akses:
- melihat warga RT terkait;
- melihat rumah;
- pengumuman RT;
- membantu administrasi iuran;
- memantau pengaduan warga RT;
- melihat data operasional RT.

RT tidak boleh mengubah data RT/RW lain.

### Warga
User biasa.

Akses:
- profil;
- data rumah/keluarga yang diizinkan;
- dashboard;
- pengumuman;
- iuran milik sendiri/rumahnya sesuai policy;
- marketplace;
- chat;
- pengaduan;
- notifikasi.

### Role assignment

Gunakan tabel `user_roles`, bukan string role yang hanya dipercaya frontend.

Satu user dapat memiliki lebih dari satu role jika kebutuhan operasional memerlukannya, tetapi UI tetap menentukan role/context aktif secara eksplisit.

---

# 5. IMPORTANT SECURITY PRINCIPLE

Frontend role checking hanya untuk UX.

Authorization sebenarnya wajib ditegakkan melalui:
- PostgreSQL RLS;
- database constraints;
- security-definer helper functions;
- server-side transaction/RPC bila dibutuhkan.

Contoh:

```text
Warga A
  X
data warga RT lain

RT 01
  X
data RT 02

RW 01
  X
data RW 02
```

Developer memiliki scope penuh pada database komplek, tetapi tetap harus melalui permission yang terdokumentasi.

---

# 6. DASHBOARD & MODULAR NAVIGATION

Ini merupakan perubahan utama dari PRD lama.

Aplikasi production mempunyai **Dashboard Komplekku** sebagai hub.

```text
                 DASHBOARD
                     │
       ┌─────────────┼──────────────┐
       ↓             ↓              ↓
    WARGA          IURAN        MARKETPLACE
       │             │              │
   nav warga      nav iuran     nav marketplace
       │             │              │
       └─────────────┴──────────────┘
                     ↓
                  DASHBOARD
```

### 6.1 Dashboard

Dashboard menampilkan hanya modul yang aktif pada deployment.

Contoh:

```text
Selamat pagi, Adli

[ Warga ]
[ Iuran ]
[ Marketplace ]
[ Pengaduan ]
[ Pengumuman ]
```

Tidak menampilkan:
- nama paket;
- "Paket A/B/C";
- upgrade plan;
- pricing;
- multi-community selector.

### 6.2 Module Navigation

Saat user masuk Marketplace:

```text
Marketplace
├── Home
├── Cari
├── Keranjang
├── Pesanan
└── Profil/Toko
```

Saat user masuk Iuran:

```text
Iuran
├── Ringkasan
├── Tagihan
├── Riwayat
└── Bantuan
```

Saat user kembali:

```text
Back
 ↓
Dashboard Komplekku
```

Setiap modul mempunyai navigation context sendiri.

### 6.3 Navigation principle

Jangan membuat satu bottom navigation global berisi semua fitur produk.

Dashboard adalah root.

Modul adalah mini-app di dalam Komplekku.

---

# 7. MVP MODULES

MVP wajib mencakup:

### Core
- Authentication
- Profil warga
- Data rumah/keluarga
- Struktur RW/RT
- Dashboard
- Pengumuman
- Notifications

### Iuran
- Master jenis iuran
- Tagihan bulanan
- Status tagihan
- Pembayaran/manual proof
- Riwayat pembayaran
- Monitoring RT/RW/Developer

### Marketplace
- Seller
- Category
- Product
- Product image
- Search
- Detail
- Cart
- Checkout
- Order
- Order status
- Chat seller

### Pengaduan
- Create complaint
- Category
- Status
- Assignment
- Comments/update
- Resolution

### Admin/Management
- Developer dashboard
- RW dashboard
- RT dashboard
- User/resident management
- Moderation
- Operational summaries

---

# 8. OUT OF SCOPE MVP

Jangan membuat:
- payment gateway otomatis;
- kartu kredit;
- wallet;
- escrow;
- GPS delivery;
- courier marketplace;
- AI;
- recommendation engine;
- loyalty;
- affiliate;
- advertising;
- subscription management;
- multi-country;
- multi-language;
- complex accounting;
- full ERP;
- advanced analytics;
- live commerce;
- auction;
- follower/following;
- complex social network.

Payment iuran dan marketplace dapat menggunakan **manual confirmation/proof** pada MVP.

---

# 9. AUTHENTICATION

Supabase Auth.

Minimum:
- email;
- password;
- session persistence;
- logout;
- protected routes.

Profile application disimpan di `profiles`.

Password tidak boleh disimpan di tabel aplikasi.

### Resident onboarding

Production flow:

```text
Login/Register
      ↓
Profile
      ↓
Verification / resident assignment
      ↓
Dashboard
```

Karena aplikasi sudah khusus satu komplek, user tidak memilih komplek.

Developer/admin dapat membuat atau mengundang warga sesuai implementation.

---

# 10. RESIDENT MANAGEMENT

## 10.1 House

Setiap rumah/unit mempunyai:
- block;
- house number;
- address label;
- RT;
- RW;
- status.

## 10.2 Household

Satu rumah dapat mempunyai banyak anggota keluarga.

Contoh:

```text
Rumah B-12
├── Kepala Keluarga
├── Pasangan
└── Anak
```

## 10.3 Resident

Data minimum:
- nama;
- nomor HP;
- avatar;
- rumah;
- hubungan keluarga;
- status resident;
- tanggal bergabung;
- verification status.

Developer/RW/RT dapat melihat data sesuai scope.

Warga biasa hanya melihat data yang memang diizinkan.

---

# 11. RW & RT STRUCTURE

```text
Developer
   │
   └── RW
        │
        ├── RT 01
        ├── RT 02
        └── RT 03
```

`rt_units` mempunyai `rw_id`.

Resident mempunyai assignment ke rumah, dan rumah mempunyai assignment RT/RW.

Jangan menjadikan RT/RW hanya text bebas di profile.

---

# 12. ANNOUNCEMENTS

Developer/RW/RT dapat membuat pengumuman sesuai scope.

Fields:
- title;
- body;
- image optional;
- target scope;
- author;
- publish_at;
- expires_at;
- status.

Scope:
- komplek;
- RW;
- RT.

Warga hanya melihat pengumuman yang berlaku untuk scope-nya.

---

# 13. IURAN MODULE

Iuran merupakan modul wajib MVP.

## 13.1 Iuran Type

Contoh:
- iuran keamanan;
- kebersihan;
- kas;
- maintenance.

Master:
- name;
- description;
- amount;
- billing frequency;
- due day;
- active.

## 13.2 Billing

Setiap periode dibuat tagihan.

Contoh:

```text
September 2026
Iuran Keamanan
Rp50.000
Status: Belum Dibayar
```

Tagihan harus menyimpan snapshot nominal.

Jika nominal master berubah bulan berikutnya, tagihan lama tidak ikut berubah.

## 13.3 Payment

MVP menggunakan manual payment/proof.

Flow:

```text
Tagihan
  ↓
Bayar
  ↓
Upload bukti
  ↓
Pending verification
  ↓
RT/RW/Developer verify
  ↓
Paid
```

Status:
- unpaid;
- pending_verification;
- paid;
- rejected;
- cancelled.

## 13.4 Iuran visibility

Warga:
- tagihan rumah/user sendiri;
- riwayat sendiri.

RT:
- seluruh tagihan RT;
- monitoring pembayaran.

RW:
- seluruh tagihan RW.

Developer:
- seluruh komplek.

---

# 14. MARKETPLACE MODULE

Marketplace tetap menjadi salah satu modul, bukan root identity produk.

MVP marketplace:

```text
Marketplace Home
→ Category/Search
→ Product
→ Seller
→ Cart
→ Checkout
→ Order
→ Chat
```

## Seller

Warga dapat menjadi seller.

Seller profile:
- store name;
- description;
- avatar;
- status.

## Product

Fields:
- seller;
- category;
- name;
- description;
- price;
- stock;
- type;
- condition;
- status.

Type:
- product;
- service.

## Cart

Satu checkout hanya boleh berisi satu seller.

Tidak ada split-order otomatis pada MVP.

## Order

Status:

```text
pending
confirmed
processing
ready
completed
cancelled
```

Order item menyimpan:
- product;
- product name snapshot;
- price snapshot;
- quantity;
- subtotal.

Tidak ada payment gateway pada MVP.

---

# 15. MARKETPLACE CHAT

Chat buyer-seller menggunakan Supabase Realtime.

Text-only MVP.

Participant harus menjadi anggota komplek dan hanya participant conversation yang dapat membaca message.

---

# 16. COMPLAINT / PENGADUAN

MVP menyediakan kanal pengaduan.

Contoh:
- keamanan;
- kebersihan;
- fasilitas;
- jalan;
- lampu;
- administrasi;
- lainnya.

Complaint fields:
- reporter;
- category;
- title;
- description;
- location note;
- priority;
- status;
- assigned_to;
- resolution note;
- created_at;
- resolved_at.

Status:

```text
submitted
in_review
in_progress
resolved
rejected
closed
```

Flow:

```text
Warga
 ↓
Buat Pengaduan
 ↓
Submitted
 ↓
RT/RW/Developer review
 ↓
In Progress
 ↓
Resolved
 ↓
Closed
```

Warga dapat melihat pengaduan miliknya.

Pengelola dapat melihat sesuai scope.

---

# 17. NOTIFICATIONS

In-app notification.

Trigger:
- pengumuman;
- tagihan dibuat;
- pembayaran diverifikasi/rejected;
- order;
- chat;
- complaint update.

Push notification boleh ditambahkan jika stabil, tetapi bukan dependency utama core MVP.

---

# 18. DEVELOPER DASHBOARD

Developer mendapatkan dashboard operasional:

```text
Overview
├── Total Warga
├── Rumah
├── RT
├── RW
├── Iuran
├── Marketplace
└── Pengaduan
```

Contoh summary:
- jumlah warga aktif;
- jumlah rumah;
- tagihan bulan berjalan;
- paid/unpaid;
- pengaduan aktif;
- order marketplace.

Jangan membuat BI/analytics kompleks.

---

# 19. RW DASHBOARD

RW:
- jumlah warga RW;
- jumlah rumah;
- daftar RT;
- monitoring iuran;
- pengumuman;
- pengaduan;
- ringkasan operasional.

---

# 20. RT DASHBOARD

RT:
- warga RT;
- rumah RT;
- iuran;
- pengaduan;
- pengumuman;
- aktivitas operasional.

---

# 21. RESIDENT DASHBOARD

Warga:
- greeting;
- announcement;
- iuran;
- marketplace;
- pengaduan;
- notifikasi;
- quick actions.

Dashboard harus menjadi hub, bukan feed marketplace.

---

# 22. PACKAGE / COMMERCIAL MODEL

Paket adalah **sales packaging**.

Contoh baseline yang dapat ditawarkan:

## Paket A — Community

- Dashboard
- Data warga
- Rumah/keluarga
- RW/RT
- Pengumuman
- Notifications

## Paket B — Management

Semua A +
- Iuran
- Pengaduan
- Dashboard pengelola
- Monitoring operasional

## Paket C — Full Ecosystem

Semua B +
- Marketplace
- Seller
- Product
- Cart
- Order
- Chat
- Marketplace notifications

Catatan:
- Nama dan isi paket adalah commercial configuration.
- Paket tidak perlu ditampilkan di aplikasi.
- Database tidak perlu mempunyai tabel `packages` untuk MVP.
- Setiap client project diaktifkan sesuai kontrak.
- Jika suatu hari diperlukan dynamic module licensing, baru buat module/license system terpisah.

---

# 23. DATABASE MODEL

Database utama:

```text
Supabase PostgreSQL
```

Core tables MVP:

### Core/Identity
1. `complex_settings`
2. `profiles`
3. `user_roles`
4. `rw_units`
5. `rt_units`
6. `houses`
7. `household_members`

### Communication
8. `announcements`
9. `notifications`

### Iuran
10. `dues`
11. `due_assignments`
12. `due_payments`

### Marketplace
13. `categories`
14. `seller_profiles`
15. `products`
16. `product_images`
17. `carts`
18. `cart_items`
19. `orders`
20. `order_items`

### Chat
21. `conversations`
22. `conversation_participants`
23. `messages`

### Pengaduan
24. `complaint_categories`
25. `complaints`
26. `complaint_updates`

### Governance
27. `audit_logs`

Total: **27 application tables** + `auth.users` milik Supabase.

---

# 24. DATABASE RULES

- UUID primary keys.
- `timestamptz`.
- Foreign keys.
- Check constraints.
- Unique constraints.
- Indexes.
- RLS.
- Transactions untuk operasi penting.
- Money menggunakan `numeric`.
- Snapshot nominal untuk transaksi.
- Soft status/deactivation bila historical data harus dipertahankan.

---

# 25. CORE RELATIONSHIP

```text
auth.users
    ↓
profiles
    ├── user_roles
    ├── household_members → houses → rt_units → rw_units
    ├── seller_profiles → products → product_images
    ├── carts → cart_items → products
    ├── orders → order_items
    ├── conversations → messages
    ├── complaints → complaint_updates
    ├── due_payments
    └── notifications
```

---

# 26. CRITICAL TRANSACTION RULE

Create order harus atomic:

```text
Validate cart
→ validate seller
→ validate active product
→ validate stock
→ create order
→ create order_items
→ decrement stock
→ clear cart
→ create notification
```

Jika satu langkah gagal, transaksi rollback.

Jangan membuat order separuh jadi.

---

# 27. IURAN TRANSACTION RULE

Payment proof:

```text
create payment record
→ upload proof
→ pending verification
```

Saat verifier approve:

```text
payment status = paid
→ create notification
→ audit log
```

Tidak boleh warga sendiri mengubah `paid`.

---

# 28. RLS SCOPE

RLS wajib mencakup:

### Warga
Own profile / own household data / own dues / own orders / own complaints / own notifications.

### RT
Data rumah/warga/iuran/pengaduan dalam RT sendiri.

### RW
Data dalam RW sendiri.

### Developer
Data seluruh komplek.

### Seller
Own store/products/orders.

### Chat
Participant only.

---

# 29. STORAGE

Buckets:
- `avatars`
- `product-images`
- `community-images`
- `complaint-images`
- `payment-proofs`

`payment-proofs` harus private.

Public image bucket tidak boleh digunakan untuk bukti pembayaran.

---

# 30. UI/UX REQUIREMENTS

Gunakan `desain.md` sebagai visual source of truth, tetapi architecture navigation harus mengikuti PRD v2:

```text
Dashboard
   ↓
Module
   ↓
Module-specific navigation
   ↓
Back
   ↓
Dashboard
```

Perubahan dari desain lama:
- jangan menjadikan Marketplace sebagai root tab permanen;
- jangan menjadikan Community Feed sebagai fitur utama jika paket tidak mengaktifkannya;
- Dashboard menjadi root hub;
- setiap modul memiliki navigation context sendiri;
- branding per komplek tetap constrained oleh design system.

---

# 31. PHASE PLAN — FULL MVP

## PHASE 0 — MASTER TEMPLATE FOUNDATION
- audit existing Expo project;
- audit existing Supabase;
- env;
- architecture;
- navigation root;
- design tokens;
- module config;
- error/loading/empty states.

Gate:
- app runs;
- Supabase connects;
- Dashboard root works.

## PHASE 1 — DATABASE V2
- replace/rework old community-centric schema;
- create 27 tables;
- indexes;
- triggers;
- RLS;
- storage;
- seed;
- security tests.

Gate:
- migration clean;
- RLS cross-scope tests pass.

## PHASE 2 — AUTH + PROFILE
- register;
- login;
- logout;
- session;
- profile;
- role assignment;
- protected routes.

## PHASE 3 — RESIDENT MANAGEMENT
- complex settings;
- RW;
- RT;
- houses;
- household members;
- resident verification;
- developer/RW/RT management.

## PHASE 4 — DASHBOARD + ANNOUNCEMENT
- root dashboard;
- module cards;
- announcement;
- notifications;
- role-specific dashboard.

## PHASE 5 — IURAN
- dues master;
- billing;
- resident view;
- upload payment proof;
- verifier;
- paid/rejected;
- history;
- summary.

## PHASE 6 — MARKETPLACE DISCOVERY
- category;
- seller;
- products;
- images;
- search;
- detail;
- module navigation.

## PHASE 7 — SELLER
- become seller;
- store;
- create/edit/deactivate product;
- stock.

## PHASE 8 — CART + ORDER
- cart;
- single-seller rule;
- checkout;
- atomic order;
- snapshot;
- stock decrement;
- order status;
- seller order management.

## PHASE 9 — CHAT
- conversation;
- participant;
- messages;
- realtime;
- listing context.

## PHASE 10 — PENGADUAN
- categories;
- create;
- assignment;
- status;
- updates;
- resolution;
- notifications.

## PHASE 11 — ADMIN / MANAGEMENT
- developer dashboard;
- RW dashboard;
- RT dashboard;
- moderation;
- user management;
- marketplace moderation;
- operational summaries.

## PHASE 12 — SECURITY + QA
- RLS attack tests;
- role tests;
- cross-RT/RW tests;
- cross-user tests;
- stock concurrency;
- duplicate checkout;
- storage policies;
- error handling;
- performance;
- mobile QA.

## PHASE 13 — MVP RELEASE
- production env;
- seed/config per client;
- app branding;
- release build;
- smoke test;
- backup;
- release checklist.

---

# 32. MVP ACCEPTANCE CRITERIA

MVP selesai jika end-to-end berikut berjalan:

### Resident
```text
Login
→ Dashboard
→ lihat profil/rumah
→ lihat pengumuman
→ lihat iuran
→ lihat marketplace
→ buat pengaduan
→ menerima notification
```

### Iuran
```text
Developer/RT/RW membuat/assign tagihan
→ Warga melihat
→ upload bukti
→ verifier review
→ Paid
→ riwayat tercatat
```

### Marketplace
```text
Warga
→ seller
→ create product
→ buyer menemukan
→ cart
→ checkout
→ order
→ seller proses
→ completed
```

### Chat
```text
Buyer
→ Chat Seller
→ message
→ realtime seller
```

### Pengaduan
```text
Warga
→ complaint
→ RT/RW/Developer review
→ update status
→ resolved
```

### Security
```text
Warga A ≠ Warga B private data
RT A ≠ RT B
RW A ≠ RW B
Non-admin ≠ Developer
```

---

# 33. EXISTING PROJECT MIGRATION RULE

Project lama jangan dibuang.

Jadikan sebagai **master/template yang direfactor**.

Code yang sudah reusable:
- design system;
- Supabase client;
- auth;
- marketplace components;
- storage;
- notification components;
- navigation primitives.

Yang harus direvisi:
- community selector;
- old `communities` multi-community model;
- old roles `user/seller/admin`;
- old marketplace-first root navigation;
- database schema;
- RLS;
- navigation;
- dashboard.

Jangan melakukan rewrite total jika bisa migrasi incremental.

---

# 34. DOCUMENTATION

Maintain:
- `PRD.md`
- `desain.md`
- `PROJECT_PROGRESS.md`
- `DECISIONS.md`
- `CHANGELOG.md`
- `database/README.md`
- migration files

---

# 35. ANTIGRAVITY OPERATING RULES

1. Read PRD before implementation.
2. Inspect existing code before rewrite.
3. Inspect database before changing schema.
4. Never expose service role key.
5. Never bypass RLS.
6. Never trust frontend role.
7. Every schema change uses migration.
8. No destructive migration without explicit review.
9. No invented features.
10. No fake payment success.
11. No hardcoded tenant/client data.
12. Keep core template reusable.
13. Every phase stops at its gate.
14. Fix blockers before next phase.
15. Update progress documentation.
16. Test security boundaries explicitly.
17. Keep module navigation isolated.
18. Package A/B/C is not shown to residents.
19. Production app never asks user to choose a complex.
20. One production deployment maps to one complex database.

---

# 36. FINAL PRODUCT ARCHITECTURE

```text
                    KOMPLEKKU TEMPLATE
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
        CLIENT A       CLIENT B      CLIENT C
             │             │             │
          APP A          APP B         APP C
             │             │             │
          DB A           DB B          DB C
             │             │             │
        1 KOMPLEK       1 KOMPLEK     1 KOMPLEK
```

Inside each app:

```text
                    DASHBOARD
                        │
      ┌─────────────────┼─────────────────┐
      ↓                 ↓                 ↓
   WARGA              IURAN           MARKETPLACE
      │                 │                 │
   own nav           own nav           own nav
      │                 │                 │
      └─────────────────┼─────────────────┘
                        ↓
                    DASHBOARD
```

Role:

```text
DEVELOPER
    ↓
RW
    ↓
RT
    ↓
WARGA
```

Core:

```text
Warga
 ├── Rumah
 ├── Keluarga
 ├── Pengumuman
 ├── Iuran
 ├── Marketplace
 ├── Pengaduan
 ├── Chat
 └── Notifications
```

---

# 37. DEFINITION OF DONE

Komplekku MVP dianggap selesai apabila:
- semua phase 0–13 selesai;
- database migration reproducible;
- RLS tested;
- authentication stable;
- resident management usable;
- dashboard usable;
- iuran end-to-end usable;
- marketplace end-to-end usable;
- chat realtime usable;
- complaint end-to-end usable;
- role boundaries tested;
- no critical security issue;
- production environment configured;
- template dapat di-clone untuk komplek berikutnya.

**END — KOMPLEKKU PRD v2.0**
