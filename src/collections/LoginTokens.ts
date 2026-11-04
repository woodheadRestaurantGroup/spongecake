import type { CollectionConfig } from 'payload'

/**
 * One-time magic link tokens and six-digit codes. Only ever touched through
 * the local API with overrideAccess, so every access rule is false.
 */
export const LoginTokens: CollectionConfig = {
  slug: 'login-tokens',
  admin: {
    hidden: true,
  },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'tokenHash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'codeHash',
      type: 'text',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
    },
    {
      name: 'usedAt',
      type: 'date',
    },
    {
      name: 'attempts',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'requestIp',
      type: 'text',
    },
    {
      name: 'redirectTo',
      type: 'text',
    },
  ],
}
