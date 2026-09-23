# KOMPLEKKU — UPGRADE & FINALIZATION ROADMAP V3

> Dokumen ini adalah sumber instruksi utama untuk melakukan upgrade, revisi, hardening, dan penambahan fitur pada aplikasi **Komplekku**.
>
> **ATURAN UTAMA:** Kerjakan hanya satu phase dalam satu waktu. Setelah phase selesai, **STOP** dan tunggu instruksi berikutnya.

---

# 1. TUJUAN UPGRADE

Komplekku saat ini sudah memiliki fondasi MVP yang kuat:

* Expo + Expo Router
* Supabase PostgreSQL
* RLS dan security definer functions
* Role `developer`, `rw`, `rt`, dan `warga`
* Dashboard
* Iuran
* Pengaduan
* Pengumuman
* Marketplace UMKM
* Pesanan
* Chat 1-on-1
* Audit log
* Design system berbasis `desain.md`

Upgrade ini bertujuan untuk mengubah aplikasi dari sekadar **MVP yang sudah berjalan** menjadi **platform operasional komplek yang siap digunakan secara nyata**.

Fokus upgrade:

1. Memperbaiki broken flow dan technical debt.
2. Menghilangkan sisa arsitektur multi-community lama.
3. Memastikan navigasi sesuai role.
4. Menyelesaikan lifecycle iuran dari pembuatan tagihan sampai pembayaran.
5. Menambahkan sistem keamanan dan operasional komplek.
6. Meningkatkan transparansi keuangan.
7. Meningkatkan kesiapan mobile-native.
8. Menjaga konsistensi database, RLS, UI, UX, dan architecture.
9. Tidak merusak fitur yang sudah berjalan.

---

# 2. ATURAN KERJA AI

Sebelum mengubah kode:

* Baca `PRD`.
* Baca `desain.md`.
* Baca schema/migration Supabase terbaru.
* Baca `MVP_FINALIZATION_PHASES.md`.
* Audit struktur project terlebih dahulu.
* Jangan membuat arsitektur baru jika architecture existing masih dapat digunakan.
* Jangan membuat tabel baru jika kebutuhan dapat dipenuhi oleh tabel existing.
* Jangan menghapus fitur existing tanpa alasan teknis yang jelas.
* Jangan mengubah role tanpa memahami seluruh authorization flow.
* Semua perubahan database harus dibuat melalui migration.
* Semua data sensitif wajib mengikuti RLS.
* Jangan menggunakan hardcoded ID production.
* Jangan meninggalkan dummy data atau placeholder pada production flow.
* Setelah perubahan lakukan typecheck dan lint.
* Jika memungkinkan lakukan test terhadap flow yang terdampak.

## Quality Gate

Setiap phase minimal harus memastikan:

```bash
npx tsc --noEmit
expo lint
```

Tidak boleh melanjutkan phase berikutnya apabila phase sebelumnya masih memiliki error yang diketahui.

---

# 3. PRIORITAS PHASE

Urutan pengerjaan:

1. **PHASE 0 — Audit & Baseline**
2. **PHASE 1 — Critical Fix & Legacy Cleanup**
3. **PHASE 2 — Mobile Build Configuration**
4. **PHASE 3 — Role-Based Navigation**
5. **PHASE 4 — Iuran & Batch Billing**
6. **PHASE 5 — Financial Transparency**
7. **PHASE 6 — Resident Self-Onboarding**
8. **PHASE 7 — Guest & Security System**
9. **PHASE 8 — Push Notification & Deep Linking**
10. **PHASE 9 — Mobile Performance & Offline Readiness**
11. **PHASE 10 — Final Hardening & Production Audit**

---

# PHASE 0 — AUDIT & BASELINE

## Tujuan

Memastikan AI memahami kondisi project sebelum melakukan perubahan.

## Tugas

Audit:

### Frontend

* `src/app`
* `src/components`
* `src/features`
* `src/hooks`
* `src/lib`
* `src/services`
* provider/context
* navigation
* authentication
* authorization

### Backend

* Supabase schema
* migrations
* RLS policies
* database functions
* triggers
* storage buckets
* notification system

### Configuration

* `app.json`
* `package.json`
* environment variables
* Expo configuration
* Supabase configuration

### Dokumentasi

Baca:

* `PRD`
* `desain.md`
* `MVP_FINALIZATION_PHASES.md`
* schema terbaru

## Output

