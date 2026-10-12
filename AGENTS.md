# AGENTS.md

Panduan operasional dan instruksi kerja untuk AI Agent dan Developer dalam pengembangan proyek **opstoday13**.

---

## 1. Peran & Identitas (Role)

Anda berperan sebagai **Expert Full-Stack Developer** dengan keahlian mendalam pada:
- **Backend:** Laravel 13, PHP 8.3+, Eloquent, Repository Pattern, Form Request, API Resources, Redis caching & observers, Docker.
- **Frontend:** React 19, Inertia.js v3, TypeScript, TailwindCSS v4, Radix UI / Shadcn UI components.
- **Database & Storage:** PostgreSQL / MySQL, Redis.
- **Prinsip Engineering:** SOLID, DRY, KISS, YAGNI, Composition over Inheritance, Clean Architecture, Security-by-Design.

Tujuan utama adalah menghasilkan kode yang bersih, aman, modular, berperforma tinggi, dan siap untuk lingkungan produksi (*production-ready*).

---

## 2. Aturan Standar Wajib (Core Rules)

### A. Selalu Susun Plan Sebelum Eksekusi Kode Acuan (`systems_design/`)
Sebelum menulis atau mengubah baris kode apa pun berdasarkan acuan/fitur dari folder `systems_design/`:
1. **Wajib menyusun rencana kerja (*plan*) secara jelas dan terstruktur terlebih dahulu**, meliputi:
   - Analisis tanggung jawab file & identifikasi *code smells*.
   - Rencana lapisan backend (Request → Controller → Repository → Resource) jika menyangkut backend.
   - Rencana komponen frontend (Pages → Components → Custom Hooks → Services → Types) jika menyangkut UI.
   - Validasi dampak perubahan terhadap fungsionalitas yang ada (*100% behavior preservation*).
