import type { CollectionConfig } from 'payload'

import { groupAdminOnly, isGroupAdmin, siteIdsWithRole } from '@/access/roles'
import { slugify } from '@/lib/slugify'

export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'domains'],
    group: 'Settings',
  },
  access: {
    // Branding is needed before sign-in, so sites are readable by anyone.
    read: () => true,
    create: groupAdminOnly,
    update: ({ req }) => {
      if (isGroupAdmin(req.user)) return true
      const ids = siteIdsWithRole(req.user, ['siteAdmin'])
      return ids.length > 0 ? { id: { in: ids } } : false
    },
    delete: groupAdminOnly,
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
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Short identifier, for example "qch". Used in URLs and configuration.',
      },
      access: {
        update: ({ req }) => isGroupAdmin(req.user),
      },
      hooks: {
        beforeValidate: [({ value, data }) => slugify(value || data?.name || '')],
      },
    },
    {
      name: 'domains',
      type: 'array',
      labels: { singular: 'Domain', plural: 'Domains' },
      admin: {
        description:
          'Hostnames that serve this site, for example spongecake.thequalitychophouse.com',
      },
      access: {
        update: ({ req }) => isGroupAdmin(req.user),
      },
      fields: [
        {
          name: 'hostname',
          type: 'text',
          required: true,
          index: true,
          hooks: {
            beforeValidate: [
              ({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
            ],
          },
        },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Square logo, at least 512px, used in the header and as the home screen icon.',
      },
    },
    {
      name: 'accentColour',
      type: 'text',
      defaultValue: '#b45309',
      validate: (value: unknown) =>
        typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
          ? true
          : 'Enter a hex colour such as #b45309',
      admin: {
        description: 'Hex colour for the top border and controls.',
      },
    },
    {
      name: 'homeTags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      filterOptions: ({ id }) => ({ site: { equals: id } }),
      admin: {
        description: 'Tags shown as sections on the home page, in this order.',
      },
    },
  ],
}