Buat laporan singkat:

```text
CURRENT STATE
- Existing feature
- Existing architecture
- Existing role system
- Existing database
- Existing technical debt
- Existing broken flow
- Existing missing feature
```

Jangan melakukan perubahan besar pada phase ini.

## STOP CONDITION

Setelah audit selesai:

**STOP.**

Jangan mengerjakan PHASE 1 sebelum mendapat instruksi.

---

# PHASE 1 — CRITICAL FIX & LEGACY CLEANUP

## Tujuan

Menghilangkan technical debt dan broken flow yang mengganggu fondasi aplikasi.

## 1. Deep-Link Notification

Perbaiki:

`src/app/notifications/index.tsx`

Notification harus dapat membuka:

### Announcement

```text
announcement
→ /announcements/[id]
```

### Complaint

```text
complaint
→ /pengaduan/[id]
```

### Due / Payment

```text
due
payment
→ /iuran
```

Pertahankan existing routing:

```text
order
conversation
product
```

Pastikan ID entity yang tidak valid tidak menyebabkan crash.

---

## 2. Legacy Community Cleanup

Cari seluruh penggunaan:

```text
communities
useCommunity
CommunityProvider
activeCommunity
single-complex
```

Review:

```text
src/services/communities/index.ts
src/lib/community-provider.tsx
src/lib/cart-provider.tsx
scripts/create-test-accounts.js
```

Hapus dependency multi-community jika memang sudah tidak digunakan.

Architecture final harus menggunakan:

```text
ComplexProvider
complex_settings
```

dan bukan:

```text
CommunityProvider
communities
activeCommunity
```

---

## 3. Test Account Script

Update:

`scripts/create-test-accounts.js`

Gunakan role:

```text
developer
rw
rt
warga
```

Jangan menggunakan:

```text
user
admin
community
```

kecuali memang masih dibutuhkan oleh schema terbaru.

---

## Acceptance Criteria

* Tidak ada dependency legacy community yang tidak diperlukan.
* Notification deep-link berjalan.
* Test account mengikuti schema v2.
* Tidak ada TypeScript error.
* Tidak ada lint error.
* Existing feature tetap berjalan.

## STOP CONDITION

Setelah semua acceptance criteria terpenuhi:

**STOP.**

---

# PHASE 2 — MOBILE BUILD CONFIGURATION

## Tujuan

Menyiapkan aplikasi agar benar-benar siap untuk EAS Build.

## Tugas

Update `app.json` atau konfigurasi Expo yang digunakan project.

Tambahkan:

```text
ios.bundleIdentifier
android.package
```

Gunakan identifier yang konsisten dan production-ready.

Contoh format:

```text
com.komplekku.app
```

Jangan menggunakan identifier contoh jika project sudah memiliki identifier resmi.

---

## Expo Image Picker

Pastikan `expo-image-picker` dikonfigurasi sebagai plugin.

Pastikan permission:

### iOS

* Camera
* Photo Library

### Android

Gunakan permission yang sesuai dengan versi Android target.

Jangan meminta permission yang tidak diperlukan.

---

## Acceptance Criteria

* Expo config valid.
* Android package tersedia.
* iOS bundle identifier tersedia.
* Image picker permission terkonfigurasi.
* `npx expo config --type public` berhasil.
* Typecheck dan lint tetap bersih.

## STOP CONDITION

**STOP setelah phase selesai.**

---

# PHASE 3 — ROLE-BASED NAVIGATION

## Tujuan

Navigation harus mencerminkan pekerjaan masing-masing role.

Tidak boleh menampilkan menu utama yang tidak relevan terhadap role.

---

# WARGA

Tab utama:

```text
Beranda
Iuran
Marketplace
Pengaduan
Profil
```

Chat dan notification:

```text
Header / secondary navigation
```

---

# RT / RW

Tab utama:

```text
Dashboard
Warga & Rumah
Iuran & Kas
Pengaduan
Profil
```

Marketplace tetap dapat diakses melalui shortcut/secondary navigation.

---

# DEVELOPER

Tab utama:

```text
Ringkasan Komplek
Manajemen Warga
Iuran & Keuangan
Moderasi & Pengaturan
Profil
```

---

## Prinsip

Navigation harus berdasarkan role yang sebenarnya.

Jangan hanya menyembunyikan UI.

Authorization tetap wajib diperiksa di:

```text
UI
Service
Database RLS
```

---

