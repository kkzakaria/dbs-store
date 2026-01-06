import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

interface FloatingMenuButtonProps {
  isScrolled: boolean
  isOpen: boolean
  onClick: () => void
}

export function FloatingMenuButton({ isScrolled, isOpen, onClick }: FloatingMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-[102] flex lg:hidden items-center justify-center",
        "w-10 h-10 rounded-full bg-primary text-primary-foreground",
        "shadow-google-lg hover:shadow-google-lg hover:scale-105",
        "transition-all duration-500 ease-out",
        (isScrolled || isOpen)
          ? "top-[15px] left-4 opacity-100 translate-x-0"
          : "top-[15px] left-4 opacity-0 -translate-x-4 pointer-events-none"
      )}
      aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
    >
      {isOpen ? (
        <X className="size-5" />
      ) : (
        <Menu className="size-5" />
      )}
    </button>
  )
}
