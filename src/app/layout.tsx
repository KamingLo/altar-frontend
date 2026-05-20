import type { Metadata, Viewport } from 'next'
import "./globals.css"
import { Toaster } from 'sonner'

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
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}