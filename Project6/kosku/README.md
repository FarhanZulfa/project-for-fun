# 🏠 KosKu — Modern Boarding House Management & Resident Portal

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**KosKu** adalah platform web terpadu untuk tata kelola operasional kos-kosan modern dan portal hunian bagi calon maupun penghuni aktif. Dirancang khusus untuk mempermudah pemilik atau keluarga pengelola memantau hunian, mencatat arus kas (pemasukan & pengeluaran), membagikan kuitansi digital, serta memberikan kemudahan calon penyewa menjelajahi kamar dan melakukan booking via WhatsApp secara instan.

Dibangun dengan prinsip **Impeccable Design & Craft Floor UX** — tata letak elegan, visual SVG custom (bebas emoji mentah), performa tinggi, dan navigasi responsif ramah jempol (*mobile thumb-friendly*).

---

## 🌟 Fitur Utama

### 1. 🌐 Website Publik & Katalog Hunian (`/`)
- **Hero & Ketersediaan Real-Time**: Status kamar siap huni langsung diperbarui dari database.
- **Katalog Kamar Interaktif**: Filter berdasarkan tipe (AC / Kipas) dan status (Tersedia / Terisi / Perbaikan).
- **1-Klik Survey & Booking WA**: Calon penyewa dapat langsung mengirim pesan WhatsApp berformat otomatis untuk survei kamar yang dipilih.
- **Fasilitas Bersama & Lokasi**: Menampilkan daftar fasilitas lengkap (WiFi, Dapur, Parkir Kanopi, Mesin Cuci) dan aturan tata tertib hunian.

### 2. 💳 Portal Mandiri Cek Tagihan Penyewa (`/cek-tagihan`)
- **Pencarian Kamar Instan**: Penghuni cukup memilih nomor kamar mereka untuk melihat rincian tagihan berjalan (Sewa, Listrik, Air).
- **Status Transparan**: Indikator jelas untuk status *Lunas*, *Belum Bayar*, atau *Telat* beserta tanggal jatuh tempo.
- **Salin Rekening & Konfirmasi Cepat**: Tombol 1-klik untuk menyalin nomor rekening resmi pengelola (BCA / Mandiri) dan tombol kirim bukti transfer ke WhatsApp pemilik.
- **Akses Kuitansi Mandiri**: Penghuni dapat langsung mengunduh/mencetak kuitansi resmi atas pembayaran yang telah lunas.

### 3. 📊 Dashboard Finansial & Operasional (`/dashboard`)
- **Kartu Metrik Eksekutif**: Tingkat okupansi kamar, total penerimaan lunas, total tunggakan sewa, biaya operasional, dan estimasi **Keuntungan Bersih (Laba Bersih)** bulan berjalan.
- **Grafik Komposisi Penerimaan**: Visualisasi Recharts interaktif yang memecah pendapatan dari pos Sewa, Listrik, dan Air.
- **Daftar Prioritas Jatuh Tempo**: Peringatan otomatis untuk tagihan yang akan jatuh tempo dalam 3 hari ke depan (dengan tombol cepat *Ingatkan via WA*).
- **Daftar Tunggakan Aktif**: Monitoring keterlambatan bayar dengan shortcut aksi *Tagih WA* dan tombol *1-Tap Lunas*.
- **Slot Kamar Kosong**: Akses cepat kamar kosong untuk langsung dialokasikan ke penyewa baru.

### 4. 🚪 Manajemen Kamar & Riwayat Servis (`/kamar`)
- **Grid Visual 20+ Kamar**: Pewarnaan kartu status intuitif (Hijau = Kosong, Biru = Terisi, Kuning = Perbaikan).
- **Ubah Status 2-Tap**: Kemudahan mengubah status kamar secara instan tanpa perlu masuk ke form yang rumit.
- **Riwayat Penghuni (Alumni)**: Rekap histori penghuni terdahulu yang pernah menempati kamar tersebut.
- **Riwayat Servis & Biaya Perbaikan**: Catatan pemeliharaan AC, pengecatan dinding, atau perbaikan fasilitas per kamar untuk evaluasi aset.
- **Export Data Kamar**: Fitur unduh rekap data kamar ke format CSV.

