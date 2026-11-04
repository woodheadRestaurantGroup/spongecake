import React from 'react'

import { avatarFor } from '@/components/Avatar'
import { HomeScreen } from '@/components/home/HomeScreen'
import { DesktopHome } from '@/components/desktop/DesktopHome'
import {
  favouriteIds,
  idOf,
  listPublishedRecipes,
  listTags,
  siteInitial,
} from '@/lib/recipes/queries'
import { getRequestContext } from '@/lib/request'

export default async function HomePage() {
  const { payload, site, user, role } = await getRequestContext()
  if (!site || !user) return null

  const [recipes, tags] = await Promise.all([
    listPublishedRecipes(payload, site.id),
    listTags(payload, site.id),
  ])
  const homeTagIds = (site.homeTags ?? []).map(idOf).filter((id): id is number => id !== undefined)
  const favourites = favouriteIds(user)

  return (
    <>
      <h1 className="sr-only">{site.name} recipes</h1>
      <HomeScreen
        site={{ name: site.name, initial: siteInitial(site.name), slug: site.slug }}
        me={{ avatar: avatarFor(user.email) }}
        isEditor={role === 'editor' || role === 'siteAdmin'}
        recipes={recipes}
        tags={tags}
        homeTagIds={homeTagIds}
        favouriteIds={favourites}
      />
      <DesktopHome siteSlug={site.slug} recipes={recipes} favouriteIds={favourites} />
    </>
  )
}
