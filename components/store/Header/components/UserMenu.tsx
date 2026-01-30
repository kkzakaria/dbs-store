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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User as UserIcon, Package, Heart, LogOut, Shield, ChevronRight, Settings } from "lucide-react"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { User } from "@/types"

interface UserMenuProps {
  isScrolled: boolean
  isLoading: boolean
  authUser: AuthUser | null
  user: User | null
  userInitials: string
  onSignOut: () => void
  onLogin: () => void
  mobileUserMenuOpen: boolean
  setMobileUserMenuOpen: (open: boolean) => void
  setMobileNavOpen?: (open: boolean) => void
}

import { MobileUserMenu } from "./MobileUserMenu"

const TriggerButton = ({ 
  onClick, 
  className, 
  isScrolled, 
  authUser, 
  user, 
  userInitials 
}: { 
  onClick?: () => void, 
  className?: string,
  isScrolled: boolean,
  authUser: AuthUser | null,
  user: User | null,
  userInitials: string
}) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className={cn(
      "rounded-full hover:bg-primary/5 relative",
      isScrolled ? "h-10 w-10" : "h-10 w-10 p-0",
      className
    )}
  >
    {authUser ? (
      <Avatar className={cn(isScrolled ? "h-8 w-8" : "h-8 w-8")}>
        <AvatarImage src={user?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
          {userInitials}
        </AvatarFallback>
      </Avatar>
    ) : (
      <UserIcon className={cn(isScrolled ? "size-[22px]" : "size-6")} />
    )}
  </Button>
)

export function UserMenu({
  isScrolled,
  isLoading,
  authUser,
  user,
  userInitials,
  onSignOut,
  onLogin,
  mobileUserMenuOpen,
  setMobileUserMenuOpen,
  setMobileNavOpen,
}: UserMenuProps) {
  const pathname = usePathname()

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileUserMenuOpen(false)
  }, [pathname])

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-full bg-muted animate-pulse",
          isScrolled ? "h-10 w-10" : "h-9 w-9"
        )}
      />
    )
  }

  const triggerProps = { isScrolled, authUser, user, userInitials };

  return (
    <>
      {/* --- DESKTOP VIEW (Dropdown) --- */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span><TriggerButton {...triggerProps} /></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 p-0 rounded-xl shadow-google-lg animate-slide-up border-none bg-background overflow-hidden"
            align="end"
            sideOffset={8}
          >
            {/* Desktop Menu Content - Kept inline for simplicity as it uses Dropdown primitives */}
            {/* Header Section */}
            <div className="p-1.5 border-b">
              {authUser ? (
                <Link href="/account" className="flex items-center gap-2 group p-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                  <div className="relative">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={user?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate leading-none mb-0.5">{user?.full_name || 'Utilisateur'}</p>
                    <p className="text-[10px] text-muted-foreground truncate leading-none">{user?.email}</p>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-1.5 px-1 py-1">
                  <p className="text-[11px] text-center text-muted-foreground">Connectez-vous pour continuer</p>
                  <Button 
                    onClick={onLogin}
                    className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-[13px] font-medium"
                  >
                    Connexion
                  </Button>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {user?.role && (user.role === 'admin' || user.role === 'super_admin') && (
                <DropdownMenuItem asChild className="rounded-none cursor-pointer h-9 px-4 focus:bg-primary/5 focus:text-blue-600">
                  <Link href="/admin" className="flex items-center gap-2.5 text-blue-600">
                    <Shield className="size-4" />
                    <span className="text-[13px] font-medium">Administration</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild className="rounded-none cursor-pointer h-9 px-4 focus:bg-primary/5 focus:text-foreground">
                <Link href="/orders" className="flex items-center gap-2.5">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="text-[13px] font-medium">Commandes</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild className="rounded-none cursor-pointer h-9 px-4 focus:bg-primary/5 focus:text-foreground">
                <Link href="/wishlist" className="flex items-center gap-2.5">
                  <Heart className="size-4 text-muted-foreground" />
                  <span className="text-[13px] font-medium">Favoris</span>
                </Link>
              </DropdownMenuItem>
            </div>

            <div className="h-px bg-border/50 mx-0" />

            <div className="py-1">
              {authUser && (
                <DropdownMenuItem asChild className="rounded-none cursor-pointer h-9 px-4 focus:bg-primary/5 focus:text-foreground">
                  <Link href="/account" className="flex items-center gap-2.5">
                    <Settings className="size-4 text-muted-foreground" />
                    <span className="text-[13px] font-medium">Paramètres</span>
                  </Link>
                </DropdownMenuItem>
              )}

              {authUser && (
                <DropdownMenuItem 
                  onClick={onSignOut}
                  className="rounded-none cursor-pointer h-9 px-4 text-destructive focus:text-destructive focus:bg-primary/5"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="size-4" />
                    <span className="text-[13px] font-medium">Déconnexion</span>
                  </div>
                </DropdownMenuItem>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- MOBILE VIEW (Sheet/Overlay) --- */}
      <div className="md:hidden">
        <TriggerButton 
          {...triggerProps}
          onClick={() => {
            if (!mobileUserMenuOpen) {
              setMobileNavOpen?.(false)
            }
            setMobileUserMenuOpen(!mobileUserMenuOpen)
          }} 
        />
        
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
