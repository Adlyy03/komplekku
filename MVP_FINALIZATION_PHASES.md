# KOMPLEKKU — MVP FINALIZATION EXECUTION PROMPTS

## TUJUAN DOKUMEN

Dokumen ini adalah instruksi lanjutan untuk menyelesaikan project **Komplekku** sampai benar-benar siap disebut **MVP**.

Project saat ini sudah memiliki fondasi besar:

* Expo / React Native
* Supabase PostgreSQL
* Authentication
* Model **1 App = 1 Komplek**
* 26 tabel database
* RLS
* Storage
* Central Dashboard
* Modul Warga
* Modul Iuran
* Modul Marketplace
* Modul Pengaduan
* Modul Pengumuman
* Modul Chat
* Notifikasi
* Panel Pengurus
* Profile
* Role `developer`, `rw`, `rt`, `warga`

**JANGAN mengulang implementasi yang sudah selesai.**

Tugas utama sekarang adalah:

> Mengubah implementasi yang sudah ada menjadi produk MVP yang benar-benar konsisten, aman, lengkap secara flow, berbeda berdasarkan role, dan siap diuji serta dipakai sebagai template untuk komplek berikutnya.

---

# ATURAN GLOBAL

Sebelum mengerjakan phase apa pun:

1. Baca `PRD_Komplekku_MVP_v2.md`.
2. Baca `desain.md`.
3. Baca schema SQL terbaru.
4. Baca seluruh struktur `src/`.
5. Audit implementasi existing sebelum melakukan perubahan.
6. Jangan membuat ulang fitur yang sudah bekerja.
7. Jangan menghapus fitur existing hanya karena ingin membuat implementasi baru.
8. Pertahankan arsitektur yang sudah ada apabila sudah sesuai.
9. Jika ada konflik antara dokumentasi dan implementasi aktual:

   * identifikasi konflik;
   * jangan diam-diam memilih salah satu;
   * gunakan requirement terbaru yang sudah ditetapkan untuk project.
10. Jangan membuat fitur di luar scope MVP tanpa alasan yang jelas.
11. Jangan mengganti stack teknologi.
12. Jangan mengganti Supabase PostgreSQL.
13. Jangan mengubah konsep menjadi multi-community selector.
14. Jangan membuat satu database global untuk banyak komplek.
15. Model produk tetap:
    **1 project/app = 1 komplek = 1 database Supabase.**

---

# KONDISI PRODUK YANG HARUS DIANGGAP FINAL

## Model Komplek

Komplekku bukan aplikasi untuk memilih komplek.

Satu deployment aplikasi hanya merepresentasikan satu komplek.

Contoh:

```text
Komplekku App A
    └── Komplek A
        └── Supabase Database A

Komplekku App B
    └── Komplek B
        └── Supabase Database B

Komplekku App C
    └── Komplek C
        └── Supabase Database C
```

Tidak boleh ada:

* community selector publik;
* pilihan "masuk ke komplek X";
* user berpindah-pindah komplek;
* data antar komplek bercampur.

Project saat ini harus diperlakukan sebagai:

> **MASTER TEMPLATE / BLUEPRINT**

yang nantinya dapat dicopy untuk deployment komplek lain.

---

# ROLE FINAL

Terdapat 4 role utama:

```text
developer
rw
rt
warga
```

Role bukan sekadar label.

Setiap role harus mempunyai:

* dashboard berbeda;
* navigation berbeda;
* informasi berbeda;
* permission berbeda;
* action berbeda;
* scope data berbeda.

Jangan membuat empat role tetapi semuanya melihat UI yang sama.

---

# PHASE 0 — PROJECT AUDIT

## Tujuan

Memahami kondisi aktual project sebelum perubahan.

## Instruksi

Audit:

```text
src/
src/app/
src/components/
src/services/
src/lib/
src/config/
supabase/
```

Audit juga:

* routing;
* providers;
* auth;
* role system;
* database services;
* RLS;
* storage;
* navigation;
* feature flags;
* error handling;
* loading state;
* empty state.

Periksa apakah implementasi yang diklaim selesai benar-benar ada.

Buat checklist:

```text
[ ] Authentication
[ ] Profile
[ ] ComplexProvider
[ ] Role detection
[ ] Warga
[ ] Rumah
[ ] Keluarga
[ ] RT
[ ] RW
[ ] Pengumuman
[ ] Iuran
[ ] Pembayaran
[ ] Marketplace
[ ] Seller
[ ] Product
[ ] Cart
[ ] Checkout
[ ] Orders
[ ] Chat
[ ] Notifications
[ ] Pengaduan
[ ] Admin
[ ] RLS
[ ] Storage
```

