# ALTAR Frontend — Dokumentasi Desain

## Ringkasan

ALTAR adalah sistem manajemen presensi berbasis web untuk lingkungan akademik, dengan dua role utama: **Asdos** (Asisten Dosen) dan **Koordinator**. Frontend dibangun menggunakan **Next.js 16 + React 19 + Tailwind CSS 4** tanpa library UI pihak ketiga seperti shadcn atau Material UI — seluruhnya komponen kustom.

---

## Stack Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Toast / Notifikasi | Sonner v2 |
| State Management | Zustand |
| Bahasa | TypeScript |

---

## Warna (Color Palette)

### Warna Utama

| Nama | Hex | Penggunaan |
|---|---|---|
| Brand Maroon | `#941C2F` | Tombol utama, sidebar, aksen aktif, focus ring |
| Background Utama | `#EDF2F4` | Background halaman dashboard |
| Teks Gelap | `#0D1B2A` | Teks utama |
| Putih | `#ffffff` | Card, input, surface |
| Hitam | `#060606` | Background auth (gelap) |

### Warna Semantik

| Kondisi | Warna |
|---|---|
| Error / Merah | `#DC2626`, background `#FCA5A5` |
| Sukses / Hijau | `#16A34A`, background `#86EFAC` |
| Warning / Kuning | `#F59E0B` |
| Slate / Abu | `#64748B`, `#8A9BAD`, `#94A3B8` |

### CSS Variables (globals.css)

```css
:root {
  --background: #ffffff;
  --foreground: #060606;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #060606;
    --foreground: #ededed;
  }
}
```

---

## Tipografi

### Font

| Font | Bobot | Digunakan di |
|---|---|---|
| Plus Jakarta Sans | 400–800 | Hero, halaman auth, dashboard |
| Inter | 400–600 | Layout dashboard |
| Monospace (system) | — | Tampilan waktu / jam |

### Ukuran Teks

| Konteks | Ukuran Tailwind |
|---|---|
| Hero heading | `text-[56px]` |
| Judul halaman | `text-4xl` / `text-3xl` |
| Subjudul | `text-2xl` |
| Body | `text-base` / `text-sm` |
| Label kecil | `text-xs` / `text-[11px]` |

---

## Layout Utama

### Struktur Halaman

```
┌─────────────────────────────────────────────────┐
│              Navbar (Landing Page)               │
├──────────────┬──────────────────────────────────┤
│              │     Top Header (Mobile)           │
│   Sidebar    ├──────────────────────────────────┤
│  (Desktop)   │                                  │
│              │        Konten Utama              │
│  #941C2F bg  │    (bg: #EDF2F4)                 │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

### Sidebar (Dashboard)

- Background: `#941C2F`
- Lebar: fixed di desktop, drawer overlay di mobile
- Logo di atas
- Grup menu yang bisa di-expand (collapsible)
- Item aktif: `bg-white/15 text-white`
- Item non-aktif: `text-white/70 hover:text-white`
- Tombol logout di bawah
- Transisi: smooth height animation saat buka/tutup grup

### Konten Utama

- Background: `#EDF2F4`
- Ada background image dengan gradient overlay
- Scrollable, max-width container untuk konten
- Padding responsif menggunakan `clamp()`

---

## Komponen UI

### Tombol (Button)

| Tipe | Tampilan |
|---|---|
| Primary | `bg-[#941C2F] text-white font-bold rounded-xl` |
| Secondary | `bg-white border border-slate-200 rounded-xl` |
| Loading | Spinner + teks "Memproses..." |
| Disabled | `opacity-60 cursor-not-allowed` |

State interaktif:
- Hover: scale naik sedikit + perubahan warna
- Active/press: `scale-[0.98]` atau `scale-95`
- Transition: `duration-200` dengan cubic-bezier

### Input / Form

- Background: putih
- Border: `border-[#E2E8F0]`
- Focus: `border-[#941C2F] ring-4 ring-[#941C2F]/10`
- Rounded: `rounded-xl`
- Validasi error ditampilkan inline di bawah input
- Password input: ada toggle show/hide

### Card / Container

- Background: putih
- Shadow: `shadow-sm` atau `shadow-md`
- Border: `border-slate-100`
- Padding: `p-4 lg:p-5` atau `p-6`
- Rounded: `rounded-2xl` atau `rounded-3xl`

### Modal / Bottom Sheet