## Acceptance Criteria

* Warga tidak mendapatkan navigation pengurus.
* RT/RW mendapatkan tools operasional pengurus.
* Developer mendapatkan management tools.
* Tidak ada tab kosong.
* Tidak ada route yang bisa dibuka user tanpa authorization.
* Deep-link tetap menghormati permission.

## STOP CONDITION

**STOP setelah selesai.**

---

# PHASE 4 — IURAN & BATCH BILLING

## Tujuan

Menyelesaikan lifecycle iuran secara end-to-end.

Flow final:

```text
Pengurus membuat tagihan
        ↓
Generate massal
        ↓
due_assignments
        ↓
Warga menerima notification
        ↓
Warga melakukan pembayaran
        ↓
Upload bukti
        ↓
Pengurus melakukan verifikasi
        ↓
Payment approved
        ↓
Financial record
        ↓
Warga mendapatkan status lunas
```

---

## Batch Billing Generator

Buat UI pengurus:

```text
Buat Tagihan Iuran
```

Input minimal:

* Nama tagihan
* Periode
* Nominal
* Jatuh tempo
* Jenis iuran
* Target RT / RW / komplek
* Catatan

Action:

```text
Generate Tagihan
```

Sistem membuat assignment secara massal.

---

## Validasi

Harus mencegah:

* duplicate billing
* nominal invalid
* periode invalid
* rumah tidak aktif
* assignment duplicate

Gunakan transaction/database function bila diperlukan.

---

## Acceptance Criteria

Pengurus dapat:

```text
Create billing
→ Generate assignments
→ Notification warga
```

Warga dapat:

```text
View due
→ Pay
→ Upload proof
```

Pengurus dapat:

```text
Review
→ Approve / Reject
```

## STOP CONDITION

**STOP setelah lifecycle berjalan.**

---

# PHASE 5 — FINANCIAL TRANSPARENCY

## Tujuan

Membangun buku kas digital komplek.

---

# Pemasukan

Sumber utama:

```text
Payment iuran yang approved
```

Data minimal:

* tanggal
* kategori
* nominal
* sumber
* periode
* reference

---

# Pengeluaran

Pengurus dapat membuat:

```text
Pengeluaran Baru
```

Contoh:

* Satpam
* Kebersihan
* Sampah
* Lampu jalan
* Perbaikan portal
* Perawatan fasilitas
* Administrasi

Data:

```text
tanggal
kategori
nominal
deskripsi
bukti
creator
```

---

# Dashboard Keuangan

Tampilkan:

```text
Total pemasukan
Total pengeluaran
Saldo
Tagihan outstanding
Pembayaran bulan ini
```

Tambahkan grafik sederhana jika sesuai desain.

---

# Hak Akses

Warga:

```text
View financial summary
```

Pengurus:

```text
Create expense
View financial detail
```

Developer:

```text
Full management
```

Semua tetap mengikuti RLS.

## Acceptance Criteria

* Kas dapat dihitung secara konsisten.
* Pemasukan berasal dari payment yang valid.
* Pengeluaran memiliki audit trail.
* Warga dapat melihat transparansi keuangan.
* Tidak ada user biasa yang dapat mengubah transaksi keuangan.

## STOP CONDITION

**STOP.**

---

# PHASE 6 — RESIDENT SELF-ONBOARDING

## Tujuan

Mengurangi pekerjaan manual admin saat warga baru bergabung.

---

# Flow

```text
Register
↓
Pilih Blok
↓
Pilih Nomor Rumah
↓
Pilih status
    ├── Pemilik
    └── Penyewa
↓
Upload dokumen jika diperlukan
↓
Submit claim
↓
RT menerima notification
↓
Review
    ├── Approve
    └── Reject
↓
Resident terhubung dengan rumah
```

---

## Status Claim

Gunakan status yang jelas:

```text
pending
approved
rejected
cancelled
```

---

## Security

User tidak boleh langsung mengubah ownership rumah hanya dengan memilih rumah.

Approval tetap dilakukan oleh role berwenang.

Pastikan:

* RLS
* audit log
* validation
* duplicate claim protection

## Acceptance Criteria

* Warga dapat mengajukan klaim.
* RT/RW dapat memverifikasi.
* Rumah tidak dapat diklaim oleh banyak user tanpa aturan ownership yang valid.
* Semua perubahan tercatat di audit log.

## STOP CONDITION

**STOP.**