## Verifikasi

Jalankan:

```bash
npx tsc --noEmit
npx expo lint
```

Jika ada error:

* catat;
* perbaiki hanya yang relevan;
* jalankan ulang.

## STOP

Setelah audit selesai, **STOP**.

Jangan masuk Phase 1 otomatis.

---

# PHASE 1 — FINAL ROLE ARCHITECTURE

## Tujuan

Membuat pengalaman aplikasi benar-benar berbeda berdasarkan role.

Role:

```text
DEVELOPER
RW
RT
WARGA
```

---

## 1. WARGA

Warga adalah pengguna utama aplikasi.

Dashboard warga berfokus pada:

* kondisi rumah;
* informasi komplek;
* iuran;
* pengumuman;
* marketplace;
* pengaduan;
* chat;
* notifikasi.

Shortcut utama:

```text
Warga
Iuran
Marketplace
Pengaduan
Pengumuman
```

Warga tidak boleh melihat:

* dashboard pengurus;
* statistik pengurus;
* moderasi;
* seluruh data warga;
* pengaturan sistem;
* manajemen role.

---

# 2. RT

RT adalah pengurus operasional level RT.

Dashboard RT harus fokus pada:

* jumlah warga RT;
* jumlah rumah;
* pengumuman RT;
* iuran warga RT;
* pengaduan warga RT;
* aktivitas warga;
* kebutuhan operasional RT.

RT hanya boleh mengelola data dalam scope RT-nya.

Contoh:

```text
RT 01

Rumah:
01
02
03
04
...
```

RT 01 tidak boleh mengakses data RT 02.

Menu RT dapat mencakup:

```text
Dashboard
Warga RT
Rumah
Iuran
Pengaduan
Pengumuman
Aktivitas
Profil
```

---

# 3. RW

RW mempunyai scope lebih luas daripada RT.

RW dapat melihat:

```text
RW
 ├── RT 01
 ├── RT 02
 ├── RT 03
 └── RT 04
```

Dashboard RW:

* total warga;
* total rumah;
* jumlah RT;
* iuran;
* pengaduan;
* pengumuman;
* statistik per RT;
* aktivitas.

RW dapat melihat data RT di bawah RW tersebut.

RW tidak boleh otomatis mempunyai akses terhadap pengaturan global Developer.

---

# 4. DEVELOPER

Developer adalah pengelola tertinggi dari instance komplek.

Dashboard Developer:

* total warga;
* total rumah;
* total RT;
* total RW;
* status iuran;
* pengaduan;
* marketplace;
* transaksi;
* pengumuman;
* konfigurasi komplek;
* role management;
* moderasi.

Developer dapat mengelola:

```text
Complex Settings
RW
RT
Rumah
Warga
Role
Modul
Pengumuman
Iuran
Pengaduan
Marketplace moderation
```

---

# ROLE NAVIGATION

Buat navigation berdasarkan role.

Contoh:

## Warga

```text
Beranda
Warga
Iuran
Marketplace
Pengaduan
Profile
```

## RT

```text
Dashboard
Warga
Iuran
Pengaduan
Pengumuman
Profile
```

## RW

```text
Dashboard
Warga
RT
Iuran
Pengaduan
Pengumuman
Profile
```

## Developer

```text
Dashboard
Warga
RT/RW
Iuran
Pengaduan
Marketplace
Pengumuman
Settings
Profile
```

Navigation tidak boleh menampilkan menu yang tidak dapat digunakan oleh role tersebut.

---

# ROLE DATA SCOPE

Implementasikan prinsip:

```text
Developer
    ↓
Entire Complex

RW
    ↓
RW + RT under RW

RT
    ↓
RT only

Warga
    ↓
Self + household + allowed public complex data
```

Jangan hanya menyembunyikan UI.

Security harus ditegakkan di:

```text
Supabase RLS
+
Service layer
+
UI
```

UI hiding bukan security.

---

## VERIFIKASI PHASE 1

Test dengan empat akun:

```text
developer@test
rw@test
rt@test
warga@test
```

Verifikasi:

* setiap role mendapat dashboard benar;
* menu benar;
* route protection benar;
* data scope benar;
* action benar;
* warga tidak bisa membuka admin melalui URL langsung.