- **Desktop**: dialog modal terpusat
- **Mobile**: bottom sheet dengan drag handle di atas
- Animasi: slide-up dari bawah di mobile, fade-in di desktop
- Backdrop: semi-transparan dengan blur

### Toast / Notifikasi

- Library: **Sonner**
- Posisi: kanan atas (desktop), bawah (mobile)
- Tipe: success, error, info, warning

### Custom Select

- Dropdown kustom dengan portal positioning
- Bukan `<select>` native — komponen sendiri di `src/components/ui/CustomSelect.tsx`

---

## Halaman-Halaman

### Landing Page (`/`)

- Hero section dengan dua varian: desktop dan mobile
- Navbar di atas dengan logo dan badge versi
- Font besar: `text-[56px]` untuk heading utama
- Background: warna terang dengan elemen dekoratif

### Autentikasi (`/auth/*`)

- Background **hitam penuh** (`bg-black`)
- Card form di tengah dengan shadow
- Google OAuth button
- Halaman: Login, Register, Reset Password, Callback

### Dashboard Asdos (`/asdos/*`)

Menu utama:
- Home (ringkasan)
- Check-in
- Check-out
- Presensi Kelas Online
- Riwayat Kehadiran
- Jadwal Ajar
- Pengajuan KP

### Dashboard Koordinator (`/koordinator/*`)

Menu utama:
- Home (ringkasan)
- Data Presensi
- Generate QR
- Manajemen User
- Manajemen KP
- Manajemen Jadwal
- Data Master

---

## Animasi & Transisi

| Nama | Efek | Digunakan di |
|---|---|---|
| `fadeUp` | Muncul dari bawah dengan stagger 0.05–0.35s | Halaman dashboard, list item |
| `shimmer` | Kilap dari kiri ke kanan | Skeleton loading |
| `scaleIn` | Muncul dari skala kecil | Modal, tombol entry |
| Sidebar expand | Smooth height transition | Grup menu sidebar |
| Press feedback | `scale-95` / `scale-[0.98]` | Semua tombol interaktif |

---

## Responsivitas

- Pendekatan **mobile-first** dengan breakpoint `lg:` (1024px) sebagai batas utama
- Sidebar: tetap di desktop, jadi drawer overlay di mobile
- Modal: dialog di desktop, bottom sheet di mobile
- Padding tombol: `p-3.5 md:p-4`
- Spacing scalable dengan `clamp()`
- Safe area padding untuk notch/home indicator di iOS

---

## Gaya Desain Keseluruhan

**Minimalis Modern** dengan sentuhan:
- **Flat Design**: tidak ada gradien berat atau shadow tebal
- **Glassmorphism ringan**: backdrop-blur pada beberapa komponen overlay
- **Sudut membulat**: konsisten menggunakan `rounded-xl` hingga `rounded-3xl`
- **Shadow halus**: `shadow-sm` / `shadow-md` — tidak dramatis
- **Palet hangat**: maroon `#941C2F` sebagai aksen memberi kesan profesional dan formal
- **Light theme** sebagai default; dark mode via CSS media query

---

## Struktur File Penting

```
altar-frontend/
├── src/
│   ├── app/
│   │   ├── globals.css          ← CSS global & variabel warna
│   │   ├── layout.tsx           ← Root layout (font, metadata)
│   │   ├── page.tsx             ← Landing page
│   │   ├── auth/                ← Halaman autentikasi
│   │   ├── asdos/               ← Halaman dashboard Asdos
│   │   └── koordinator/         ← Halaman dashboard Koordinator
│   └── components/
│       ├── home/
│       │   └── Hero.tsx         ← Hero landing page
│       ├── auth/
│       │   ├── AuthLayout.tsx   ← Wrapper layout auth
│       │   ├── LoginForm.tsx    ← Form login + Google OAuth
│       │   └── RegisterForm.tsx ← Form registrasi
│       ├── dashboard/
│       │   ├── DashboardLayout.tsx     ← Layout utama dashboard
│       │   ├── Sidebar.tsx             ← Navigasi sidebar
│       │   ├── asdos/
│       │   │   ├── AsdosHome.tsx       ← Home dashboard Asdos
│       │   │   └── AsdosUI.tsx         ← Shell & skeleton Asdos
│       │   └── koordinator/
│       │       └── KoordinatorHome.tsx ← Home dashboard Koordinator
│       └── ui/
│           ├── CustomSelect.tsx ← Dropdown kustom
│           └── BottomSheet.tsx  ← Modal bottom sheet
└── design.md                    ← File ini
```
