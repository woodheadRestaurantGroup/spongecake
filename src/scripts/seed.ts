/**
 * Local development seed. Creates the QCH site on localhost, three users
 * with different roles, a handful of tags and recipes.
 *
 *   pnpm seed
 *
 * Safe to rerun: it does nothing if the site already exists.
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        textFormat: 0,
        children: [
          { type: 'text', text, version: 1, format: 0, mode: 'normal', style: '', detail: 0 },
        ],
      },
    ],
  },
})

async function seed() {
  const payload = await getPayload({ config: await config })

  const existing = await payload.find({
    collection: 'sites',
    where: { slug: { equals: 'qch' } },
    limit: 1,
  })
  if (existing.totalDocs > 0) {
    payload.logger.info('Seed already applied (site "qch" exists). Nothing to do.')
    await payload.db.destroy?.()
    return
  }

  const qch = await payload.create({
    collection: 'sites',
    data: {
      name: 'The Quality Chop House',
      slug: 'qch',
      domains: [{ hostname: 'localhost' }, { hostname: 'spongecake.thequalitychophouse.com' }],
      accentColour: '#8b2d2d',
    },
  })

  const admin = await payload.create({
    collection: 'users',
    data: { name: 'Group Admin', email: 'admin@example.com', isGroupAdmin: true },
  })
  const editor = await payload.create({
    collection: 'users',
    data: {
      name: 'Head Chef',
      email: 'editor@example.com',
      memberships: [{ site: qch.id, role: 'editor' }],
    },
  })
  await payload.create({
    collection: 'users',
    data: {
      name: 'Chef de Partie',
      email: 'viewer@example.com',
      memberships: [{ site: qch.id, role: 'viewer' }],
    },
  })

  const tagNames = ['Starters', 'Mains', 'Sauces', 'Pastry', 'Bread', 'Staff food']
  const tags: Record<string, number> = {}
  for (const name of tagNames) {
    const tag = await payload.create({ collection: 'tags', data: { name, site: qch.id } })
    tags[name] = tag.id
  }
  await payload.update({
    collection: 'sites',
    id: qch.id,
    data: { homeTags: ['Starters', 'Mains', 'Sauces', 'Pastry', 'Bread'].map((n) => tags[n]) },
  })

  const mayo = await payload.create({
    collection: 'recipes',
    data: {
      title: 'House mayonnaise',
      site: qch.id,
      author: editor.id,
      _status: 'published',
      tags: [tags['Sauces']],
      yield: { amount: 1, label: 'litre' },
      ingredientSections: [
        {
          ingredients: [
            { quantity: 6, unit: 'each', item: 'egg yolks' },
            { quantity: 30, unit: 'g', item: 'Dijon mustard' },
            { quantity: 40, unit: 'ml', item: 'white wine vinegar' },
            { quantity: 800, unit: 'ml', item: 'rapeseed oil' },
            { quantity: null, unit: 'none', item: 'salt', scales: false, note: 'to taste' },
          ],
        },
      ],
      method: [
        { text: paragraph('Whisk the yolks, mustard and half the vinegar until pale.') },
        {
          text: paragraph(
            'Add the oil in a thin stream, whisking constantly, until thick and glossy.',
          ),
        },
        {
          text: paragraph(
            'Loosen with the remaining vinegar. Season. Keeps three days in the fridge.',
          ),
        },
      ],
    },
  })

  await payload.create({
    collection: 'recipes',
    data: {
      title: 'Confit potatoes',
      site: qch.id,
      author: editor.id,
      _status: 'published',
      tags: [tags['Mains']],
      yield: { amount: 12, label: 'portions' },
      ingredientSections: [
        {
          title: 'For the potatoes',
          ingredients: [
            { quantity: 3, unit: 'kg', item: 'Maris Piper potatoes', note: 'peeled' },
            { quantity: 1.5, unit: 'l', item: 'beef dripping', note: 'melted' },
            { quantity: 6, unit: 'each', item: 'garlic cloves', note: 'crushed' },
            { quantity: 1, unit: 'bunch', item: 'thyme' },
            { quantity: 2, unit: 'tbsp', item: 'flaky salt' },
          ],
        },
        {
          title: 'To serve',
          ingredients: [{ quantity: 100, unit: 'g', subRecipe: mayo.id, note: 'per portion' }],
        },
      ],
      method: [
        {
          text: paragraph(
            'Slice the potatoes 2mm on a mandoline. Toss with salt, garlic and picked thyme.',
          ),
        },
        {
          text: paragraph(
            'Layer tightly into a lined gastro, pouring dripping between layers. Press with a second tray.',
          ),
        },
        {
          text: paragraph(
            'Bake at 160°C for 2 hours until a knife meets no resistance. Press overnight.',
          ),
        },
        {
          text: paragraph(
            'Portion into 12. Fry in dripping until golden on all sides. Serve with mayonnaise.',
          ),
        },
      ],
      notes: paragraph('Keeps five days pressed and wrapped. Fry from cold.'),
    },
  })

  await payload.create({
    collection: 'recipes',
    data: {
      title: 'Brown butter brioche',
      site: qch.id,
      author: admin.id,
      _status: 'draft',
      tags: [tags['Bread'], tags['Pastry']],
      yield: { amount: 2, label: 'loaves' },
      ingredientSections: [
        {
          ingredients: [
            { quantity: 500, unit: 'g', item: 'strong white flour' },
            { quantity: 10, unit: 'g', item: 'salt' },
            { quantity: 60, unit: 'g', item: 'caster sugar' },
            { quantity: 14, unit: 'g', item: 'fresh yeast' },
            { quantity: 6, unit: 'each', item: 'eggs' },
            { quantity: 250, unit: 'g', item: 'brown butter', note: 'soft' },
          ],
        },
      ],
      method: [
        {
          text: paragraph('Mix everything but the butter to a smooth dough. Add butter gradually.'),
        },
        {
          text: paragraph(
            'Prove overnight in the fridge. Shape, prove again, bake at 180°C for 30 minutes.',
          ),
        },
      ],
    },
  })

  payload.logger.info(
    'Seeded site "qch" with users admin@example.com, editor@example.com, viewer@example.com.',
  )
  await payload.db.destroy?.()
}

// `payload run` exits as soon as the import settles, so the work must be awaited here.
await seed()
