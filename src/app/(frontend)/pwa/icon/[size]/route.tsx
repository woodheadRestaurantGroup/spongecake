import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import React from 'react'

import { siteInitial } from '@/lib/recipes/queries'
import { getRequestContext } from '@/lib/request'

export const dynamic = 'force-dynamic'

const SIZES = new Set([120, 152, 167, 180, 192, 256, 384, 512])

let fontCache: Promise<ArrayBuffer> | null = null
function loadFont(origin: string): Promise<ArrayBuffer> {
  if (!fontCache) {
    fontCache = fetch(new URL('/fonts/IBMPlexSans-SemiBold.woff', origin)).then((r) => {
      if (!r.ok) throw new Error('font fetch failed')
      return r.arrayBuffer()
    })
    fontCache.catch(() => {
      fontCache = null
    })
  }
  return fontCache
}

/**
 * Home-screen icon: the site's initial on its accent, as a PNG at the
 * requested size. ?maskable=1 keeps the initial inside the safe zone so
 * Android can crop the square to its own shape.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params
  const size = Number(raw)
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 })

  const maskable = request.nextUrl.searchParams.get('maskable') === '1'
  const { site } = await getRequestContext()
  const accent = site?.accentColour ?? '#8B2D2D'
  const initial = siteInitial(site?.name ?? 'Spongecake')
  const font = await loadFont(request.nextUrl.origin)
  const glyph = Math.round(size * (maskable ? 0.4 : 0.5))

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: accent,
        color: '#FFFFFF',
        fontFamily: 'Plex',
        fontSize: glyph,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initial}
    </div>,
    {
      width: size,
      height: size,
      fonts: [{ name: 'Plex', data: font, weight: 600, style: 'normal' }],
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    },
  )
}
