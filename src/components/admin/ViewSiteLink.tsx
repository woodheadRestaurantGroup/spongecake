import Link from 'next/link'
import React from 'react'

/**
 * Rendered in the Payload admin header (top bar) on every page.
 * The counterpart to the front end's "Admin" button.
 */
export function ViewSiteLink() {
  return (
    <Link
      href="/"
      className="btn btn--style-pill btn--size-small"
      style={{ margin: 0, textDecoration: 'none', whiteSpace: 'nowrap' }}
    >
      View site
    </Link>
  )
}
