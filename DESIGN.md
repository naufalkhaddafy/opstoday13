# DESIGN.md

Panduan arah desain (*Design Direction*) untuk proyek **opstoday13**.
File ini berfungsi sebagai **sumber arah (*direction*)** identitas visual, sedangkan **antislop** bertindak sebagai **penyaring (*filter*)** kualitas output AI.

---

## 1. Identitas & Kepribadian (Identity & Personality)

- **Produk:** Sistem Otomasi Workflow & Manajemen Dokumen / Tiket Operasional Internal.
- **Karakter:** Profesional, lugas, efisien, kokoh, dan berorientasi data lapangan.
- **Kesan Visual:** Bersih, terstruktur dengan rapi (*craftsmanship*), tanpa dekorasi palsu atau elemen tren kecerdasan buatan yang berlebihan.

---

## 2. Palet Warna (Brand Palette: b-hero)

Semua komponen antarmuka publik maupun admin menggunakan identitas warna b-hero yang didefinisikan terpusat di `@/lib/brand`.

| Token | Nilai Hex / OKLCH | Peran & Penggunaan |
|-------|-------------------|-------------------|
| `BRAND.dark` | `#1B5E20` | Hijau tua — Status selesai (*completed*), sidebar primer gelap |
| `BRAND.mid` | `#2E7D32` | Hijau utama — Tombol aksi utama (CTA), ikon section, aksen primer |
| `BRAND.light` | `#4CAF50` | Hijau terang — Status berjalan (*in progress*), kehadiran (*present*) |
| `BRAND.yellow` | `#FDD835` | Kuning aksen — Status tertunda (*pending*), sorotan peringatan |
| `BRAND.black` | `#0a0a0a` | Hitam murni — Titik awal gradien header b-hero |

### Warna Semantik & Pendukung
- **Destructive/Error:** Merah / Rose (`oklch(0.577 0.245 27.325)`) — aksi bahaya, tiket ditolak/batal.
- **Neutral/Surface:** 
  - Light mode: Pure white (`#ffffff` / `oklch(1 0 0)`), border abu-abu netral halus (`oklch(0.922 0 0)`).
  - Dark mode: Dark slate (`oklch(0.145 0 0)`), border kontras terkalibrasi (`oklch(0.269 0 0)`).
- **Status Tiket:** Gunakan selalu komponen reusable `<TicketStatusBadge />` dari `@/components/shared/TicketStatusBadge`.

---

## 3. Tipografi (Typography)

- **Font Utama:** `Instrument Sans`, sans-serif modern yang terbaca jelas dan formal.
- **Hirarki:**
  - `H1 / Page Title`: Text-xl hingga 2xl, semi-bold/bold, tracking rapat alami.
  - `Card Title`: Text-lg / xl, font-semibold.
  - `Body / Konten`: Text-sm hingga base, warna teks utama (`foreground`).
  - `Label / Keterangan`: Text-xs / sm, muted foreground (`text-muted-foreground`).
- **Larangan (Anti-slop R-06):** Tidak menggunakan font monospace berukuran besar untuk judul bergaya terminal palsu, dan tidak menggunakan *extreme uppercase letter-spacing* tanpa fungsi hirarki.

---

## 4. Tata Letak & Ritme Komposisi (Layout & Section Rhythm)

### Halaman Daftar / Index
- Menggunakan wrapper standar: `flex h-full flex-1 flex-col gap-4 p-4`.
- Header menggunakan `BRAND_PAGE_HEADER` dengan ikon dalam wadah `BRAND_ICON_BOX`.
- Area konten berisi tabel data atau daftar tiket dengan status jelas dan aksi navigasi riil.

### Halaman Form (Create / Edit)
- Wrapper berpusat: `max-w-4xl mx-auto w-full`.
- **Tombol Kembali:** Selalu di kanan atas `CardHeader` menggunakan tombol outline berikon panah kembali.
- **Tombol Simpan:** Di kanan bawah formulir, ditempatkan setelah garis pemisah (`border-t pt-6 mt-6`). Dilarang memakai `CardFooter` untuk aksi formulir.

### Bentuk & Sudut (Border Radius)
- Radius standar: `--radius: 0.625rem` (`rounded-lg` / `rounded-xl` konsisten).
- Hindari membuat seluruh elemen berbentuk kapsul/pill (tombol, card, input). Bentuk kapsul hanya dikhususkan untuk status badges.

---

## 5. Dials Liveliness (Antislop Calibration - R-37)

Untuk menjaga tampilan tetap hidup namun tidak terjebak dalam gaya AI generik:

- **ENERGY (Skala 1-3): `2`**
  - Antarmuka kerja produktivitas operasional yang tegas, kontras warna hijau b-hero yang terarah, tanpa warna neon acak.
- **RHYTHM (Skala 1-3): `2`**
  - Ritme tata letak terstruktur dengan pemisahan informasi yang jelas antara filter, tabel data, dan kartu metrik operasional.
- **MOTION (Skala 1-3): `1`**
  - Mikro-interaksi subtil dan fungsional (hover tombol, transisi dialog/dropdown), tanpa animasi melayang (*floating*) atau *fade-up* berlebihan pada setiap kartu.

---

## 6. Standar Aksesibilitas & Kontras (Craftsmanship)

- Semua teks memenuhi standar kontras **WCAG AA** (rasio minimal 4.5:1 untuk teks normal).
- Indikator fokus (`ring-ring`) selalu terlihat saat navigasi keyboard (`Tab`, `Shift+Tab`).
- Semua kontrol interaktif (tombol, dropdown, modal) memiliki fungsi nyata dan dapat dioperasikan penuh dengan keyboard.
