import React from 'react'

import { avatarParams } from '@/lib/avatar'

export type AvatarParams = ReturnType<typeof avatarParams>

/** Stable avatar parameters for a user. Seeded with the lower-cased email, never change this. */
export function avatarFor(email: string): AvatarParams {
  return avatarParams(email.trim().toLowerCase())
}

/**
 * Generated avatar: circle with an offset circle and a rotated rounded square
 * from a fixed palette. Pure CSS so there are no SVG id collisions.
 */
export function Avatar({
  params,
  size,
  label,
}: {
  params: AvatarParams
  size: number
  label?: string
}) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full align-middle"
      style={{ width: size, height: size, background: params.bg }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: '70%',
          height: '70%',
          left: `${params.x1}%`,
          top: `${params.y1}%`,
          background: params.c1,
        }}
      />
      <span
        className="absolute"
        style={{
          width: '55%',
          height: '55%',
          left: `${params.x2}%`,
          top: `${params.y2}%`,
          borderRadius: '18%',
          transform: `rotate(${params.rot}deg)`,
          background: params.c2,
        }}
      />
    </span>
  )
}
