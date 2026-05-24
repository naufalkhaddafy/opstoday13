# Role
You are an expert Full-Stack Web Developer and Infrastructure Architect.

# Project Context
Sistem ini berfokus pada otomasi workflow dan manajemen dokumen internal.
Tech Stack: Laravel 13, React, Inertia.js, TailwindCSS. 
Deployment env: Docker / Virtualized Environments.

# Coding Best Practices

## React & Inertia
- Selalu gunakan Functional Components dan React Hooks.
- Ekstrak komponen UI yang sering digunakan menjadi reusable components.
- Hindari penggunaan class components.

## Laravel

### Arsitektur lapisan

```
Request → Form Request (validasi) → Controller → Repository (data) → Model/DB
                                              ↘ Resource (format JSON/props) → Inertia/API
```

| Lapisan | Lokasi | Tanggung jawab |
|--------|--------|----------------|
| **Validasi** | `app/Http/Requests/` | Rules input HTTP; reusable rules di `app/Concerns/` atau `app/Rules/` |
| **Repository** | `app/Repositories/` | Query, persist, cache; terima data sudah tervalidasi |
| **Resource** | `app/Http/Resources/` | Bentuk output JSON/props Inertia; field aman untuk client |
| **Controller** | `app/Http/Controllers/` | Orkestrasi: panggil repository, bungkus Resource, redirect/flash |

### Struktur folder
```
app/
  Http/
    Controllers/
    Requests/             # Validasi input
    Resources/            # Format data ke client (Inertia & API JSON)
      Settings/           # Page-level resources (opsional per halaman)
  Repositories/
    Contracts/
    Eloquent/
  Models/
  Services/               # Opsional: orkestrasi multi-repository
```

### Repository Pattern
- **Controller** tidak boleh query Eloquent langsung (kecuali sementara untuk fitur yang belum punya repository).
- **Repository** menangani akses data; method berorientasi use case (`updateProfile`, `updatePassword`).
- Bind interface → implementasi di `AppServiceProvider::register()`.
- Tambah repository per aggregate saat fitur baru butuh; jangan abstraksi prematur.

### API Resources (format output)
- Satu resource per entitas: `UserResource`, dll.
- Page-level resource untuk props Inertia kompleks: `Settings/SecurityPageResource`.
- Semua field yang dikirim ke React/API didefinisikan di Resource — jangan expose model mentah.
- Untuk Inertia: `Inertia::render('page', SomeResource::make($data)->resolve())`.
- Shared data global (mis. `auth.user`) di `HandleInertiaRequests` juga pakai Resource.
- Resource **bukan** tempat validasi atau query DB.

### Validasi
- Route controller: type-hint **Form Request**; controller pakai `$request->validated()`.
- Fortify / job / CLI: `Validator` atau Form Request di Action/Command.
- Repository **tidak** memvalidasi request mentah.

### Controller (tetap tipis)
- Inject repository lewat constructor.
- Flash message dan redirect tetap di controller.
- Tidak ada `map()`, `diffForHumans()`, atau shaping array manual — delegasikan ke Resource.

### Data & performa
- Eager loading dan Redis cache di **Repository**.
- Standar RESTful atau konvensi rute Inertia yang rapi.

## General
- Fitur baru: Form Request + Repository (jika perlu) + Resource sebelum memperbesar controller.
- Tulis kode dengan mempertimbangkan keamanan dan efisiensi memori (terutama saat memproses file/dokumen).
- Berikan komentar singkat pada logika yang kompleks.
