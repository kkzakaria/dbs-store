"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoMarqueeProps {
  className?: string
  reverse?: boolean
  pauseOnHover?: boolean
  speed?: number
}

const logos = [
  { name: "JBL", path: "/images/logo-maquee/128px-JBL-Logo.png" },
  { name: "Nothing", path: "/images/logo-maquee/128px-Nothing.png" },
  { name: "Apple", path: "/images/logo-maquee/apple-11 (1).svg" },
  { name: "Canon", path: "/images/logo-maquee/canon-wordmark-1.svg" },
  { name: "DJI", path: "/images/logo-maquee/dji-1.svg" },
  { name: "HP", path: "/images/logo-maquee/hp-5.svg" },
  { name: "Huawei", path: "/images/logo-maquee/huawei-2.svg" },
  { name: "Honor", path: "/images/logo-maquee/huawei-honor-logo.svg" },
  { name: "Lenovo", path: "/images/logo-maquee/lenovo-2.svg" },
  { name: "Nintendo", path: "/images/logo-maquee/nintendo-4.svg" },
  { name: "OnePlus", path: "/images/logo-maquee/oneplus-wordmark-4.svg" },
  { name: "Oppo", path: "/images/logo-maquee/oppo-2022-1.svg" },
  { name: "Ray-Ban", path: "/images/logo-maquee/ray-ban.svg" },
  { name: "Samsung", path: "/images/logo-maquee/samsung-electronics.svg" },
  { name: "SanDisk", path: "/images/logo-maquee/sandisk.svg" },
  { name: "Sony", path: "/images/logo-maquee/sony-2.svg" },
  { name: "Xiaomi", path: "/images/logo-maquee/xiaomi-1.svg" },
]

export function LogoMarquee({
  className,
  reverse = false,
  pauseOnHover = true,
  speed = 40, // seconds for one full loop
}: LogoMarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden p-2 [--gap:4rem] [gap:var(--gap)] flex-row",
        className
      )}
      style={
        {
          "--duration": `${speed}s`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex shrink-0 justify-around [gap:var(--gap)] animate-marquee",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
      >
        {logos.map((logo, idx) => (
          <div
            key={`${logo.name}-${idx}`}
            className="flex h-12 w-auto items-center justify-center"
          >
            <Image
              src={logo.path}
              alt={logo.name}
              width={120}
              height={48}
              className="h-8 md:h-10 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            />
          </div>
        ))}
      </div>
      <div
        className={cn(
          "flex shrink-0 justify-around [gap:var(--gap)] animate-marquee",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        aria-hidden="true"
      >
        {logos.map((logo, idx) => (
          <div
            key={`${logo.name}-clone-${idx}`}
            className="flex h-12 w-auto items-center justify-center"
          >
            <Image
              src={logo.path}
              alt={logo.name}
              width={120}
              height={48}
              className="h-8 md:h-10 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
