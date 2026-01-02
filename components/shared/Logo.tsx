import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps extends React.ComponentProps<"div"> {
  variant?: "default" | "small" | "large" | "icon-only"
  showText?: boolean
  asLink?: boolean
}

const sizeMap = {
  small: { width: 60, height: 36 },
  default: { width: 90, height: 54 },
  large: { width: 160, height: 96 },
  "icon-only": { width: 80, height: 48 },
}

function Logo({
  variant = "default",
  asLink = true,
  className,
  ...props
}: LogoProps) {
  const size = sizeMap[variant]

  const content = (
    <div
      data-slot="logo"
      className={cn("flex items-center", className)}
      {...props}
    >
      <Image
        src="/dbs-store-logo.png"
        alt="DBS Store"
        width={size.width}
        height={size.height}
        className="shrink-0 object-contain h-full w-auto"
        priority
      />
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
