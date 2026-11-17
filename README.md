# Canyoning Bali — React + Node.js + Supabase

Aplikasi website canyoning yang sebelumnya berupa satu file `index.html` kini sudah dikonversi menjadi:

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router
- **Backend**: Node.js + Express (REST API)
- **Database**: Supabase PostgreSQL (diakses dari server memakai `pg` / direct connection)
- **Deploy**: satu service — Express menyajikan API dan hasil build React sekaligus

Data tours, pickup, review, guide, galeri, artikel, FAQ, kebijakan, dan quiz sekarang **berasal dari database**, bukan file statis di frontend. Form booking dan contact juga tersimpan ke database.

---

## 1. Struktur folder

```
pariwisata/
├── client/                  # React + Vite
│   ├── src/
│   │   ├── components/      # Navbar, Hero, dialogs, footer, dll.
│   │   ├── context/         # AppContext (content + dialog + toast)
│   │   ├── lib/             # api client, format & image helpers
│   │   ├── pages/           # Home, Packages, Detail, About, Gallery, Articles, Contact
│   │   └── styles/index.css
│   ├── public/assets/tours/ # foto canyon lokal
│   └── .env.example
├── server/                  # Node.js + Express
│   ├── db/
│   │   ├── schema.sql       # skema PostgreSQL + RLS
│   │   ├── setup.js         # apply schema + seed
│   │   └── seed-data/       # sumber data awal (dipakai saat seeding)
│   ├── lib/                 # pg pool, serializer, helper
│   ├── middleware/          # admin auth, rate limit
│   ├── routes/              # content, bookings, contact
│   ├── index.js
│   └── .env.example
├── index.html               # file lama (arsip, tidak dipakai aplikasi baru)
└── package.json             # script helper
```

---

## 2. Konfigurasi database

### Direct connection

Format resmi Supabase:

```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

Untuk project ini:

```
postgresql://postgres:pariwisata123@db.genqdhimsibslhekxkja.supabase.co:5432/postgres
```

> String yang diberikan (`postgresql://postgres:pariwisata123.genqdhimsibslhekxkja.supabase.co:5432/postgres`)
> kehilangan `@` dan awalan `db.`. Format yang benar adalah seperti di atas.

**Catatan penting:** host `db.<ref>.supabase.co` saat ini hanya punya record **IPv6**. Dari jaringan
yang tidak mendukung IPv6, koneksi akan gagal (`Network is unreachable`). Karena itu konfigurasi
`.env` di repo ini memakai **Supavisor pooler** (IPv4) yang region-nya sudah terdeteksi otomatis:

```
postgresql://postgres.genqdhimsibslhekxkja:pariwisata123@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

- Port `5432` = session mode (dipakai untuk migrasi/seeding).
- Port `6543` = transaction mode (opsional untuk API produksi).
- Jangan menambahkan `?sslmode=require` pada URL karena driver `pg` versi ini akan memaksa
  verifikasi sertifikat dan gagal dengan *self-signed certificate*. TLS sudah diatur di
  `server/lib/db.js` (`ssl: { rejectUnauthorized: false }`).

Login pooler memakai user `postgres.<project-ref>`, bukan `postgres`.

### Env server

`server/.env` (sudah dibuat, jangan di-commit):

```env
DATABASE_URL=postgresql://postgres.genqdhimsibslhekxkja:PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
PORT=3001
CORS_ORIGIN=http://localhost:5173
ADMIN_TOKEN=<token-rahasia>
PG_POOL_MAX=10
```

### Env client

`client/.env`:

```env
VITE_API_BASE_URL=/api
```

Saat development, Vite mem-proxy `/api` ke `http://localhost:3001` (lihat `client/vite.config.js`).

---

## 3. Menjalankan aplikasi

Pertama kali:

```bash
npm run install:all
npm run db:setup        # membuat tabel + mengisi data awal ke Supabase
```

Development (dua terminal):

```bash
npm run dev:server      # http://localhost:3001
npm run dev:client      # http://localhost:5173
```

Buka **http://localhost:5173**.

Production (satu service):

```bash
npm run build           # build React ke client/dist
npm start               # Express menyajikan API + client/dist di :3001
```

Buka **http://localhost:3001**.

`npm run db:setup` aman dijalankan berulang: konten di-upsert/di-reset, sedangkan data
`booking_requests` dan `contact_messages` **tidak dihapus**.

---

## 4. Skema database

Tabel utama:

| Tabel | Isi |
| --- | --- |
| `site_settings` | nama brand, telepon, email, alamat, jam, sosial media |
| `tours` | 4 canyon, harga, itinerary (JSONB), inclusions, requirements, dll. |
| `pickups` | titik jemput + biaya |
| `reviews` | review tamu |
| `guides` | profil guide |
| `gallery` | foto galeri |
| `articles` | artikel journal (HTML body) |
| `faqs` | pertanyaan umum |
| `policies` | privacy, terms, cancellation |
| `quiz_questions` | pertanyaan canyon matcher |
| `booking_requests` | permintaan booking dari form |
| `contact_messages` | pesan dari form contact |

Semua tabel memakai **RLS enabled** dan akses `anon`/`authenticated` dicabut. Hanya server
(yang terhubung sebagai user `postgres`) yang bisa membaca/menulis.

---

## 5. API

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/health` | status server + database |
| GET | `/api/content` | semua konten sekaligus (dipakai frontend) |
| GET | `/api/tours` | daftar tour |
| GET | `/api/tours/:id` | detail tour |
| GET | `/api/pickups` | titik jemput |
| GET | `/api/reviews` | review |
| GET | `/api/guides` | guide |
| GET | `/api/gallery` | galeri |
| GET | `/api/articles` | artikel |
| GET | `/api/articles/:slug` | detail artikel |
| GET | `/api/policies/:slug` | privacy / terms / cancellation |
| POST | `/api/bookings` | buat booking request (publik, rate limited) |
| GET | `/api/bookings` | daftar booking (butuh `x-admin-token`) |
| PATCH | `/api/bookings/:id` | ubah status booking (butuh `x-admin-token`) |
| POST | `/api/contact` | kirim pesan contact (publik, rate limited) |
| GET | `/api/contact` | daftar pesan (butuh `x-admin-token`) |

Contoh admin request:

```bash
curl http://localhost:3001/api/bookings \
  -H "x-admin-token: $(grep '^ADMIN_TOKEN=' server/.env | cut -d= -f2)"
```

Harga booking dihitung ulang di server dari harga tour + biaya pickup di database, jadi
client tidak bisa memanipulasi total.

---

## 6. Yang berubah dari versi lama

- Semua konten dipindahkan dari `client/src/data/*` ke tabel Supabase.
- Form booking tidak lagi menulis langsung dari browser ke Supabase; sekarang melalui API
  `POST /api/bookings` yang memvalidasi input dan menghitung total.
- Ditambahkan halaman **detail paket** (`/packages/:id`) yang sebelumnya link-nya belum ada route-nya.
- Bug JSX pada About, Contact, dan Gallery diperbaiki.
- Dialog booking, artikel, dan quiz sekarang dikelola lewat React context, bukan variable global
  `window.__open*`.
- Tema gelap/terang, bottom navigation mobile, reveal animation, dan toast tetap dipertahankan.