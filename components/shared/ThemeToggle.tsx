"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  isScrolled?: boolean
}

export function ThemeToggle({ isScrolled }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const buttonClasses = cn(
    "rounded-full text-foreground hover:text-primary hover:bg-primary/5 transition-google",
    isScrolled ? "h-8 w-8" : "h-10 w-10"
  )

  const iconClasses = cn(isScrolled ? "size-4" : "size-5", "transition-all")

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className={buttonClasses}>
        <SunIcon className={iconClasses} />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={`Passer en mode ${theme === "dark" ? "clair" : "sombre"}`}
      className={buttonClasses}
    >
      <SunIcon
        className={cn(
          iconClasses,
          "rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
        )}
      />
      <MoonIcon
        className={cn(
          "absolute",
          iconClasses,
          "rotate-90 scale-0 dark:rotate-0 dark:scale-100"
        )}
      />
    </Button>
  )
}
