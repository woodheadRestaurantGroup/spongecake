import React from 'react'

export const dynamic = 'force-dynamic'

/** Bare layout for the print sheet: no app chrome, white page. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-white text-black">{children}</div>
}
