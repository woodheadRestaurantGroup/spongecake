import { getRequestContext } from '@/lib/request'

export const dynamic = 'force-dynamic'

/** iOS shows about twelve characters under a home-screen icon. */
function shortName(name: string): string {
  if (name.length <= 12) return name
  const words = name.replace(/^the\s+/i, '').split(/\s+/)
  let out = ''
  for (const w of words) {
    if ((out + ' ' + w).trim().length > 12) break
    out = (out + ' ' + w).trim()
  }
  return out || name.slice(0, 12)
}

/** Web app manifest for the site at this hostname. */
export async function GET() {
  const { site } = await getRequestContext()
  const name = site?.name ?? 'Spongecake'
  const icon = (size: number, purpose: 'any' | 'maskable') => ({
    src: `/pwa/icon/${size}${purpose === 'maskable' ? '?maskable=1' : ''}`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose,
  })

  return Response.json(
    {
      id: '/',
      name: site ? `${name} recipes` : 'Spongecake',
      short_name: site ? shortName(name) : 'Spongecake',
      description: 'Recipe database for Woodhead Restaurant Group kitchens.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#F6F5F2',
      theme_color: '#F6F5F2',
      lang: 'en-GB',
      icons: [icon(192, 'any'), icon(512, 'any'), icon(192, 'maskable'), icon(512, 'maskable')],
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache',
      },
    },
  )
}
