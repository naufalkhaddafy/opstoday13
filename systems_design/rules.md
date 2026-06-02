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

### Konvensi Layout Halaman

Semua halaman Inertia mengikuti pola layout yang seragam agar tampilan konsisten.

#### Wrapper & Breadcrumbs
- Gunakan **React Fragment** (`<>...</>`) sebagai wrapper — **bukan** `<AppLayout>` secara langsung.
- Definisikan breadcrumbs via **static property** di akhir komponen:
  ```tsx
  NamaPage.layout = {
      breadcrumbs: [
          { title: 'Parent', href: '/parent' },
          { title: 'Current', href: '/current' },
      ],
  };
  ```

#### Halaman List (Index)
```
<>
  <Head title="..." />
  <div className="flex h-full flex-1 flex-col gap-4 p-4">
    <!-- Header: judul + tombol aksi -->
    <Card>
      <CardHeader> ... </CardHeader>
      <CardContent> <!-- tabel / daftar --> </CardContent>
    </Card>
  </div>
</>
```

#### Halaman Form (Create / Edit)
```
<>
  <Head title="..." />
  <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Judul Form</CardTitle>
          <CardDescription>Deskripsi singkat.</CardDescription>
        </div>
        <Button variant="outline" asChild>
          <Link href="...">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          <!-- Field-field form -->
          <div className="flex justify-end pt-6 border-t mt-6">
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" /> Simpan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</>
```

#### Aturan Penting
- Container form selalu `max-w-4xl mx-auto w-full`.
- Tombol **Kembali** ada di `CardHeader` sejajar dengan judul (kanan atas), menggunakan ikon `ArrowLeft`.
- Tombol **Simpan** ada di dalam `<form>`, di bawah garis (`border-t`), rata kanan, menggunakan ikon `Save`.
- Jangan menggunakan `CardFooter` untuk tombol aksi form.

### Reusable Components

Prinsip: **jangan copy-paste JSX yang sama di lebih dari satu halaman**. Ekstrak menjadi komponen.

#### Lokasi
```
resources/js/components/
  ui/         # Primitif (Button, Input, Select) — Shadcn UI, jangan edit
  shared/     # Komponen komposit yang dipakai lintas halaman
```

#### Kapan Harus Ekstrak
| Situasi | Contoh | Aksi |
|---------|--------|------|
| Pola UI identik muncul ≥ 2× | Tabel dengan badge status | Buat komponen di `shared/` |
| Form field + label + error berulang | Input Nama, Input Email | Buat `<FormField>` wrapper |
| Layout section berulang | Card header dengan tombol kembali | Buat `<PageFormCard>` |

#### Contoh: `FormField` Wrapper
```tsx
// components/shared/form-field.tsx
export function FormField({ label, htmlFor, required, error, children }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
```
Dengan ini, halaman form hanya perlu:
```tsx
<FormField label="Nama" htmlFor="name" required error={errors.name}>
    <Input id="name" value={data.name} onChange={...} />
</FormField>
```

### Custom Hooks

Gunakan custom hooks untuk **mengisolasi logika** agar komponen halaman tetap fokus pada rendering.

#### Lokasi
```
resources/js/hooks/
  use-debounced-search.ts   # Contoh: pencarian dengan debounce
  use-filters.ts            # Contoh: state filter tabel
```

#### Kapan Harus Buat Custom Hook
- **State + side-effect** yang dipakai di ≥ 2 halaman (misalnya debounced search).
- **Logika form** yang kompleks (transform, computed values).
- **Interaksi API** berulang (polling, optimistic update).

#### Contoh: `useDebouncedSearch`
```tsx
// hooks/use-debounced-search.ts
export function useDebouncedSearch(initialValue: string, delay = 300) {
    const [value, setValue] = useState(initialValue);
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(window.location.pathname, 
                { search: value }, 
                { preserveState: true, replace: true }
            );
        }, delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return [value, setValue] as const;
}
```

### Prinsip Menjaga Halaman Tetap Ringkas

| Prinsip | Penjelasan |
|---------|------------|
| **Single Responsibility** | Satu file halaman = satu *page render*. Logika bisnis di hook/utils. |
| **Composition over Duplication** | Gabungkan komponen kecil; jangan tulis ulang markup. |
| **Props down, Events up** | Data mengalir ke bawah via props; perubahan naik via callback. |
| **Colocation** | Simpan komponen, hook, dan type di dekat tempat pemakaiannya. Jika hanya dipakai satu halaman, letakkan di subfolder halaman tersebut. |
| **Jangan Inline Style** | Gunakan kelas Tailwind. Hindari `style={{}}` kecuali untuk nilai dinamis (e.g. `width` dari kalkulasi). |
| **Hindari Prop Drilling > 2 Level** | Gunakan context atau komposisi (`children`) daripada meneruskan props terlalu dalam. |

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
- **Hindari FQN Inline**: Jangan menulis *Fully Qualified Namespace* (FQN) secara inline di dalam kode (contoh: `\App\Models\User::all()`). Selalu gunakan statement `use` di bagian atas file (contoh: `use App\Models\User;` lalu `User::all()`).