## STOP

---

# PHASE 2 — ADMIN / PENGURUS OPERASIONAL

## Tujuan

Mengubah panel admin menjadi dashboard operasional yang benar-benar berguna.

Jangan hanya membuat tabel CRUD.

---

# DEVELOPER DASHBOARD

Tampilkan:

```text
Total Warga
Total Rumah
Total RT
Total RW
Iuran Belum Lunas
Pengaduan Aktif
Total Seller
Produk Aktif
Order
```

Tambahkan:

* aktivitas terbaru;
* pengaduan terbaru;
* pembayaran terbaru;
* order terbaru;
* pengumuman terbaru.

---

# RW DASHBOARD

Tampilkan:

```text
Warga RW
Rumah RW
Jumlah RT
Iuran
Pengaduan
```

Tambahkan breakdown:

```text
RT 01
RT 02
RT 03
...
```

---

# RT DASHBOARD

Tampilkan:

```text
Warga RT
Rumah RT
Iuran
Pengaduan
```

Tambahkan:

* warga terbaru;
* pengaduan terbaru;
* pembayaran terbaru.

---

# ADMIN WARGA

Pengurus dapat:

* melihat warga;
* melihat rumah;
* melihat keluarga;
* melihat RT/RW;
* mengaktifkan/nonaktifkan akun;
* mengelola role sesuai permission.

Jangan izinkan:

```text
RT → promote dirinya menjadi Developer
Warga → mengubah dirinya menjadi Developer
```

---

# ROLE MANAGEMENT

Developer dapat mengelola:

```text
Developer
RW
RT
Warga
```

RW/RT hanya boleh mengelola role sesuai scope dan permission yang telah ditentukan.

Semua perubahan role harus dicatat ke:

```text
audit_logs
```

---

# PHASE 3 — END-TO-END CORE FLOW

## Tujuan

Memastikan semua fitur bukan hanya "ada screen", tetapi benar-benar bekerja dari awal sampai akhir.

---

# FLOW A — REGISTER WARGA

Flow:

```text
Register
↓
Login
↓
Profile
↓
Identitas rumah
↓
Verifikasi / assignment
↓
Masuk dashboard
```

Pastikan:

* user tidak otomatis menjadi developer;
* role default aman;
* rumah dan keluarga terhubung dengan benar;
* profile tersimpan.

---

# FLOW B — IURAN

Flow warga:

```text
Lihat tagihan
↓
Pilih tagihan
↓
Bayar
↓
Upload bukti
↓
Status menunggu verifikasi
```

Flow pengurus:

```text
Masuk dashboard
↓
Lihat pembayaran pending
↓
Buka bukti
↓
Verifikasi
↓
Lunas
```

Status harus konsisten:

```text
unpaid
pending_verification
paid
rejected
```

Pastikan:

* bukti pembayaran tersimpan;
* hanya pihak berwenang yang dapat memverifikasi;
* warga tidak bisa mengubah status menjadi paid sendiri;
* perubahan status tercatat.

---

# FLOW C — PENGADUAN

```text
Warga
↓
Create complaint
↓
submitted
↓
Pengurus review
↓
in_review
↓
in_progress
↓
resolved
↓
closed
```

Pastikan:

* hanya pengurus yang berwenang mengubah status;
* warga dapat melihat status laporan miliknya;
* update tercatat dalam timeline;
* attachment aman.

---

# FLOW D — MARKETPLACE

Seller:

```text
Buat seller profile
↓
Buat produk
↓
Upload image
↓
Moderasi
↓
Produk aktif
```

Buyer:

```text
Browse
↓
Product detail
↓
Add cart
↓
Cart
↓
Checkout
↓
Order
↓
Seller proses
↓
Selesai
```

Pertahankan:

```text
single-seller checkout
```

Order harus mempunyai snapshot:

* nama produk;
* harga;
* quantity;
* seller;
* total.

Perubahan produk setelah order tidak boleh mengubah histori order.

---

# FLOW E — CHAT

```text
Buyer
↓
Seller
↓
Conversation
↓
Messages
↓
Realtime update
↓
Notification
```

Pastikan user hanya dapat mengakses conversation yang diikuti.

---

# FLOW F — PENGUMUMAN

```text
Developer/RW/RT
↓
Create announcement
↓
Scope
↓
Publish
↓
Warga menerima
↓
Notification
```

Scope:

```text
Complex
RW
RT
```

