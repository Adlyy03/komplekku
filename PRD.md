# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# KOMPLEKKU — MVP

**Version:** 1.0
**Status:** Ready for Development
**Product:** Komplekku
**Platform:** Mobile App
**Frontend:** Expo / React Native
**Backend:** Supabase
**Database:** PostgreSQL via Supabase
**Authentication:** Supabase Auth
**Storage:** Supabase Storage
**Realtime:** Supabase Realtime
**Primary Development Agent:** Antigravity AI

---

# 1. PROJECT VISION

## 1.1 Product Name

**Komplekku**

Komplekku adalah aplikasi marketplace/community platform khusus lingkungan perumahan atau komplek yang memungkinkan warga:

* menemukan produk dan jasa dari warga sekitar;
* membeli produk dari seller di dalam komplek;
* menjual produk atau jasa kepada warga lain;
* berkomunikasi dengan seller;
* melihat dan mengelola pesanan;
* menerima notifikasi aktivitas;
* memiliki identitas sebagai bagian dari suatu komplek/community.

Admin/pengelola komplek memiliki kemampuan untuk mengelola community, pengguna, seller, produk, dan aktivitas marketplace.

---

# 2. CORE PROBLEM

Marketplace umum seperti marketplace besar memiliki cakupan terlalu luas.

Komplekku fokus pada transaksi dan interaksi dalam lingkungan yang lebih kecil:

> "Apa yang tersedia dan bisa dibeli dari orang-orang di sekitar komplek gue?"

Contoh:

* Tetangga jual nasi uduk.
* Warga jual frozen food.
* Warga buka jasa laundry.
* Ada orang jual tanaman.
* Ada warga menerima jasa servis AC.
* Ada warga jual makanan homemade.
* Ada warga ingin menjual barang bekas.
* Warga ingin membeli sesuatu tanpa harus mencari seller jauh di luar komplek.

Komplekku memperpendek jarak antara **buyer dan seller di dalam komunitas yang sama**.

---

# 3. PRODUCT GOAL

MVP harus membuktikan bahwa:

1. Warga dapat masuk ke komunitas/komplek mereka.
2. Warga dapat melihat marketplace khusus komunitas.
3. Warga dapat menjadi buyer.
4. Warga dapat menjadi seller.
5. Seller dapat membuat dan mengelola produk.
6. Buyer dapat memasukkan produk ke cart.
7. Buyer dapat membuat order.
8. Buyer dan seller dapat berkomunikasi.
9. User dapat melihat status order.
10. Admin dapat mengelola komunitas dan user.
11. Seluruh data tersimpan secara aman di Supabase/PostgreSQL.
12. Tidak ada user yang dapat mengakses data milik komunitas lain secara ilegal.

---

# 4. MVP PRINCIPLE

## 4.1 Source of Truth

Dokumen PRD ini adalah **source of truth**.

Antigravity WAJIB:

* mengikuti scope PRD;
* tidak membuat fitur baru tanpa kebutuhan;
* tidak mengubah business rule tanpa alasan teknis;
* tidak menghapus requirement tanpa konfirmasi;
* tidak membuat database table tambahan hanya karena "mungkin berguna";
* tidak mengasumsikan payment gateway jika belum ditentukan;
* tidak mengasumsikan sistem delivery kompleks;
* tidak membuat microservices jika tidak diperlukan;
* menggunakan Supabase sebagai backend utama sesuai arsitektur yang ditentukan.

Jika terdapat requirement yang ambigu:

1. gunakan keputusan paling sederhana yang konsisten dengan PRD;
2. dokumentasikan asumsi;
3. jangan memperluas scope MVP.

---

# 5. TARGET USERS

## 5.1 Resident / Buyer

Warga yang menggunakan aplikasi untuk:

* browsing produk;
* melihat detail produk;
* membeli produk;
* membuat order;
* melihat order;
* chat dengan seller;
* mengelola profile.

User buyer juga dapat menjadi seller.

---

## 5.2 Seller

Warga yang menjual:

* produk fisik;
* makanan/minuman;
* barang bekas;
* jasa sederhana;
* produk rumahan.

Seller dapat:

* membuat toko/profile seller;
* membuat produk;
* mengedit produk;
* menghapus/nonaktifkan produk;
* menerima order;
* mengubah status order;
* chat dengan buyer.

---

## 5.3 Admin

Admin adalah pengelola community.

Admin dapat:

* mengelola community;
* melihat user;
* mengelola seller;
* moderasi produk;
* mengelola status user;
* melihat order;
* melakukan tindakan administratif tertentu.

Admin bukan superuser tanpa batas.

Permission harus dibatasi berdasarkan role.

---

# 6. USER ROLE MODEL

MVP menggunakan role:

```text
USER
SELLER
ADMIN
```

Catatan:

* SELLER tetap merupakan USER.
* Satu user dapat menjadi buyer dan seller.
* Seller tidak membutuhkan akun terpisah.
* ADMIN merupakan user dengan permission administratif.
* Role tidak boleh ditentukan hanya berdasarkan frontend.
* Authorization wajib diverifikasi di backend/database.

---

# 7. CORE USER JOURNEY

## 7.1 New User

```text
Open App
    ↓
Register
    ↓
Login
    ↓
Create Profile
    ↓
Join / Select Community
    ↓
Home
    ↓
Browse Marketplace
```

---

## 7.2 Buyer

```text
Home
 ↓
Marketplace
 ↓
Search / Category
 ↓
Product Detail
 ↓
Add to Cart
 ↓
Cart
 ↓
Checkout
 ↓
Create Order
 ↓
Order Detail
 ↓
Seller Processes Order
 ↓
Order Completed
```

---

## 7.3 Seller

```text
Profile
 ↓
Become Seller / Seller Dashboard
 ↓
Create Store
 ↓
Create Product
 ↓
Product Published
 ↓
Buyer Orders
 ↓
Seller Receives Order
 ↓
Seller Updates Status
 ↓
Order Completed
```

---

## 7.4 Chat

```text
Product
 ↓
Chat Seller
 ↓
Conversation
 ↓
Messages
```

Chat juga dapat diakses melalui inbox/conversation list.

---

# 8. MVP SCOPE

## IN SCOPE

### Authentication

* register;
* login;
* logout;
* session persistence;
* basic profile.

### Community

* community;
* join/select community;
* community membership.

### Marketplace

* product listing;
* category;
* search;
* product detail;
* seller/store information.

### Seller

* seller profile/store;
* create product;
* edit product;
* deactivate product;
* seller dashboard.

### Cart

* add item;
* update quantity;
* remove item;
* cart total.

### Order

* checkout;
* create order;
* order detail;
* order status;
* buyer order history;
* seller order management.

### Chat

* conversation;
* messages;
* realtime messaging.

### Notification

* basic in-app notifications;
* order notifications;
* chat notifications.

### Admin

* user management;
* seller management;
* product moderation;
* community management;
* order visibility.

---

# 9. MVP OUT OF SCOPE

Jangan implementasi fitur berikut pada MVP kecuali requirement berubah:

* payment gateway;
* automatic payment verification;
* complex delivery tracking;
* courier marketplace;
* GPS delivery tracking;
* advanced recommendation engine;
* AI recommendation;
* loyalty points;
* vouchers;
* coupons;
* affiliate system;
* advertising system;
* subscription;
* multi-country;
* multi-language;
* advanced analytics;
* warehouse management;
* inventory forecasting;
* sophisticated dispute resolution;
* complex refund engine;
* live streaming;
* video commerce;
* auction;
* bidding;
* social media feed;
* stories;
* follower/following;
* public comments;
* advanced review system;
* complex promotion engine.

