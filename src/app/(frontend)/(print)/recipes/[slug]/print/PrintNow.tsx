'use client'

import { useEffect } from 'react'

/** Opens the print dialog once the sheet has rendered, and offers a button in case it was dismissed. */
export function PrintNow() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300)
    return () => clearTimeout(t)
  }, [])
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        height: 36,
        padding: '0 14px',
        borderRadius: 10,
        border: '1px solid #000',
        fontWeight: 600,
        background: '#fff',
      }}
    >
      Print
    </button>
  )
}