### 5. 👥 Manajemen Penyewa & Siklus Sewa (`/penyewa`)
- **Pencatatan Lengkap**: Nama, kontak WhatsApp, nomor darurat, tanggal mulai sewa, durasi sewa, dan status aktif.
- **Sinkronisasi Otomatis**: Menambah penyewa otomatis mengubah status kamar menjadi *Terisi*.
- **Alur Checkout / Selesai Sewa**: Proses keluar penghuni yang aman (soft-delete), otomatis mengembalikan status kamar menjadi *Kosong* siap huni.
- **Tab Riwayat (Alumni) & Daftar Ulang**: Memantau mantan penghuni dan memfasilitasi proses check-in ulang bila mereka menyewa kembali.
- **Export Data Penyewa**: Unduh laporan rekapitulasi penyewa ke spreadsheet CSV.

### 6. 🧾 Pembayaran, Tagihan & Kuitansi Digital (`/pembayaran`)
- **Input Tagihan Fleksibel**: Mendukung komponen sewa, token/tagihan listrik, dan iuran air.
- **1-Tap Tandai Lunas**: Pelunasan cepat langsung dari daftar dengan auto-update status kas.
- **Kuitansi Digital Resmi**: Menghasilkan lembar kuitansi resmi berstandar bisnis lengkap dengan nomor transaksi unik, tanggal, perincian pos, status lunas, teks terbilang rupiah otomatis, dan format tanda tangan digital.
- **Export CSV Pembayaran**: Unduh pembukuan transaksi untuk arsip bulanan.

### 7. 📉 Pengeluaran & Laporan Laba-Rugi (`/pengeluaran`)
- **Pencatatan Beban Operasional**: Kategori lengkap (Listrik & Air Umum, Kebersihan & Sampah, Keamanan, Perbaikan & Perawatan, Internet/WiFi, Gaji Pengurus, Lain-lain).
- **Laporan Laba-Rugi Kasar**: Komparasi pendapatan bersih vs total beban operasional dengan margin keuntungan bersih.
- **Grafik Tren Finansial 6 Bulan**: Grafik batang ganda Recharts memantau histori pergerakan pemasukan vs pengeluaran.
- **1-Tap Salin Ringkasan WA**: Format ringkasan teks otomatis yang siap dikirimkan ke grup chat keluarga pengelola.
- **Cetak Laporan Format A4**: Halaman cetak laporan keuangan yang otomatis rapi dalam format cetak standar kertas dokumen.

### 8. 👨‍👩‍👧 Multi-User & Hak Akses Keluarga (`/pengaturan`)
- **Admin**: Akses penuh mengelola kamar, penyewa, keuangan, input pengeluaran, dan manajemen akun.
- **Viewer**: Mode baca aman (read-only) untuk anggota keluarga lain yang hanya ingin memantau laporan tanpa risiko mengubah data secara tidak sengaja.
- **Profil & Panduan Kolaborasi**: Pengaturan profil pemilik dan panduan penambahan akun keluarga baru.

---

## 🛠️ Arsitektur & Teknologi

| Layer | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3 (Turbopack) | App Router, Server Components & Client Hooks |
| **UI Library** | React 19 + Tailwind CSS v4 | Clean custom CSS tokens & responsif |
| **Database** | Supabase (PostgreSQL) | Managed database, Auth, RLS Policies |
| **Charts** | Recharts 3.x | Visualisasi grafik keuangan interaktif |
| **Forms & Validation**| React Hook Form + Zod | Validasi data client-side yang aman dan cepat |
| **Icons** | Custom Authored SVGs | 35+ komponen ikon modular bebas AI-slop |
| **Date Utility** | date-fns 4.x | Format penanggalan standar Indonesia (id locale) |

---

## 🚀 Panduan Memulai (Local Setup)

