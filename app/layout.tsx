import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: { default: 'SQUAD', template: '%s · SQUAD' },
  description: 'The smarter way to run your 5-a-side. Availability, payments, and balanced teams — sorted.',
  keywords: ['5-a-side', 'football', 'team management', 'squad', 'payments', 'availability'],
  openGraph: {
    title: 'SQUAD',
    description: 'The smarter way to run your 5-a-side.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050a08',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text-primary font-body antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#161625',
              color: '#fff',
              border: '1px solid #1E1E35',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#B8FF3C', secondary: '#07070F' },
            },
            error: {
              iconTheme: { primary: '#FF4C4C', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