---

# 10. FUNCTIONAL REQUIREMENTS

# 10.1 AUTHENTICATION

## Requirements

User dapat:

* register;
* login;
* logout;
* maintain session;
* access protected screens only after authentication.

Supabase Auth digunakan sebagai authentication provider.

---

## Register

Minimum field:

```text
Email
Password
Full Name
```

Setelah registration:

```text
Auth Account
    ↓
Profile
    ↓
Community Membership
```

Password tidak boleh disimpan manual di database aplikasi.

Supabase Auth menangani credential/password.

---

## Login

User login menggunakan:

* email;
* password.

Jika login berhasil:

```text
Authenticated Session
        ↓
Check Profile
        ↓
Check Community Membership
        ↓
Route User
```

---

## Logout

Logout harus:

* invalidate local session;
* return user ke login screen;
* clear user-specific cached state jika diperlukan.

---

# 11. PROFILE

Setiap authenticated user memiliki profile.

Minimum:

```text
Full Name
Avatar
Phone Number (optional)
Bio (optional)
Community
Created At
Updated At
```

Profile tidak boleh bergantung pada data yang hanya ada di frontend.

---

# 12. COMMUNITY

Community adalah representasi sebuah komplek/perumahan.

Contoh:

```text
Komplek Melati
Komplek Permata
Perumahan XYZ
```

## Community Entity

Minimal:

```text
id
name
description
address
image_url
status
created_at
updated_at
```

---

# 13. COMMUNITY MEMBERSHIP

User harus memiliki membership terhadap community.

Minimal:

```text
id
community_id
user_id
role
status
joined_at
```

Status:

```text
active
pending
blocked
inactive
```

MVP dapat menggunakan flow sederhana:

```text
Register
 ↓
Select Community
 ↓
Join Community
 ↓
Active Membership
```

Jika nantinya diperlukan approval admin, status `pending` dapat digunakan.

---

# 14. COMMUNITY ISOLATION

Ini requirement KRITIS.

Marketplace harus berbasis community.

Jika user berada di Community A:

* user dapat melihat produk Community A;
* user tidak boleh melihat produk Community B;
* user tidak boleh membuat order lintas community;
* user tidak boleh mengakses chat lintas community;
* user tidak boleh mengakses private data community lain.

Semua enforcement wajib dilakukan di backend/database.

Frontend filtering saja **TIDAK CUKUP**.

Supabase Row Level Security (RLS) wajib digunakan.

---

# 15. MARKETPLACE

Marketplace adalah halaman utama untuk discovery.

User dapat melihat:

* produk;
* kategori;
* seller;
* harga;
* gambar;
* availability/status.

---

# 16. MARKETPLACE HOME

Minimum UI:

```text
Header
 ├── Community Name
 ├── Notification
 └── Profile

Search Bar

Categories

Featured / Latest Products

Product Grid/List
```

MVP tidak wajib memiliki algorithmic personalization.

Sorting default:

```text
Latest products
```

---

# 17. CATEGORY

Kategori digunakan untuk mengelompokkan produk.

Contoh:

```text
Makanan
Minuman
Sembako
Fashion
Elektronik
Rumah Tangga
Kecantikan
Jasa
Barang Bekas
Lainnya
```

Kategori dapat dikelola admin.

Product hanya boleh menggunakan category yang valid.

---

# 18. PRODUCT

Product minimum:

```text
id
seller_id
community_id
category_id
name
description
price
stock
type
status
created_at
updated_at
```

Product type:

```text
physical
service
```

Status:

```text
draft
active
inactive
sold_out
```

---

# 19. PRODUCT IMAGE

Product dapat memiliki satu atau lebih gambar.

Gunakan Supabase Storage.

Struktur konseptual:

```text
Product
  ↓
Product Images
```

Minimal MVP:

* 1 primary image;
* additional images optional.

Image URL/path disimpan di database.

Binary image tidak disimpan langsung di PostgreSQL.

---

# 20. PRODUCT RULES

Seller hanya dapat:

* create product miliknya;
* update product miliknya;
* deactivate product miliknya.

Seller tidak dapat:

* mengedit product seller lain;
* menghapus product seller lain;
* mengubah community_id sembarangan;
* memanipulasi seller_id.

`community_id` product harus mengikuti community seller.

---

# 21. PRODUCT DETAIL

Product detail menampilkan:

```text
Product Image
Product Name
Price
Stock / Availability
Description
Seller
Community
Category
Add to Cart
Chat Seller
```

Jika product inactive/sold out:

* Add to Cart disabled.

---

# 22. SEARCH

Search MVP berdasarkan:

* product name;
* product description;
* category.

Search harus dibatasi community aktif user.

Contoh:

```text
User Community A
       ↓
Search "ayam"
       ↓
Products in Community A only
```

---

# 23. SELLER

User dapat menjadi seller.

Flow:

```text
Profile
 ↓
Become Seller
 ↓
Create Seller Store/Profile
 ↓
Seller Dashboard
```

---

# 24. SELLER PROFILE / STORE

Minimum:

```text
seller_profile_id
user_id
community_id
store_name
description
avatar_url
status
created_at
updated_at
```

Seller status:

```text
active
inactive
blocked
```

---

# 25. SELLER DASHBOARD

Seller dashboard menampilkan:

```text
Total Products
Active Products
Pending Orders
Processing Orders
Completed Orders
```

MVP tidak membutuhkan analytics kompleks.

---

# 26. SELLER PRODUCT MANAGEMENT

Seller dapat:

### Create

* nama;
* deskripsi;
* harga;
* stock;
* category;
* type;
* image.

### Edit

Seller dapat mengubah product miliknya.

### Deactivate

Seller dapat menonaktifkan product.

### Reactivate

Seller dapat mengaktifkan kembali product jika valid.

---

# 27. CART

Cart dimiliki user.

Entity:

```text
cart
cart_items
```

Cart item:

```text
id
cart_id
product_id
quantity
created_at
updated_at
```

---

# 28. CART RULES

Ketika user:

```text
Add Product
```

Sistem:

1. cek product masih active;
2. cek product masih tersedia;
3. cek product berasal dari community user;
4. cek quantity valid;
5. add/update cart item.

---

# 29. MULTI-SELLER CART

Untuk MVP, gunakan aturan sederhana:

> **Satu checkout hanya boleh berisi produk dari satu seller.**

Alasan:

* order management lebih sederhana;
* seller ownership jelas;
* status order tidak bercampur;
* database lebih sederhana;
* menghindari kompleksitas split order.

Jika cart berisi seller berbeda:

```text
Seller A product
Seller B product
```

UI harus meminta user checkout secara terpisah.

Jangan membuat automatic split order pada MVP.

---

# 30. CHECKOUT

Checkout menampilkan:

```text
Seller
Product
Quantity
Price
Subtotal
Delivery / Pickup method
Notes
Grand Total
```

Karena payment gateway belum masuk MVP, payment status dapat menggunakan:

```text
unpaid
pending
paid
cancelled
```

Namun jangan implementasikan payment processing nyata.

---

# 31. PAYMENT MVP

MVP tidak mengintegrasikan payment gateway.

Order dapat dianggap:

```text
Payment Method:
Cash / Manual
```

atau metode sederhana lain yang ditentukan implementation.