### 1. Clone Repository
```bash
git clone https://github.com/FarhanZulfa/kos.git
cd kos
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Salin file template `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Buka file `.env.local` dan masukkan kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Setup Database Supabase
Jalankan file SQL yang tersedia di folder `supabase/` pada **Supabase SQL Editor**:
1. **`supabase/schema.sql`**: Membuat tabel `rooms`, `tenants`, `payments`, `profiles`, fungsi trigger RLS, serta data awal (seed) 20 kamar.
2. **`supabase/fase2_expenses.sql`**: Menambahkan tabel `expenses` untuk pencatatan pengeluaran operasional dan kebijakan keamanannya.

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## 📂 Struktur Direktori

```text
kos/
├── app/
│   ├── (app)/                   # Halaman portal internal pengelola (terproteksi auth)
│   │   ├── dashboard/           # Dashboard ringkasan okupansi, kas & tunggakan
│   │   ├── kamar/               # Manajemen 20 kamar, detail & riwayat servis
│   │   ├── pembayaran/          # Catatan tagihan, pelunasan & kuitansi
│   │   ├── pengaturan/          # Profil & manajemen peran pengguna (Admin/Viewer)
│   │   ├── pengeluaran/         # Pembukuan beban operasional & laporan laba-rugi
│   │   ├── penyewa/             # Pengelolaan penghuni aktif, checkout & alumni
│   │   └── layout.tsx           # Layout internal dengan navigasi desktop & mobile
│   ├── cek-tagihan/             # Portal publik mandiri untuk pengecekan tagihan penyewa
│   ├── login/                   # Halaman autentikasi masuk & daftar akun pengelola
│   ├── globals.css              # Design tokens, styling A4 print & CSS kustom
│   ├── layout.tsx               # Root layout dengan font Fraunces & Public Sans
│   └── page.tsx                 # Landing page publik & katalog kamar untuk calon penyewa
├── components/
│   ├── kamar/                   # Komponen card kamar, modal formulir, & modal detail
│   ├── pembayaran/              # Modal input pembayaran, pelunasan & kuitansi resmi
│   ├── pengeluaran/             # Modal form pengeluaran & format lembar cetak laporan
│   ├── penyewa/                 # Modal pendaftaran penyewa & modal checkout hunian
│   ├── public/                  # Header publik, katalog interaktif, & footer hunian
│   └── shared/                  # Komponen navigasi, modal wrapper, & library 35+ SVG icons
├── lib/
│   ├── context/                 # Context global autentikasi & role user
│   ├── supabase/                # Client, Server, & Middleware Supabase
│   ├── export-utils.ts          # Utilitas pembuatan CSV & fungsi terbilang rupiah
│   └── utils.ts                 # Formatter mata uang (Rupiah), tanggal, dsb.
├── supabase/
│   ├── schema.sql               # Skema utama DB (Rooms, Tenants, Payments, Profiles)
│   └── fase2_expenses.sql       # Skema tabel Expenses & index keuangan
├── types/
│   └── database.ts              # Definisi TypeScript untuk seluruh entitas database
├── .env.example                 # Template konfigurasi environment
├── middleware.ts                # Proteksi rute publik vs rute internal pengelola
└── package.json                 # Dependensi & skrip Next.js
```

---

## 📱 Desain Responsif & Impeccable UX
- **Mobile Thumb-Friendly**: Seluruh form input, modal, dan bottom-bar navigation memiliki target sentuh minimal 44px dengan `touch-manipulation`.
- **Aksesibilitas Tinggi**: Lengkap dengan atribut ARIA semantic (`tablist`, `tab`, `aria-label`, `aria-current="page"`).
- **Zero AI-Slop Icons**: Tidak memakai icon generik mentah atau platform-dependent emoji pada antarmuka utama; seluruh visual menggunakan SVG berbobot seimbang.
- **Dark/Light Harmony**: Menggunakan palet warm earth & amber yang nyaman di mata untuk pemakaian jangka panjang.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi **MIT**. Bebas digunakan, dipelajari, dan dikembangkan lebih lanjut.