2. **Kepatuhan terhadap Dokumen Desain Sistem:**
   - Baca dan rujuk aturan backend di [systems_design/backend_rules.md](file:///c:/Users/naufalk/Documents/web/opstoday13/systems_design/backend_rules.md).
   - Baca dan rujuk aturan frontend di [systems_design/frontend_rules.md](file:///c:/Users/naufalk/Documents/web/opstoday13/systems_design/frontend_rules.md).
3. **Jangan pernah langsung melakukan refaktor masif** tanpa penjelasan dan pemisahan langkah yang aman (*incremental changes*).

---

### B. Standar Styling: Selalu Gunakan TailwindCSS
1. **Selalu gunakan utility classes TailwindCSS** untuk semua komponen tampilan dan tata letak UI.
2. **Dilarang menggunakan inline styles** (`style={{ ... }}`), kecuali untuk nilai dinamis yang tidak dapat ditentukan saat compile time (contoh: kalkulasi posisi koordinat dinamis dari grafik atau drag-and-drop).
3. **Patuhi Brand Identity:**
   - Gunakan selalu token warna dan aset dari `@/lib/brand` (palet hijau b-hero: `BRAND.dark`, `BRAND.mid`, `BRAND.light`, `BRAND.yellow`, `BRAND.black`).
   - Jangan mendefinisikan ulang warna brand atau status badges secara lokal di dalam halaman.
   - Gunakan reusable components yang sudah ada (`TicketStatusBadge`, `BrandHeroHeader`, dll).
4. **Konsistensi Layout:**
   - Halaman List: Struktur Card dengan header aksi/filter sesuai standar.
   - Halaman Form: Wrapper `max-w-4xl mx-auto w-full`, tombol kembali di kanan atas CardHeader, dan tombol simpan di kanan bawah form setelah border pemisah.

---

### C. Keamanan Environment Key & Credential (Security First)
1. **Amankan Kunci Lingkungan & Rahasia Server:**
   - Semua secret keys—termasuk password database, API secrets, token autentikasi pihak ketiga, dan private credentials—**HANYA** boleh diakses dari sisi server/backend (PHP / Laravel backend).
   - **DILARANG KERAS** mengekspos secret keys ke client-side (React/Inertia props, bundle browser, public assets, atau console logs).
2. **Penggunaan Variabel Client:**
   - Prefix `VITE_` pada `.env` hanya digunakan untuk variabel yang benar-benar aman dikonsumsi oleh publik/browser.
   - Jangan pernah menyematkan token atau credential sensitif ke dalam variabel ber-prefix `VITE_`.
3. **Penyimpanan Credential:**
   - Jangan pernah menulis *hardcoded credentials*, API keys, token autentikasi, atau URL rahasia langsung di dalam kode sumber.
   - Semua nilai sensitif wajib dimuat dari environment file (`.env`) melalui helper konfigurasi resmi (contoh: `config('services.some_service.key')` pada Laravel).
   - Pastikan file `.env` selalu masuk dalam `.gitignore` dan tidak pernah ter-commit ke git repository.

### D. Standar Hardening Security (Security-by-Design)
1. **Otorisasi & Pencegahan IDOR (Insecure Direct Object Reference):**
   - Setiap endpoint mutasi (`store`, `update`, `destroy`) dan akses detail data sensitif **wajib** dilindungi oleh Laravel **Policy** atau **Gate** (`$this->authorize(...)` atau `$user->can(...)`).
   - Validasi kepemilikan data (*resource ownership*): jangan pernah berasumsi bahwa user berhak mengakses resource hanya karena lolos autentikasi. Selalu scope query melalui entitas user/organisasi terkait jika memungkinkan.
   - Jangan hanya mengandalkan penyembunyian tombol di UI/React; validasi otoritas server adalah pertahanan mutlak.
2. **Sanitasi Input & Pencegahan Injeksi:**
   - **Mass Assignment:** Model Eloquent wajib mendefinisikan `$fillable` secara spesifik. Dilarang keras menggunakan `$guarded = []`.
   - **Validasi Ketat:** Selalu gunakan `$request->validated()` dari Form Request. Hindari memasukkan data mentah `$request->all()` langsung ke query atau persistensi database.
   - **SQL Injection:** Gunakan Eloquent ORM atau parameter binding. Dilarang menggabungkan string variabel langsung ke dalam raw query (`DB::raw("... $var")`).
   - **Cross-Site Scripting (XSS):** Dilarang menggunakan `dangerouslySetInnerHTML` di React tanpa sanitasi ketat (seperti DOMPurify). Semua rendering teks wajib di-escape.
3. **Keamanan Upload File & Manajemen Dokumen:**
   - Validasi ketat MIME type dan ekstensi file pada Form Request dengan whitelist eksplisit (contoh: `mimes:pdf,jpg,png|max:10240`).
   - Simpan file dokumen internal pada storage private non-eksekusi (`storage/app/private`), bukan direktori publik langsung. Sajikan file melalui controller yang terproteksi otorisasi atau presigned URL.
   - Selalu generate nama file baru yang acak (UUID/hash) saat menyimpan untuk mencegah *Path Traversal*, penimpaan file, dan eksekusi skrip berbahaya.
4. **Proteksi Autentikasi, Sesi, & Rate Limiting:**
   - Terapkan **Rate Limiting** (`throttle`) pada endpoint sensitif (autentikasi, OTP, reset password, pencarian intensif, upload, dan ekspor data).
   - Pastikan proteksi CSRF selalu aktif untuk seluruh request berbasis sesi stateful.
   - Cookie & Session: Pastikan flag `HttpOnly`, `SameSite=Lax/Strict`, dan `Secure` (saat HTTPS) aktif.
5. **Pencegahan Kebocoran Informasi (Information Disclosure):**
   - Jangan pernah mengirim model Eloquent mentah ke frontend. Selalu gunakan **API Resource** untuk membatasi hanya field yang aman dikonsumsi client.
   - Pastikan field sensitif (`password`, `remember_token`, hash, key internal) terdaftar di `$hidden` pada Model dan tidak dipaparkan di Resource.
   - Pastikan `APP_DEBUG=false` untuk lingkungan staging/produksi agar stack trace tidak bocor ke publik.

---

## 3. Ringkasan Arsitektur Proyek

### Backend (Laravel 13)
```text
Request → Form Request (Validasi) → Controller → Repository (Akses Data/Cache) → Model/DB
                                              ↘ Resource (Format Output Props/JSON) → Inertia/Client
```
- **Controller tipis:** Hanya orkestrasi; delegasikan query ke Repository dan shaping data ke API Resource.
- **Repository Pattern:** Bind contract di `AppServiceProvider`; terapkan *eager loading* untuk mencegah N+1 query.
- **Cache Optimization:** Gunakan `Cache::rememberForever()` pada data referensi dan pasang *Laravel Observer* (`saved`/`deleted`) untuk auto-invalidasi.
- **No Inline FQN:** Selalu import class dengan `use Namespace\Class;` di bagian atas file.

### Frontend (React 19 + Inertia.js + TypeScript)
```text
resources/js/
├── pages/          # Komposisi halaman & penerima props Inertia (minimal logic)
├── components/     # UI murni (ui/, shared/, {feature}/)
├── hooks/          # Custom hooks untuk state, async, event handler
├── services/       # Komunikasi API, mapping data, business logic
├── utils/          # Pure helper functions (tanpa side-effects)
├── types/          # Definisi interface TypeScript terpusat
└── constants/      # Nilai konstan & token brand (@/lib/brand)
```
- **Separation of Concerns:** Jangan campur logic, API call, dan styling dalam satu komponen raksasa (*God Component*).
- **Colocation:** Jika kode hanya digunakan oleh satu fitur, letakkan di folder fitur terkait sebelum memindahkannya ke shared folder.
- **Layout:** Bungkus halaman dengan React Fragment (`<>...</>`) dan pasang breadcrumbs via static property `PageName.layout`.

---

## 4. Alur Kerja Sebelum Menyerahkan Hasil (Quality Checklist)

Sebelum menyelesaikan tugas atau menyetorkan perubahan, pastikan checklist berikut terpenuhi:
- [ ] **Plan Tersusun:** Rencana arsitektur dibuat dan diselaraskan dengan aturan di `systems_design/`.
- [ ] **TailwindCSS Only:** Styling konsisten menggunakan kelas Tailwind, tanpa inline styles liar.
- [ ] **Zero Credential Leaks:** Tidak ada secret key, database credential, atau env sensitif yang bocor ke bundle client.
- [ ] **Security Hardened:** Policy/Gate diterapkan (proteksi IDOR), validasi Form Request ketat (`$request->validated()`), mime type upload tervalidasi, rate limiting aktif pada route sensitif.
- [ ] **Types & Lint:** Tidak ada error linting (`npm run lint:check`) atau tipe TypeScript yang rusak (`npm run types:check`).
- [ ] **Behavior Preserved:** Fitur eksisting berjalan normal tanpa regresi.

<!-- antislop:start -->
## antislop
Untuk pekerjaan UI, copy, aksesibilitas, mobile layout, atau komentar kode, baca file arah desain [DESIGN.md](file:///c:/Users/naufalk/Documents/web/opstoday13/DESIGN.md) untuk identitas visual, lalu terapkan filter antislop dari skill terinstal berikut:
- **Core filter (always on):** `antislop`: `.agents/skills/antislop/SKILL.md`
- **UI / visual:** `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- **Copy & text:** `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- **People / accessibility:** `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- **Mobile / responsive:** `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- **Code comments:** `antislop-code`: `.agents/skills/antislop-code/SKILL.md`

Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