Jangan:

* menyimpan nomor kartu;
* menyimpan CVV;
* membuat fake payment gateway;
* mengklaim payment berhasil jika tidak ada payment system.

---

# 32. ORDER

Order minimum:

```text
id
buyer_id
seller_id
community_id
order_number
status
payment_status
subtotal
delivery_fee
total
notes
created_at
updated_at
```

---

# 33. ORDER ITEM

```text
id
order_id
product_id
product_name_snapshot
price_snapshot
quantity
subtotal
created_at
```

## IMPORTANT

Order item harus menyimpan snapshot:

```text
product_name_snapshot
price_snapshot
```

Tujuannya agar histori order tidak berubah ketika seller mengubah product.

Contoh:

Hari ini:

```text
Nasi Goreng = Rp15.000
```

Buyer order.

Besok seller mengubah harga:

```text
Nasi Goreng = Rp20.000
```

Order lama tetap:

```text
Rp15.000
```

---

# 34. ORDER STATUS

MVP:

```text
pending
confirmed
processing
ready
completed
cancelled
```

Flow normal:

```text
pending
 ↓
confirmed
 ↓
processing
 ↓
ready
 ↓
completed
```

Cancellation:

```text
pending → cancelled
confirmed → cancelled
```

Status transition harus dikontrol.

User tidak boleh mengubah status order secara sembarangan dari frontend.

---

# 35. BUYER ORDER FLOW

```text
Cart
 ↓
Checkout
 ↓
Create Order
 ↓
Order Pending
 ↓
Seller Confirms
 ↓
Processing
 ↓
Ready
 ↓
Buyer receives product
 ↓
Completed
```

Buyer dapat melihat:

* order number;
* seller;
* items;
* total;
* status;
* timestamp.

---

# 36. SELLER ORDER FLOW

Seller dashboard:

```text
Incoming Orders
 ↓
Open Order
 ↓
Confirm
 ↓
Processing
 ↓
Ready
 ↓
Complete
```

Seller hanya dapat mengubah order yang menjadi tanggung jawabnya.

---

# 37. ORDER OWNERSHIP

Buyer dapat melihat:

```text
orders where buyer_id = current_user
```

Seller dapat melihat:

```text
orders where seller_id = current_seller
```

Admin dapat melihat berdasarkan permission admin community.

---

# 38. CHAT

Chat MVP digunakan untuk komunikasi buyer-seller.

Entity:

```text
conversations
conversation_participants
messages
```

---

# 39. CONVERSATION

Minimum:

```text
id
community_id
created_at
updated_at
```

Participant:

```text
conversation_id
user_id
joined_at
```

MVP conversation buyer-seller.

Tidak perlu group chat.

---

# 40. MESSAGE

Minimum:

```text
id
conversation_id
sender_id
message
created_at
read_at
```

MVP text-only.

Belum perlu:

* voice message;
* video;
* file sharing;
* reactions;
* stickers;
* GIF;
* group chat.

---

# 41. CHAT RULES

User hanya dapat:

* membaca conversation yang dia ikuti;
* mengirim message sebagai dirinya sendiri;
* melihat message dari participant conversation.

User tidak dapat:

* membaca conversation user lain;
* mengirim message menggunakan user lain;
* mengakses community lain.

---

# 42. REALTIME CHAT

Gunakan Supabase Realtime.

Flow:

```text
User A sends message
        ↓
Database INSERT
        ↓
Supabase Realtime
        ↓
User B receives update
```

Database tetap menjadi source of truth.

Realtime hanya digunakan sebagai mekanisme update UI.

---

# 43. NOTIFICATION

MVP notification bersifat in-app.

Trigger minimum:

### Order

* new order;
* order confirmed;
* order processing;
* order ready;
* order completed;
* order cancelled.

### Chat

* new message.

Entity:

```text
notifications
```

Minimum:

```text
id
user_id
type
title
body
reference_type
reference_id
read_at
created_at
```

---

# 44. NOTIFICATION RULES

Notification hanya dapat dibaca oleh user pemilik notification.

User dapat:

* melihat notification;
* membuka notification;
* mark as read.

---

# 45. PUSH NOTIFICATION

Push notification bukan dependency utama MVP.

Jika implementasi Expo Push Notification dilakukan, gunakan sebagai enhancement setelah core notification berjalan.

Jangan membuat core architecture bergantung pada push notification.

---

# 46. ADMIN

Admin dashboard minimal terdiri dari:

```text
Overview
Users
Sellers
Products
Orders
Communities
```

---

# 47. ADMIN — USER MANAGEMENT

Admin dapat:

* melihat user community;
* melihat profile;
* melihat status membership;
* block/unblock user jika diperlukan;
* melihat seller status.

Admin tidak boleh melihat password user.

---

# 48. ADMIN — SELLER MANAGEMENT

Admin dapat:

* melihat seller;
* melihat seller store;
* melihat product seller;
* mengaktifkan/nonaktifkan seller;
* melakukan moderation.

---

# 49. ADMIN — PRODUCT MODERATION

Admin dapat:

* melihat product;
* melihat seller;
* melihat community;
* activate;
* deactivate;
* remove/moderate product.

Product moderation harus tercatat jika audit log digunakan.

---

# 50. ADMIN — COMMUNITY MANAGEMENT

Admin dapat:

* create community;
* edit community;
* deactivate community;
* melihat members.

Community tidak boleh dihapus sembarangan jika masih memiliki:

* members;
* products;
* orders;
* conversations.

Gunakan soft-delete/deactivation jika diperlukan.

---

# 51. DATABASE ARCHITECTURE

Database utama:

**PostgreSQL via Supabase**

Authentication:

**Supabase Auth**

File:

**Supabase Storage**

Realtime:

**Supabase Realtime**

Authorization:

**PostgreSQL RLS**

---

# 52. CORE DATABASE ENTITIES

MVP minimal membutuhkan entity berikut:

```text
profiles
communities
community_members
seller_profiles
categories
products
product_images
carts
cart_items
orders
order_items
conversations
conversation_participants
messages
notifications
```

Jika menggunakan Supabase Auth:

```text
auth.users
```

adalah source authentication user.

`profiles` menyimpan application-level user profile.

---

# 53. ENTITY RELATIONSHIP

Konseptual:

```text
auth.users
    │
    └── profiles
          │
          └── community_members
                    │
                    └── communities

profiles
   │
   └── seller_profiles
          │
          └── products
                 │
                 ├── product_images
                 └── categories

profiles
   │
   └── carts
          │
          └── cart_items
                 │
                 └── products

profiles
   │
   ├── buyer → orders
   │
   └── seller → orders

orders
   │
   └── order_items
          │
          └── products

profiles
   │
   └── conversations
          │
          ├── participants
          └── messages

profiles
   │
   └── notifications
```

---

# 54. DATABASE DESIGN PRINCIPLES

Antigravity wajib:

* menggunakan foreign key;
* menggunakan UUID untuk primary key entity utama;
* menggunakan timestamp;
* menggunakan constraints;
* menggunakan indexes untuk query penting;
* menggunakan unique constraints jika diperlukan;
* menghindari duplicated source-of-truth;
* menggunakan transaction untuk operasi multi-table penting;
* menjaga referential integrity.

---

# 55. UUID

Gunakan UUID untuk ID utama.

Contoh:

```text
id UUID PRIMARY KEY
```

Jangan menggunakan sequential integer ID untuk user-facing entities kecuali ada alasan kuat.

