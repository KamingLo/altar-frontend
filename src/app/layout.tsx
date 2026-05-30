import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import "./globals.css"
import { Toaster } from 'sonner'
import { PullToRefresh } from '@/components/ui/PullToRefresh'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

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
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={plusJakartaSans.className}>
        <PullToRefresh />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
