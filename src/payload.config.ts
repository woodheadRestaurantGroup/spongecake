import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { ROLES, isGroupAdmin, siteIdsWithRole } from './access/roles'
import { LoginTokens } from './collections/LoginTokens'
import { Media } from './collections/Media'
import { Recipes } from './collections/Recipes'
import { Sites } from './collections/Sites'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { env, getDatabaseUrl, getPayloadSecret, parseEmailFrom } from './lib/env'
import type { Config } from './payload-types'

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
    components: {
      beforeLogin: ['@/components/admin/MagicLinkLogin#MagicLinkLogin'],
    },
    livePreview: {
      collections: ['recipes'],
      url: ({ data, req }) => {
        const origin = req.origin || new URL(req.url || 'http://localhost:3000').origin
        const slug = typeof data?.slug === 'string' && data.slug ? data.slug : data?.id
        return `${origin}/recipes/${slug}?preview=true`
      },
      breakpoints: [
        { label: 'iPhone', name: 'iphone', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 820, height: 1180 },
      ],
    },
  },
  collections: [Recipes, Tags, Media, Users, Sites, LoginTokens],
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
    multiTenantPlugin<Config>({
      tenantsSlug: 'sites',
      tenantField: { name: 'site' },
      tenantsArrayField: {
        arrayFieldName: 'memberships',
        arrayTenantFieldName: 'site',
        includeDefaultField: true,
        rowFields: [
          {
            name: 'role',
            type: 'select',
            required: true,
            defaultValue: 'viewer',
            options: ROLES.map((role) => ({
              label:
                role === 'siteAdmin' ? 'Site Admin' : role.charAt(0).toUpperCase() + role.slice(1),
              value: role,
            })),
          },
        ],
        // Site Admins may manage memberships; the Users collection hook limits them to their own sites.
        arrayFieldAccess: {
          create: ({ req }) =>
            isGroupAdmin(req.user) || siteIdsWithRole(req.user, ['siteAdmin']).length > 0,
          update: ({ req }) =>
            isGroupAdmin(req.user) || siteIdsWithRole(req.user, ['siteAdmin']).length > 0,
        },
      },
      collections: {
        recipes: {},
        tags: {},
        media: {},
      },
      userHasAccessToAllTenants: (user) => Boolean(user?.isGroupAdmin),
      // Sites are readable by everyone for branding; access is set on the collection itself.
      useTenantsCollectionAccess: false,
      i18n: {
        translations: {
          en: {
            'nav-tenantSelector-label': 'Site',
            'assign-tenant-button-label': 'Assign site',
            'assign-tenant-modal-title': 'Assign "{{title}}" to a site',
            'field-assignedTenant-label': 'Site',
          },
        },
      },
    }),
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
