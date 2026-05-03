import type { Metadata, Viewport } from 'next'
import "./globals.css"

// 1. Konfigurasi Viewport untuk iOS
export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// 2. Konfigurasi Metadata khusus Apple
export const metadata: Metadata = {
  title: 'Altar.',
  description: 'Assistant Lecturer Tarumanagara',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Altar.',
    statusBarStyle: 'black-translucent',
  },
  icons: {
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