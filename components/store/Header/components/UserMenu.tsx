"use client"

import Link from "next/link"
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
import { User as UserIcon, Package, Heart, LogOut, Shield } from "lucide-react"
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
}

export function UserMenu({
  isScrolled,
  mounted,
  isLoading,
  authUser,
  user,
  userInitials,
  onSignOut,
  onLogin,
}: UserMenuProps) {
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

  // Authenticated user
  if (authUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative rounded-full p-0 hover:bg-muted",
              isScrolled ? "h-8 w-8" : "h-9 w-9"
            )}
          >
            <Avatar className={cn(isScrolled ? "h-7 w-7" : "h-8 w-8")}>
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 p-2 rounded-xl shadow-google-lg animate-slide-up"
          align="end"
        >
          <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
            <Link href="/account" className="flex items-center gap-2 p-2">
              <UserIcon className="size-4" />
              <span>Mon compte</span>
            </Link>
          </DropdownMenuItem>
          {/* Admin link - only show for admin or super_admin users */}
          {user?.role && (user.role === 'admin' || user.role === 'super_admin') && (
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
              <Link href="/admin" className="flex items-center gap-2 p-2 text-blue-600">
                <Shield className="size-4" />
                <span>Administration</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
            <Link href="/orders" className="flex items-center gap-2 p-2">
              <Package className="size-4" />
              <span>Mes commandes</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
            <Link href="/wishlist" className="flex items-center gap-2 p-2 text-rose-500">
              <Heart className="size-4" />
              <span>Favoris</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSignOut}
            className="rounded-lg cursor-pointer text-destructive p-2"
          >
            <div className="flex items-center gap-2">
              <LogOut className="size-4" />
              <span>Déconnexion</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Guest user - show login buttons
  return (
    <>
      {/* Desktop: full button */}
      <Button
        onClick={onLogin}
        className={cn(
          "hidden md:flex rounded-full bg-primary hover:bg-primary-hover text-white font-medium transition-google shadow-google-sm hover:shadow-google-md",
          isScrolled ? "px-4 py-1.5 text-sm h-8" : "px-5 py-2 h-10"
        )}
      >
        Connexion
      </Button>
      {/* Mobile: icon only */}
      <Button
        onClick={onLogin}
        variant="ghost"
        size="icon"
        className={cn(
          "md:hidden rounded-full text-foreground hover:text-primary hover:bg-primary/5",
          isScrolled ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        <UserIcon className={cn(isScrolled ? "size-4" : "size-5")} />
      </Button>
    </>
  )
}
