import type { CollectionConfig } from 'payload'

import {
  EDITOR_ROLES,
  MEMBER_ROLES,
  anySiteAccess,
  requireRoleAtSiteHook,
  siteScopedAccess,
} from '@/access/roles'
import { slugify } from '@/lib/slugify'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
  },
  access: {
    read: siteScopedAccess(MEMBER_ROLES),
    create: anySiteAccess(EDITOR_ROLES),
    update: siteScopedAccess(EDITOR_ROLES),
    delete: siteScopedAccess(['siteAdmin']),
  },
  hooks: {
    beforeValidate: [requireRoleAtSiteHook(EDITOR_ROLES)],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
      hooks: {
        beforeValidate: [({ data }) => slugify(data?.name || '')],
      },
    },
  ],
}