---

# 56. TIMESTAMPS

Entity yang mutable minimal memiliki:

```text
created_at
updated_at
```

Timestamp sebaiknya menggunakan timezone-aware timestamp.

Database menyimpan waktu secara konsisten.

---

# 57. PRICE

Harga jangan disimpan sebagai floating point.

Gunakan tipe numeric/decimal yang sesuai PostgreSQL.

Contoh:

```text
numeric(12,2)
```

atau pendekatan integer dalam satuan rupiah jika architecture memilih demikian.

Yang penting:

> Jangan menggunakan JavaScript floating-point sebagai source of truth untuk monetary calculation.

---

# 58. STOCK

Stock harus integer non-negative.

Rule:

```text
stock >= 0
```

Jika stock:

```text
0
```

product dapat dianggap:

```text
sold_out
```

---

# 59. RLS / SECURITY

Supabase RLS wajib diaktifkan pada table yang mengandung data user/community.

Minimum protection:

### Profiles

User hanya dapat update profile sendiri.

### Community Members

User hanya dapat melihat membership yang relevan.

### Products

User hanya dapat melihat active product dari community mereka.

Seller hanya dapat modify product miliknya.

### Cart

User hanya dapat mengakses cart sendiri.

### Orders

Buyer hanya dapat melihat order miliknya.

Seller hanya dapat melihat order seller miliknya.

### Messages

Participant hanya dapat melihat conversation/message yang diikuti.

### Notifications

User hanya dapat melihat notification miliknya.

---

# 60. SECURITY RULE

Jangan pernah mengandalkan:

```text
if (user.role === 'admin')
```

di frontend sebagai satu-satunya security layer.

Frontend authorization hanya untuk UX.

Security enforcement harus dilakukan pada:

```text
Supabase RLS
Database policies
Backend/database functions
```

---

# 61. SERVICE / DATA ACCESS LAYER

Frontend tidak boleh menyebarkan query database secara brutal ke seluruh component.

Gunakan struktur yang terorganisasi.

Contoh konseptual:

```text
services/
    auth/
    communities/
    products/
    sellers/
    cart/
    orders/
    chat/
    notifications/
    admin/
```

Atau architecture equivalent yang konsisten.

Tujuannya:

* business logic terisolasi;
* query mudah dirawat;
* testing lebih mudah;
* migration lebih aman.

---

# 62. FRONTEND ARCHITECTURE

Expo / React Native.

Struktur konseptual:

```text
app/
    auth/
    onboarding/
    home/
    marketplace/
    product/
    cart/
    checkout/
    orders/
    chat/
    notifications/
    profile/
    seller/
    admin/
```

Struktur aktual boleh berbeda selama separation of concerns tetap terjaga.

---

# 63. NAVIGATION

Recommended navigation:

```text
Auth Stack
    ↓
Onboarding
    ↓
Main App

Main App:
    Home
    Marketplace
    Orders
    Chat
    Profile
```

Seller screens dapat berada di Profile/Seller Dashboard.

Admin memiliki route terpisah berdasarkan role.

---

# 64. HOME SCREEN

Home menampilkan:

```text
Community
Greeting
Search
Categories
Recent Products
Quick Actions
```

Quick action dapat berupa:

```text
Sell Something
My Orders
My Store
```

Jangan memasukkan fitur yang tidak ada di MVP.

---

# 65. UI/UX PRINCIPLES

Design harus:

* mobile-first;
* sederhana;
* cepat dipahami;
* minim friction;
* konsisten;
* accessible;
* memiliki loading state;
* memiliki empty state;
* memiliki error state;
* memiliki confirmation state.

---

# 66. REQUIRED UI STATES

Setiap screen yang mengambil data wajib memiliki:

### Loading

Contoh:

```text
Loading products...
```

### Empty

Contoh:

```text
Belum ada produk di komplek ini.
```

### Error

Contoh:

```text
Gagal memuat data.
Coba lagi.
```

### Success

Contoh:

```text
Pesanan berhasil dibuat.
```

Jangan menampilkan blank screen ketika request gagal.

---

# 67. FORM VALIDATION

Semua form wajib memiliki validation.

Contoh product:

```text
Name required
Price required
Price >= 0
Stock >= 0
Category required
Description length valid
```

Validation frontend meningkatkan UX.

Validation backend/database tetap wajib.

---

# 68. ERROR HANDLING

Error dari Supabase tidak boleh ditampilkan mentah kepada user jika berisi detail internal.

Jangan:

```text
PostgrestError: duplicate key constraint...
```

Tampilkan pesan user-friendly.

Developer logs dapat tetap menyimpan detail teknis.

---

# 69. PERFORMANCE

MVP harus memperhatikan:

* pagination;
* lazy loading;
* image optimization;
* query filtering;
* indexes;
* avoiding unnecessary realtime subscriptions.

Jangan mengambil seluruh database:

```text
SELECT *
```

tanpa kebutuhan.

Marketplace harus menggunakan pagination/limit.

---

# 70. IMAGE STORAGE

Supabase Storage digunakan untuk:

```text
avatars
product-images
community-images
```

Bucket/path harus memiliki policy yang sesuai.

User tidak boleh mengupload file sembarangan ke area private user lain.

---

# 71. DATA CONSISTENCY

Operasi berikut harus atomic atau transaction-safe:

### Create Order

Minimal:

```text
Validate cart
Validate product
Validate stock
Create order
Create order items
Update stock
Clear cart
Create notifications
```

Jangan sampai:

```text
Order created
tetapi order_items gagal
```

atau:

```text
Stock berkurang
tetapi order gagal dibuat
```

---

# 72. STOCK CONCURRENCY

Jika dua buyer membeli product yang sama secara bersamaan:

```text
Stock = 1

Buyer A checkout
Buyer B checkout
```

Database harus mencegah stock menjadi:

```text
-1
```

Stock validation harus dilakukan secara atomic/transactional.

Jangan hanya:

```text
if stock > quantity
```

di frontend.

---

# 73. ORDER SNAPSHOT

Saat order dibuat, simpan snapshot:

```text
product name
price
quantity
```

Jangan bergantung pada product table untuk historical order display.

---

# 74. AUDITABILITY

Untuk tindakan penting, sistem sebaiknya dapat mengetahui:

```text
who
did what
when
```

MVP minimum dapat menggunakan timestamps dan ownership fields.

Audit log penuh dapat menjadi Phase lanjutan jika belum diperlukan.

---

# 75. ADMIN SECURITY

Admin route:

```text
Authenticated
      ↓
Check admin permission
      ↓
Allow admin UI
```

Tetapi database juga harus memiliki policy untuk memastikan admin permission.

Jangan percaya parameter:

```text
role=admin
```

dari client.

---

# 76. API / BACKEND PRINCIPLE

Supabase digunakan sebagai backend utama.

Tidak perlu membuat Express.js hanya untuk membungkus Supabase jika tidak ada kebutuhan.

Gunakan:

* Supabase Client;
* PostgreSQL;
* RLS;
* RPC/database functions jika dibutuhkan;
* Edge Functions jika membutuhkan server-side secret/business logic.

Jangan expose:

```text
service_role key
```

ke mobile app.

---

# 77. ENVIRONMENT VARIABLES

Frontend hanya boleh menerima public/client-safe configuration.

Contoh:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Secret key:

```text
SUPABASE_SERVICE_ROLE_KEY
```

tidak boleh masuk Expo mobile bundle.

---