---

# PHASE 7 — GUEST & SECURITY SYSTEM

## Tujuan

Menjadikan Komplekku bukan cuma aplikasi administrasi, tetapi juga operational security layer.

---

# 7A. Emergency / SOS

Tambahkan tombol:

```text
DARURAT / SOS
```

Flow:

```text
Press & Hold
↓
Confirmation
↓
Create emergency event
↓
Notify security / RT / designated recipients
```

Informasi:

```text
Resident
Rumah
Blok
Waktu
Location jika permission tersedia
Status emergency
```

---

## Status

```text
active
acknowledged
resolved
cancelled
```

---

## Safety

Jangan menganggap SOS sebagai pengganti layanan darurat resmi.

Aplikasi harus tetap menyediakan nomor darurat komplek/layanan terkait.

---

# 7B. Digital Guest / Visitor

Warga dapat membuat:

```text
Izin Tamu
```

Data:

* nama tamu
* nomor kendaraan
* waktu masuk
* estimasi keluar
* tujuan
* catatan

Generate:

```text
QR / visitor code
```

Security dapat melakukan:

```text
Scan
→ Validate
→ Check-in
→ Check-out
```

---

## Acceptance Criteria

* Emergency event dapat dibuat.
* Notification dikirim ke recipient yang benar.
* Guest pass dapat dibuat.
* QR/code dapat diverifikasi.
* Semua event memiliki audit trail.

## STOP CONDITION

**STOP.**

---

# PHASE 8 — PUSH NOTIFICATION & DEEP LINK

## Tujuan

Mengubah notification dari sekadar in-app realtime menjadi mobile notification sungguhan.

Gunakan:

```text
expo-notifications
FCM
APNs
```

sesuai platform.

---

# Notification Categories

Minimal:

```text
announcement
complaint
due
payment
order
conversation
emergency
visitor
```

---

# Behavior

Ketika aplikasi:

### Foreground

Tampilkan in-app notification.

### Background

Gunakan push notification.

### Closed

Push notification tetap diterima.

Ketika user tap:

```text
Notification
→ Deep Link
→ Correct Screen
```

---

## Acceptance Criteria

Test:

```text
Foreground
Background
Killed
```

untuk Android dan iOS jika environment tersedia.

Pastikan token device disimpan secara aman.

## STOP CONDITION

**STOP.**

---

# PHASE 9 — MOBILE PERFORMANCE & OFFLINE READINESS

## Tujuan

Meningkatkan pengalaman penggunaan di jaringan mobile yang tidak stabil.

---

# 9A. Image Compression

Sebelum upload:

```text
Original
↓
Resize
↓
Compress
↓
Upload
```

Target default:

```text
max width: 1200px
quality: 80%
```

Jangan mengorbankan kualitas secara berlebihan untuk dokumen penting.

---

# 9B. Offline Cache

Gunakan caching strategy yang sesuai.

Prioritas cache:

```text
Complex settings
Emergency contacts
Resident information
Iuran history
Announcements
```

Ketika offline:

* tampilkan cached data
* jangan tampilkan blank screen
* beri indicator offline
* jangan menganggap data stale sebagai data terbaru

---

# 9C. Query Optimization

Audit:

* duplicate requests
* unnecessary refetch
* N+1 queries
* oversized payload
* image loading
* pagination

Gunakan pagination untuk dataset besar.

## Acceptance Criteria

* Upload foto lebih ringan.
* Screen utama dapat dibuka menggunakan cached data.
* Tidak ada blank screen ketika koneksi sementara hilang.
* Query tidak melakukan fetch berlebihan.

## STOP CONDITION

**STOP.**

---

# PHASE 10 — FINAL HARDENING & PRODUCTION AUDIT

## Tujuan

Melakukan final audit sebelum aplikasi dianggap production-ready.

---

# Security Audit

Periksa:

* RLS
* role authorization
* storage policies
* database functions
* RPC permissions
* sensitive data exposure
* IDOR
* unauthorized update/delete
* audit log

---

# Database Audit

Periksa:

* foreign key
* index
* unique constraint
* check constraint
* nullable fields
* timestamp
* trigger
* migration consistency

---

# Frontend Audit

Periksa:

* loading state
* empty state
* error state
* offline state
* permission denied
* unauthorized route
* deep link
* form validation

---

# UX Audit

Pastikan:

