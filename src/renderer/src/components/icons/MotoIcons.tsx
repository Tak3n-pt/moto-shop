import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function GearIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M10.3 2.3l-.5 2a7 7 0 0 0-2 1.2l-1.9-.7-1.7 3 1.4 1.3a7 7 0 0 0 0 2.4l-1.4 1.3 1.7 3 1.9-.7a7 7 0 0 0 2 1.2l.5 2h3.4l.5-2a7 7 0 0 0 2-1.2l1.9.7 1.7-3-1.4-1.3a7 7 0 0 0 0-2.4l1.4-1.3-1.7-3-1.9.7a7 7 0 0 0-2-1.2l-.5-2h-3.4Z" />
    </svg>
  )
}

export function ChainLinkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="12" rx="8" ry="6" />
      <ellipse cx="28" cy="12" rx="8" ry="6" />
    </svg>
  )
}

export function MotorcycleSilhouette(props: IconProps) {
  return (
    <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Rear wheel */}
      <circle cx="25" cy="58" r="16" />
      <circle cx="25" cy="58" r="10" />
      <circle cx="25" cy="58" r="3" />
      {/* Front wheel */}
      <circle cx="95" cy="58" r="16" />
      <circle cx="95" cy="58" r="10" />
      <circle cx="95" cy="58" r="3" />
      {/* Frame and body */}
      <path d="M25 58 L45 30 L70 25 L85 35 L95 58" />
      <path d="M45 30 L55 45 L75 45 L85 35" />
      {/* Engine block */}
      <rect x="42" y="38" width="20" height="14" rx="2" />
      {/* Seat */}
      <path d="M38 28 Q50 20 70 25" strokeWidth={2.5} />
      {/* Handlebars */}
      <path d="M82 20 L88 28 L85 35" />
      <path d="M80 18 L86 16" />
      {/* Front fork */}
      <path d="M88 28 L95 58" />
      {/* Exhaust */}
      <path d="M42 50 L20 55 L18 52" strokeWidth={2} />
      {/* Fenders */}
      <path d="M10 52 Q25 38 40 52" />
      <path d="M80 52 Q95 38 110 52" />
      {/* Headlight */}
      <circle cx="92" cy="30" r="3" />
      {/* Taillight */}
      <circle cx="35" cy="28" r="2" />
    </svg>
  )
}

export function PistonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Piston head */}
      <rect x="4" y="2" width="16" height="8" rx="2" />
      <line x1="4" y1="5" x2="20" y2="5" />
      <line x1="4" y1="7" x2="20" y2="7" />
      {/* Connecting rod */}
      <path d="M10 10 L10 22 M14 10 L14 22" />
      {/* Wrist pin */}
      <circle cx="12" cy="22" r="3" />
      {/* Rod extension */}
      <line x1="12" y1="25" x2="12" y2="30" />
    </svg>
  )
}

export function WrenchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Wrench 1 */}
      <path d="M6 4 L4 6 L12 14 L14 12 Z" />
      <path d="M3 3 Q1 5 4 6 L6 4 Q5 1 3 3Z" />
      <path d="M12 14 L16 18" />
      {/* Wrench 2 */}
      <path d="M22 4 L24 6 L16 14 L14 12 Z" />
      <path d="M25 3 Q27 5 24 6 L22 4 Q23 1 25 3Z" />
      <path d="M16 14 L12 18" />
      {/* Center bolt */}
      <circle cx="14" cy="14" r="2" />
    </svg>
  )
}

export function SparkPlugIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 32" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Terminal */}
      <line x1="8" y1="1" x2="8" y2="5" strokeWidth={2} />
      {/* Insulator */}
      <path d="M5 5 L11 5 L10 14 L6 14 Z" />
      {/* Hex nut */}
      <rect x="4" y="14" width="8" height="4" rx="0.5" />
      <line x1="4" y1="16" x2="12" y2="16" />
      {/* Shell */}
      <path d="M5 18 L11 18 L10 26 L6 26 Z" />
      {/* Electrode */}
      <line x1="8" y1="26" x2="8" y2="30" strokeWidth={1.5} />
      {/* Ground electrode */}
      <path d="M6 30 L10 30 L10 28" />
    </svg>
  )
}

export function MotoEmblem(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Outer gear ring */}
      <circle cx="24" cy="24" r="20" />
      <circle cx="24" cy="24" r="17" />
      {/* Gear teeth */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 24 + 17 * Math.cos(rad)
        const y1 = 24 + 17 * Math.sin(rad)
        const x2 = 24 + 21 * Math.cos(rad)
        const y2 = 24 + 21 * Math.sin(rad)
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2.5} />
      })}
      {/* Motorcycle inside - simplified side view */}
      {/* Wheels */}
      <circle cx="16" cy="28" r="4" strokeWidth={1} />
      <circle cx="32" cy="28" r="4" strokeWidth={1} />
      {/* Frame */}
      <path d="M16 28 L21 20 L28 18 L32 28" strokeWidth={1} />
      {/* Seat */}
      <path d="M19 19 Q24 15 28 18" strokeWidth={1.5} />
      {/* Handlebar */}
      <path d="M30 16 L32 14" strokeWidth={1} />
    </svg>
  )
}

export function HelmetIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20 C4 9 12 2 24 2 C34 2 44 9 44 20" />
      <path d="M4 20 H20 L28 28 H6 C4.9 28 4 27.1 4 26Z" />
      <path d="M32 24 H42" />
      <circle cx="18" cy="16" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ShockAbsorberIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 48" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="12" y="2" width="8" height="6" rx="1.5" />
      <line x1="16" y1="8" x2="16" y2="44" strokeWidth={1.4} />
      <path d="M10 12 L22 12" />
      <path d="M10 18 L22 18" />
      <path d="M10 24 L22 24" />
      <path d="M10 30 L22 30" />
      <path d="M10 36 L22 36" />
      <rect x="10" y="40" width="12" height="6" rx="1.5" />
    </svg>
  )
}

export function WheelIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="24" cy="24" r="20" />
      <circle cx="24" cy="24" r="12" />
      <circle cx="24" cy="24" r="4" />
      {[0, 45, 90, 135].map(angle => {
        const rad = angle * Math.PI / 180
        const x = 24 + 12 * Math.cos(rad)
        const y = 24 + 12 * Math.sin(rad)
        return <line key={angle} x1={24} y1={24} x2={x} y2={y} />
      })}
    </svg>
  )
}

