"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Toggle } from "@/components/ui/toggle"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Toggle variant="outline" className="size-9" disabled>
        <SunIcon size={16} />
      </Toggle>
    )
  }

  return (
    <Toggle
      aria-label={`Passer en mode ${theme === "dark" ? "clair" : "sombre"}`}
      className="group size-9 data-[state=on]:bg-transparent data-[state=on]:hover:bg-muted"
      onPressedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
      pressed={theme === "dark"}
      variant="outline"
    >
      <MoonIcon
        aria-hidden="true"
        className="shrink-0 scale-0 opacity-0 transition-all group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
        size={16}
      />
      <SunIcon
        aria-hidden="true"
        className="absolute shrink-0 scale-100 opacity-100 transition-all group-data-[state=on]:scale-0 group-data-[state=on]:opacity-0"
        size={16}
      />
    </Toggle>
  )
}
