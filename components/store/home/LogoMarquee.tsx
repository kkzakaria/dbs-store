"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

export interface Logo {
  name: string
  path: string
  scale?: number
}

interface LogoMarqueeProps {
  logos?: Logo[]
  className?: string
  reverse?: boolean
  pauseOnHover?: boolean
  speed?: number
  fadeEdges?: boolean
}

const defaultLogos: Logo[] = [
  { name: "JBL", path: "/images/logo-marquee/128px-JBL-Logo.png" },
  { name: "Nothing", path: "/images/logo-marquee/128px-Nothing.png" },
  { name: "Apple", path: "/images/logo-marquee/apple-11 (1).svg" },
  { name: "Canon", path: "/images/logo-marquee/canon-wordmark-1.svg" },
  { name: "DJI", path: "/images/logo-marquee/dji-1.svg" },
  { name: "HP", path: "/images/logo-marquee/hp-5.svg", scale: 1.4 },
  { name: "Huawei", path: "/images/logo-marquee/huawei-2.svg", scale: 2 },
  { name: "Honor", path: "/images/logo-marquee/huawei-honor-logo.svg" },
  { name: "Lenovo", path: "/images/logo-marquee/lenovo-2.svg" },
  { name: "Nintendo", path: "/images/logo-marquee/nintendo-4.svg" },
  { name: "OnePlus", path: "/images/logo-marquee/oneplus-wordmark-4.svg" },
  { name: "Oppo", path: "/images/logo-marquee/oppo-2022-1.svg" },
  { name: "Ray-Ban", path: "/images/logo-marquee/ray-ban.svg", scale: 1.5 },
  { name: "Samsung", path: "/images/logo-marquee/samsung-electronics.svg" },
  { name: "SanDisk", path: "/images/logo-marquee/sandisk.svg" },
  { name: "Sony", path: "/images/logo-marquee/sony-2.svg", scale: 2 },
  { name: "Xiaomi", path: "/images/logo-marquee/xiaomi-1.svg" },
]

function LogoItem({ logo }: { logo: Logo }) {
  return (
    <div className="flex h-16 w-auto min-w-[120px] items-center justify-center p-2">
      <Image
        src={logo.path}
        alt={logo.name}
        width={140}
        height={56}
        className="h-10 md:h-14 w-auto max-w-[100px] md:max-w-[150px] object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 dark:invert dark:opacity-50 dark:hover:opacity-90 transition-all duration-300 motion-reduce:transition-none"
        style={logo.scale ? { transform: `scale(${logo.scale})` } : undefined}
      />
    </div>
  )
}

export function LogoMarquee({
  logos = defaultLogos,
  className,
  reverse = false,
  pauseOnHover = true,
  speed = 40,
  fadeEdges = true,
}: LogoMarqueeProps) {
  const trackClasses = cn(
    "flex shrink-0 [gap:var(--gap)] animate-marquee motion-reduce:[animation-play-state:paused]",
    reverse && "[animation-direction:reverse]",
    pauseOnHover && "group-hover:[animation-play-state:paused]"
  )

  return (
    <div
      className={cn(
        "group relative flex overflow-hidden py-2 px-4 [--gap:6rem] [gap:var(--gap)] flex-row",
        className
      )}
      style={{ "--duration": `${speed}s` } as React.CSSProperties}
      role="marquee"
      aria-label="Nos marques partenaires"
    >
      {fadeEdges ? (
        <>
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />
        </>
      ) : null}

      <div className={trackClasses}>
        {logos.map((logo, idx) => (
          <LogoItem key={`${logo.name}-${idx}`} logo={logo} />
        ))}
      </div>
      <div className={trackClasses} aria-hidden="true">
        {logos.map((logo, idx) => (
          <LogoItem key={`${logo.name}-clone-${idx}`} logo={logo} />
        ))}
      </div>
    </div>
  )
}
