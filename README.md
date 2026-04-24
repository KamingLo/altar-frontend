# Auth-Next PWA Boilerplate

Sebuah boilerplate Progressive Web App (PWA) berbasis Next.js yang menyediakan autentikasi lengkap dan terintegrasi dengan backend MSC (Model-Service-Controller) buatan Kaming. Proyek ini dirancang untuk koneksi mulus antara frontend dan backend, dengan fokus pada performa dan pengalaman pengguna yang optimal.

## 🚀 Fitur Utama

- **Progressive Web App (PWA)**: Installable, offline-capable, dengan manifest dan service worker
- **Autentikasi Lengkap**: Login manual, OAuth Google, session management
- **Middleware Proteksi**: Route protection menggunakan Next.js middleware
- **Server Actions**: Penggunaan Next.js server actions untuk operasi server-side
- **TypeScript**: Type safety penuh untuk development yang lebih aman
- **Tailwind CSS**: Styling modern dan responsive
- **iOS Optimized**: Konfigurasi khusus untuk pengalaman optimal di perangkat Apple

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── actions/          # Server actions untuk autentikasi
│   │   ├── auth/
│   │   │   ├── login.ts      # Action login manual
│   │   │   ├── oauth.ts      # Action OAuth Google
│   │   │   ├── register.ts   # Action registrasi
│   │   │   └── session.ts    # Action session management
│   │   └── admin/            # Actions untuk admin (future)
│   ├── auth/             # Halaman autentikasi
│   │   ├── callback/         # OAuth callback
│   │   ├── login/            # Halaman login
│   │   └── register/         # Halaman registrasi
│   ├── dashboard/        # Halaman dashboard (protected)
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout dengan PWA config
│   ├── manifest.ts       # PWA manifest
│   └── page.tsx          # Landing page
├── components/           # Reusable components
├── hooks/                # Custom React hooks
│   └── useCounter.ts     # Example hook
└── lib/                  # Utility libraries
    └── formatDate.ts     # Date formatting utility

proxy.ts                 # Middleware untuk autentikasi
```

## 🛠️ Setup & Instalasi

### Prerequisites

- Node.js 24+
- Backend MSC server (lihat dokumentasi backend)

### Langkah Instalasi

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd pwa-boilerplate
   ```
2. **Install dependencies**

   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```
3. **Konfigurasi environment**

   Buat file `.env.local` di root directory:

   ```env
   BACKEND_URL=http://localhost:8080  # URL backend MSC Anda
   ```
4. **Jalankan development server**

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📖 Dokumentasi Middleware (proxy.ts)

File `proxy.ts` adalah Next.js middleware yang menangani proteksi route dan manajemen autentikasi. Middleware ini berjalan sebelum request mencapai halaman, memungkinkan kontrol akses yang efisien.

### Fungsi Utama

1. **Proteksi Route Dashboard**: Memastikan hanya user yang terautentikasi dapat mengakses `/dashboard/*`
2. **Redirect Guest**: User yang belum login diarahkan ke `/auth/login` saat mengakses halaman protected
3. **Redirect Authenticated**: User yang sudah login diarahkan ke `/dashboard` saat mengakses halaman login/register

### Logika Kerja

```typescript
// 1. Ambil token dari cookie
const token = request.cookies.get('auth_token')?.value;

// 2. Tentukan route yang perlu proteksi
const isDashboardPage = pathname.startsWith('/dashboard');
const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');

// 3. Logika redirect
if (isDashboardPage && !token) {
  return NextResponse.redirect(new URL('/auth/login', request.url));
}

if (isAuthPage && token) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### Konfigurasi Matcher

Middleware hanya berjalan pada route tertentu untuk optimasi performa:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/auth/login', 
    '/auth/register'
  ],
};
```

### Catatan Penting

- Middleware menggunakan cookie `auth_token` untuk validasi sesi
- Token diset oleh server actions saat login berhasil
- Untuk route selain yang dimatch, middleware dilewati (tidak ada overhead)

## 🔐 Sistem Autentikasi

### Login Manual

- Form login dengan email dan password
- Validasi input client-side dan server-side
- Error handling yang informatif

### OAuth Google

- Integrasi dengan Google OAuth 2.0
- Callback handling untuk token exchange
- Auto-redirect setelah autentikasi

### Session Management

- Cookie-based session dengan HttpOnly flag
- Server-side session validation
- Auto-logout saat token expired

## 🎨 Styling & UI

- **Tailwind CSS v4**: Utility-first CSS framework
- **Dark Theme**: Desain gelap yang modern
- **Responsive**: Mobile-first approach
- **Gradient Effects**: Visual effects dengan CSS gradients
- **iOS Optimized**: Viewport dan touch handling khusus iOS

## 📱 PWA Features

- **Installable**: Dapat diinstall sebagai native app
- **Offline Capable**: Service worker untuk caching (future enhancement)
- **Manifest**: Konfigurasi PWA lengkap
- **Icons**: Multiple icon sizes untuk berbagai device
- **Apple Touch Icons**: Optimasi untuk iOS home screen

## 🚀 Deployment

### Build Production

```bash
npm run build
npm run start
```

### Deploy ke Vercel

1. Push ke GitHub
2. Connect repository ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

### Deploy ke Platform Lain

Pastikan platform mendukung:

- Next.js 16+
- Environment variables
- Static file serving untuk PWA assets

## 🔧 Development Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint checking
```

## 📚 Dependencies Utama

- **Next.js 16**: React framework dengan App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS v4**: Styling
- **ESLint**: Code linting

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kaming** - *Initial work* - [Your GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Next.js team untuk framework yang powerful
- Vercel untuk hosting dan deployment tools
- Tailwind CSS untuk styling system yang excellent
- React community untuk ecosystem yang luar biasa
