import type { Metadata, Viewport } from 'next'
import React from 'react'

import { ViewTransitionsProvider } from '@/components/nav/ViewTransitions'
import { RegisterServiceWorker } from '@/components/pwa/RegisterServiceWorker'
import { getRequestContext } from '@/lib/request'

import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getRequestContext()
  return {
    title: { default: 'Spongecake', template: '%s · Spongecake' },
    description: 'Recipe database for Woodhead Restaurant Group kitchens.',
    robots: { index: false, follow: false },
    manifest: '/manifest.webmanifest',
    icons: { apple: '/pwa/icon/180' },
    appleWebApp: { capable: true, statusBarStyle: 'default', title: site?.name ?? 'Spongecake' },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F5F2' },
    { media: '(prefers-color-scheme: dark)', color: '#121211' },
  ],
}

/** Applies the stored theme before first paint so there is no flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getRequestContext()
  const accent = site?.accentColour ?? '#8B2D2D'

  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      style={{ '--site-accent': accent } as React.CSSProperties}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="preload"
          href="/fonts/ibm-plex-sans-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-ink">
        <ViewTransitionsProvider>{children}</ViewTransitionsProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  )
}
