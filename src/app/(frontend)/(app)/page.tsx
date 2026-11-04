import React from 'react'

import { RecipeBrowser } from '@/components/home/RecipeBrowser'
import { idOf, listPublishedRecipes, listTags } from '@/lib/recipes/queries'
import { getRequestContext } from '@/lib/request'

export default async function HomePage() {
  const { payload, site } = await getRequestContext()
  if (!site) return null

  const [recipes, tags] = await Promise.all([
    listPublishedRecipes(payload, site.id),
    listTags(payload, site.id),
  ])
  const homeTagIds = (site.homeTags ?? []).map(idOf).filter((id): id is number => id !== undefined)

  return (
    <>
      <h1 className="sr-only">{site.name} recipes</h1>
      <RecipeBrowser siteSlug={site.slug} recipes={recipes} tags={tags} homeTagIds={homeTagIds} />
    </>
  )
}
