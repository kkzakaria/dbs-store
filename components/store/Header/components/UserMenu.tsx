"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User as UserIcon, Package, Heart, LogOut, Shield, ChevronRight, Settings } from "lucide-react"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { User } from "@/types"

interface UserMenuProps {
  isScrolled: boolean
  mounted: boolean
  isLoading: boolean
  authUser: AuthUser | null
  user: User | null
  userInitials: string
  onSignOut: () => void
  onLogin: () => void
  mobileUserMenuOpen: boolean
  setMobileUserMenuOpen: (open: boolean) => void
}

import { MobileUserMenu } from "./MobileUserMenu"

export function UserMenu({
  isScrolled,
  mounted,
  isLoading,
  authUser,
  user,
  userInitials,
  onSignOut,
  onLogin,
  mobileUserMenuOpen,
  setMobileUserMenuOpen,
}: UserMenuProps) {
  const pathname = usePathname()

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileUserMenuOpen(false)
  }, [pathname])

  // Loading state
  if (!mounted || isLoading) {
    return (
      <div
        className={cn(
          "rounded-full bg-muted animate-pulse",
          isScrolled ? "h-8 w-8" : "h-9 w-9"
        )}
      />
    )
  }

  const TriggerButton = ({ onClick, className }: { onClick?: () => void, className?: string }) => (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "rounded-full hover:bg-muted relative",
        isScrolled ? "h-8 w-8" : "h-10 w-10 p-0",
        className
      )}
    >
      {authUser ? (
        <Avatar className={cn(isScrolled ? "h-7 w-7" : "h-8 w-8")}>
          <AvatarImage src={user?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      ) : (
        <UserIcon className={cn(isScrolled ? "size-5" : "size-6")} />
      )}
    </Button>
  )

  return (
    <>
      {/* --- DESKTOP VIEW (Dropdown) --- */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span><TriggerButton /></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-80 p-0 rounded-xl shadow-google-lg animate-slide-up border-none bg-background overflow-hidden"
            align="end"
            sideOffset={8}
          >
            {/* Desktop Menu Content - Kept inline for simplicity as it uses Dropdown primitives */}
            {/* Header Section */}
            <div className="p-4 border-b">
              {authUser ? (
                <Link href="/account" className="flex items-center gap-3 group">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={user?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user?.full_name || 'Utilisateur'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-center text-muted-foreground mb-2">Connectez-vous pour plus de fonctionnalités</p>
                  <Button 
                    onClick={onLogin}
                    className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 font-medium"
                  >
                    Connexion / Inscription
                  </Button>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {user?.role && (user.role === 'admin' || user.role === 'super_admin') && (
                <DropdownMenuItem asChild className="rounded-none cursor-pointer hover:bg-muted/50 focus:bg-muted/50 h-12 px-6">
                  <Link href="/admin" className="flex items-center gap-4 text-blue-600">
                    <Shield className="size-5" />
                    <span className="text-sm font-medium">Administration</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild className="rounded-none cursor-pointer hover:bg-muted/50 focus:bg-muted/50 h-12 px-6">
                <Link href="/orders" className="flex items-center gap-4">
                  <Package className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Commandes</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild className="rounded-none cursor-pointer hover:bg-muted/50 focus:bg-muted/50 h-12 px-6">
                <Link href="/wishlist" className="flex items-center gap-4">
                  <Heart className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Favoris</span>
                </Link>
              </DropdownMenuItem>
            </div>

            <div className="h-px bg-border/50 mx-0" />

            <div className="py-2">
              {authUser && (
                <DropdownMenuItem asChild className="rounded-none cursor-pointer hover:bg-muted/50 focus:bg-muted/50 h-12 px-6">
                  <Link href="/account" className="flex items-center gap-4">
                    <Settings className="size-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Paramètres</span>
                  </Link>
                </DropdownMenuItem>
              )}

              {authUser && (
                <DropdownMenuItem 
                  onClick={onSignOut}
                  className="rounded-none cursor-pointer hover:bg-muted/50 focus:bg-muted/50 h-12 px-6 text-destructive focus:text-destructive"
                >
                  <div className="flex items-center gap-4">
                    <LogOut className="size-5" />
                    <span className="text-sm font-medium">Déconnexion</span>
                  </div>
                </DropdownMenuItem>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- MOBILE VIEW (Sheet/Overlay) --- */}
      <div className="md:hidden">
        <TriggerButton onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)} />
        
        <MobileUserMenu 
          open={mobileUserMenuOpen}
          onOpenChange={setMobileUserMenuOpen}
          authUser={authUser}
          user={user}
          userInitials={userInitials}
          onSignOut={onSignOut}
          onLogin={onLogin}
        />
      </div>
    </>
  )
}
