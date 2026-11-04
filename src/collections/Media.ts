import type { CollectionConfig } from 'payload'

import {
  EDITOR_ROLES,
  anySiteAccess,
  requireRoleAtSiteHook,
  siteScopedAccess,
} from '@/access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    // Image URLs are unguessable, and serving them without auth keeps them
    // cacheable and lets the offline cache work.
    read: () => true,
    create: anySiteAccess(EDITOR_ROLES),
    update: siteScopedAccess(EDITOR_ROLES),
    delete: siteScopedAccess(['siteAdmin']),
  },
  hooks: {
    beforeValidate: [requireRoleAtSiteHook(EDITOR_ROLES)],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 800, withoutEnlargement: true },
      { name: 'hero', width: 1600, withoutEnlargement: true },
    ],
    adminThumbnail: 'thumbnail',
  },
}