Warga hanya menerima pengumuman sesuai scope.

---

# PHASE 4 — DATABASE & RLS SECURITY AUDIT

## Tujuan

Memastikan database aman sebelum production.

Database existing mempunyai 26 tabel:

### CORE

```text
complex_settings
profiles
rw_units
rt_units
houses
household_members
user_roles
```

### KOMUNIKASI

```text
announcements
notifications
```

### IURAN

```text
dues
due_assignments
due_payments
```

### MARKETPLACE

```text
categories
seller_profiles
products
product_images
carts
cart_items
orders
order_items
```

### CHAT

```text
conversations
conversation_participants
messages
```

### PENGADUAN

```text
complaint_categories
complaints
complaint_updates
```

### AUDIT

```text
audit_logs
```

Jangan menambah tabel hanya untuk menambah jumlah tabel.

---

# RLS MATRIX

Audit permission:

| Data             | Developer | RW       | RT       | Warga       |
| ---------------- | --------- | -------- | -------- | ----------- |
| Complex Settings | CRUD      | Read     | Read     | Read        |
| Profiles         | CRUD      | Scope RW | Scope RT | Own         |
| RW               | CRUD      | Own RW   | Read     | Read        |
| RT               | CRUD      | Scope RW | Own RT   | Read        |
| Houses           | CRUD      | Scope RW | Scope RT | Own         |
| Household        | CRUD      | Scope RW | Scope RT | Own         |
| Roles            | CRUD      | Limited  | Limited  | Own         |
| Announcements    | CRUD      | Scope    | Scope    | Read        |
| Dues             | CRUD      | Scope    | Scope    | Own         |
| Payments         | CRUD      | Verify   | Verify   | Own         |
| Complaints       | CRUD      | Scope    | Scope    | Own         |
| Marketplace      | CRUD      | Moderate | Moderate | Own         |
| Orders           | Read      | Read     | Read     | Own         |
| Chat             | Limited   | Limited  | Limited  | Participant |
| Notifications    | Read      | Read     | Read     | Own         |
| Audit Logs       | Read      | Limited  | Limited  | None        |

Ini adalah baseline audit.

Sesuaikan dengan schema aktual apabila ada perbedaan yang sudah ditetapkan PRD.

---

# SECURITY TEST

Wajib mencoba skenario negatif:

```text
Warga membaca profile warga lain
Warga membaca payment orang lain
Warga mengubah role sendiri
Warga mengakses admin route
RT membaca warga RT lain
RT membaca pembayaran RT lain
RT mengubah setting komplek
RW mengubah setting global
Seller membaca order seller lain
User membaca chat yang bukan participant
User membaca complaint private milik orang lain
```

Semua harus ditolak.

---

# PHASE 5 — UI/UX POLISH

## Tujuan

Mengubah aplikasi dari "fitur sudah ada" menjadi "produk siap demo".

Audit seluruh screen.

Setiap screen wajib mempunyai:

### Loading

Gunakan skeleton/loading indicator yang sesuai.

### Empty state

Contoh:

```text
Belum ada tagihan
Belum ada pengaduan
Belum ada produk
Belum ada pesan
```

### Error state

Berikan pesan yang jelas.

Jangan hanya:

```text
Error
```

Gunakan:

```text
Data belum dapat dimuat.
Coba lagi beberapa saat.
```

### Success feedback

Contoh:

```text
Pembayaran berhasil dikirim.
Produk berhasil dibuat.
Pengaduan berhasil dikirim.
```

### Confirmation

Action destructive wajib mempunyai confirmation.

Contoh:

```text
Blokir warga?
Hapus produk?
Tutup pengaduan?
```

---

# UI CONSISTENCY

Audit:

* spacing;
* typography;
* border radius;
* buttons;
* cards;
* badges;
* icons;
* modal;
* bottom sheet;
* forms;
* inputs;
* error state;
* loading;
* empty state.

Gunakan design system yang sudah ada di `desain.md`.

Jangan membuat visual language baru yang bertentangan dengan desain existing.

---

# PHASE 6 — DASHBOARD HUB + MINI-APP EXPERIENCE

## Tujuan

Memastikan konsep utama Komplekku terasa jelas.

Central Hub:

```text
Komplekku
    ↓
Dashboard
    ↓
Pilih layanan
```

Contoh:

```text
Marketplace
    ↓
Marketplace Navigation
    ↓
Home
Categories
Cart
Orders
Seller
```

Iuran:

