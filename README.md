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
│   │   ├── admin/           # Admin panel (login, layout, 20 halaman)
│   │   ├── components/      # Navbar, Hero, dialogs, footer, dll.
│   │   ├── context/         # AppContext (content + dialog + toast)
│   │   ├── lib/             # api client, format & image helpers
│   │   ├── pages/           # Home, Packages, Detail, About, Gallery, Articles, Contact
│   │   └── styles/          # index.css (publik) + admin.css (panel admin)
│   ├── public/assets/tours/ # foto canyon lokal
│   └── .env.example
├── server/                  # Node.js + Express
│   ├── db/
│   │   ├── schema.sql       # skema PostgreSQL + RLS
│   │   ├── migrations/      # migrasi bertahap (001_admin.sql = tabel admin)
│   │   ├── migrate.js       # runner migrasi (idempoten)
│   │   ├── setup.js         # apply schema + migrasi + seed
│   │   └── seed-data/       # sumber data awal (dipakai saat seeding)
│   ├── lib/                 # pg pool, serializer, auth, storage, notifikasi
│   ├── middleware/          # admin auth (JWT + legacy token), rate limit
│   ├── routes/              # content, bookings, contact
│   │   └── admin/           # seluruh endpoint panel admin
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
ADMIN_TOKEN=<token-rahasia-legacy>
PG_POOL_MAX=10

# --- Panel admin ---
ADMIN_JWT_SECRET=<string-random-min-16-karakter>   # menandatangani sesi admin (8 jam)
ADMIN_EMAIL=owner@example.com                      # dipakai sekali oleh db:setup
ADMIN_PASSWORD=ganti-dengan-min-8-karakter
ADMIN_NAME=Owner

# --- Upload media (Supabase Storage) — opsional ---
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=media

# --- Notifikasi (opsional) ---
RESEND_API_KEY=
MAIL_FROM=Canyoning Bali <hello@example.com>
FONNTE_TOKEN=
CRON_SECRET=<string-random>                        # dipakai Vercel cron untuk dispatch
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
npm run db:setup        # membuat tabel + migrasi + mengisi data awal ke Supabase
```

`npm run db:setup` akan membuat akun owner pertama dari `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(kalau belum ada akun admin).

Development (dua terminal):

```bash
npm run dev:server      # http://localhost:3001
npm run dev:client      # http://localhost:5173
```

Buka **http://localhost:5173** untuk situs publik, dan **http://localhost:5173/admin**
untuk panel admin.

Production (satu service):

```bash
npm run build           # build React ke client/dist
npm start               # Express menyajikan API + client/dist di :3001
```

Buka **http://localhost:3001** (publik) dan **http://localhost:3001/admin** (admin).

`npm run db:setup` aman dijalankan berulang dan **tidak menimpa konten yang sudah diedit
lewat panel admin**: seed hanya jalan saat tabel `tours` masih kosong. Untuk memaksa reset
konten ke data awal:

```bash
npm run db:seed          # = db:setup --force
```

Data `booking_requests` dan `contact_messages` tidak pernah dihapus oleh seed.

Migrasi skema admin dibungkus terpisah, jadi bisa dijalankan sendiri tanpa seed:

```bash
npm run db:migrate       # menerapkan server/db/migrations/*.sql (idempoten)
```

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
| `admin_users` | akun panel admin (bcrypt + role owner/manager/staff) |
| `audit_logs` | jejak aksi admin |
| `tour_availability` | override kapasitas / tanggal tutup per tour |
| `booking_status_history` | riwayat perubahan status booking |
| `booking_notes` | catatan internal booking |
| `media` | pustaka media (Supabase Storage) |
| `notifications` | outbox notifikasi (email/WhatsApp) |

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

### API panel admin (`/api/admin/*`)

Semua endpoint admin menerima `Authorization: Bearer <JWT admin>` (dari
`POST /api/admin/auth/login`). Token legacy `x-admin-token` tetap diterima sebagai owner
agar script lama tidak rusak.

