"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/Logo"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

import { MobileNav } from "../MobileNav"
import { AuthDialog } from "@/components/auth"

import { useHeader } from "./hooks/use-header"
import {
  FloatingMenuButton,
  DesktopNav,
  MegaMenu,
  ActionButtons,
  UserMenu,
  InlineSearch,
} from "./components"

export function Header() {
  const {
    pathname,
    user,
    authUser,
    signOut,
    isLoading,
    userInitials,
    openLogin,
    totalItems,
    openCart,
    isHydrated,
    hasPromotions,
    searchOpen,
    setSearchOpen,
    mobileNavOpen,
    setMobileNavOpen,
    isScrolled,
    mounted,
    activeCategory,
    setActiveCategory,
    megaMenuRef,
  } = useHeader()

  return (
    <>


      {/* Floating Menu Button - Mobile only, appears when scrolled */}
      {/* Floating Menu Button - Always present, handles visibility based on state */}
      <FloatingMenuButton
        isScrolled={isScrolled}
        isOpen={mobileNavOpen}
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
      />

      <header
        className={cn(
          "sticky top-0 z-[101] w-full transition-all duration-500 ease-out"
        )}
      >
        {/* Outer wrapper for positioning */}
        <div
          className={cn(
            "transition-all duration-500 ease-out",
            (isScrolled || mobileNavOpen) ? "py-3 px-4 lg:px-4 pl-[60px] lg:pl-4" : "py-0 px-0"
          )}
        >
          {/* The actual header bar that transforms to pill */}
          <div
            ref={megaMenuRef}
            className={cn(
              "transition-all duration-500 ease-out mx-auto",
              (isScrolled || mobileNavOpen)
                ? "max-w-6xl bg-background/95 backdrop-blur-xl rounded-full shadow-google-md border border-border/40"
                : "max-w-none bg-background border-b border-border/30"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-1 transition-all duration-500 ease-out",
                (isScrolled || mobileNavOpen)
                  ? "h-12 px-3 lg:px-4"
                  : "h-16 md:h-18 container-google"
              )}
            >
              <div className="flex items-center gap-3 shrink-0">
                {/* Mobile Menu Button - always visible in dock mode */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  className={cn(
                    "lg:hidden rounded-full transition-all duration-300",
                    // Hide if Scrolled OR Menu Open (Floating Button takes over)
                    (isScrolled || mobileNavOpen) ? "opacity-0 w-0 p-0 overflow-hidden" : "opacity-100"
                  )}
                >
                  {mobileNavOpen ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </Button>

                {/* Logo */}
                <Link
                  href="/"
                  className="relative flex items-center shrink-0"
                >
                  <Logo
                    variant="default"
                    asLink={false}
                    className={cn(
                      "transition-all duration-300",
                      (isScrolled || mobileNavOpen) ? "scale-75 origin-left" : "scale-100"
                    )}
                  />
                </Link>
              </div>

              {/* Center: Desktop Navigation */}
              <DesktopNav
                pathname={pathname}
                activeCategory={activeCategory}
                isScrolled={isScrolled}
                onCategoryHover={setActiveCategory}
              />

              {/* Right section: Actions */}
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                {/* Inline Search - Google Store style */}
                <InlineSearch
                  isExpanded={searchOpen}
                  onExpandedChange={setSearchOpen}
                  isScrolled={isScrolled || mobileNavOpen}
                />

                <ActionButtons
                  isScrolled={isScrolled || mobileNavOpen}
                  totalItems={totalItems}
                  isHydrated={isHydrated}
                  onCartOpen={openCart}
                />

                <UserMenu
                  isScrolled={isScrolled || mobileNavOpen}
                  mounted={mounted}
                  isLoading={isLoading}
                  authUser={authUser}
                  user={user}
                  userInitials={userInitials}
                  onSignOut={signOut}
                  onLogin={openLogin}
                />
              </div>
            </div>

            {/* Mega Menu Dropdown - Desktop only */}
            <MegaMenu
              activeCategory={activeCategory}
              isScrolled={isScrolled}
              onClose={() => setActiveCategory(null)}
            />
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        user={user}
        authUser={authUser}
        onSignOut={signOut}
        hasPromotions={hasPromotions}
      />

      {/* Auth Dialog */}
      <AuthDialog />
    </>
  )
}
