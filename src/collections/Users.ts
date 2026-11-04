import { randomUUID } from 'crypto'
import type { Access, CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'
import { ValidationError } from 'payload'

import {
  ADMIN_ROLES,
  anySiteAccess,
  getMemberships,
  groupAdminOnly,
  isGroupAdmin,
  siteIdsWithRole,
} from '@/access/roles'
import { magicLinkJwtStrategy } from '@/lib/auth/strategy'
import { env } from '@/lib/env'

/** 90 days, in seconds. */
export const SESSION_SECONDS = 60 * 60 * 24 * 90

/**
 * Site Admins may only add, change or remove memberships for sites they
 * administer. Memberships at other sites must pass through untouched.
 */
const guardMemberships: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (!req.user || isGroupAdmin(req.user)) return data
  if (!('memberships' in data)) return data

  const adminSites = new Set(siteIdsWithRole(req.user, ['siteAdmin']))
  const before = getMemberships(originalDoc).filter((m) => !adminSites.has(m.siteId))
  const after = getMemberships(data).filter((m) => !adminSites.has(m.siteId))

  const key = (m: { siteId: number; role: string }) => `${m.siteId}:${m.role}`
  const same =
    before.length === after.length && before.every((m) => after.some((n) => key(n) === key(m)))

  if (!same) {
    throw new ValidationError({
      collection: 'users',
      errors: [
        {
          path: 'memberships',
          message: 'You can only manage memberships for sites you administer.',
        },
      ],
    })
  }
  return data
}

/** Group Admins see everyone; Site Admins see members of their sites; everyone sees themselves. */
const selfOrAdministeredSites: Access = ({ req }) => {
  if (!req.user) return false
  if (isGroupAdmin(req.user)) return true
  const self: Where = { id: { equals: req.user.id } }
  const adminSites = siteIdsWithRole(req.user, ['siteAdmin'])
  if (adminSites.length === 0) return self
  const where: Where = { or: [self, { 'memberships.site': { in: adminSites } }] }
  return where
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'memberships'],
    group: 'Settings',
  },
  auth: {
    // Sign-in is by magic link only (see src/lib/auth). Payload's password
    // strategy is off, but its fields stay so email and sessions exist.
    disableLocalStrategy: { enableFields: true, optionalPassword: true },
    strategies: [magicLinkJwtStrategy],
    useSessions: true,
    tokenExpiration: SESSION_SECONDS,
    cookies: {
      sameSite: 'Lax',
      secure: env.isProduction,
    },
  },
  access: {
    admin: ({ req }) => isGroupAdmin(req.user) || siteIdsWithRole(req.user, ADMIN_ROLES).length > 0,
    read: selfOrAdministeredSites,
    create: anySiteAccess(['siteAdmin']),
    update: selfOrAdministeredSites,
    delete: groupAdminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.avatarSeed) data.avatarSeed = randomUUID()
        return data
      },
    ],
    beforeChange: [guardMemberships],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'isGroupAdmin',
      type: 'checkbox',
      label: 'Group Admin',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Full access to every site. Reserved for group management.',
      },
      access: {
        create: ({ req }) => isGroupAdmin(req.user),
        update: ({ req }) => isGroupAdmin(req.user),
      },
    },
    {
      name: 'favourites',
      type: 'relationship',
      relationTo: 'recipes',
      hasMany: true,
      admin: { hidden: true },
      access: {
        update: ({ req, id }) => isGroupAdmin(req.user) || req.user?.id === id,
      },
    },
    {
      name: 'avatarSeed',
      type: 'text',
      admin: { hidden: true },
    },
    // `memberships` (site + role) is added by the multi-tenant plugin. See payload.config.ts.
  ],
}
