import type { Metadata, Viewport } from 'next'
import React from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: 'Spongecake',
  description: 'Recipe database for Woodhead Restaurant Group kitchens.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-dvh bg-stone-50 text-stone-900 antialiased dark:bg-stone-900 dark:text-stone-100">
        {children}
      </body>
    </html>
  )
}
