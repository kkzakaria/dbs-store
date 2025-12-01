import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps extends React.ComponentProps<"div"> {
  variant?: "default" | "small" | "large" | "icon-only"
  showText?: boolean
  asLink?: boolean
}

const sizeMap = {
  small: { icon: 24, text: "text-lg" },
  default: { icon: 32, text: "text-xl" },
  large: { icon: 48, text: "text-3xl" },
  "icon-only": { icon: 32, text: "" },
}

function Logo({
  variant = "default",
  showText = true,
  asLink = true,
  className,
  ...props
}: LogoProps) {
  const size = sizeMap[variant]
  const shouldShowText = showText && variant !== "icon-only"

  const content = (
    <div
      data-slot="logo"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {/* Logo Icon - Stylized "D" with circuit pattern */}
      <svg
        width={size.icon}
        height={size.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="[stop-color:hsl(var(--primary))]" />
            <stop offset="100%" className="[stop-color:hsl(var(--primary)/0.8)]" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="[stop-color:hsl(var(--accent-foreground))]" />
            <stop offset="100%" className="[stop-color:hsl(var(--accent-foreground)/0.8)]" />
          </linearGradient>
        </defs>

        {/* Main circle */}
        <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />

        {/* Letter D */}
        <path
          d="M16 12H26C32.627 12 38 17.373 38 24C38 30.627 32.627 36 26 36H16V12Z"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner vertical line of D */}
        <line
          x1="16"
          y1="12"
          x2="16"
          y2="36"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Circuit dots - accent color */}
        <circle cx="26" cy="18" r="2" className="fill-[hsl(var(--accent-foreground))]" />
        <circle cx="30" cy="24" r="2" className="fill-[hsl(var(--accent-foreground))]" />
        <circle cx="26" cy="30" r="2" className="fill-[hsl(var(--accent-foreground))]" />
      </svg>

      {/* Text */}
      {shouldShowText && (
        <span className={cn("font-bold tracking-tight", size.text)}>
          <span className="text-primary">DBS</span>
          <span className="text-accent-foreground"> Store</span>
        </span>
      )}
    </div>
  )

  if (asLink) {
    return (
      <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
        {content}
      </Link>
    )
  }

  return content
}

export { Logo }