| Grup | Endpoint |
| --- | --- |
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/password` |
| Dashboard | `GET /dashboard` |
| Bookings | `GET /bookings`, `GET /bookings/:id`, `POST /bookings`, `PATCH /bookings/:id`, `POST /bookings/:id/notes`, `GET /bookings/export.csv` |
| Availability | `GET /availability`, `PUT /availability/:tourId/:date`, `POST /availability/bulk`, `DELETE /availability/:tourId/:date` |
| Messages | `GET /messages`, `GET /messages/:id`, `PATCH /messages/:id`, `POST /messages/:id/convert-to-booking` |
| Konten | `/tours`, `/pickups`, `/reviews`, `/guides`, `/gallery`, `/articles`, `/faqs`, `/policies`, `/quiz`, `/settings` |
| Media | `GET /media`, `GET /media/config`, `POST /media/sign`, `POST /media`, `PATCH /media/:id`, `DELETE /media/:id` |
| Laporan | `GET /reports`, `GET /reports/export.csv` |
| Notifikasi | `GET /notifications`, `POST /notifications/:id/retry`, `POST|GET /notifications/dispatch` |
| Pengguna | `GET /users`, `POST /users`, `PATCH /users/:id`, `POST /users/:id/reset-password`, `DELETE /users/:id` |
| Audit | `GET /audit` |

Hak akses per role:

- **staff** — dashboard, bookings, messages.
- **manager** — staff + konten, availability, reports, settings, notifikasi.
- **owner** — semuanya + users & audit log.

Endpoint publik `GET /api/availability?tourId=...&date=...` mengembalikan sisa kapasitas
(tanpa data pribadi) dan dipakai form booking untuk menampilkan ketersediaan.

---

## 6. Panel admin

Panel admin berada di `/admin` dan **terpisah dari layout situs publik** (tanpa navbar/footer
publik). Login memakai email + password akun `admin_users`, JWT berlaku 8 jam dan disimpan di
`sessionStorage`.

### Fitur

| Halaman | Kegunaan |
| --- | --- |
| Dashboard | statistik booking/pendapatan, grafik 30 hari, tour populer, trip terdekat |
| Bookings | daftar + filter + pencarian, buat booking manual, detail, ubah status, catatan, export CSV |
| Availability | kalender kapasitas per tour, tutup tanggal, bulk update, override per tanggal |
| Messages | inbox pesan contact, tandai status, catatan internal, konversi jadi booking |
| Konten | Tours (+duplicate/reorder), Pickup points, Reviews, Guides, Gallery, Articles, FAQs, Policies, Canyon matcher |
| Media | pustaka upload (Supabase Storage) + pilih gambar |
| Reports | ringkasan booking/pendapatan per rentang tanggal + export CSV |
| Notifications | outbox email/WhatsApp, retry, kirim manual |
| Site settings | kontak, sosial media, banner pengumuman, tujuan notifikasi |
| Admin users | kelola akun & role (owner-only) |
| Audit log | riwayat aksi admin (owner-only) |

Editor artikel & kebijakan memakai textarea HTML tanpa dependency, dan semua HTML disanitasi
di server (`sanitize-html`) sebelum disimpan.

### Upload media (opsional)

Upload diaktifkan dengan mengisi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` (bucket
`media`, harus **public read**). Browser mengompres gambar ke WebP lalu upload lewat signed
URL. Kalau storage belum dikonfigurasi, tombol upload dinonaktifkan tetapi input gambar tetap
bisa memakai URL, id Pexels, atau path lokal (`/assets/...`).

### Notifikasi (opsional)

Setiap booking/contact baru serta booking yang di-`confirmed` menulis baris ke tabel
`notifications` (outbox). Pengiriman:

- **Email** — Resend (`RESEND_API_KEY`, `MAIL_FROM`).
- **WhatsApp** — Fonnte (`FONNTE_TOKEN`).
- **Reminder H-1** — otomatis diantre untuk booking `confirmed` yang berangkat besok.

Kirim outbox dari tombol **Send queued now** di halaman Notifications, atau lewat cron:

```
POST /api/admin/notifications/dispatch
Header: x-cron-secret: <CRON_SECRET>
```

Endpoint menerima header `x-cron-secret: <CRON_SECRET>` **atau** `Authorization: Bearer <CRON_SECRET>`
(Vercel cron mengirim bentuk bearer) — cukup set env `CRON_SECRET` di Vercel.

#### Penjadwal 15 menit di plan Hobby

