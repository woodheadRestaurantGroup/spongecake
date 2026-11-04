'use client'

export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="h-11 rounded-[12px] bg-surface-2 px-4 text-[15px] font-semibold active:opacity-70"
    >
      Try again
    </button>
  )
}
