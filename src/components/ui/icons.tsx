import React from 'react'

type IconProps = { size?: number; stroke?: number; className?: string }

const base = (size: number, stroke: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: stroke,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
})

export const ChevronLeft = ({ size = 24, stroke = 2, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <polyline points="15 5 8 12 15 19" />
  </svg>
)
export const ChevronRight = ({ size = 20, stroke = 2, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <polyline points="9 5 16 12 9 19" />
  </svg>
)
export const ChevronSmall = ({ size = 16, stroke = 2.2, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <polyline points="9 6 15 12 9 18" />
  </svg>
)
export const Search = ({ size = 20, stroke = 2, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
)
export const Plus = ({ size = 22, stroke = 2.4, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <line x1="12" y1="5" x2="12" y2="19" />
  </svg>
)
export const Minus = ({ size = 22, stroke = 2.4, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
export const Close = ({ size = 20, stroke = 2.4, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
)
export const Heart = ({
  size = 24,
  stroke = 2,
  className,
  filled = false,
}: IconProps & { filled?: boolean }) => (
  <svg {...base(size, stroke, className)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" />
  </svg>
)
export const Clock = ({ size = 18, stroke = 2, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <circle cx="12" cy="12" r="8.5" />
    <polyline points="12 7.5 12 12 15 14" />
  </svg>
)
export const List = ({ size = 20, stroke = 2, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <line x1="9" y1="7" x2="20" y2="7" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="17" x2="20" y2="17" />
    <circle cx="4.5" cy="7" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="17" r="1" />
  </svg>
)
export const Phone = ({ size = 22, stroke = 2, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <rect x="6" y="3" width="12" height="18" rx="2.5" />
    <line x1="10" y1="7" x2="14" y2="7" />
  </svg>
)
export const Check = ({ size = 18, stroke = 3, className }: IconProps) => (
  <svg {...base(size, stroke, className)}>
    <polyline points="5 12.5 10 17.5 19 7" />
  </svg>
)
export const ClearCircle = ({ className }: { className?: string }) => (
  <span
    className={`flex h-5 w-5 items-center justify-center rounded-full bg-ink-3 text-surface ${className ?? ''}`}
    aria-hidden
  >
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <line x1="2" y1="2" x2="8" y2="8" />
      <line x1="8" y1="2" x2="2" y2="8" />
    </svg>
  </span>
)