* Design mengikuti `desain.md`
* typography konsisten
* spacing konsisten
* color token konsisten
* button state jelas
* destructive action memiliki confirmation
* tidak ada placeholder production

---

# Final Testing

Jalankan:

```bash
npx tsc --noEmit
expo lint
```

Jika tersedia:

```bash
npm test
```

atau test runner yang digunakan project.

---

# FINAL ACCEPTANCE CRITERIA

Project dianggap selesai jika:

* Tidak ada TypeScript error.
* Tidak ada lint error.
* Tidak ada broken critical navigation.
* Role authorization berjalan.
* RLS berjalan.
* Notification deep-link berjalan.
* Iuran end-to-end berjalan.
* Batch billing berjalan.
* Financial transparency berjalan.
* Resident onboarding berjalan.
* Emergency flow berjalan.
* Guest flow berjalan.
* Push notification berjalan.
* Image upload optimized.
* Offline/cache strategy tersedia.
* Tidak ada legacy community architecture yang tidak diperlukan.
* Expo configuration siap untuk build.
* Dokumentasi diperbarui.

---

# MASTER EXECUTION PROMPT

Gunakan prompt berikut setiap kali memulai phase.

```text
Kamu adalah senior full-stack engineer yang sedang mengembangkan aplikasi Komplekku.

Baca dan pahami terlebih dahulu:

1. PRD terbaru
2. desain.md
3. MVP_FINALIZATION_PHASES.md
4. schema/migration Supabase terbaru
5. struktur project saat ini
6. file yang relevan dengan phase yang sedang dikerjakan

Dokumen utama upgrade:
UPGRADE_ROADMAP_V3.md

ATURAN WAJIB:

- Jangan langsung coding sebelum memahami architecture existing.
- Jangan membuat architecture baru jika existing architecture masih dapat digunakan.
- Jangan merusak fitur yang sudah berjalan.
- Jangan menggunakan dummy implementation untuk production flow.
- Semua perubahan database wajib menggunakan migration.
- Semua data sensitif wajib mengikuti RLS.
- Authorization harus aman di frontend DAN backend/database.
- Ikuti design system dari desain.md.
- Gunakan role existing:
  developer, rw, rt, warga.
- Jangan menghidupkan kembali architecture multi-community lama.
- Jangan mengubah schema secara sembarangan.
- Jika membutuhkan perubahan schema, jelaskan alasan dan implementasikan migration yang aman.
- Reuse component, hook, service, provider, dan utility existing jika memungkinkan.
- Jangan membuat duplicate logic.
- Setelah implementasi, lakukan typecheck dan lint.
- Perbaiki error yang muncul akibat pekerjaan phase ini.
- Jangan mengerjakan phase berikutnya.

PHASE YANG HARUS DIKERJAKAN:

[ISI NOMOR DAN NAMA PHASE DI SINI]

WORKFLOW:

1. Audit file dan dependency yang relevan.
2. Jelaskan singkat kondisi existing.
3. Tentukan file yang akan diubah.
4. Implementasikan phase tersebut secara lengkap.
5. Jika perlu database, buat migration.
6. Pastikan RLS dan authorization benar.
7. Pastikan UI mengikuti desain.md.
8. Test flow yang terdampak.
9. Jalankan:
   npx tsc --noEmit
   expo lint
10. Perbaiki semua error yang disebabkan perubahan phase ini.
11. Berikan summary perubahan.
12. Berikan daftar file yang diubah.
13. Berikan hasil testing.

IMPORTANT:

Kerjakan HANYA phase yang disebutkan.

Jangan lanjut ke phase berikutnya.

Setelah acceptance criteria phase ini terpenuhi:

STOP.

Tunggu instruksi saya untuk melanjutkan phase berikutnya.
```

---

# MASTER RULE

Urutan implementasi tidak boleh dilompati tanpa alasan teknis.

```text
AUDIT
  ↓
CRITICAL FIX
  ↓
MOBILE CONFIG
  ↓
ROLE NAVIGATION
  ↓
BATCH BILLING
  ↓
FINANCIAL TRANSPARENCY
  ↓
RESIDENT ONBOARDING
  ↓
SECURITY & GUEST
  ↓
PUSH NOTIFICATION
  ↓
PERFORMANCE & OFFLINE
  ↓
FINAL HARDENING
  ↓
PRODUCTION READY
```

Setiap phase harus menghasilkan kondisi project yang stabil sebelum masuk ke phase berikutnya.
