import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { env, getDatabaseUrl, getPayloadSecret, parseEmailFrom } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const emailFrom = parseEmailFrom(process.env.EMAIL_FROM)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Spongecake',
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: getPayloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: getDatabaseUrl(),
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schema changes always go through migrations, in every environment,
    // so development and production never drift.
    push: false,
  }),
  // Without a Resend key (local development, CI) Payload logs emails to the console.
  email: env.resendApiKey
    ? resendAdapter({
        apiKey: env.resendApiKey,
        defaultFromAddress: emailFrom.address,
        defaultFromName: emailFrom.name,
      })
    : undefined,
  sharp,
  plugins: [
    // Without a Blob token (local development, CI) uploads are stored on disk under /media.
    ...(env.blobToken
      ? [
          vercelBlobStorage({
            collections: { media: true },
            token: env.blobToken,
          }),
        ]
      : []),
  ],
})