# 78. ENVIRONMENT SETUP

Pisahkan:

```text
Development
Production
```

Jangan hardcode:

* Supabase URL;
* keys;
* secrets;
* environment-specific configuration.

---

# 79. DATABASE MIGRATION

Semua perubahan schema harus reproducible.

Gunakan migration files.

Jangan melakukan perubahan schema manual tanpa migration jika project sudah masuk development serius.

Contoh:

```text
001_initial_schema
002_profiles
003_communities
004_products
005_orders
...
```

Nomor migration hanya contoh.

---

# 80. SEED DATA

Development membutuhkan seed data untuk:

* community;
* categories;
* users;
* sellers;
* products.

Seed data harus jelas ditandai sebagai development/test data.

---

# 81. TESTING

MVP minimal membutuhkan:

### Unit Tests

Untuk business logic penting:

* cart calculation;
* order total;
* stock validation;
* status transition.

### Integration Tests

Untuk:

* authentication;
* product creation;
* order creation;
* RLS;
* chat permission.

### Manual QA

Setiap phase wajib diuji sebelum lanjut.

---

# 82. CRITICAL SECURITY TESTS

WAJIB dites:

### User A mencoba membaca User B cart

Expected:

```text
DENIED
```

### User A mencoba membaca order User B

Expected:

```text
DENIED
```

### Seller A mencoba edit Product Seller B

Expected:

```text
DENIED
```

### Community A user mencoba membaca Product Community B

Expected:

```text
DENIED
```

### Non-admin mencoba admin operation

Expected:

```text
DENIED
```

### User mencoba membaca conversation yang bukan participant

Expected:

```text
DENIED
```

---

# 83. ANALYTICS MVP

Analytics kompleks belum diperlukan.

Minimal dapat mencatat:

```text
product views
order created
order completed
```

Jika analytics belum dibutuhkan untuk validasi MVP, boleh ditunda.

Jangan membuat analytics system kompleks.

---

# 84. NON-FUNCTIONAL REQUIREMENTS

## Reliability

Core operation harus tidak menghasilkan corrupted data.

## Security

RLS dan authorization wajib.

## Performance

Screen utama harus terasa responsive.

## Maintainability

Code harus modular.

## Scalability

Database design harus memungkinkan pertumbuhan:

```text
10 users
→
1,000 users
→
10,000+ users
```

tanpa redesign fundamental.

---

# 85. PHASE DEVELOPMENT PLAN

Development dibagi menjadi beberapa phase.

**RULE: Jangan melompat phase jika dependency phase sebelumnya belum stabil.**

---

# PHASE 0 — PROJECT FOUNDATION

## Goal

Menyiapkan project supaya development berikutnya memiliki foundation yang benar.

### Tasks

* [ ] Review existing Expo project.
* [ ] Review existing Supabase project.
* [ ] Configure environment variables.
* [ ] Configure Supabase client.
* [ ] Establish folder architecture.
* [ ] Establish navigation architecture.
* [ ] Establish theme/design system.
* [ ] Configure linting.
* [ ] Configure formatting.
* [ ] Configure TypeScript.
* [ ] Establish error handling.
* [ ] Establish loading/empty/error components.

### Acceptance Criteria

* App dapat dijalankan.
* Supabase client dapat connect.
* Environment tidak hardcoded.
* Tidak ada service role key di client.
* Navigation foundation tersedia.
* TypeScript berjalan tanpa critical errors.

---

# PHASE 1 — DATABASE FOUNDATION

## Goal

Membangun database schema sebelum feature development.

### Tasks

Create:

* [ ] profiles
* [ ] communities
* [ ] community_members
* [ ] seller_profiles
* [ ] categories
* [ ] products
* [ ] product_images
* [ ] carts
* [ ] cart_items
* [ ] orders
* [ ] order_items
* [ ] conversations
* [ ] conversation_participants
* [ ] messages
* [ ] notifications

### Tasks Tambahan

* [ ] Foreign keys
* [ ] Constraints
* [ ] Indexes
* [ ] Timestamps
* [ ] RLS
* [ ] Policies
* [ ] Storage buckets
* [ ] Storage policies
* [ ] Seed data

### Acceptance Criteria

* Semua schema berhasil migration.
* Foreign key valid.
* Tidak ada circular dependency bermasalah.
* RLS aktif.
* Basic permission tests berhasil.
* Seed data dapat digunakan.

---

# PHASE 2 — AUTH & USER PROFILE

## Goal

User dapat masuk ke aplikasi dengan identity yang valid.

### Tasks

* [ ] Register.
* [ ] Login.
* [ ] Logout.
* [ ] Session persistence.
* [ ] Auth state listener.
* [ ] Profile creation.
* [ ] Profile update.
* [ ] Avatar upload.
* [ ] Protected routes.

### Acceptance Criteria

User dapat:

```text
Register
 ↓
Login
 ↓
Session persisted
 ↓
Profile
 ↓
Logout
```

Security test:

* User A tidak dapat update profile User B.

---

# PHASE 3 — COMMUNITY

## Goal

User memiliki konteks community yang jelas.

### Tasks

* [ ] Community list.
* [ ] Select community.
* [ ] Join community.
* [ ] Membership state.
* [ ] Active community.
* [ ] Community profile.
* [ ] Community switching jika user memiliki >1 membership.

### Acceptance Criteria

User hanya dapat mengakses marketplace sesuai community aktif.

Security:

```text
Community A user
    X
Community B data
```

harus ditolak.

---

# PHASE 4 — MARKETPLACE DISCOVERY

## Goal

User dapat menemukan produk.

### Tasks

* [ ] Marketplace home.
* [ ] Product list.
* [ ] Product detail.
* [ ] Category.
* [ ] Search.
* [ ] Pagination.
* [ ] Product image.
* [ ] Seller information.
* [ ] Empty states.
* [ ] Loading states.
* [ ] Error states.

### Acceptance Criteria

User dapat:

```text
Open Marketplace
 ↓
See products
 ↓
Search
 ↓
Filter category
 ↓
Open product
 ↓
See seller
```

---

# PHASE 5 — SELLER & PRODUCT MANAGEMENT

## Goal

User dapat berubah menjadi seller dan menjual product.

### Tasks

* [ ] Become seller.
* [ ] Create store.
* [ ] Seller dashboard.
* [ ] Create product.
* [ ] Upload product image.
* [ ] Edit product.
* [ ] Deactivate product.
* [ ] Reactivate product.
* [ ] Stock management.

### Acceptance Criteria

Seller dapat:

```text
Create Store
 ↓
Create Product
 ↓
Product Active
 ↓
Buyer can see product
```

Security:

Seller A tidak dapat modify Seller B product.

---

# PHASE 6 — CART

## Goal

Buyer dapat mengumpulkan product sebelum checkout.

### Tasks

* [ ] Create cart.
* [ ] Add item.
* [ ] Update quantity.
* [ ] Remove item.
* [ ] Cart total.
* [ ] Stock validation.
* [ ] Seller validation.
* [ ] Community validation.
* [ ] Single-seller checkout rule.

### Acceptance Criteria

Buyer dapat:

```text
Product
 ↓
Add Cart
 ↓
Update Qty
 ↓
Remove
 ↓
Checkout
```

Tidak boleh checkout:

* product inactive;
* stock insufficient;
* community berbeda;
* seller berbeda dalam satu checkout.

---

# PHASE 7 — ORDER

## Goal

Menyelesaikan core marketplace transaction flow.