```text
Iuran
    ↓
Iuran Navigation
    ↓
Tagihan
Riwayat
Pembayaran
```

Warga:

```text
Warga
    ↓
Warga Navigation
    ↓
Rumah
Keluarga
RT/RW
```

Pengaduan:

```text
Pengaduan
    ↓
Pengaduan Navigation
    ↓
Laporan
Buat Laporan
Riwayat
```

Ketika user keluar dari modul:

```text
Back
↓
Central Dashboard
```

Jangan membuat seluruh fitur menjadi satu bottom navigation besar.

---

# PHASE 7 — FEATURE FLAGS & PACKAGE READINESS

Komplekku akan dijual dalam paket.

Paket bukan sesuatu yang harus terlihat oleh user.

User tidak perlu melihat:

```text
Anda menggunakan Paket B
```

Tidak perlu.

Paket adalah model bisnis internal.

Contoh:

```text
Paket A
→ Core Management

Paket B
→ Core + Iuran + Pengaduan

Paket C
→ Core + Iuran + Pengaduan + Marketplace
```

Namun struktur aplikasi harus dapat mengaktifkan/nonaktifkan modul.

Gunakan:

```text
src/config/modules.ts
```

Pastikan modul dapat dikontrol tanpa merusak aplikasi.

Contoh:

```text
residents
announcements
dues
marketplace
complaints
```

Jika marketplace disabled:

* shortcut marketplace tidak muncul;
* route tidak dapat diakses;
* seller tidak dapat membuat toko;
* marketplace data tetap aman;
* dashboard tidak menampilkan widget marketplace.

Feature flag bukan security replacement.

Security tetap harus ada di backend.

---

# PHASE 8 — DEMO / SEED DATA

Buat data demo realistis.

Contoh:

```text
1 Developer

1 RW
 ├── RT 01
 ├── RT 02
 └── RT 03

20–50 houses

Multiple households

Multiple warga

Sample dues

Sample payments

Sample announcements

Sample complaints

Sample sellers

Sample products

Sample orders

Sample conversations
```

Pastikan data demo dapat digunakan untuk menguji semua role.

Buat akun demo:

```text
developer
rw
rt
warga
seller
buyer
```

Seller dan buyer boleh merupakan role warga yang mempunyai fitur seller.

---

# PHASE 9 — QA MATRIX

Buat checklist QA berdasarkan role.

## WARGA

```text
[ ] Login
[ ] Register
[ ] Profile
[ ] Rumah
[ ] Keluarga
[ ] Pengumuman
[ ] Iuran
[ ] Upload bukti
[ ] Pengaduan
[ ] Marketplace
[ ] Cart
[ ] Checkout
[ ] Orders
[ ] Chat
[ ] Notifications
```

## RT

```text
[ ] Login
[ ] Dashboard RT
[ ] Warga RT
[ ] Rumah RT
[ ] Iuran RT
[ ] Verifikasi pembayaran
[ ] Pengaduan RT
[ ] Pengumuman RT
```

## RW

```text
[ ] Dashboard RW
[ ] Statistik RT
[ ] Warga RW
[ ] Iuran RW
[ ] Pengaduan RW
[ ] Pengumuman RW
```

## DEVELOPER

```text
[ ] Dashboard
[ ] Complex Settings
[ ] RW
[ ] RT
[ ] Warga
[ ] Roles
[ ] Iuran
[ ] Pengaduan
[ ] Marketplace moderation
[ ] Orders
[ ] Announcements
[ ] Audit logs
```

---

# PHASE 10 — PERFORMANCE & RELIABILITY

Audit:

* unnecessary queries;
* duplicate fetch;
* infinite loading;
* race condition;
* realtime subscription cleanup;
* image loading;
* large list rendering;
* unnecessary re-render;
* stale state;
* navigation state.

Pastikan subscription realtime dibersihkan saat unmount.

Pastikan list menggunakan strategi rendering yang sesuai.

Pastikan gambar dari Storage tidak dimuat dengan ukuran berlebihan.

---

# PHASE 11 — PRODUCTION READINESS

Sebelum MVP dianggap selesai:

## Environment

Pisahkan:

```text
development
production
```

Jangan commit secret.

Pastikan `.env` tidak masuk repository.

---

## Supabase

Pastikan:

```text
RLS enabled
Storage policies correct
Functions secure
Indexes appropriate
Triggers working
Updated_at working
```

---

## Authentication

Test:

