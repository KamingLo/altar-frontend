import type { Metadata, Viewport } from 'next'
import "./globals.css"

// 1. Konfigurasi Viewport untuk iOS
export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Penting agar aplikasi tidak ter-zoom saat input ditekan di iOS
  userScalable: false,
}

// 2. Konfigurasi Metadata khusus Apple
export const metadata: Metadata = {
  title: 'Next.js PWA',
  description: 'A Progressive Web App built with Next.js',
  manifest: '/manifest.json', // Mengarah ke manifest yang sudah kamu buat
  appleWebApp: {
    capable: true, // Menyembunyikan UI Safari (menjadi standalone)
    title: 'NextPWA',
    statusBarStyle: 'black-translucent', // Gaya baris status baterai/sinyal di atas
  },
  icons: {
    // Safari mencari apple-touch-icon untuk ikon di Home Screen
    apple: '/apple-touch-icon-precomposed.png', 
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}