Plan **Hobby Vercel hanya mengizinkan cron harian**, sehingga schedule `*/15 * * * *`
ditolak saat deploy. Karena itu `vercel.json` memakai schedule harian (`0 3 * * *`)
sebagai **cadangan**, sedangkan penjadwal tiap 15 menit dijalankan dari luar lewat
layanan cron gratis [cron-job.org](https://cron-job.org).

Setup sekali saja:

1. Daftar gratis di [cron-job.org](https://cron-job.org) dan login.
2. **Create cronjob**, isi:
   - **Title**: `Dispatch notifications`
   - **URL**: `https://domain-vercel-anda.vercel.app/api/admin/notifications/dispatch`
   - **Schedule**: *Every 15 minutes* (atau ekspresi `*/15 * * * *`)
   - **Request method**: `POST`
   - **Headers** (bagian *Advanced*): tambah baris
     `x-cron-secret` = `<nilai CRON_SECRET>` (harus sama dengan env di Vercel)
3. Simpan, lalu klik **Run now** untuk menguji. Respons harus
   `{"success":true,"processed":...,"sent":...,"failed":...}`.

Log eksekusi bisa dilihat di dashboard cron-job.org, sedangkan hasil dispatch
(`processed`, `sent`, `failed`) juga tampil di halaman **Notifications** admin.

> Tip: aktifkan notifikasi email di cron-job.org agar Anda diberi tahu jika penjadwal
> mulai gagal (mis. domain berubah atau `CRON_SECRET` diganti).

---

## 7. Deploy ke Vercel (full-stack)

Repo ini sudah menyertakan `vercel.json` di root agar Vercel:

1. Meng-install dependency `server/` dan `client/`.
2. Mem-build React dari `client/`.
3. Menjalankan Express sebagai serverless function di `api/[...path].js`
   (semua request `/api/*` diteruskan ke Express).

```json
{
  "installCommand": "npm --prefix server install && npm --prefix client install",
  "buildCommand": "npm --prefix client run build",
  "outputDirectory": "client/dist",
  "crons": [
    { "path": "/api/admin/notifications/dispatch", "schedule": "0 3 * * *" }
  ]
}
```

Schedule di atas **harian**, karena plan Hobby Vercel tidak mengizinkan cron lebih dari
sekali per hari. Untuk pengiriman notifikasi tiap 15 menit, pakai penjadwal gratis
**cron-job.org** — lihat bagian **Notifikasi** di atas.

Tanpa konfigurasi ini, Vercel hanya menjalankan `npm install` di root (yang tidak punya
dependency), sehingga muncul error `vite: command not found` dan `/api/*` menjadi 404.

### Environment variables yang wajib di-set di Vercel

Buka **Project → Settings → Environment Variables**, lalu tambahkan:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | `postgresql://postgres.genqdhimsibslhekxkja:PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres` |
| `ADMIN_TOKEN` | token rahasia admin legacy (bebas, string panjang) |
| `ADMIN_JWT_SECRET` | string random min 16 karakter untuk sesi admin panel |
| `CORS_ORIGIN` | `https://domain-vercel-anda.vercel.app` (opsional) |
| `SUPABASE_URL` | (opsional) untuk upload media |
| `SUPABASE_SERVICE_ROLE_KEY` | (opsional) untuk upload media |
| `RESEND_API_KEY` / `MAIL_FROM` | (opsional) notifikasi email |
| `FONNTE_TOKEN` | (opsional) notifikasi WhatsApp |
| `CRON_SECRET` | string random untuk mengamankan cron dispatch |

> Akun owner pertama dibuat lewat `npm run db:setup` secara lokal (dari `ADMIN_EMAIL` /
> `ADMIN_PASSWORD`). Di Vercel tidak perlu `ADMIN_PASSWORD`; login-kan akun yang sudah ada.
> Jika lupa password, owner bisa mereset dari halaman **Admin users**.

Nilai `DATABASE_URL` harus memakai **pooler IPv4** (host `aws-1-ap-northeast-2.pooler.supabase.com`),
bukan host `db.*.supabase.co` yang hanya IPv6. Jangan menambahkan `?sslmode=require`.

Setelah menambah environment variable, lakukan **Redeploy**. Tidak perlu mengubah
`VITE_API_BASE_URL`: frontend otomatis memanggil `/api` di domain yang sama.

Cek setelah deploy:

```
https://domain-vercel-anda.vercel.app/api/health
```

Harus mengembalikan `{"status":"ok","database":"connected",...}`.

### Troubleshooting

| Gejala | Penyebab & solusi |
| --- | --- |
| `connect ECONNREFUSED 127.0.0.1:5432` | `DATABASE_URL` tidak terbaca saat runtime. Tambahkan env di Vercel, centang environment **Production** (dan **Preview** jika memakai preview URL), lalu **Redeploy**. |
| `/api/health` → `database: "not_configured"` | Sama seperti di atas — env belum masuk ke deployment. Environment variable baru hanya berlaku setelah redeploy. |
| `/api/health` → `database: "unavailable"` | URL ada tetapi koneksi gagal. Pastikan memakai host pooler IPv4, user `postgres.<project-ref>`, dan tanpa `?sslmode=require`. |
| `/api/*` → 404 | Pastikan folder `api/[...path].js` ikut ter-push dan redeploy dari commit terbaru. |

Server juga menerima env bawaan integrasi Supabase/Vercel (`POSTGRES_URL`, `POSTGRES_PRISMA_URL`,
`SUPABASE_DB_URL`, atau kombinasi `POSTGRES_HOST`/`POSTGRES_USER`/`POSTGRES_PASSWORD`), tetapi
`DATABASE_URL` tetap yang paling disarankan.

Alternatif single-service di VPS/Render: build client lalu jalankan `npm --prefix server start`
— Express otomatis menyajikan `client/dist`.

---

## 8. Yang berubah dari versi lama

- Semua konten dipindahkan dari `client/src/data/*` ke tabel Supabase.
- Form booking tidak lagi menulis langsung dari browser ke Supabase; sekarang melalui API
  `POST /api/bookings` yang memvalidasi input dan menghitung total.
- Ditambahkan halaman **detail paket** (`/packages/:id`) yang sebelumnya link-nya belum ada route-nya.
- Bug JSX pada About, Contact, dan Gallery diperbaiki.
- Dialog booking, artikel, dan quiz sekarang dikelola lewat React context, bukan variable global
  `window.__open*`.
- Tema gelap/terang, bottom navigation mobile, reveal animation, dan toast tetap dipertahankan.