### Tasks

* [ ] Checkout.
* [ ] Create order.
* [ ] Create order items.
* [ ] Price snapshot.
* [ ] Stock decrement.
* [ ] Cart clearing.
* [ ] Order history.
* [ ] Order detail.
* [ ] Seller incoming orders.
* [ ] Order status transition.
* [ ] Cancellation.
* [ ] Notifications.

### Acceptance Criteria

Full flow:

```text
Buyer
 ↓
Cart
 ↓
Checkout
 ↓
Create Order
 ↓
Seller sees order
 ↓
Seller confirms
 ↓
Processing
 ↓
Ready
 ↓
Completed
```

Order creation harus atomic.

---

# PHASE 8 — CHAT

## Goal

Buyer dan seller dapat berkomunikasi.

### Tasks

* [ ] Conversation creation.
* [ ] Conversation list.
* [ ] Message list.
* [ ] Send message.
* [ ] Realtime subscription.
* [ ] Read status.
* [ ] Chat from product detail.
* [ ] Chat permission.

### Acceptance Criteria

```text
Buyer opens product
 ↓
Chat Seller
 ↓
Conversation created
 ↓
Buyer sends message
 ↓
Seller receives realtime update
```

Security:

Non-participant tidak dapat membaca conversation.

---

# PHASE 9 — NOTIFICATIONS

## Goal

User mengetahui aktivitas penting.

### Tasks

* [ ] Notification table.
* [ ] Notification list.
* [ ] Unread count.
* [ ] Mark read.
* [ ] Order notifications.
* [ ] Chat notifications.
* [ ] Deep link/reference handling.

### Acceptance Criteria

Event penting menghasilkan notification yang benar.

Contoh:

```text
New Order
 ↓
Seller notification
```

---

# PHASE 10 — ADMIN

## Goal

Community memiliki administrative control.

### Tasks

* [ ] Admin authentication.
* [ ] Admin dashboard.
* [ ] User management.
* [ ] Membership management.
* [ ] Seller management.
* [ ] Product moderation.
* [ ] Order visibility.
* [ ] Community management.
* [ ] Permission enforcement.

### Acceptance Criteria

Admin dapat menjalankan administrative tasks sesuai permission.

Non-admin:

```text
ADMIN ROUTE
    ↓
DENIED
```

---

# PHASE 11 — SECURITY HARDENING

## Goal

Mengamankan MVP sebelum release.

### Tasks

* [ ] Audit RLS.
* [ ] Audit Storage policies.
* [ ] Audit ownership.
* [ ] Audit role permission.
* [ ] Test cross-community access.
* [ ] Test cross-user access.
* [ ] Test seller ownership.
* [ ] Test admin permission.
* [ ] Remove secrets from client.
* [ ] Validate environment configuration.
* [ ] Validate input sanitization.
* [ ] Review database constraints.

### Acceptance Criteria

Semua critical authorization test PASS.

---

# PHASE 12 — QA & MVP RELEASE

## Goal

Memastikan MVP stabil untuk penggunaan nyata terbatas.

### Tasks

* [ ] Full regression testing.
* [ ] Authentication test.
* [ ] Community test.
* [ ] Marketplace test.
* [ ] Seller test.
* [ ] Cart test.
* [ ] Order test.
* [ ] Chat test.
* [ ] Notification test.
* [ ] Admin test.
* [ ] Offline/error behavior test.
* [ ] Performance check.
* [ ] Crash/error logging.
* [ ] Production environment setup.
* [ ] Release build.

### Acceptance Criteria

Core journey berhasil:

```text
Register
 ↓
Join Community
 ↓
Browse
 ↓
Become Seller
 ↓
Create Product
 ↓
Buyer Adds Cart
 ↓
Checkout
 ↓
Seller Processes
 ↓
Chat
 ↓
Complete Order
```

---

# 86. DEFINITION OF DONE

Sebuah feature dianggap DONE hanya jika:

* [ ] UI selesai.
* [ ] Database selesai jika dibutuhkan.
* [ ] Backend/data logic selesai.
* [ ] Validation selesai.
* [ ] Loading state selesai.
* [ ] Empty state selesai.
* [ ] Error state selesai.
* [ ] Authorization selesai.
* [ ] RLS diperiksa.
* [ ] Happy path berhasil.
* [ ] Error path berhasil.
* [ ] Tidak ada critical TypeScript error.
* [ ] Tidak ada critical runtime error.
* [ ] Tidak merusak feature sebelumnya.

---

# 87. ACCEPTANCE CRITERIA — AUTH

### AC-AUTH-001

Given user belum login:

When membuka protected screen:

Then user diarahkan ke login.

### AC-AUTH-002

Given user register dengan credential valid:

Then account dibuat dan profile dapat dibuat.

### AC-AUTH-003

Given user logout:

Then protected session tidak dapat digunakan lagi.

---

# 88. ACCEPTANCE CRITERIA — COMMUNITY

### AC-COM-001

User dapat memilih community.

### AC-COM-002

User hanya dapat mengakses data community tempat dia menjadi member.

### AC-COM-003

User dari Community A tidak dapat membaca product Community B.

---

# 89. ACCEPTANCE CRITERIA — PRODUCT

### AC-PROD-001

Seller dapat membuat product.

### AC-PROD-002

Product active dapat dilihat member community.

### AC-PROD-003

Seller hanya dapat edit product miliknya.

### AC-PROD-004

Product inactive tidak dapat ditambahkan ke cart.

---

# 90. ACCEPTANCE CRITERIA — CART

### AC-CART-001

Buyer dapat add product.

### AC-CART-002

Buyer dapat update quantity.

### AC-CART-003

Buyer dapat remove item.

### AC-CART-004

Quantity tidak boleh melebihi available stock.

### AC-CART-005

Checkout multi-seller tidak diperbolehkan dalam satu order.

---

# 91. ACCEPTANCE CRITERIA — ORDER

### AC-ORDER-001

Buyer dapat create order dari cart valid.

### AC-ORDER-002

Order menyimpan price snapshot.

### AC-ORDER-003

Seller hanya dapat melihat order miliknya.

### AC-ORDER-004

Buyer hanya dapat melihat order miliknya.

### AC-ORDER-005

Order status mengikuti transition yang valid.

### AC-ORDER-006

Stock tidak boleh menjadi negative.

---

# 92. ACCEPTANCE CRITERIA — CHAT

### AC-CHAT-001

Buyer dapat memulai conversation dengan seller.

### AC-CHAT-002

Participant dapat membaca messages.

### AC-CHAT-003

Participant dapat mengirim message.

### AC-CHAT-004

Message muncul realtime.

### AC-CHAT-005

Non-participant tidak dapat membaca conversation.

---

# 93. ACCEPTANCE CRITERIA — ADMIN

### AC-ADMIN-001

Admin dapat membuka admin dashboard.

### AC-ADMIN-002

Non-admin tidak dapat membuka admin functionality.

### AC-ADMIN-003

Admin dapat melakukan moderation sesuai permission.

---

# 94. CORE BUSINESS RULES

Rule #1:

> Satu user dapat menjadi buyer dan seller.

Rule #2:

> Product selalu dimiliki seller.

Rule #3:

> Seller merupakan member community.

Rule #4:

> Product harus berada di community seller.

Rule #5:

> Buyer dan seller dalam transaction harus berada pada community yang sama.

Rule #6:

> Satu order hanya untuk satu seller.

Rule #7:

> Historical order menggunakan price snapshot.

Rule #8:

> Stock tidak boleh negative.

Rule #9:

> User hanya dapat mengakses private data miliknya.

Rule #10:

> Authorization wajib ditegakkan di database/backend.

Rule #11:

> Authentication menggunakan Supabase Auth.

Rule #12:

> PostgreSQL menjadi source of truth untuk transactional data.

Rule #13:

> Realtime bukan source of truth; database tetap source of truth.

Rule #14:

> Payment gateway bukan bagian MVP.

Rule #15:

> Jangan menambah fitur di luar PRD tanpa approval.

---

# 95. DATA OWNERSHIP MODEL

```text
USER
 ├── Owns Profile
 ├── Owns Cart
 ├── Owns Notifications
 └── Participates in Community

SELLER
 ├── Owns Store
 ├── Owns Products
 └── Receives Orders

BUYER
 ├── Owns Cart
 ├── Creates Orders
 └── Participates in Conversations

ADMIN
 └── Manages Community Resources
```

---

# 96. SCREEN INVENTORY

## Authentication

* Splash
* Login
* Register

## Onboarding

* Profile Setup
* Community Selection
* Community Confirmation

## Main

* Home
* Marketplace
* Product Detail
* Categories
* Search
* Cart
* Checkout
* Orders
* Order Detail
* Chat List
* Chat Detail
* Notifications
* Profile

## Seller

* Become Seller
* Store Setup
* Seller Dashboard
* My Products
* Create Product
* Edit Product
* Seller Orders
* Seller Order Detail

## Admin

* Admin Dashboard
* Users
* User Detail
* Sellers
* Seller Detail
* Products
* Product Moderation
* Orders
* Communities
* Community Detail

---

# 97. UX NAVIGATION RULES

User harus selalu dapat:

* kembali;
* mengetahui context screen;
* melihat status operation;
* membatalkan form;
* retry request yang gagal.

Destructive actions seperti:

```text
Deactivate Product
Cancel Order
Block User
```

harus memiliki confirmation.

---

# 98. EMPTY STATES

Contoh:

### Marketplace

```text
Belum ada produk di komplek ini.
```

### Cart

```text
Keranjang kamu masih kosong.
```

### Orders

```text
Belum ada pesanan.
```

### Chat

```text
Belum ada percakapan.
```

### Products

```text
Kamu belum memiliki produk.
```

---

# 99. LOADING STATES

Jangan membuat user melihat screen kosong.

Gunakan:

* skeleton;
* spinner;
* disabled button;
* progress indicator.

Untuk action seperti checkout:

```text
Processing...
```

Button tidak boleh bisa dipencet berkali-kali selama request berjalan.

---

# 100. DUPLICATE ACTION PROTECTION

Critical mutation harus idempotent atau memiliki protection.

Contoh:

User klik:

```text
Place Order
```

5 kali.

System tidak boleh membuat 5 order karena double click.

UI:

```text
Disable button while processing
```

Backend juga harus dirancang aman terhadap duplicate request bila memungkinkan.

---

# 101. SEARCH / PAGINATION

Product listing harus scalable.

Jangan:

```text
Fetch 100,000 products
```

ke mobile.

Gunakan:

```text
limit
offset/cursor
filters
indexes
```

sesuai kebutuhan.

---

# 102. DATABASE INDEX PRIORITY

Index terutama diperlukan untuk query:

```text
products.community_id
products.seller_id
products.category_id
products.status

orders.buyer_id
orders.seller_id
orders.community_id
orders.status

messages.conversation_id

notifications.user_id
notifications.read_at

community_members.user_id
community_members.community_id
```

Actual indexes harus mengikuti query plan dan database behavior.

Jangan membuat index random tanpa alasan.

---

# 103. API / QUERY PRINCIPLES

Query harus:

* scoped;
* minimal;
* paginated;
* authorized;
* typed;
* error handled.

Hindari:

```text
fetch everything
then filter on frontend
```

Filtering security harus terjadi di database.

---

# 104. STATE MANAGEMENT

Gunakan state management sesederhana mungkin.

Local UI state:

```text
useState
```

Server data:

Gunakan data fetching/cache mechanism yang konsisten.

Jangan membuat global state monster untuk semua data.

Cart/session/user state boleh memiliki centralized state jika memang dibutuhkan.

---

# 105. CACHING

Cache boleh digunakan untuk:

* marketplace;
* categories;
* profile.

Namun data transactional:

```text
order
stock
payment
```

harus selalu divalidasi terhadap source of truth.

Jangan menganggap cached stock sebagai stock aktual.

---

# 106. OFFLINE BEHAVIOR

MVP tidak menjanjikan full offline mode.

Jika network tidak tersedia:

```text
Show error
Allow retry
```

Jangan membuat user mengira order berhasil jika request belum diterima server.

---

# 107. LOGGING

Developer logging harus membantu debugging:

```text
Auth errors
Database errors
Order creation errors
Realtime errors
Image upload errors
```

Jangan log:

* password;
* access token;
* secret key;
* sensitive personal information.

---

# 108. ENVIRONMENT SECURITY

Never commit:

```text
.env
service role secret
private API keys
credentials
```

ke repository.

Gunakan:

```text
.env.example
```

untuk dokumentasi variable.

---

# 109. DEVELOPMENT WORKFLOW

Antigravity harus bekerja dengan pola:

```text
Read PRD
 ↓
Inspect Existing Code
 ↓
Inspect Database
 ↓
Plan Phase
 ↓
Implement
 ↓
Run Checks
 ↓
Test
 ↓
Fix
 ↓
Document
 ↓
Move to Next Phase
```

Jangan langsung rewrite seluruh project.

---

# 110. EXISTING PROJECT RULE

Jika code sudah ada:

**JANGAN menghapus atau rewrite architecture hanya karena AI punya preferensi sendiri.**

Antigravity harus:

1. inspect existing code;
2. identify reusable components;
3. identify technical debt;
4. modify only what is necessary;
5. preserve working functionality.

Jika perlu perubahan besar:

```text
Explain reason
 ↓
Define impact
 ↓
Implement incrementally
```

---

# 111. PHASE GATE

Setiap phase memiliki gate.

Contoh:

```text
PHASE 1
Database
   ↓
PASS?
   ├── NO → FIX
   └── YES
          ↓
PHASE 2
Auth
```

Jangan lanjut jika terdapat critical blocker.

---

# 112. PROGRESS TRACKING

Antigravity harus maintain:

```text
PROJECT_PROGRESS.md
```

Format:

```text
# Komplekku Development Progress

## Phase 0
Status: COMPLETE

- [x] Expo setup
- [x] Supabase connection
- [x] Environment setup

## Phase 1
Status: IN PROGRESS

- [x] Profiles
- [x] Communities
- [ ] Products
- [ ] RLS
```

Status:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
COMPLETE
```

---

# 113. CHANGE LOG

Maintain:

```text
CHANGELOG.md
```

Setiap perubahan besar:

```text
Date
Phase
Change
Reason
Impact
```

Contoh:

```text
2026-09-22

Phase: 7
Change:
Added order price snapshots.

Reason:
Historical order consistency.

Impact:
order_items stores product_name_snapshot and price_snapshot.
```

---

# 114. DECISION LOG

Jika terdapat architectural decision penting, maintain:

```text
DECISIONS.md
```

Format:

```text
Decision
Context
Options
Chosen approach
Reason
Trade-offs
```

Contoh:

```text
Decision:
Use Supabase directly instead of Express API for MVP.

