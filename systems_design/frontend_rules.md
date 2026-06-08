# Role
You are an expert Frontend Developer working with React, TypeScript, and Inertia.js.
Follow these guidelines to maintain a clean, scalable, and maintainable codebase.

# React & Inertia Best Practices

## 1. Modularity & Reusability
- **Keep Components Small**: A single file should ideally not exceed 200-300 lines. If it does, break it down into smaller, reusable child components.
- **Single Responsibility Principle**: Each component should do one thing. If a component manages too much state or UI logic, extract it.
- **Extract UI Shells**: Abstract repetitive layout structures (Cards, Wrappers, Skeletons) into generic reusable components.
- Selalu gunakan Functional Components dan React Hooks. Hindari penggunaan class components.
- Ekstrak komponen UI yang sering digunakan menjadi reusable components.

## 2. File & Directory Structure
- Store page-level components in `resources/js/pages/`.
- Store shared generic components in `resources/js/components/ui/` (e.g. `Button`, `Card`, `Input` — Shadcn UI).
- Store composite components used across pages in `resources/js/components/shared/`.
- Store domain-specific/feature components in subdirectories like `resources/js/components/{feature}/`.
- Move pure functions, formatters, and helpers to `resources/js/lib/` or `resources/js/utils/` or inside a specific feature directory as `helpers.tsx` or `helpers.ts`.
- Move complex TypeScript interfaces and types out of component files and into a dedicated `types.ts` or `resources/js/types/` folder.

## 3. State & Props Management
- Pass only necessary data via props. Don't pass large objects if the child component only needs one property.
- Utilize standard prop destructuring and define explicit TypeScript interfaces for all props.
- Keep state as close to where it's needed as possible. Avoid lifting state up unless necessary.

## 4. Performance Optimization
- Use `useCallback` and `useMemo` for expensive calculations or when passing callbacks to memoized child components.
- Use Inertia's `Deferred Loading` (`<Deferred>`) to lazily load expensive data metrics to prevent blocking initial render.

## 5. Konvensi Layout Halaman

Semua halaman Inertia mengikuti pola layout yang seragam agar tampilan konsisten.

### Wrapper & Breadcrumbs
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

### Halaman List (Index)
```tsx
<>
  <Head title="..." />
  <div className="flex h-full flex-1 flex-col gap-4 p-4">
    <Card>
      <CardHeader> ... </CardHeader>
      <CardContent> <!-- tabel / daftar --> </CardContent>
    </Card>
  </div>
</>
```

### Halaman Form (Create / Edit)
```tsx
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

**Aturan Penting**:
- Container form selalu `max-w-4xl mx-auto w-full`.
- Tombol **Kembali** ada di `CardHeader` sejajar dengan judul (kanan atas), menggunakan ikon `ArrowLeft`.
- Tombol **Simpan** ada di dalam `<form>`, di bawah garis (`border-t`), rata kanan, menggunakan ikon `Save`.
- Jangan menggunakan `CardFooter` untuk tombol aksi form.

## 6. Kapan Harus Ekstrak Reusable Components

| Situasi | Contoh | Aksi |
|---------|--------|------|
| Pola UI identik muncul ≥ 2× | Tabel dengan badge status | Buat komponen di `shared/` |
| Form field + label + error berulang | Input Nama, Input Email | Buat `<FormField>` wrapper |
| Layout section berulang | Card header dengan tombol kembali | Buat `<PageFormCard>` |

## 7. Custom Hooks
Gunakan custom hooks untuk **mengisolasi logika** agar komponen halaman tetap fokus pada rendering.

- **Lokasi**: `resources/js/hooks/`
- **Kapan Buat Custom Hook**:
  - **State + side-effect** yang dipakai di ≥ 2 halaman (misalnya debounced search).
  - **Logika form** yang kompleks (transform, computed values).
  - **Interaksi API** berulang (polling, optimistic update).

## 8. Prinsip Menjaga Halaman Tetap Ringkas

| Prinsip | Penjelasan |
|---------|------------|
| **Single Responsibility** | Satu file halaman = satu *page render*. Logika bisnis di hook/utils. |
| **Composition over Duplication** | Gabungkan komponen kecil; jangan tulis ulang markup. |
| **Props down, Events up** | Data mengalir ke bawah via props; perubahan naik via callback. |
| **Colocation** | Simpan komponen, hook, dan type di dekat tempat pemakaiannya. Jika hanya dipakai satu halaman, letakkan di subfolder halaman tersebut. |
| **Jangan Inline Style** | Gunakan kelas Tailwind. Hindari `style={{}}` kecuali untuk nilai dinamis (e.g. `width` dari kalkulasi). |
| **Hindari Prop Drilling > 2 Level** | Gunakan context atau komposisi (`children`) daripada meneruskan props terlalu dalam. |

## 9. Brand Identity (b-hero)

Semua halaman — publik maupun admin — **wajib** memakai palet warna b-hero yang sama. Jangan hardcode warna acak (indigo/violet/fuchsia) untuk elemen brand; impor dari `@/lib/brand`.

### Aset & Token Warna
| Token | Hex | Penggunaan |
|-------|-----|------------|
| `BRAND.dark` | `#1B5E20` | Hijau tua — completed, sidebar primary (dark) |
| `BRAND.mid` | `#2E7D32` | Hijau utama — primary, ikon section, CTA aktif |
| `BRAND.light` | `#4CAF50` | Hijau terang — present, in progress |
| `BRAND.yellow` | `#FDD835` | Kuning aksen — pending, highlight, badge subtitle |
| `BRAND.black` | `#0a0a0a` | Hitam — awal gradient header |

- **Logo**: `/images/kpc-logo.png` atau ikon b-hero → gunakan `BRAND_LOGO_SRC` dari `@/lib/brand`.
- **CSS global** (`resources/css/app.css`): `--primary`, `--ring`, `--chart-*`, `--sidebar-primary` sudah diset ke palet hijau b-hero.

### Kapan Pakai Apa
| Kebutuhan | Import |
|-----------|--------|
| Warna hex chart / progress bar | `BRAND`, `TICKET_CHART_COLORS` dari `@/lib/brand` |
| Badge status tiket | `TicketStatusBadge` dari `@/components/shared/TicketStatusBadge` |
| Header halaman dashboard | `<BrandHeroHeader />` — prop `compact` untuk layout admin (sidebar) |
| Header card halaman detail | `BRAND_PAGE_HEADER` + `BRAND_ICON_BOX` |

### Aturan Brand
- **Jangan** definisikan ulang `STATUS_STYLES` atau `BRAND` di file halaman — impor dari `@/lib/brand` atau komponen shared.
- Warna semantik non-brand (mis. `rose` untuk absent/error) boleh dipakai untuk status negatif.
- Warna shift di roster (SFT/MLM) boleh berbeda karena bersifat kode shift, bukan elemen brand.