```text
Login
Logout
Session restore
Expired session
Invalid credentials
Register
Password reset jika tersedia
```

---

## Error Handling

Pastikan aplikasi tidak crash ketika:

```text
Network offline
Supabase timeout
Empty response
Invalid data
Storage upload failure
Permission denied
```

---

# PHASE 12 — FINAL MVP ACCEPTANCE

MVP hanya boleh dianggap selesai apabila semua kondisi berikut terpenuhi.

## Product

```text
[ ] 1 App = 1 Komplek
[ ] Tidak ada community selector
[ ] Role berbeda
[ ] Dashboard berbeda
[ ] Navigation berbeda
[ ] Modul bekerja
```

## Backend

```text
[ ] Schema stable
[ ] RLS stable
[ ] Storage stable
[ ] Auth stable
[ ] Role security stable
```

## Core Flow

```text
[ ] Register
[ ] Login
[ ] Profile
[ ] Warga
[ ] Iuran
[ ] Pengumuman
[ ] Pengaduan
[ ] Marketplace
[ ] Chat
[ ] Notifications
[ ] Admin
```

## QA

```text
[ ] Developer tested
[ ] RW tested
[ ] RT tested
[ ] Warga tested
[ ] Negative security tests
[ ] Empty states
[ ] Error states
[ ] Loading states
```

## Code Quality

```text
[ ] TypeScript 0 errors
[ ] Expo lint 0 errors
[ ] No obvious console errors
[ ] No dead routes
[ ] No broken imports
[ ] No duplicated business logic
```

---

# FINAL COMMAND

Setelah semua phase selesai, project harus berada dalam kondisi:

> **Komplekku MVP — Production Candidate**

Project tersebut harus dapat dijadikan template.

Struktur konseptual:

```text
KOMPLEKKU MASTER TEMPLATE
│
├── Application
├── Components
├── Services
├── Providers
├── Config
├── Supabase Schema
├── RLS
├── Storage
└── Documentation
```

Kemudian deployment baru dapat dibuat:

```text
MASTER TEMPLATE
      │
      ├── Komplek A
      │     └── Supabase A
      │
      ├── Komplek B
      │     └── Supabase B
      │
      └── Komplek C
            └── Supabase C
```

Setiap komplek berdiri sendiri.

Jangan membuat database global yang menampung semua komplek.

---

# ATURAN EKSEKUSI AI

Untuk setiap phase:

1. Baca requirement phase.
2. Audit existing implementation.
3. Kerjakan hanya scope phase tersebut.
4. Jangan mengulang pekerjaan yang sudah benar.
5. Jangan membuat fitur di luar scope.
6. Jalankan test/verifikasi.
7. Laporkan:

   * file yang berubah;
   * fitur yang ditambahkan;
   * bug yang diperbaiki;
   * hasil TypeScript;
   * hasil lint;
   * hasil test.
8. Setelah selesai:
   **STOP.**
9. Tunggu instruksi berikutnya.

Jangan mengerjakan phase berikutnya secara otomatis.

---

# PRIORITAS

Urutan pengerjaan wajib:

```text
PHASE 0
Project Audit
        ↓
PHASE 1
Role Architecture
        ↓
PHASE 2
Pengurus Dashboard
        ↓
PHASE 3
End-to-End Flow
        ↓
PHASE 4
Database & RLS Security
        ↓
PHASE 5
UI/UX Polish
        ↓
PHASE 6
Hub + Mini-App Navigation
        ↓
PHASE 7
Feature Flags / Package Readiness
        ↓
PHASE 8
Demo / Seed Data
        ↓
PHASE 9
QA
        ↓
PHASE 10
Performance
        ↓
PHASE 11
Production Readiness
        ↓
PHASE 12
MVP Acceptance
```

# DEFINITION OF DONE

Komplekku dianggap selesai MVP jika:

> Seorang Developer dapat menerima deployment Komplekku untuk satu komplek, mempunyai database sendiri, mempunyai role Developer/RW/RT/Warga, warga dapat menggunakan modul utama, pengurus dapat mengelola komplek sesuai scope, seluruh flow utama berjalan end-to-end, RLS mencegah akses ilegal, UI memiliki state yang lengkap, dan project dapat digunakan sebagai master template untuk deployment komplek berikutnya.

**JANGAN berhenti hanya karena screen sudah ada.**

MVP berarti:

> **Fitur + Flow + Permission + Database + Security + UX + Testing + Production readiness.**