Reason:
The current MVP requirements do not require a dedicated API layer.
Supabase already provides Auth, PostgreSQL, RLS, Storage and Realtime.
```

---

# 115. ANTIGRAVITY OPERATING RULES

Antigravity WAJIB mengikuti:

### Rule 1

Jangan invent fitur.

### Rule 2

Jangan bypass RLS.

### Rule 3

Jangan expose secret.

### Rule 4

Jangan duplicate business logic tanpa alasan.

### Rule 5

Jangan hardcode environment.

### Rule 6

Jangan mengubah schema tanpa migration.

### Rule 7

Jangan menganggap frontend validation sebagai security.

### Rule 8

Jangan melakukan destructive migration tanpa review.

### Rule 9

Jangan menghapus data production.

### Rule 10

Jangan membuat payment system palsu.

### Rule 11

Jangan membuat microservice architecture untuk MVP tanpa kebutuhan.

### Rule 12

Jangan melakukan massive rewrite jika incremental change cukup.

### Rule 13

Jika requirement tidak jelas, gunakan implementasi paling sederhana dan dokumentasikan asumsi.

### Rule 14

Setiap phase harus dapat diuji secara independen.

### Rule 15

Code yang sudah working harus dipertahankan kecuali ada alasan teknis yang jelas.

---

# 116. MVP SUCCESS CRITERIA

MVP dianggap berhasil secara teknis apabila:

### Authentication

* Register bekerja.
* Login bekerja.
* Logout bekerja.
* Session bekerja.

### Community

* User dapat join community.
* Data terisolasi antar community.

### Marketplace

* Product dapat dibuat.
* Product dapat ditemukan.
* Product dapat dicari.
* Product detail bekerja.

### Seller

* User dapat menjadi seller.
* Seller dapat membuat product.
* Seller dapat mengelola product.

### Cart

* Add/remove/update bekerja.
* Seller restriction bekerja.

### Order

* Checkout bekerja.
* Order dibuat.
* Stock berkurang dengan benar.
* Seller menerima order.
* Buyer melihat order.
* Status order bekerja.

### Chat

* Conversation bekerja.
* Message bekerja.
* Realtime bekerja.

### Notification

* Event penting menghasilkan notification.

### Admin

* Admin dapat melakukan moderation.
* Non-admin tidak dapat mengakses admin functionality.

### Security

* RLS bekerja.
* Cross-user access ditolak.
* Cross-community access ditolak.
* Secret tidak terekspos.

---

# 117. MVP DEFINITION

Komplekku MVP bukan sekadar:

> "Aplikasi yang bisa menampilkan produk."

MVP harus menghasilkan **closed-loop marketplace experience**:

```text
COMMUNITY
    ↓
USER
    ↓
SELLER
    ↓
PRODUCT
    ↓
BUYER
    ↓
CART
    ↓
ORDER
    ↓
SELLER PROCESSING
    ↓
CHAT / NOTIFICATION
    ↓
COMPLETED
```

Jika loop tersebut belum dapat dilakukan end-to-end, MVP belum dianggap selesai.

---

# 118. FUTURE ROADMAP

Fitur berikut dapat dipertimbangkan setelah MVP tervalidasi.

## Phase 2 Product Expansion

* payment gateway;
* digital wallet;
* delivery;
* pickup scheduling;
* seller ratings;
* buyer ratings;
* reviews;
* order cancellation policy;
* refunds.

## Community Expansion

* announcement;
* community events;
* community directory;
* lost & found;
* neighborhood discussion.

## Marketplace Expansion

* favorites;
* wishlist;
* promotions;
* vouchers;
* product variants;
* seller analytics;
* inventory management.

## Communication

* group chat;
* image messages;
* voice messages;
* richer notifications.

## Business

* premium seller;
* featured product;
* advertising;
* subscription;
* marketplace commission.

## Intelligence

* recommendations;
* semantic search;
* AI seller assistant;
* AI moderation.

Semua fitur tersebut **bukan bagian MVP**.

---

# 119. RECOMMENDED IMPLEMENTATION ORDER

Urutan final:

```text
PHASE 0
Foundation
        ↓
PHASE 1
Database
        ↓
PHASE 2
Auth
        ↓
PHASE 3
Community
        ↓
PHASE 4
Marketplace
        ↓
PHASE 5
Seller
        ↓
PHASE 6
Cart
        ↓
PHASE 7
Order
        ↓
PHASE 8
Chat
        ↓
PHASE 9
Notification
        ↓
PHASE 10
Admin
        ↓
PHASE 11
Security
        ↓
PHASE 12
QA + Release
```

---

# 120. FINAL INSTRUCTION FOR ANTIGRAVITY

**You are implementing Komplekku MVP according to this PRD.**

Treat this document as the primary product specification.

Before implementing any feature:

1. Identify the current phase.
2. Read relevant requirements.
3. Inspect the existing code.
4. Inspect the existing Supabase schema.
5. Determine dependencies.
6. Implement the smallest correct solution.
7. Do not introduce features outside the MVP.
8. Maintain database integrity.
9. Enforce authorization at the database/backend level.
10. Test the feature.
11. Update progress documentation.
12. Only then proceed to the next task.

When a requirement is ambiguous:

* do not invent a complex solution;
* prefer the simplest implementation consistent with the PRD;
* record the assumption in `DECISIONS.md`;
* preserve future extensibility where practical.

When a technical problem occurs:

```text
Inspect
 ↓
Identify root cause
 ↓
Fix smallest necessary scope
 ↓
Test
 ↓
Document if architectural
```

Do not hide errors by:

* disabling security;
* bypassing RLS;
* hardcoding credentials;
* suppressing TypeScript errors;
* deleting database constraints;
* mocking critical production behavior.

---

# 121. FINAL MVP PRODUCT MAP

```text
                    KOMPLEKKU
                        │
          ┌─────────────┴─────────────┐
          │                           │
      COMMUNITY                    ADMIN
          │                           │
     ┌────┴────┐               ┌──────┴──────┐
     │         │               │             │
   BUYER    SELLER           USERS        PRODUCTS
     │         │               │             │
     │       STORE             │          MODERATION
     │         │               │
     │      PRODUCTS           │
     │         │               │
     └────┬────┘               │
          │                    │
        CART                   │
          │                    │
       CHECKOUT                │
          │                    │
        ORDER ─────────────────┘
          │
     ┌────┴────┐
     │         │
   CHAT    NOTIFICATION
     │
     │
   REALTIME
```

---

# 122. FINAL PRODUCT PHILOSOPHY

Komplekku harus terasa seperti:

> **Marketplace kecil yang hidup di dalam sebuah komplek.**

Bukan:

> marketplace raksasa yang dipaksa punya fitur komunitas.

Prioritas MVP:

```text
COMMUNITY
    >
DISCOVERY
    >
SELLING
    >
CART
    >
ORDER
    >
COMMUNICATION
    >
ADMIN
```

Fokus utama adalah **transaction loop yang sederhana, aman, dan benar**.

Jangan mengejar jumlah fitur.

Lebih baik memiliki:

```text
10 fitur
×
benar-benar bekerja
×
aman
×
data konsisten
```

daripada:

```text
50 fitur
×
setengah matang
×
RLS berantakan
×
database kacau
```

---

# END OF PRD

**Version 1.0 — Komplekku MVP**

Status:

```text
READY FOR IMPLEMENTATION
```
