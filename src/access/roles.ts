import type { Access, CollectionBeforeValidateHook, PayloadRequest, Where } from 'payload'
import { Forbidden } from 'payload'

import type { User } from '@/payload-types'

export const ROLES = ['viewer', 'editor', 'siteAdmin'] as const
export type Role = (typeof ROLES)[number]

/** Roles that may enter the Payload admin panel. */
export const ADMIN_ROLES: Role[] = ['editor', 'siteAdmin']
/** Roles that may create and edit recipes, tags and media. */
export const EDITOR_ROLES: Role[] = ['editor', 'siteAdmin']
/** Roles that may read a site's content at all. */
export const MEMBER_ROLES: Role[] = ['viewer', 'editor', 'siteAdmin']

type MaybeUser = Partial<User> | PayloadRequest['user'] | null | undefined

export function isGroupAdmin(user: MaybeUser): boolean {
  return Boolean(user && (user as User).isGroupAdmin)
}

function extractId(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    return typeof id === 'number' ? id : undefined
  }
  return undefined
}

export type Membership = { siteId: number; role: Role }

export function getMemberships(user: MaybeUser): Membership[] {
  const rows = (user as User | null | undefined)?.memberships
  if (!Array.isArray(rows)) return []
  const out: Membership[] = []
  for (const row of rows) {
    const siteId = extractId(row.site)
    if (siteId !== undefined && ROLES.includes(row.role as Role)) {
      out.push({ siteId, role: row.role as Role })
    }
  }
  return out
}

/** IDs of the sites where the user holds one of the given roles. */
export function siteIdsWithRole(user: MaybeUser, roles: readonly Role[]): number[] {
  return getMemberships(user)
    .filter((m) => roles.includes(m.role))
    .map((m) => m.siteId)
}

export function roleAtSite(user: MaybeUser, siteId: number): Role | undefined {
  if (isGroupAdmin(user)) return 'siteAdmin'
  return getMemberships(user).find((m) => m.siteId === siteId)?.role
}

export function hasRoleAtSite(user: MaybeUser, siteId: number, roles: readonly Role[]): boolean {
  if (isGroupAdmin(user)) return true
  const role = roleAtSite(user, siteId)
  return role !== undefined && roles.includes(role)
}

/**
 * Builds an access function that grants everything to Group Admins and
 * otherwise constrains to documents whose `fieldName` is one of the sites
 * where the user holds one of `roles`. Returns false when the user holds
 * none, so an empty list never leaks into an `in` query.
 */
export function siteScopedAccess(roles: readonly Role[], fieldName = 'site'): Access {
  return ({ req }) => {
    if (!req.user) return false
    if (isGroupAdmin(req.user)) return true
    const siteIds = siteIdsWithRole(req.user, roles)
    if (siteIds.length === 0) return false
    const where: Where = { [fieldName]: { in: siteIds } }
    return where
  }
}

/** True when the user holds one of `roles` at any site, or is a Group Admin. */
export function anySiteAccess(roles: readonly Role[]): Access {
  return ({ req }) => {
    if (!req.user) return false
    if (isGroupAdmin(req.user)) return true
    return siteIdsWithRole(req.user, roles).length > 0
  }
}

export const groupAdminOnly: Access = ({ req }) => isGroupAdmin(req.user)

export const authenticated: Access = ({ req }) => Boolean(req.user)

/**
 * Collection hook that rejects a create or update unless the acting user
 * holds one of `roles` at the document's site. Access rules on create can
 * only express a yes or no, so this is where "editor at this site" lives.
 * Userless local API calls (seeds, scripts) pass through.
 */
export function requireRoleAtSiteHook(roles: readonly Role[]): CollectionBeforeValidateHook {
  return ({ data, originalDoc, req }) => {
    if (!req.user || isGroupAdmin(req.user)) return data
    const siteValue = data?.site ?? originalDoc?.site
    const siteId = extractId(siteValue)
    if (siteId === undefined) {
      throw new Forbidden(req.t)
    }
    if (!hasRoleAtSite(req.user, siteId, roles)) {
      throw new Forbidden(req.t)
    }
    return data
  }
}
