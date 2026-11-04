/**
 * Central place for reading environment variables so the rest of the app
 * never touches process.env directly.
 */

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Migrations should run against a direct (unpooled) connection where one is
 * available, because transaction-mode poolers do not support every statement
 * a migration can issue. Neon's Vercel integration injects DATABASE_URL_UNPOOLED.
 */
export function getDatabaseUrl(): string {
  const migrating = process.env.PAYLOAD_MIGRATING === 'true'
  const unpooled = process.env.DATABASE_URL_UNPOOLED
  const pooled = process.env.DATABASE_URL

  const url = migrating && unpooled ? unpooled : pooled
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

export function getPayloadSecret(): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) {
    throw new Error('PAYLOAD_SECRET is not set')
  }
  if (isProduction && secret.length < 32) {
    throw new Error('PAYLOAD_SECRET must be at least 32 characters in production')
  }
  return secret
}

export type EmailFrom = { name: string; address: string }

/**
 * Parses EMAIL_FROM in either "Name <address>" or bare "address" form.
 */
export function parseEmailFrom(value: string | undefined): EmailFrom {
  const fallback: EmailFrom = {
    name: 'Spongecake',
    address: 'spongecake@send.woodheadrestaurantgroup.co.uk',
  }
  if (!value) return fallback

  const match = value.trim().match(/^(?:"?([^"<]*?)"?\s*)?<([^>]+)>$/)
  if (match) {
    const name = match[1]?.trim()
    return { name: name || fallback.name, address: match[2].trim() }
  }
  return { name: fallback.name, address: value.trim() }
}

export const env = {
  isProduction,
  resendApiKey: process.env.RESEND_API_KEY || undefined,
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || undefined,
  defaultSiteSlug: process.env.DEFAULT_SITE_SLUG || undefined,
}
