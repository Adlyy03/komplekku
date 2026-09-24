# Komplekku

Aplikasi manajemen kompleks perumahan berbasis Expo/React Native.

## Development (tanpa Docker)

```bash
npm install
npx expo start
```

## Development dengan Docker

### Prerequisites
- Docker Engine ≥ 24
- Docker Compose v2
- HP Android & komputer di jaringan Wi-Fi yang sama
- File `.env` sudah terisi (lihat `.env.example`)

### Setup pertama kali

```bash
# Build image
docker compose build

# Jalankan dev server (LAN mode, untuk Android di Wi-Fi sama)
docker compose up
```

QR code muncul di terminal. Scan dengan Expo Go di HP Android.

### Commands

```bash
# Start dev server
docker compose up

# Start di background (detached)
docker compose up -d

# Lihat logs (jika detached)
docker compose logs -f expo

# Stop server
docker compose down

# Masuk shell container
docker compose exec expo sh

# Rebuild image (setelah ubah package.json)
docker compose build --no-cache
```

### Mode tunnel (jika Android tidak bisa connect via LAN)

Gunakan tunnel mode jika:
- HP dan komputer beda jaringan
- LAN mode tidak berhasil
- Di balik corporate firewall

```bash
# Jalankan tunnel mode
docker compose --profile tunnel up expo-tunnel
```

Tunnel menggunakan ngrok/Expo proxy, tidak perlu jaringan sama.

### Cara membuka dari Android (Expo Go)

1. Install **Expo Go** dari Play Store
2. HP & laptop harus terhubung ke Wi-Fi yang sama
3. `docker compose up`
4. Tunggu QR code muncul di terminal
5. Buka Expo Go → scan QR code

### Troubleshooting network

**QR code tidak muncul:**
```bash
# Pastikan terminal support TTY
docker compose up  # bukan -d
```

**HP tidak bisa connect:**
1. Pastikan sama Wi-Fi (bukan mobile data)
2. Coba tunnel mode: `docker compose --profile tunnel up expo-tunnel`
3. Cek firewall — port 8081 harus open di komputer

**Metro bundler error:**
```bash
# Reset cache
docker compose exec expo npx expo start --clear
```

**Setelah update `package.json`:**
```bash
docker compose build
docker compose up
```

## Environment Variables

Buat file `.env` di root project:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Struktur Project

- `src/app/` — Routes (Expo Router file-based routing)
- `src/` — Components, hooks, utils
- `assets/` — Images, fonts
- `supabase/` — Database migrations & config
