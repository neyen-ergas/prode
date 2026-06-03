import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Prode Mundial 2026',
  description: 'Predicciones del Mundial 2026 con tu familia',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Prode 2026',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#10B981',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.className} bg-gray-950 text-white antialiased min-h-screen`}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
