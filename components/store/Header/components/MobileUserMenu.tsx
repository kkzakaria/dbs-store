"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, Package, Heart, Settings, LogOut, ChevronRight } from "lucide-react"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { User } from "@/types"

interface MobileUserMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authUser: AuthUser | null
  user: User | null
  userInitials: string
  onSignOut: () => void
  onLogin: () => void
}

import { createPortal } from "react-dom"

export function MobileUserMenu({
  open,
  onOpenChange,
  authUser,
  user,
  userInitials,
  onSignOut,
  onLogin,
}: MobileUserMenuProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open || !mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[99] bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet Overlay */}
      <div 
        className={cn(
          "fixed inset-x-0 top-0 z-[100]",
          "animate-in slide-in-from-bottom-[5%] duration-500 ease-out",
          "h-[100dvh] flex flex-col"
        )}
      >
        {/* Transparent Spacer for Appbar */}
        <div className="h-[72px] shrink-0 bg-transparent" onClick={() => onOpenChange(false)} />

        {/* Menu Sheet - Rounded Top */}
        <div className="flex-1 bg-background rounded-t-[32px] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative">
          <div className="overflow-y-auto h-full hide-scrollbar pt-4 pb-24 px-0"> {/* Adjusted padding to match MobileNav structure */}
            
             {/* Header Section - Profile */}
            <div className="mb-6 px-6"> {/* Added px-6 to match MobileNav content padding if needed, or keep standard */}
              {authUser ? (
                <Link 
                  href="/account" 
                  className="flex items-center gap-4 group"
                  onClick={() => onOpenChange(false)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 border-2 border-border/50 shadow-sm">
                      <AvatarImage src={user?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate tracking-tight">{user?.full_name || 'Utilisateur'}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-medium">{user?.email}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-3 py-1">
                  <p className="text-[13px] text-center text-muted-foreground font-medium px-4">Accédez à votre compte</p>
                  <Button 
                    onClick={() => {
                        onLogin()
                        onOpenChange(false)
                    }}
                    className="w-full rounded-full h-10 text-sm font-bold shadow-google-sm"
                  >
                    Connexion
                  </Button>
                </div>
              )}
            </div>

            {/* Menu Items - Capsules */}
            <div className="flex flex-col gap-2 px-4">
              {/* Admin Link */}
              {user?.role && (user.role === 'admin' || user.role === 'super_admin') && (
                 <Link 
                    href="/admin" 
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center justify-between w-full p-2 pl-6 rounded-[32px]",
                      "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all duration-200",
                      "min-h-[48px]"
                    )}
                  >
                    <span className="text-sm font-semibold tracking-tight text-blue-700 dark:text-blue-400">Administration</span>
                    <div className="flex items-center justify-center p-2 mr-0 rounded-full bg-white dark:bg-black/10 shadow-sm h-9 w-9">
                      <Shield className="size-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </Link>
              )}

              <Link 
                href="/orders" 
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center justify-between w-full p-1 pl-5 rounded-[32px]",
                  "bg-[#F1F3F4] dark:bg-muted hover:bg-[#E8EAED] dark:hover:bg-muted/80 transition-all duration-200",
                  "min-h-[48px]"
                )}
              >
                <span className="text-sm font-semibold tracking-tight text-foreground">Commandes</span>
                <div className="flex items-center justify-center p-2 mr-0 rounded-full bg-white dark:bg-black/10 shadow-sm h-9 w-9">
                  <Package className="size-4.5 text-foreground" />
                </div>
              </Link>
              
              <Link 
                href="/wishlist" 
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center justify-between w-full p-1 pl-5 rounded-[32px]",
                  "bg-[#F1F3F4] dark:bg-muted hover:bg-[#E8EAED] dark:hover:bg-muted/80 transition-all duration-200",
                  "min-h-[48px]"
                )}
              >
                <span className="text-sm font-semibold tracking-tight text-foreground">Favoris</span>
                <div className="flex items-center justify-center p-2 mr-0 rounded-full bg-white dark:bg-black/10 shadow-sm h-9 w-9">
                  <Heart className="size-4.5 text-foreground" />
                </div>
              </Link>

              {authUser && (
                <Link 
                  href="/account" 
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center justify-between w-full p-1 pl-5 rounded-[32px]",
                    "bg-[#F1F3F4] dark:bg-muted hover:bg-[#E8EAED] dark:hover:bg-muted/80 transition-all duration-200",
                    "min-h-[48px]"
                  )}
                >
                  <span className="text-sm font-semibold tracking-tight text-foreground">Paramètres</span>
                  <div className="flex items-center justify-center p-2 mr-0 rounded-full bg-white dark:bg-black/10 shadow-sm h-9 w-9">
                    <Settings className="size-4.5 text-foreground" />
                  </div>
                </Link>
              )}

              {authUser && (
                <button 
                  onClick={() => {
                      onSignOut()
                      onOpenChange(false)
                  }}
                  className={cn(
                    "flex items-center justify-between w-full p-1 pl-5 rounded-[32px]",
                    "bg-[#F1F3F4] dark:bg-muted hover:bg-[#E8EAED] dark:hover:bg-muted/80 transition-all duration-200",
                    "min-h-[48px] text-left"
                  )}
                >
                  <span className="text-sm font-semibold tracking-tight text-destructive">Déconnexion</span>
                  <div className="flex items-center justify-center p-2 mr-0 rounded-full bg-white dark:bg-black/10 shadow-sm h-9 w-9">
                    <LogOut className="size-4.5 text-destructive" />
                  </div>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
